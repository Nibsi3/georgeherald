"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Search, X, GripVertical, Trash2, Plus } from "lucide-react";

interface ArticleListing {
  slug: string;
  title: string;
  featuredImage: string;
  section: string;
  category: string;
  updated: string;
  isTopStory: boolean;
}

interface WorkspaceConfig {
  id: string;
  name: string;
  heroArticleSlugs: string[];
}

export default function AdminHeroPage() {
  const [heroSlugs, setHeroSlugs] = useState<string[]>([]);
  const [heroArticles, setHeroArticles] = useState<ArticleListing[]>([]);
  const [searchResults, setSearchResults] = useState<ArticleListing[]>([]);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceConfig | null>(null);
  const [latestArticles, setLatestArticles] = useState<ArticleListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Get current workspace from cookie
  function getWorkspaceId() {
    const match = document.cookie.match(/gh_workspace=([^;]+)/);
    return match ? match[1] : "george-herald";
  }

  useEffect(() => {
    async function load() {
      const wsId = getWorkspaceId();
      // Load workspace config
      const wsRes = await fetch("/api/admin/workspaces");
      const wsData = await wsRes.json();
      const ws = (wsData.workspaces || []).find((w: WorkspaceConfig) => w.id === wsId);
      if (ws) {
        setWorkspace(ws);
        setHeroSlugs(ws.heroArticleSlugs || []);
        // Load article details for hero slugs
        if (ws.heroArticleSlugs?.length) {
          const articles: ArticleListing[] = [];
          for (const slug of ws.heroArticleSlugs) {
            const res = await fetch(`/api/admin/articles?slug=${encodeURIComponent(slug)}`);
            const data = await res.json();
            if (data.article) articles.push(data.article);
          }
          setHeroArticles(articles);
        }
        // Load latest 6 articles for this workspace
        const latestRes = await fetch(`/api/admin/articles?workspace=${encodeURIComponent(wsId)}&limit=6&sort=latest`);
        const latestData = await latestRes.json();
        if (latestData.articles) setLatestArticles(latestData.articles);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!search.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const wsId = getWorkspaceId();
    const res = await fetch(`/api/admin/articles?search=${encodeURIComponent(search)}&limit=10&workspace=${encodeURIComponent(wsId)}`);
    const data = await res.json();
    setSearchResults((data.articles || []).filter((a: ArticleListing) => !heroSlugs.includes(a.slug)));
    setSearching(false);
  }, [search, heroSlugs]);

  useEffect(() => {
    const t = setTimeout(handleSearch, 300);
    return () => clearTimeout(t);
  }, [handleSearch]);

  function addHero(article: ArticleListing) {
    if (heroSlugs.includes(article.slug)) return;
    setHeroSlugs([...heroSlugs, article.slug]);
    setHeroArticles([...heroArticles, article]);
    setSearch("");
    setSearchResults([]);
  }

  function removeHero(slug: string) {
    setHeroSlugs(heroSlugs.filter((s) => s !== slug));
    setHeroArticles(heroArticles.filter((a) => a.slug !== slug));
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const newSlugs = [...heroSlugs];
    const newArticles = [...heroArticles];
    [newSlugs[idx - 1], newSlugs[idx]] = [newSlugs[idx], newSlugs[idx - 1]];
    [newArticles[idx - 1], newArticles[idx]] = [newArticles[idx], newArticles[idx - 1]];
    setHeroSlugs(newSlugs);
    setHeroArticles(newArticles);
  }

  function moveDown(idx: number) {
    if (idx >= heroSlugs.length - 1) return;
    const newSlugs = [...heroSlugs];
    const newArticles = [...heroArticles];
    [newSlugs[idx], newSlugs[idx + 1]] = [newSlugs[idx + 1], newSlugs[idx]];
    [newArticles[idx], newArticles[idx + 1]] = [newArticles[idx + 1], newArticles[idx]];
    setHeroSlugs(newSlugs);
    setHeroArticles(newArticles);
  }

  async function handleSave() {
    if (!workspace) return;
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/workspaces", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: workspace.id, heroArticleSlugs: heroSlugs }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Top Stories</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Select which articles appear as top stories for <strong>{workspace?.name}</strong>
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#DC2626] text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          <strong>Position 1</strong> = Main top story (large card). Positions <strong>2–4</strong> = Side stories. 
          The order you set here controls exactly how they appear on the homepage for <strong>{workspace?.name}</strong>.
        </p>
      </div>

      {/* Current hero articles */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
          <h2 className="font-bold text-gray-900">Current Top Stories ({heroArticles.length})</h2>
        </div>

        {heroArticles.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            No top stories selected. Use the search below to add articles.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {heroArticles.map((article, idx) => (
              <div
                key={article.slug}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs"
                  >
                    ▲
                  </button>
                  <span className="text-xs font-black text-gray-300 w-5 text-center">{idx + 1}</span>
                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx >= heroArticles.length - 1}
                    className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs"
                  >
                    ▼
                  </button>
                </div>
                <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
                {article.featuredImage ? (
                  <img src={article.featuredImage} alt="" className="w-14 h-10 object-cover rounded-md shrink-0 bg-gray-100" />
                ) : (
                  <div className="w-14 h-10 bg-gray-100 rounded-md shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{article.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-[#DC2626] bg-red-50 px-1.5 py-0.5 rounded uppercase">
                      {idx === 0 ? "MAIN STORY" : `Position ${idx + 1}`}
                    </span>
                    <span className="text-[10px] text-gray-400">{article.section} · {article.category?.replace(/-/g, " ")}</span>
                  </div>
                </div>
                <button
                  onClick={() => removeHero(article.slug)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Latest articles quick-add */}
      {latestArticles.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Star className="h-4 w-4 text-blue-500" />
            <h2 className="font-bold text-gray-900">Latest Articles — Quick Add</h2>
            <span className="text-xs text-gray-400 ml-auto">Click to add as top story</span>
          </div>
          <div className="divide-y divide-gray-50">
            {latestArticles
              .filter((a) => !heroSlugs.includes(a.slug))
              .map((article) => (
                <button
                  key={article.slug}
                  onClick={() => addHero(article)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-blue-50 transition-colors text-left"
                >
                  {article.featuredImage ? (
                    <img src={article.featuredImage} alt="" className="w-14 h-10 object-cover rounded-md shrink-0 bg-gray-100" />
                  ) : (
                    <div className="w-14 h-10 bg-gray-100 rounded-md shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{article.title}</p>
                    <p className="text-[10px] text-gray-400">{article.section} · {article.category?.replace(/-/g, " ")} · {new Date(article.updated).toLocaleDateString("en-ZA")}</p>
                  </div>
                  <Plus className="h-4 w-4 text-blue-600 shrink-0" />
                </button>
              ))}
            {latestArticles.filter((a) => !heroSlugs.includes(a.slug)).length === 0 && (
              <div className="px-5 py-4 text-center text-gray-400 text-sm">
                All latest articles are already in top stories.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search to add articles */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Article to Top Stories
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626] outline-none"
            placeholder="Search for an article by title..."
          />
          {search && (
            <button onClick={() => { setSearch(""); setSearchResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {searching && <p className="text-xs text-gray-400 mt-2">Searching...</p>}

        {searchResults.length > 0 && (
          <div className="mt-3 border border-gray-200 rounded-lg divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
            {searchResults.map((article) => (
              <button
                key={article.slug}
                onClick={() => addHero(article)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                {article.featuredImage ? (
                  <img src={article.featuredImage} alt="" className="w-12 h-9 object-cover rounded-md shrink-0 bg-gray-100" />
                ) : (
                  <div className="w-12 h-9 bg-gray-100 rounded-md shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{article.title}</p>
                  <p className="text-[10px] text-gray-400">{article.section} · {new Date(article.updated).toLocaleDateString("en-ZA")}</p>
                </div>
                <Plus className="h-4 w-4 text-[#DC2626] shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
