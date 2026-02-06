import { searchArticles } from "@/lib/scraped-data";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) {
    return NextResponse.json([]);
  }
  const results = searchArticles(q, 8);
  const lite = results.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    category: a.category?.name || a.section,
    publishedDate: a.publishedDate,
  }));
  return NextResponse.json(lite);
}
