import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import fs from "fs";
import path from "path";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const ADMIN_COOKIE = "gh_admin_session";
const WORKSPACE_COOKIE = "gh_workspace";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days

export interface UserRecord {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "super_admin" | "admin" | "editor" | "writer";
  workspaces: string[];
  activeWorkspace: string;
  createdAt: string;
}

export interface SessionData {
  id: string;
  email: string;
  name: string;
  role: string;
  workspaces: string[];
  activeWorkspace: string;
}

const USERS_FILE = path.join(process.cwd(), "src", "data", "users.json");

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "georgeherald";
const R2_USERS_KEY = process.env.R2_USERS_KEY || "admin/users.json";

const r2Enabled = Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);

const r2 = r2Enabled
  ? new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

async function streamToString(stream: any): Promise<string> {
  if (!stream) return "";
  if (typeof stream === "string") return stream;
  if (Buffer.isBuffer(stream)) return stream.toString("utf-8");

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

export async function readUsers(): Promise<UserRecord[]> {
  if (r2Enabled && r2) {
    try {
      const res = await r2.send(
        new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: R2_USERS_KEY,
        })
      );
      const raw = await streamToString(res.Body);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

export async function writeUsers(users: UserRecord[]): Promise<void> {
  if (r2Enabled && r2) {
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: R2_USERS_KEY,
        Body: JSON.stringify(users, null, 2),
        ContentType: "application/json",
      })
    );
    return;
  }

  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

function encodeSession(user: SessionData) {
  return Buffer.from(JSON.stringify({ ...user, exp: Date.now() + SESSION_DURATION * 1000 })).toString("base64");
}

function decodeSession(token: string): SessionData | null {
  try {
    const data = JSON.parse(Buffer.from(token, "base64").toString());
    if (data.exp && data.exp > Date.now()) {
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        workspaces: data.workspaces || [],
        activeWorkspace: data.activeWorkspace || "george-herald",
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string) {
  const users = await readUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return null;

  const sessionData: SessionData = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    workspaces: user.workspaces,
    activeWorkspace: user.activeWorkspace || user.workspaces[0] || "george-herald",
  };

  const token = encodeSession(sessionData);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
  cookieStore.set(WORKSPACE_COOKIE, sessionData.activeWorkspace, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });

  return sessionData;
}

export async function switchWorkspace(workspaceId: string) {
  const session = await getSession();
  if (!session) return null;
  // Allow switch if user has no workspaces restriction (super_admin) or workspace is in their list
  if (session.workspaces && session.workspaces.length > 0 && !session.workspaces.includes(workspaceId)) {
    return null;
  }

  const updatedSession: SessionData = { ...session, activeWorkspace: workspaceId };
  const token = encodeSession(updatedSession);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
  cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });

  return updatedSession;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  cookieStore.delete(WORKSPACE_COOKIE);
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const session = decodeSession(token);
  if (!session) return null;

  // Refresh stale sessions that are missing workspace data
  if (!session.id || !session.workspaces || session.workspaces.length === 0) {
    const users = await readUsers();
    const user = users.find((u) => u.email === session.email);
    if (user) {
      const refreshed: SessionData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        workspaces: user.workspaces,
        activeWorkspace: session.activeWorkspace || user.activeWorkspace || user.workspaces[0] || "george-herald",
      };
      // Try to re-encode the refreshed session (may fail in read-only SSR context)
      try {
        const newToken = encodeSession(refreshed);
        cookieStore.set(ADMIN_COOKIE, newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: SESSION_DURATION,
          path: "/",
        });
        cookieStore.set(WORKSPACE_COOKIE, refreshed.activeWorkspace, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: SESSION_DURATION,
          path: "/",
        });
      } catch {
        // Cookie setting not allowed in this context (e.g. during SSR render)
      }
      return refreshed;
    }
  }

  return session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}
