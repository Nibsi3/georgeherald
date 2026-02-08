"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Trash2,
  Eye,
  ImageIcon,
  X,
  ExternalLink,
  Upload,
  Video,
  CheckCircle2,
  ChevronDown,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Sparkles,
  Tag,
  Underline,
  Strikethrough,
  Link2,
  Minus,
  Pilcrow,
  Camera,
  Plus,
} from "lucide-react";

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

function getWorkspaceId() {
  if (typeof document === "undefined") return "george-herald";
  const match = document.cookie.match(/gh_workspace=([^;]+)/);
  return match ? match[1] : "george-herald";
}

interface ArticleData {
  guid?: string;
  slug?: string;
  title: string;
  description: string;
  bodyText: string;
  section: string;
  category: string;
  isTopStory: boolean;
  featuredImage: string;
  author: string;
  tags: string[];
  images: { url: string; alt: string }[];
  videoUrls: string[];
  galleryLink: string;
  updated: string;
  hasVideo: boolean;
  hasGallery: boolean;
  link?: string;
  ogImage?: string;
  workspace?: string;
}

const EMPTY_ARTICLE: ArticleData = {
  title: "",
  description: "",
  bodyText: "",
  section: "news",
  category: "general-news",
  isTopStory: false,
  featuredImage: "",
  author: "",
  tags: [],
  images: [],
  videoUrls: [],
  galleryLink: "",
  updated: new Date().toISOString(),
  hasVideo: false,
  hasGallery: false,
};

