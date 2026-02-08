"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Star,
  Trash2,
  Filter,
  X,
  MoreHorizontal,
  Pencil,
  ExternalLink,
  Copy,
  FolderInput,
  Archive,
  CheckCircle2,
  Upload,
  Eye,
  Video,
  Camera,
  ChevronDown,
  FileText,
} from "lucide-react";

interface ArticleListing {
  guid: string;
  slug: string;
  title: string;
  description: string;
  section: string;
  category: string;
  isTopStory: boolean;
  featuredImage: string;
  author: string;
  tags: string[];
  updated: string;
  hasVideo: boolean;
  hasGallery: boolean;
  viewCount?: number;
  workspace?: string;
  createdBy?: string;
}

const SECTIONS = [
  "news", "sport", "entertainment", "opinion", "community", "lifestyle",
];

const SECTION_CATEGORIES: Record<string, string[]> = {
  news: ["top-stories", "local-news", "national-news", "business", "crime", "agriculture", "politics", "property", "environment", "elections", "general-news", "latest"],
  sport: ["rugby", "cricket", "football", "golf", "tennis", "athletics", "other-sport"],
  entertainment: ["entertainment", "culture", "tourism", "lifestyle"],
  opinion: ["comment", "blogs"],
  community: ["we-care", "heritage", "academic", "general-notices"],
  lifestyle: ["lifestyle", "property", "tourism"],
};

const ALL_CATEGORIES = [
  "top-stories", "local-news", "national-news", "business", "crime",
  "lifestyle", "agriculture", "politics", "property", "environment",
  "elections", "general-news", "rugby", "cricket", "football", "golf",
  "tennis", "athletics", "other-sport", "entertainment", "academic",
  "culture", "tourism", "we-care", "heritage", "general-notices",
  "comment", "blogs", "latest",
];

function getCategoriesForSection(section: string): string[] {
  return SECTION_CATEGORIES[section] || ALL_CATEGORIES;
}

const PARENT_WORKSPACE = "george-herald";

function getWorkspaceId() {
  if (typeof document === "undefined") return PARENT_WORKSPACE;
  const match = document.cookie.match(/gh_workspace=([^;]+)/);
  return match ? match[1] : PARENT_WORKSPACE;
}

