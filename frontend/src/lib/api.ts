import type { Article, Video, Gallery, StrapiResponse } from "./types";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const API_TOKEN = process.env.STRAPI_API_TOKEN || "";

async function fetchAPI<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`/api${path}`, STRAPI_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (API_TOKEN) {
    headers["Authorization"] = `Bearer ${API_TOKEN}`;
  }

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getArticles(params?: {
  section?: string;
  isTopStory?: boolean;
  isFeatured?: boolean;
  page?: number;
  pageSize?: number;
  sort?: string;
}): Promise<StrapiResponse<Article[]>> {
  const queryParams: Record<string, string> = {
    "populate": "*",
    "sort": params?.sort || "publishedDate:desc",
    "pagination[page]": String(params?.page || 1),
    "pagination[pageSize]": String(params?.pageSize || 10),
  };

  if (params?.section) {
    queryParams["filters[section][$eq]"] = params.section;
  }
  if (params?.isTopStory) {
    queryParams["filters[isTopStory][$eq]"] = "true";
  }
  if (params?.isFeatured) {
    queryParams["filters[isFeatured][$eq]"] = "true";
  }

  return fetchAPI<StrapiResponse<Article[]>>("/articles", queryParams);
}

export async function getArticleBySlug(slug: string): Promise<StrapiResponse<Article[]>> {
  return fetchAPI<StrapiResponse<Article[]>>("/articles", {
    "filters[slug][$eq]": slug,
    "populate": "*",
  });
}

export async function getVideos(params?: {
  section?: string;
  page?: number;
  pageSize?: number;
}): Promise<StrapiResponse<Video[]>> {
  const queryParams: Record<string, string> = {
    "populate": "*",
    "sort": "publishedDate:desc",
    "pagination[page]": String(params?.page || 1),
    "pagination[pageSize]": String(params?.pageSize || 8),
  };

  if (params?.section) {
    queryParams["filters[section][$eq]"] = params.section;
  }

  return fetchAPI<StrapiResponse<Video[]>>("/videos", queryParams);
}

export async function getVideoBySlug(slug: string): Promise<StrapiResponse<Video[]>> {
  return fetchAPI<StrapiResponse<Video[]>>("/videos", {
    "filters[slug][$eq]": slug,
    "populate": "*",
  });
}

export async function getGalleries(params?: {
  section?: string;
  page?: number;
  pageSize?: number;
}): Promise<StrapiResponse<Gallery[]>> {
  const queryParams: Record<string, string> = {
    "populate": "*",
    "sort": "publishedDate:desc",
    "pagination[page]": String(params?.page || 1),
    "pagination[pageSize]": String(params?.pageSize || 8),
  };

  if (params?.section) {
    queryParams["filters[section][$eq]"] = params.section;
  }

  return fetchAPI<StrapiResponse<Gallery[]>>("/galleries", queryParams);
}

export async function getGalleryBySlug(slug: string): Promise<StrapiResponse<Gallery[]>> {
  return fetchAPI<StrapiResponse<Gallery[]>>("/galleries", {
    "filters[slug][$eq]": slug,
    "populate[images][populate]": "*",
    "populate[coverImage][populate]": "*",
  });
}

export function getStrapiMediaUrl(url?: string): string {
  if (!url) return "/placeholder.jpg";
  if (url.startsWith("http")) return url;
  return `${STRAPI_URL}${url}`;
}
