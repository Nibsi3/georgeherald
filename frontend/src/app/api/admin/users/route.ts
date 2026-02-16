import { NextRequest, NextResponse } from "next/server";
import { getSession, readUsers, writeUsers } from "@/lib/admin-auth";
import type { UserRecord } from "@/lib/admin-auth";

export const runtime = "nodejs";

// GET: list all users (super_admin/admin only)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const users = await readUsers();

    // Non-admins can only see users in their workspaces
    if (session.role === "super_admin" || session.role === "admin") {
      const safe = users.map(({ password, ...u }) => u);
      return NextResponse.json({ users: safe });
    }

    const filtered = users
      .filter((u) => u.workspaces.some((w) => session.workspaces.includes(w)))
      .map(({ password, ...u }) => u);
    return NextResponse.json({ users: filtered });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list users" },
      { status: 500 }
    );
  }
}

// POST: create a new user
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "super_admin" && session.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { email, password, name, role, workspaces } = body;

  if (!email || !password || !name) {
    return NextResponse.json({ error: "email, password, name required" }, { status: 400 });
  }

    const users = await readUsers();
    if (users.find((u) => u.email === email)) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

  const newUser: UserRecord = {
    id: `user-${Date.now()}`,
    email,
    password,
    name,
    role: role || "writer",
    workspaces: workspaces || [session.activeWorkspace],
    activeWorkspace: (workspaces && workspaces[0]) || session.activeWorkspace,
    createdAt: new Date().toISOString(),
  };

    users.push(newUser);
    await writeUsers(users);

    const { password: _, ...safe } = newUser;
    return NextResponse.json({ user: safe }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create user" },
      { status: 500 }
    );
  }
}

// PUT: update a user
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "super_admin" && session.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const users = await readUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (updates.name !== undefined) users[idx].name = updates.name;
  if (updates.email !== undefined) users[idx].email = updates.email;
  if (updates.password !== undefined) users[idx].password = updates.password;
  if (updates.role !== undefined) users[idx].role = updates.role;
  if (updates.workspaces !== undefined) users[idx].workspaces = updates.workspaces;
  if (updates.activeWorkspace !== undefined) users[idx].activeWorkspace = updates.activeWorkspace;

    await writeUsers(users);
    const { password: _, ...safe } = users[idx];
    return NextResponse.json({ user: safe });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE: remove a user
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "super_admin" && session.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    // Prevent deleting yourself
    if (id === session.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const users = await readUsers();
    const filtered = users.filter((u) => u.id !== id);
    if (filtered.length === users.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await writeUsers(filtered);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete user" },
      { status: 500 }
    );
  }
}
