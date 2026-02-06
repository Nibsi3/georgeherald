import type { NavItem } from "./types";

export const mainNavigation: NavItem[] = [
  {
    label: "News",
    href: "/news",
    children: [
      { label: "Top Stories", href: "/news/category/top-stories" },
      { label: "Local", href: "/news/category/local" },
      { label: "National & World", href: "/news/category/national" },
      { label: "Crime", href: "/news/category/crime" },
      { label: "Business", href: "/news/category/business" },
      { label: "Environment", href: "/news/category/environment" },
      { label: "Agriculture", href: "/news/category/agriculture" },
      { label: "Politics", href: "/news/category/politics" },
      { label: "General", href: "/news/category/general" },
    ],
  },
  {
    label: "Sport",
    href: "/sport",
    children: [
      { label: "Latest Sport", href: "/sport" },
      { label: "Rugby", href: "/sport/rugby" },
      { label: "Cricket", href: "/sport/cricket" },
      { label: "Football", href: "/sport/football" },
      { label: "Golf", href: "/sport/golf" },
      { label: "Tennis", href: "/sport/tennis" },
      { label: "Athletics", href: "/sport/athletics" },
    ],
  },
  {
    label: "Videos",
    href: "/videos",
    children: [
      { label: "Latest Videos", href: "/videos" },
      { label: "News", href: "/videos/news" },
      { label: "Sport", href: "/videos/sport" },
      { label: "Business", href: "/videos/business" },
      { label: "Entertainment", href: "/videos/entertainment" },
      { label: "Lifestyle", href: "/videos/lifestyle" },
    ],
  },
  {
    label: "Galleries",
    href: "/galleries",
    children: [
      { label: "General", href: "/galleries/general" },
      { label: "News", href: "/galleries/news" },
      { label: "Schools", href: "/galleries/schools" },
      { label: "Special Events", href: "/galleries/special-events" },
      { label: "Sport", href: "/galleries/sport" },
    ],
  },
  {
    label: "Life & Arts",
    href: "/lifestyle",
    children: [
      { label: "Lifestyle", href: "/lifestyle" },
      { label: "Entertainment", href: "/entertainment" },
      { label: "What's On", href: "/whats-on" },
      { label: "Tourism", href: "/tourism" },
      { label: "Property", href: "/property" },
    ],
  },
  {
    label: "Schools",
    href: "/schools",
    children: [
      { label: "All Schools", href: "/schools" },
      { label: "Sport", href: "/schools/sport" },
      { label: "Academic", href: "/schools/academic" },
      { label: "Cultural", href: "/schools/cultural" },
      { label: "Social", href: "/schools/social" },
    ],
  },
  {
    label: "Community",
    href: "/community",
    children: [
      { label: "Municipal Notices", href: "/community/municipal-notices" },
      { label: "What's On", href: "/community/whats-on" },
      { label: "Sports Gallery", href: "/galleries/sport" },
      { label: "About George", href: "/community/about-george" },
    ],
  },
  {
    label: "Opinion",
    href: "/opinion",
  },
];
