import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/admin-auth";
import fs from "fs";
import path from "path";

const GALLERIES_FILE = path.join(process.cwd(), "src", "data", "galleries.json");

function readGalleries() {
  try {
    return JSON.parse(fs.readFileSync(GALLERIES_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeGalleries(galleries: unknown[]) {
  fs.writeFileSync(GALLERIES_FILE, JSON.stringify(galleries, null, 2), "utf-8");
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

  const galleries = readGalleries();
  return NextResponse.json({ galleries });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, section, journalist, images, coverImage } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const slug = slugify(title);

  const newGallery = {
    title,
    url: "",
    slug,
    coverImage: coverImage || (images && images.length > 0 ? images[0].url : ""),
    section: section || "General",
    page: {
      title,
      coverImage: coverImage || (images && images.length > 0 ? images[0].url : ""),
      images: (images || []).map((img: { url: string; alt?: string }) => ({
        url: img.url,
        alt: img.alt || title,
      })),
      description: description || "",
    },
    journalist: journalist || session.name || "",
    publishedDate: new Date().toISOString(),
    createdBy: session.name,
  };

  const galleries = readGalleries();
  galleries.unshift(newGallery);
  writeGalleries(galleries);

  return NextResponse.json({ gallery: newGallery, slug });
}
