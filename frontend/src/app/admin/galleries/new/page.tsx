"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Camera, CheckCircle2, User, Clock, Plus, X, Trash2 } from "lucide-react";

export default function NewGalleryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [journalist, setJournalist] = useState("");
  const [section, setSection] = useState("General");
  const [images, setImages] = useState<{ url: string; alt: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [viewIdx, setViewIdx] = useState(0);

  // Auto-populate journalist from logged-in user
  useEffect(() => {
    fetch("/api/admin/auth").then((r) => r.json()).then((data) => {
      if (data.user?.name) setJournalist(data.user.name);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(""), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

  async function uploadFile(file: File): Promise<{ url: string; name: string } | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "galleries/images");
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success && data.file) return { url: data.file.url, name: file.name };
      setToastMsg(data.error || "Upload failed");
      return null;
    } catch {
      setToastMsg("Upload failed");
      return null;
    }
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const result = await uploadFile(file);
      if (result) {
        setImages((prev) => [...prev, { url: result.url, alt: result.name }]);
        setToastMsg(`${result.name} added`);
      }
    }
    setUploading(false);
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    if (viewIdx >= images.length - 1) setViewIdx(Math.max(0, images.length - 2));
  }

  async function handleSave() {
    if (!title) {
      setToastMsg("Title is required");
      return;
    }
    if (images.length === 0) {
      setToastMsg("Add at least one photo");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/galleries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, section, journalist, images, coverImage: images[0]?.url }),
      });
      const data = await res.json();
      if (res.ok && data.slug) {
        setToastMsg("Gallery published!");
        setTimeout(() => router.push("/admin/articles"), 1000);
      } else {
        setToastMsg(data.error || "Failed to save gallery");
      }
    } catch {
      setToastMsg("Failed to save gallery");
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

      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleImageUpload(e.target.files); e.target.value = ""; }} />

      {/* Top action bar */}
      <div className="flex items-center gap-3 pb-4">
        <Link href="/admin/articles" className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-gray-900 truncate">New Gallery</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !title || images.length === 0}
          className="inline-flex items-center gap-2 bg-[#DC2626] text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Publishing..." : "Publish Gallery"}
        </button>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">

            {/* Gallery icon header */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Camera className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Create Gallery</h2>
                <p className="text-xs text-gray-400">This gallery will appear in the Galleries section</p>
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
                placeholder="Gallery title..."
              />
            </div>

            {/* Photos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Photos ({images.length})</label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-[#DC2626] hover:text-[#B91C1C] flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Photos
                </button>
              </div>

              {images.length > 0 ? (
                <>
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 group">
                    <img src={images[viewIdx]?.url} alt={images[viewIdx]?.alt || ""} className="absolute inset-0 w-full h-full object-cover" />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setViewIdx((viewIdx - 1 + images.length) % images.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        >&#8249;</button>
                        <button
                          onClick={() => setViewIdx((viewIdx + 1) % images.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        >&#8250;</button>
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                          {viewIdx + 1} / {images.length}
                        </div>
                      </>
                    )}
                    <button
                      onClick={() => removeImage(viewIdx)}
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1.5 rounded-lg transition-opacity text-[10px] flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                  {images.length > 1 && (
                    <div className="flex gap-1.5 mt-2 overflow-x-auto">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setViewIdx(idx)}
                          className={`shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 transition-colors ${idx === viewIdx ? "border-[#DC2626]" : "border-transparent opacity-60 hover:opacity-100"}`}
                        >
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#DC2626] hover:bg-red-50/30 transition-colors"
                >
                  <Camera className="h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-400">Click to upload photos</p>
                  {uploading && <p className="text-xs text-[#DC2626]">Uploading...</p>}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626] outline-none resize-none"
                placeholder="Brief description of the gallery..."
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
                {["General", "Sport", "News", "Entertainment", "Community"].map((s) => (
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
