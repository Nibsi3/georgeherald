"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Video, CheckCircle2, User, Clock } from "lucide-react";

export default function NewVideoPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [journalist, setJournalist] = useState("");
  const [section, setSection] = useState("LatestVideos");
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [thumbnail, setThumbnail] = useState("");

  // Auto-populate journalist from logged-in user
  useEffect(() => {
    fetch("/api/admin/auth").then((r) => r.json()).then((data) => {
      if (data.user?.name) setJournalist(data.user.name);
    }).catch(() => {});
  }, []);

  // Auto-generate thumbnail from YouTube URL
  useEffect(() => {
    const match = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    if (match) {
      setThumbnail(`https://img.youtube.com/vi/${match[1]}/0.jpg`);
    } else {
      setThumbnail("");
    }
  }, [videoUrl]);

  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(""), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

  async function handleSave() {
    if (!title || !videoUrl) {
      setToastMsg("Title and video URL are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, videoUrl, thumbnail, section, journalist }),
      });
      const data = await res.json();
      if (res.ok && data.slug) {
        setToastMsg("Video published!");
        setTimeout(() => router.push("/admin/articles"), 1000);
      } else {
        setToastMsg(data.error || "Failed to save video");
      }
    } catch {
      setToastMsg("Failed to save video");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-0">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          {toastMsg}
        </div>
      )}

      {/* Top action bar */}
      <div className="flex items-center gap-3 pb-4">
        <Link href="/admin/articles" className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-gray-900 truncate">New Video</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !title || !videoUrl}
          className="inline-flex items-center gap-2 bg-[#DC2626] text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Publishing..." : "Publish Video"}
        </button>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">

            {/* Video icon header */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Video className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Add Video</h2>
                <p className="text-xs text-gray-400">This video will appear in the Videos section</p>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base font-semibold focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626] outline-none"
                placeholder="Video title..."
              />
            </div>

            {/* Video URL */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Video URL</label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626] outline-none"
                placeholder="https://www.youtube.com/watch?v=... or embed URL"
              />
              <p className="text-[11px] text-gray-400 mt-1">Paste a YouTube or Vimeo URL</p>
            </div>

            {/* Preview */}
            {thumbnail && (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                <img src={thumbnail} alt="Video thumbnail" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <svg className="h-7 w-7 text-[#DC2626] ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626] outline-none resize-none"
                placeholder="Brief description of the video..."
              />
            </div>

            {/* Journalist & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  <User className="inline h-3 w-3 mr-1" />Journalist
                </label>
                <input
                  type="text"
                  value={journalist}
                  onChange={(e) => setJournalist(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626] outline-none"
                  placeholder="Journalist name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  <Clock className="inline h-3 w-3 mr-1" />Date
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" })}
                  readOnly
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            {/* Section */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Section</label>
              <div className="flex flex-wrap gap-1.5">
                {["LatestVideos", "Sport", "News", "Entertainment", "Community"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSection(s)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${section === s ? "bg-[#DC2626] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