export default function ArticleEditorPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const isNew = slug === "new";
  const heroInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const [article, setArticle] = useState<ArticleData>(EMPTY_ARTICLE);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [topTags, setTopTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [galleryViewIdx, setGalleryViewIdx] = useState(0);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/articles?slug=${encodeURIComponent(slug)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.article) {
            setArticle({
              ...EMPTY_ARTICLE,
              ...data.article,
              tags: data.article.tags || [],
              images: data.article.images || [],
              videoUrls: data.article.videoUrls || [],
            });
          }
          setLoading(false);
        });
    } else {
      // For new articles in non-GH workspaces, auto-mark as top story
      const wsId = getWorkspaceId();
      if (wsId !== "george-herald") {
        setArticle((prev) => ({ ...prev, isTopStory: true, workspace: wsId }));
      }
    }
  }, [slug, isNew]);

  // Set initial body content when article loads
  useEffect(() => {
    if (bodyRef.current && article.bodyText && !bodyRef.current.innerHTML) {
      bodyRef.current.innerHTML = article.bodyText;
    }
  }, [article.bodyText]);

  // Fetch top tags
  useEffect(() => {
    fetch("/api/admin/tags").then((r) => r.json()).then((data) => {
      setTopTags(data.topTags || []);
    }).catch(() => {});
  }, []);

  // Tag suggestions based on input
  useEffect(() => {
    if (tagInput.length >= 2 && topTags.length > 0) {
      const q = tagInput.toLowerCase();
      const matches = topTags.filter(
        (t) => t.includes(q) && !article.tags.includes(t)
      ).slice(0, 8);
      setTagSuggestions(matches);
    } else {
      setTagSuggestions([]);
    }
  }, [tagInput, topTags, article.tags]);

  // Close category picker on outside click
  useEffect(() => {
    if (!categoryOpen) return;
    function handleClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest("[data-category-picker]")) {
        setCategoryOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [categoryOpen]);

  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(""), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

  function toast(msg: string) { setToastMsg(msg); }

  function updateField<K extends keyof ArticleData>(field: K, value: ArticleData[K]) {
    setArticle((prev) => ({ ...prev, [field]: value }));
  }

  // Sync contentEditable body to state
  const handleBodyInput = useCallback(() => {
    if (bodyRef.current) {
      const html = bodyRef.current.innerHTML;
      setArticle((prev) => ({ ...prev, bodyText: html }));
    }
  }, []);

  async function handleSave() {
    // Sync body before saving
    if (bodyRef.current) {
      article.bodyText = bodyRef.current.innerHTML;
    }
    setSaving(true);
    setSaved(false);
    try {
      // Auto-set workspace
      const wsId = getWorkspaceId();
      const payload = {
        ...article,
        workspace: article.workspace || wsId,
      };
      // Non-GH workspace articles are auto top stories
      if (wsId !== "george-herald" && isNew) {
        payload.isTopStory = true;
      }

      if (isNew) {
        const res = await fetch("/api/admin/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.article?.slug) {
          toast("Article published!");
          router.push("/admin/articles");
        }
      } else {
        await fetch("/api/admin/articles", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, ...payload }),
        });
        setSaved(true);
        toast("Article saved");
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Save failed:", err);
      toast("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this article permanently? This cannot be undone.")) return;
    await fetch(`/api/admin/articles?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
    router.push("/admin/articles");
  }

  function addTag(t?: string) {
    const tag = (t || tagInput).trim().toLowerCase();
    if (tag && !article.tags.includes(tag)) {
      setArticle((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput("");
    setTagSuggestions([]);
  }

  function removeTag(tag: string) {
    setArticle((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  }

  async function uploadFile(file: File, folder: string): Promise<{ url: string; name: string } | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success && data.file) {
        return { url: data.file.url, name: file.name };
      }
      toast(data.error || "Upload failed");
      return null;
    } catch {
      toast("Upload failed - check R2 credentials");
      return null;
    }
  }

  async function handleHeroUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const result = await uploadFile(files[0], "articles/images");
    if (result) {
      updateField("featuredImage", result.url);
      toast("Hero photo uploaded");
    }
    setUploading(false);
  }

  async function handleGalleryUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const result = await uploadFile(file, "articles/images");
      if (result) {
        setArticle((prev) => ({
          ...prev,
          images: [...prev.images, { url: result.url, alt: result.name }],
          hasGallery: true,
        }));
        toast(`${result.name} added to gallery`);
      }
    }
    setUploading(false);
  }

  async function handleVideoUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const result = await uploadFile(file, "articles/videos");
      if (result) {
        setArticle((prev) => ({
          ...prev,
          videoUrls: [...prev.videoUrls, result.url],
          hasVideo: true,
        }));
        toast(`${result.name} uploaded`);
      }
    }
    setUploading(false);
  }

  function removeImage(idx: number) {
    setArticle((prev) => {
      const newImages = prev.images.filter((_, i) => i !== idx);
      return { ...prev, images: newImages, hasGallery: newImages.length > 0 };
    });
  }

  function removeVideo(idx: number) {
    setArticle((prev) => {
      const newUrls = prev.videoUrls.filter((_, i) => i !== idx);
      return { ...prev, videoUrls: newUrls, hasVideo: newUrls.length > 0 };
    });
  }

  // WYSIWYG formatting via execCommand
  function execFormat(command: string, value?: string) {
    document.execCommand(command, false, value);
    bodyRef.current?.focus();
    handleBodyInput();
  }

  function insertBlock(tag: string) {
    switch (tag) {
      case "h2": document.execCommand("formatBlock", false, "h2"); break;
      case "h3": document.execCommand("formatBlock", false, "h3"); break;
      case "blockquote": document.execCommand("formatBlock", false, "blockquote"); break;
      case "p": document.execCommand("formatBlock", false, "p"); break;
      default: break;
    }
    bodyRef.current?.focus();
    handleBodyInput();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400 text-sm">Loading article...</div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          {toastMsg}
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={heroInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleHeroUpload(e.target.files)} />
      <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleGalleryUpload(e.target.files)} />
      <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => handleVideoUpload(e.target.files)} />

      {/* Top action bar */}
      <div className="flex items-center gap-3 pb-4">
        <Link href="/admin/articles" className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-gray-900 truncate">
            {isNew ? "New Article" : "Editing"}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isNew && (
            <a
              href={`/${article.section}/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
              title="View on website"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {!isNew && (
            <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !article.title}
            className="inline-flex items-center gap-2 bg-[#DC2626] text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : saved ? "Saved!" : isNew ? "Publish" : "Save"}
          </button>
        </div>
      </div>

      {/* ─── WYSIWYG Article View: The preview IS the editor ─── */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">

            {/* Inline Category / Subcategory picker */}
            <div className="relative mb-4" data-category-picker>
              <button
                onClick={() => setCategoryOpen(!categoryOpen)}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#DC2626] border border-[#DC2626]/30 px-2.5 py-1 rounded-full hover:bg-red-50 transition-colors capitalize"
              >
                {article.section} {article.category && article.category !== article.section ? `/ ${article.category.replace(/-/g, " ")}` : ""}
                <ChevronDown className={`h-3 w-3 transition-transform ${categoryOpen ? "rotate-180" : ""}`} />
              </button>

              {categoryOpen && (
                <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-30 w-80 overflow-hidden">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Category</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SECTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            updateField("section", s);
                            updateField("category", getCategoriesForSection(s)[0] || "general-news");
                          }}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors capitalize ${
                            article.section === s
                              ? "bg-[#DC2626] text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Subcategory</p>
                    <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
                      {getCategoriesForSection(article.section).map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            updateField("category", c);
                            setCategoryOpen(false);
                          }}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors capitalize ${
                            article.category === c
                              ? "bg-[#DC2626] text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {c.replace(/-/g, " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Editable Title */}
            <input
              type="text"
              value={article.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full text-2xl md:text-3xl font-black text-gray-900 leading-tight outline-none border-0 p-0 mb-4 placeholder-gray-300 bg-transparent"
              placeholder="Write your headline..."
            />

            {/* Meta: Author · Date · Views */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-5">
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input
                  type="text"
                  value={article.author}
                  onChange={(e) => updateField("author", e.target.value)}
                  className="font-medium text-gray-700 bg-transparent outline-none border-0 p-0 w-32 placeholder-gray-400"
                  placeholder="Author name"
                />
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                0 views
              </span>
            </div>

            {/* Hero Image — click to upload */}
            {article.featuredImage ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 mb-5 group">
                <img src={article.featuredImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-3">
                  <button
                    onClick={() => heroInputRef.current?.click()}
                    className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity"
                  >
                    Change Photo
                  </button>
                  <button
                    onClick={() => updateField("featuredImage", "")}
                    className="opacity-0 group-hover:opacity-100 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => heroInputRef.current?.click()}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#DC2626] hover:bg-red-50/30 transition-colors mb-5"
              >
                <ImageIcon className="h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-400">Click to upload hero photo</p>
                {uploading && <p className="text-xs text-[#DC2626]">Uploading...</p>}
              </div>
            )}

            {/* Editable Excerpt */}
            <div className="border-l-4 border-[#DC2626] pl-3 mb-5">
              <textarea
                value={article.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={2}
                className="w-full text-sm font-medium text-gray-700 leading-relaxed outline-none border-0 p-0 resize-none bg-transparent placeholder-gray-400"
                placeholder="Write a brief excerpt or summary..."
              />
            </div>

            {/* Share buttons (non-functional preview) */}
            <div className="flex flex-wrap items-center gap-1.5 mb-5">
              <span className="text-[11px] font-semibold text-gray-500">Share:</span>
              {["Facebook", "X / Twitter", "WhatsApp", "LinkedIn", "Email"].map((s) => (
                <span key={s} className="text-[10px] font-medium text-gray-600 border border-gray-200 px-2 py-1 rounded">{s}</span>
              ))}
            </div>

            <div className="border-t border-gray-200 mb-5" />

            {/* Formatting Toolbar — sticky when editing body */}
            <div className="sticky top-[57px] z-20 -mx-6 md:-mx-8 px-6 md:px-8 bg-white border-b border-gray-100 py-2 mb-4">
              <div className="flex flex-wrap items-center gap-0.5">
                <button onClick={() => execFormat("bold")} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Bold"><Bold className="h-3.5 w-3.5" /></button>
                <button onClick={() => execFormat("italic")} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Italic"><Italic className="h-3.5 w-3.5" /></button>
                <button onClick={() => execFormat("underline")} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Underline"><Underline className="h-3.5 w-3.5" /></button>
                <button onClick={() => execFormat("strikeThrough")} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Strikethrough"><Strikethrough className="h-3.5 w-3.5" /></button>
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <button onClick={() => insertBlock("h2")} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Heading"><Heading1 className="h-3.5 w-3.5" /></button>
                <button onClick={() => insertBlock("h3")} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Subheading"><Heading2 className="h-3.5 w-3.5" /></button>
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <button onClick={() => execFormat("insertUnorderedList")} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Bullet List"><List className="h-3.5 w-3.5" /></button>
                <button onClick={() => execFormat("insertOrderedList")} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Numbered List"><ListOrdered className="h-3.5 w-3.5" /></button>
                <button onClick={() => insertBlock("blockquote")} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Pull Quote"><Quote className="h-3.5 w-3.5" /></button>
                <button onClick={() => { document.execCommand("formatBlock", false, "blockquote"); document.execCommand("bold"); bodyRef.current?.focus(); handleBodyInput(); }} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 flex items-center gap-0.5" title="Bold Intro Text">
                  <Sparkles className="h-3.5 w-3.5" />
                </button>
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <button onClick={() => { const url = prompt("Enter link URL:"); if (url) execFormat("createLink", url); }} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Link"><Link2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => execFormat("insertHorizontalRule")} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Divider"><Minus className="h-3.5 w-3.5" /></button>
                <button onClick={() => insertBlock("p")} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Paragraph"><Pilcrow className="h-3.5 w-3.5" /></button>
                <div className="flex-1" />
                <span className="text-[10px] text-gray-400 tabular-nums">{article.bodyText.length} chars</span>
              </div>
            </div>

            {/* WYSIWYG Body — contentEditable styled like article page */}
            <div
              ref={bodyRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleBodyInput}
              className="min-h-[300px] outline-none text-[15px] leading-[1.85] text-gray-800 break-words
                [&>p]:mb-4
                [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:text-5xl [&>p:first-of-type]:first-letter:font-black [&>p:first-of-type]:first-letter:text-[#DC2626] [&>p:first-of-type]:first-letter:leading-[0.85] [&>p:first-of-type]:first-letter:mr-2 [&>p:first-of-type]:first-letter:mt-1
                [&>h2]:text-xl [&>h2]:font-extrabold [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:pb-1.5 [&>h2]:border-b-2 [&>h2]:border-[#DC2626]/20
                [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mt-5 [&>h3]:mb-2
                [&>blockquote]:border-l-4 [&>blockquote]:border-[#DC2626] [&>blockquote]:bg-red-50/50 [&>blockquote]:pl-4 [&>blockquote]:py-2 [&>blockquote]:pr-3 [&>blockquote]:rounded-r-lg [&>blockquote]:my-4 [&>blockquote]:italic
                [&>ul]:list-disc [&>ul]:ml-5 [&>ul]:my-3
                [&>ol]:list-decimal [&>ol]:ml-5 [&>ol]:my-3
                [&>hr]:my-6 [&>hr]:border-gray-200
                [&_a]:text-[#DC2626] [&_a]:underline
                [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-sm
                [&_u]:underline [&_s]:line-through
                empty:before:content-['Start_writing_your_article_here...'] empty:before:text-gray-400 empty:before:italic"
              data-placeholder="Start writing your article here..."
            />

            {/* Videos */}
            {article.videoUrls.length > 0 && (
              <div className="mt-8 space-y-3">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-[#DC2626]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  Video
                </h3>
                {article.videoUrls.map((url, idx) => (
                  <div key={idx} className="relative w-full aspect-video rounded-xl overflow-hidden bg-black group">
                    {url.includes("youtube") || url.includes("youtu.be") ? (
                      <iframe src={url} className="absolute inset-0 w-full h-full" allowFullScreen title={`Video ${idx + 1}`} />
                    ) : (
                      <video src={url} controls className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => removeVideo(idx)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1.5 rounded-lg transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Photo Gallery (separate from hero) */}
            {article.images.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-[#DC2626]" />
                    Photos ({article.images.length})
                  </h3>
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="text-xs font-semibold text-[#DC2626] hover:text-[#B91C1C] flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add More
                  </button>
                </div>
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 group">
                  <img
                    src={article.images[galleryViewIdx]?.url}
                    alt={article.images[galleryViewIdx]?.alt || ""}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {article.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setGalleryViewIdx((galleryViewIdx - 1 + article.images.length) % article.images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => setGalleryViewIdx((galleryViewIdx + 1) % article.images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      >
                        ›
                      </button>
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                        {galleryViewIdx + 1} / {article.images.length}
                      </div>
                    </>
                  )}
                  <button
                    onClick={() => removeImage(galleryViewIdx)}
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1.5 rounded-lg transition-opacity text-[10px] flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
                {/* Thumbnail strip */}
                {article.images.length > 1 && (
                  <div className="flex gap-1.5 mt-2 overflow-x-auto">
                    {article.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setGalleryViewIdx(idx)}
                        className={`shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 transition-colors ${idx === galleryViewIdx ? "border-[#DC2626]" : "border-transparent opacity-60 hover:opacity-100"}`}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Add media buttons if none yet */}
            {article.images.length === 0 && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-[#DC2626] hover:text-[#DC2626] transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  Add Gallery Photos
                </button>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
                >
                  <Video className="h-4 w-4" />
                  Add Video
                </button>
              </div>
            )}

            {/* Tags */}
            <div className="mt-8 pt-5 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tags</span>
              </div>

              {/* Quick-add top tags */}
              {topTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {topTags.filter((t) => !article.tags.includes(t)).slice(0, 10).map((t) => (
                    <button
                      key={t}
                      onClick={() => addTag(t)}
                      className="text-[11px] font-medium text-gray-500 bg-gray-100 hover:bg-[#DC2626] hover:text-white px-2.5 py-1 rounded-full transition-colors"
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              )}

              {/* Current tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {article.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 bg-[#DC2626]/10 text-[#DC2626] text-xs font-semibold px-2.5 py-1 rounded-full">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-800"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>

              {/* Tag input */}
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626] outline-none"
                    placeholder="Type to add or search tags..."
                  />
                  <button onClick={() => addTag()} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors">Add</button>
                </div>
                {tagSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-12 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                    {tagSuggestions.map((s) => (
                      <button key={s} onClick={() => addTag(s)} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-gray-400" />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
