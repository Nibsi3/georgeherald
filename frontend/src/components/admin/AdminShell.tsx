"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Tags,
  ImageIcon,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  Users,
  ChevronDown,
  Building2,
  Check,
  Star,
} from "lucide-react";
import { useState, useEffect } from "react";

interface Workspace {
  id: string;
  name: string;
  shortName: string;
  domain: string;
  color: string;
}

interface AdminShellProps {
  session: {
    id?: string;
    email: string;
    name: string;
    role: string;
    workspaces?: string[];
    activeWorkspace?: string;
  };
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Articles", href: "/admin/articles", icon: FileText },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Tags", href: "/admin/tags", icon: Tags },
  { label: "Media", href: "/admin/media", icon: ImageIcon },
  { label: "Top Stories", href: "/admin/hero", icon: Star },
];

const ADMIN_NAV = [
  { label: "Members", href: "/admin/members", icon: Users },
];

const ALL_WORKSPACES: Workspace[] = [
  { id: "george-herald", name: "George Herald", shortName: "GH", domain: "https://www.georgeherald.com", color: "#DC2626" },
  { id: "knysna-plett-herald", name: "Knysna-Plett Herald", shortName: "KPH", domain: "https://www.knysnaplettherald.com", color: "#DC2626" },
  { id: "mossel-bay-advertiser", name: "Mossel Bay Advertiser", shortName: "MBA", domain: "https://www.mosselbayadvertiser.com", color: "#DC2626" },
  { id: "oudtshoorn-courant", name: "Oudtshoorn Courant", shortName: "OC", domain: "https://www.oudtshoorncourant.com", color: "#DC2626" },
  { id: "graaff-reinet-advertiser", name: "Graaff-Reinet Advertiser", shortName: "GRA", domain: "https://www.graaffreinetadvertiser.com", color: "#DC2626" },
];

export default function AdminShell({ session, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const [activeWs, setActiveWs] = useState(session.activeWorkspace || "george-herald");
  const [switching, setSwitching] = useState(false);

  const userWorkspaces = (!session.workspaces || session.workspaces.length === 0 || session.role === "super_admin")
    ? ALL_WORKSPACES
    : ALL_WORKSPACES.filter((ws) => session.workspaces!.includes(ws.id));
  const currentWs = ALL_WORKSPACES.find((ws) => ws.id === activeWs) || ALL_WORKSPACES[0];
  const isAdmin = session.role === "super_admin" || session.role === "admin";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wsDropdownOpen && !(e.target as HTMLElement).closest("[data-ws-dropdown]")) {
        setWsDropdownOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [wsDropdownOpen]);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  async function handleSwitchWorkspace(wsId: string) {
    if (wsId === activeWs) { setWsDropdownOpen(false); return; }
    setSwitching(true);
    try {
      const res = await fetch("/api/admin/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: wsId }),
      });
      if (res.ok) {
        setActiveWs(wsId);
        // Cache workspace in localStorage so it persists across sessions
        try { localStorage.setItem("gh_workspace", wsId); } catch {}
        // Hard reload so all client components re-read the workspace cookie
        window.location.reload();
      }
    } finally {
      setSwitching(false);
      setWsDropdownOpen(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Workspace Switcher */}
          <div className="px-3 pt-4 pb-2" data-ws-dropdown>
            <button
              onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
              disabled={switching}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-center w-9 h-9 bg-[#DC2626] rounded-xl shrink-0">
                <span className="text-xs font-black text-white" style={{ fontFamily: "Georgia, serif" }}>
                  {currentWs.shortName}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-bold leading-tight truncate">{currentWs.name}</p>
                <p className="text-[10px] text-white/40">Content Manager</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${wsDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Workspace dropdown */}
            {wsDropdownOpen && (
              <div className="mt-1 bg-gray-800 rounded-xl border border-white/10 overflow-hidden shadow-xl">
                <div className="px-3 py-2 border-b border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Switch workspace</p>
                </div>
                {userWorkspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => handleSwitchWorkspace(ws.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-center w-7 h-7 bg-white/10 rounded-lg shrink-0">
                      <span className="text-[9px] font-black">{ws.shortName}</span>
                    </div>
                    <span className="flex-1 text-left text-sm text-white/80 truncate">{ws.name}</span>
                    {ws.id === activeWs && <Check className="h-3.5 w-3.5 text-green-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="mx-3 mb-2 lg:hidden flex items-center justify-end text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>

          {/* Navigation */}
          <nav className="flex-1 py-2 px-3 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#DC2626] text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  {item.label}
                  {active && <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
                </Link>
              );
            })}

            {/* Admin-only navigation */}
            {isAdmin && (
              <div className="pt-3 mt-3 border-t border-white/10">
                <p className="px-3 text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-2">Administration</p>
                {ADMIN_NAV.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? "bg-[#DC2626] text-white"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      {item.label}
                      {active && <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="pt-3 mt-3 border-t border-white/10">
              <Link
                href={currentWs.domain}
                target="_blank"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ExternalLink className="h-4.5 w-4.5 shrink-0" />
                View {currentWs.shortName} Website
              </Link>
            </div>
          </nav>

          {/* User info + logout */}
          <div className="px-3 py-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#DC2626]/30 flex items-center justify-center text-xs font-bold text-[#DC2626]">
                {session.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session.name}</p>
                <p className="text-[10px] text-white/40 truncate capitalize">{session.role?.replace(/_/g, " ")}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-white/50 hover:text-red-400 hover:bg-white/5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 lg:px-8 py-3 flex items-center gap-4">
          <button
            className="lg:hidden text-gray-600 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* Active workspace indicator */}
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">{currentWs.name}</span>
          </div>
          <div className="flex-1" />
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
          <span className="text-xs text-gray-400 hidden sm:block">
            {new Date().toLocaleDateString("en-ZA", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
