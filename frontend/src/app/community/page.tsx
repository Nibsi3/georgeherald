import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import SectionHeader from "@/components/sections/SectionHeader";
import MostReadSidebar from "@/components/sections/MostReadSidebar";
import ArticleCard from "@/components/cards/ArticleCard";
import GalleryCard from "@/components/cards/GalleryCard";
import ArticleListPaginated from "@/components/ui/article-list-paginated";
import { getMostReadArticles, getArticlesBySection, getArticlesByCategory, getGalleriesBySection } from "@/lib/scraped-data";
import { FileText, Calendar, Camera, Mountain, Mail, MessageCircle, ChevronRight, Users, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community",
  description: "Community resources, municipal notices, events and heritage from George and the Garden Route.",
};

const communityResources = [
  {
    title: "Municipal Notices",
    href: "/community/municipal-notices",
    icon: FileText,
    desc: "Official notices and public information from George Municipality.",
    accent: "bg-primary/10 text-primary",
  },
  {
    title: "What's On",
    href: "/community/whats-on",
    icon: Calendar,
    desc: "Events, markets, shows and activities in the Garden Route.",
    accent: "bg-amber-50 text-amber-600",
  },
  {
    title: "Sports Gallery",
    href: "/galleries/sport",
    icon: Camera,
    desc: "Photos from local sporting events across the region.",
    accent: "bg-blue-50 text-blue-600",
  },
  {
    title: "About George",
    href: "/community/about-george",
    icon: Mountain,
    desc: "History, heritage and natural beauty of the Garden Route.",
    accent: "bg-green-50 text-green-700",
  },
  {
    title: "Contact the Herald",
    href: "https://www.georgeherald.com/ContactUs",
    icon: Mail,
    desc: "Get in touch with our editorial team and newsroom.",
    accent: "bg-slate-50 text-slate-600",
  },
  {
    title: "WhatsApp Channel",
    href: "https://whatsapp.com/channel/0029VaNwpHsFcovzVDNsRk2X",
    icon: MessageCircle,
    desc: "Follow us on WhatsApp for breaking news and alerts.",
    accent: "bg-emerald-50 text-emerald-600",
  },
];

export default function CommunityPage() {
  const mostRead = getMostReadArticles(10);
  const localArticles = [
    ...getArticlesBySection("community", 20),
    ...getArticlesByCategory("we-care", 20),
    ...getArticlesByCategory("heritage", 20),
    ...getArticlesByCategory("local", 10),
  ];
  const seen = new Set<number>();
  const uniqueLocal = localArticles.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  }).slice(0, 12);
  const communityGalleries = getGalleriesBySection(undefined, 4);

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Community</span>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-red-800 text-white p-8 lg:p-12 mb-10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-8 w-8" />
            <h1 className="text-3xl lg:text-4xl font-black">Community</h1>
          </div>
          <p className="text-white/80 text-lg max-w-2xl leading-relaxed">
            Your gateway to George and the Garden Route community. Find municipal notices, local events, heritage information and ways to connect.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-white/70">
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> George, Western Cape</span>
            <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> 044 874 2413</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Resource Cards */}
          <SectionHeader title="Community Resources" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {communityResources.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="group relative overflow-hidden rounded-xl border border-border bg-white p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-200"
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${item.accent} mb-3`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </div>

          <Separator className="my-8" />

          {/* Local News */}
          <SectionHeader title="Local Community News" href="/news/category/local" />
          <div className="mb-10">
            <ArticleListPaginated articles={uniqueLocal} itemsPerPage={12} />
          </div>

          <Separator className="my-8" />

          {/* Community Galleries */}
          <SectionHeader title="Community Galleries" href="/galleries" />
          <div className="grid grid-cols-2 gap-4">
            {communityGalleries.map((gallery) => (
              <GalleryCard key={gallery.id} gallery={gallery} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <MostReadSidebar articles={mostRead} />

          {/* Emergency Numbers */}
          <div className="rounded-xl border border-primary/20 bg-red-50 p-5">
            <h3 className="font-bold text-sm text-primary mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Emergency Numbers
            </h3>
            <div className="space-y-2 text-xs">
              {[
                { label: "George Municipality", number: "044 801 9111" },
                { label: "Fire Department", number: "044 801 6311" },
                { label: "Ambulance", number: "10177" },
                { label: "Police (SAPS)", number: "10111" },
                { label: "Garden Route SPCA", number: "044 878 1082" },
              ].map((item) => (
                <div key={item.number} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{item.label}</span>
                  <a href={`tel:${item.number.replace(/\s/g, "")}`} className="font-bold text-foreground hover:text-primary transition-colors">
                    {item.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}


