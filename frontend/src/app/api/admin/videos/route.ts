import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/admin-auth";
import fs from "fs";
import path from "path";

const VIDEOS_FILE = path.join(process.cwd(), "src", "data", "videos.json");

function readVideos() {
  try {
    return JSON.parse(fs.readFileSync(VIDEOS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeVideos(videos: unknown[]) {
  fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2), "utf-8");
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  const now = new Date();
  const dateSuffix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  return `${base}-${dateSuffix}`;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const videos = readVideos();
  return NextResponse.json({ videos });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, videoUrl, thumbnail, section, journalist } = body;

  if (!title || !videoUrl) {
    return NextResponse.json({ error: "Title and video URL are required" }, { status: 400 });
  }

  const slug = slugify(title);

  // Extract YouTube thumbnail if not provided
  let thumbUrl = thumbnail || "";
  if (!thumbUrl && videoUrl) {
    const match = videoUrl.match(/(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (match) {
      thumbUrl = `https://img.youtube.com/vi/${match[1]}/0.jpg`;
    }
  }

  // Normalize embed URL
  let embedUrl = videoUrl.trim();
  const watchMatch = embedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (watchMatch) {
    embedUrl = `//www.youtube.com/embed/${watchMatch[1]}`;
  }

  const newVideo = {
    title,
    url: "",
    slug,
    thumbnail: thumbUrl,
    section: section || "LatestVideos",
    page: {
      title: title,
      description: description || "",
      videoUrl: embedUrl,
      thumbnail: thumbUrl,
      sourceUrl: "",
    },
    journalist: journalist || session.name || "",
    publishedDate: new Date().toISOString(),
    createdBy: session.name,
  };

  const videos = readVideos();
  videos.unshift(newVideo);
  writeVideos(videos);

  return NextResponse.json({ video: newVideo, slug });
}