export default function AdminArticlesPage() {
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<ArticleListing[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [categoryModal, setCategoryModal] = useState<{ slug: string; current: string } | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [activeWs, setActiveWs] = useState(PARENT_WORKSPACE);
  const [newMenuOpen, setNewMenuOpen] = useState(false);

  useEffect(() => {
    setActiveWs(getWorkspaceId());
  }, []);

  const fetchArticles = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "25");
    if (search) params.set("search", search);
    if (section) params.set("section", section);
    if (category) params.set("category", category);
    // Pass workspace for content distribution filtering
    const wsId = getWorkspaceId();
    params.set("workspace", wsId);

    const res = await fetch(`/api/admin/articles?${params}`);
    const data = await res.json();
    setArticles(data.articles || []);
    setPagination(data.pagination || { page: 1, limit: 25, total: 0, pages: 0 });
    setLoading(false);
    setSelected(new Set());
  }, [search, section, category]);

  useEffect(() => {
    fetchArticles(1);
  }, [fetchArticles]);

  useEffect(() => {
    if (searchParams.get("filter") === "top") {
      setCategory("top-stories");
    }
  }, [searchParams]);

  // Close menus on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (openMenu && !(e.target as HTMLElement).closest("[data-action-menu]")) {
        setOpenMenu(null);
      }
      if (newMenuOpen && !(e.target as HTMLElement).closest("[data-new-menu]")) {
        setNewMenuOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [openMenu, newMenuOpen]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(""), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

  function toast(msg: string) { setToastMsg(msg); }

  function toggleSelect(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === articles.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(articles.map((a) => a.slug)));
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} article(s)? This cannot be undone.`)) return;
    setDeleting(true);
    for (const slug of selected) {
      await fetch(`/api/admin/articles?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
    }
    setDeleting(false);
    toast(`${selected.size} articles deleted`);
    fetchArticles(pagination.page);
  }

  async function handleDelete(slug: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/articles?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
    toast("Article deleted");
    fetchArticles(pagination.page);
  }

  async function handleToggleTopStory(slug: string, current: boolean) {
    await fetch("/api/admin/articles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, isTopStory: !current }),
    });
    toast(current ? "Removed from top stories" : "Added to top stories");
    fetchArticles(pagination.page);
  }

  async function handleChangeCategory(slug: string, newCategory: string) {
    await fetch("/api/admin/articles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, category: newCategory }),
    });
    toast(`Category changed to ${newCategory.replace(/-/g, " ")}`);
    setCategoryModal(null);
    fetchArticles(pagination.page);
  }

  async function handleDuplicate(slug: string) {
    const res = await fetch(`/api/admin/articles?slug=${encodeURIComponent(slug)}`);
    const data = await res.json();
    if (!data.article) { toast("Article not found"); return; }
    const a = data.article;
    await fetch("/api/admin/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${a.title} (Copy)`,
        description: a.description,
        section: a.section,
        category: a.category,
        tags: a.tags,
        featuredImage: a.featuredImage,
        author: a.author,
        bodyText: a.bodyText,
      }),
    });
    toast("Article duplicated");
    fetchArticles(1);
  }

  function handleCopySlug(slug: string) {
    navigator.clipboard.writeText(slug);
    toast("Slug copied to clipboard");
  }

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Articles</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total.toLocaleString()} total articles</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" data-new-menu>
            <button
              onClick={() => setNewMenuOpen(!newMenuOpen)}
              className="inline-flex items-center gap-2 bg-[#DC2626] text-white font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-[#B91C1C] transition-colors shrink-0"
            >
              <Plus className="h-4 w-4" />
              New
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${newMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {newMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-30 w-56 overflow-hidden">
                <Link href="/admin/articles/new" onClick={() => setNewMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><FileText className="h-4 w-4 text-[#DC2626]" /></span>
                  <div><p className="text-sm font-semibold text-gray-800">Article</p><p className="text-[11px] text-gray-400">Write a news article</p></div>
                </Link>
                <Link href="/admin/videos/new" onClick={() => setNewMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-t border-gray-100">
                  <span className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center"><Video className="h-4 w-4 text-purple-600" /></span>
                  <div><p className="text-sm font-semibold text-gray-800">Video</p><p className="text-[11px] text-gray-400">Upload or embed a video</p></div>
                </Link>
                <Link href="/admin/galleries/new" onClick={() => setNewMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-t border-gray-100">
                  <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><Camera className="h-4 w-4 text-blue-600" /></span>
                  <div><p className="text-sm font-semibold text-gray-800">Gallery</p><p className="text-[11px] text-gray-400">Create a photo gallery</p></div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles by title, description, or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626] outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="pl-8 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:ring-2 focus:ring-[#DC2626] outline-none"
              >
                <option value="">All Sections</option>
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:ring-2 focus:ring-[#DC2626] outline-none"
            >
              <option value="">All Subcategories</option>
              {(section ? getCategoriesForSection(section) : ALL_CATEGORIES).map((c) => (
                <option key={c} value={c}>{c.replace(/-/g, " ")}</option>
              ))}
            </select>
            {(search || section || category) && (
              <button
                onClick={() => { setSearch(""); setSection(""); setCategory(""); }}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="bg-[#DC2626]/5 border border-[#DC2626]/20 rounded-xl px-4 py-3 flex items-center gap-4">
          <span className="text-sm font-semibold text-[#DC2626]">{selected.size} selected</span>
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 hover:text-red-900 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? "Deleting..." : "Delete selected"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-gray-500 hover:text-gray-700 ml-auto"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Subcategory change modal — filtered by article's section */}
      {categoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCategoryModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Change Subcategory</h3>
            <p className="text-sm text-gray-500 mb-4">Select a new subcategory for this article</p>
            <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
              {getCategoriesForSection(
                articles.find((a) => a.slug === categoryModal.slug)?.section || "news"
              ).map((c) => (
                <button
                  key={c}
                  onClick={() => handleChangeCategory(categoryModal.slug, c)}
                  className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                    c === categoryModal.current
                      ? "bg-[#DC2626] text-white"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {c.replace(/-/g, " ")}
                </button>
              ))}
            </div>
            <button onClick={() => setCategoryModal(null)} className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Article list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-visible">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-[40px_1fr_110px_120px_90px_70px_48px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div>
            <input
              type="checkbox"
              checked={selected.size === articles.length && articles.length > 0}
              onChange={toggleSelectAll}
              className="rounded border-gray-300 text-[#DC2626] focus:ring-[#DC2626]"
            />
          </div>
          <div>Article</div>
          <div>Section</div>
          <div>Category</div>
          <div>Date</div>
          <div>Views</div>
          <div></div>
        </div>

        {loading ? (
          <div className="px-5 py-16 text-center text-gray-400 text-sm">Loading articles...</div>
        ) : articles.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-gray-400 text-sm">No articles found</p>
            <Link href="/admin/articles/new" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-[#DC2626] hover:underline">
              <Plus className="h-3.5 w-3.5" /> Create your first article
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {articles.map((article) => (
              <div
                key={article.slug}
                className={`grid grid-cols-1 md:grid-cols-[40px_1fr_110px_120px_90px_70px_48px] gap-2 md:gap-3 px-5 py-3 hover:bg-gray-50/80 transition-colors items-center group ${
                  selected.has(article.slug) ? "bg-red-50/50" : ""
                }`}
              >
                {/* Checkbox */}
                <div className="hidden md:block">
                  <input
                    type="checkbox"
                    checked={selected.has(article.slug)}
                    onChange={() => toggleSelect(article.slug)}
                    className="rounded border-gray-300 text-[#DC2626] focus:ring-[#DC2626]"
                  />
                </div>

                {/* Article info */}
                <div className="flex items-center gap-3 min-w-0">
                  {article.featuredImage ? (
                    <img src={article.featuredImage} alt="" className="w-14 h-10 object-cover rounded-lg shrink-0 bg-gray-100" />
                  ) : (
                    <div className="w-14 h-10 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center text-gray-300">
                      <Upload className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/articles/${article.slug}`}
                        className="text-sm font-semibold text-gray-900 hover:text-[#DC2626] truncate block transition-colors"
                      >
                        {article.title}
                      </Link>
                      {/* Workspace origin badge — show when viewing non-GH workspace */}
                      {activeWs !== PARENT_WORKSPACE && (
                        (article.workspace || PARENT_WORKSPACE) === PARENT_WORKSPACE ? (
                          <span className="shrink-0 text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded" title="Shared from George Herald">GH</span>
                        ) : (article.workspace === activeWs) ? (
                          <span className="shrink-0 text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded" title="Local to this workspace">Local</span>
                        ) : null
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {article.author && <span className="text-gray-500">{article.author}</span>}
                      {article.author && article.tags?.length > 0 && " · "}
                      {article.tags?.slice(0, 2).join(", ")}
                    </p>
                  </div>
                </div>

                {/* Section */}
                <div>
                  <span className="inline-block text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full capitalize">{article.section}</span>
                </div>

                {/* Category */}
                <div>
                  <span className="text-[11px] text-gray-500 capitalize">{article.category?.replace(/-/g, " ")}</span>
                </div>

                {/* Date */}
                <div>
                  <span className="text-[11px] text-gray-400">
                    {new Date(article.updated).toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "2-digit" })}
                  </span>
                </div>

                {/* Views */}
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3 text-gray-300" />
                  <span className="text-[11px] text-gray-500 tabular-nums">{(article.viewCount || 0).toLocaleString()}</span>
                  {article.isTopStory && (
                    <Star className="h-3 w-3 text-amber-500 fill-current ml-1" title="Top Story" />
                  )}
                </div>

                {/* Action menu */}
                <div className="relative" data-action-menu>
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === article.slug ? null : article.slug); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>

                  {openMenu === article.slug && (
                    <div className="absolute right-0 top-8 w-56 bg-white rounded-xl border border-gray-200 shadow-xl z-[100] py-1 overflow-hidden">
                      <Link
                        href={`/admin/articles/${article.slug}`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setOpenMenu(null)}
                      >
                        <Pencil className="h-3.5 w-3.5 text-gray-400" />
                        Edit Article
                      </Link>
                      <a
                        href={`/${article.section}/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setOpenMenu(null)}
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                        View on Website
                      </a>

                      <div className="border-t border-gray-100 my-1" />

                      <button
                        onClick={() => { setCategoryModal({ slug: article.slug, current: article.category }); setOpenMenu(null); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FolderInput className="h-3.5 w-3.5 text-gray-400" />
                        Change Subcategory
                      </button>
                      <button
                        onClick={() => { handleToggleTopStory(article.slug, article.isTopStory); setOpenMenu(null); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Star className={`h-3.5 w-3.5 ${article.isTopStory ? "text-amber-500 fill-amber-400" : "text-gray-400"}`} />
                        {article.isTopStory ? "Remove from Top Stories" : "Mark as Top Story"}
                      </button>

                      <div className="border-t border-gray-100 my-1" />

                      <button
                        onClick={() => { handleDuplicate(article.slug); setOpenMenu(null); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5 text-gray-400" />
                        Duplicate Article
                      </button>
                      <button
                        onClick={() => { handleCopySlug(article.slug); setOpenMenu(null); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Archive className="h-3.5 w-3.5 text-gray-400" />
                        Copy Slug
                      </button>

                      <div className="border-t border-gray-100 my-1" />

                      <button
                        onClick={() => { handleDelete(article.slug, article.title); setOpenMenu(null); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Article
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchArticles(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                let p: number;
                if (pagination.pages <= 7) {
                  p = i + 1;
                } else if (pagination.page <= 4) {
                  p = i + 1;
                } else if (pagination.page >= pagination.pages - 3) {
                  p = pagination.pages - 6 + i;
                } else {
                  p = pagination.page - 3 + i;
                }
                return (
                  <button
                    key={p}
                    onClick={() => fetchArticles(p)}
                    className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                      p === pagination.page
                        ? "bg-[#DC2626] text-white"
                        : "hover:bg-gray-200 text-gray-600"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => fetchArticles(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
