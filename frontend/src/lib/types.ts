export interface StrapiImage {
  url: string;
  alternativeText?: string;
  width?: number;
  height?: number;
  formats?: {
    thumbnail?: { url: string; width: number; height: number };
    small?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    large?: { url: string; width: number; height: number };
  };
}

export interface Author {
  id: number;
  name: string;
  slug: string;
  bio?: string;
  avatar?: StrapiImage;
  email?: string;
  role?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  parentSection?: string;
  sortOrder?: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface ContentBlock {
  type: "paragraph" | "heading" | "blockquote" | "list";
  text: string;
  html?: string;
  level?: string;
  items?: string[];
  ordered?: boolean;
}

export interface Article {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: unknown[];
  bodyText?: string;
  bodyBlocks?: ContentBlock[];
  articleImages?: StrapiImage[];
  sourceUrl?: string;
  galleryLink?: string;
  videoUrls?: string[];
  featuredImage?: StrapiImage;
  category?: Category;
  author?: Author;
  tags?: Tag[];
  isTopStory: boolean;
  isBreaking: boolean;
  isFeatured: boolean;
  viewCount: number;
  publishedDate: string;
  section: string;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  description?: string;
  videoUrl: string;
  thumbnail?: StrapiImage;
  duration?: string;
  section?: string;
  publishedDate: string;
  viewCount: number;
}

export interface Gallery {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: StrapiImage;
  images?: StrapiImage[];
  section?: string;
  publishedDate: string;
}

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export type Section =
  | "local"
  | "national"
  | "business"
  | "crime"
  | "environment"
  | "agriculture"
  | "politics"
  | "lifestyle"
  | "entertainment"
  | "sport"
  | "schools"
  | "community"
  | "opinion"
  | "general";

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}
