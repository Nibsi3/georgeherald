import { NextRequest, NextResponse } from "next/server";
import { login, logout, getSession } from "@/lib/admin-auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ user: { id: session.id, name: session.name, email: session.email, role: session.role, activeWorkspace: session.activeWorkspace } });
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const user = await login(email, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  return NextResponse.json({ user });
}

export async function DELETE() {
  await logout();
  return NextResponse.json({ ok: true });
}
