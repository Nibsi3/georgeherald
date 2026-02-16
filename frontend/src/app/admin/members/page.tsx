"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Shield,
  ShieldCheck,
  PenTool,
  Eye,
  Building2,
  CheckCircle2,
} from "lucide-react";

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  workspaces: string[];
  activeWorkspace: string;
  createdAt: string;
}

const WORKSPACE_LABELS: Record<string, string> = {
  "george-herald": "George Herald",
  "knysna-plett-herald": "Knysna-Plett Herald",
  "mossel-bay-advertiser": "Mossel Bay Advertiser",
  "oudtshoorn-courant": "Oudtshoorn Courant",
  "graaff-reinet-advertiser": "Graaff-Reinet Advertiser",
};

const WORKSPACE_IDS = Object.keys(WORKSPACE_LABELS);

const ROLES = [
  { value: "super_admin", label: "Super Admin", icon: ShieldCheck, desc: "Full access to all workspaces and settings" },
  { value: "admin", label: "Admin", icon: Shield, desc: "Manage members and content within assigned workspaces" },
  { value: "editor", label: "Editor", icon: PenTool, desc: "Create, edit, and publish articles" },
  { value: "writer", label: "Writer", icon: Eye, desc: "Create and edit own articles" },
];

function getWorkspaceId() {
  if (typeof document === "undefined") return "george-herald";
  const match = document.cookie.match(/gh_workspace=([^;]+)/);
  return match ? match[1] : "george-herald";
}

export default function AdminMembersPage() {
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "writer",
    workspaces: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(false);

  const currentWs = getWorkspaceId();
  const currentWsLabel = WORKSPACE_LABELS[currentWs] || currentWs;

  // Filter users to current workspace (or show all)
  const users = showAllWorkspaces
    ? allUsers
    : allUsers.filter((u) => u.workspaces?.includes(currentWs));

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(""), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

  function toast(msg: string) { setToastMsg(msg); }

  async function readJsonSafe(res: Response): Promise<any> {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { error: text };
    }
  }

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await readJsonSafe(res);
      if (!res.ok) {
        setError(data?.error || "Failed to load members");
        setAllUsers([]);
      } else {
        setError("");
        setAllUsers(data?.users || []);
      }
    } finally {
      setLoading(false);
    }
  }

  function openNewForm() {
    setEditingUser(null);
    setForm({ name: "", email: "", password: "", role: "writer", workspaces: [currentWs] });
    setShowForm(true);
    setError("");
  }

  function openEditForm(user: UserInfo) {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      workspaces: user.workspaces,
    });
    setShowForm(true);
    setError("");
  }

  function toggleWorkspace(wsId: string) {
    setForm((prev) => ({
      ...prev,
      workspaces: prev.workspaces.includes(wsId)
        ? prev.workspaces.filter((w) => w !== wsId)
        : [...prev.workspaces, wsId],
    }));
  }

  async function handleSave() {
    if (!form.name || !form.email) {
      setError("Name and email are required");
      return;
    }
    if (!editingUser && !form.password) {
      setError("Password is required for new users");
      return;
    }
    if (form.workspaces.length === 0) {
      setError("At least one workspace must be assigned");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingUser) {
        const body: Record<string, unknown> = {
          id: editingUser.id,
          name: form.name,
          email: form.email,
          role: form.role,
          workspaces: form.workspaces,
        };
        if (form.password) body.password = form.password;

        const res = await fetch("/api/admin/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await readJsonSafe(res);
          setError(data?.error || "Failed to update");
          setSaving(false);
          return;
        }
      } else {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await readJsonSafe(res);
          setError(data?.error || "Failed to create");
          setSaving(false);
          return;
        }
      }
      setShowForm(false);
      fetchUsers();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: UserInfo) {
    if (!confirm(`Delete ${user.name} (${user.email})? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/users?id=${user.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await readJsonSafe(res);
      setError(data?.error || "Failed to delete");
      return;
    }
    setError("");
    toast("Member deleted");
    fetchUsers();
  }

  const roleIcon = (role: string) => {
    const r = ROLES.find((r) => r.value === role);
    return r ? r.icon : Eye;
  };

  const roleLabel = (role: string) => {
    const r = ROLES.find((r) => r.value === role);
    return r ? r.label : role;
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          {toastMsg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {users.length} member{users.length !== 1 ? "s" : ""} {showAllWorkspaces ? "across all workspaces" : `in ${currentWsLabel}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAllWorkspaces(!showAllWorkspaces)}
            className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${
              showAllWorkspaces
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            {showAllWorkspaces ? "All Workspaces" : currentWsLabel}
          </button>
          <button
            onClick={openNewForm}
            className="inline-flex items-center gap-2 bg-[#DC2626] text-white font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-[#B91C1C] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Member
          </button>
        </div>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              {editingUser ? "Edit Member" : "Add New Member"}
            </h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626] outline-none"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626] outline-none"
                placeholder="john@georgeherald.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Password {editingUser && <span className="font-normal text-gray-400">(leave empty to keep current)</span>}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626] outline-none"
                placeholder={editingUser ? "••••••••" : "Choose a password"}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#DC2626] outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Workspace assignment */}
          <div className="mb-5">
            <label className="block text-sm font-bold text-gray-700 mb-2">Assigned Workspaces</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {WORKSPACE_IDS.map((wsId) => (
                <label
                  key={wsId}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    form.workspaces.includes(wsId)
                      ? "border-[#DC2626] bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.workspaces.includes(wsId)}
                    onChange={() => toggleWorkspace(wsId)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                    form.workspaces.includes(wsId) ? "bg-[#DC2626] border-[#DC2626]" : "border-gray-300"
                  }`}>
                    {form.workspaces.includes(wsId) && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{WORKSPACE_LABELS[wsId]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#DC2626] text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingUser ? "Update Member" : "Create Member"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_150px_1fr_100px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div>Member</div>
          <div>Role</div>
          <div>Workspaces</div>
          <div></div>
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">Loading members...</div>
        ) : users.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">No members found</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((user) => {
              const RoleIcon = roleIcon(user.role);
              return (
                <div
                  key={user.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_150px_1fr_100px] gap-2 md:gap-4 px-5 py-4 hover:bg-gray-50 transition-colors items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#DC2626]/10 flex items-center justify-center text-sm font-bold text-[#DC2626] shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full capitalize">
                      <RoleIcon className="h-3 w-3" />
                      {roleLabel(user.role)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {user.workspaces.map((wsId) => (
                      <span
                        key={wsId}
                        className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                      >
                        {WORKSPACE_LABELS[wsId] || wsId}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => openEditForm(user)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Role descriptions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Role Permissions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ROLES.map((r) => (
            <div key={r.value} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <r.icon className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-700">{r.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
