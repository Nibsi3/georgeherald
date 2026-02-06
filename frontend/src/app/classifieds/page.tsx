import Link from "next/link";
import { Briefcase, ShoppingBag, Home, Car, Bell, Building2, Wrench, FileText, Search } from "lucide-react";
import type { Metadata } from "next";
import classifiedsData from "@/data/classifieds.json";

export const metadata: Metadata = {
  title: "Classifieds",
  description: "Browse classified ads from George Herald — vacancies, for sale, property, services and more.",
};

const SECTION_CONFIG: Record<string, { icon: typeof Briefcase; color: string; description: string }> = {
  vacancies: { icon: Briefcase, color: "bg-blue-50 text-blue-600 border-blue-200", description: "Job offers, employment wanted & business opportunities" },
  "for-sale": { icon: ShoppingBag, color: "bg-green-50 text-green-600 border-green-200", description: "Pets, furniture, auctions & miscellaneous items" },
  "home-improvement": { icon: Wrench, color: "bg-orange-50 text-orange-600 border-orange-200", description: "Gardening, plumbing, handymen & cleaning services" },
  motoring: { icon: Car, color: "bg-purple-50 text-purple-600 border-purple-200", description: "Vehicles for sale, boats, motorcycles & repairs" },
  notices: { icon: Bell, color: "bg-pink-50 text-pink-600 border-pink-200", description: "Personal notices, marriages, births & announcements" },
  property: { icon: Building2, color: "bg-amber-50 text-amber-600 border-amber-200", description: "Houses, flats, business premises & accommodation" },
  services: { icon: Home, color: "bg-teal-50 text-teal-600 border-teal-200", description: "General services, transport, storage & more" },
};

export default function ClassifiedsPage() {
  const data = classifiedsData as Record<string, { name: string; subcategories: Record<string, { name: string; count: number; ads: { ref: string; text: string; date: string; url: string }[] }> }>;

  // Count total ads
  let totalAds = 0;
  for (const section of Object.values(data)) {
    for (const sub of Object.values(section.subcategories)) {
      totalAds += sub.count;
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Classifieds</span>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 md:p-10 mb-8 text-white">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="h-8 w-8" />
          <h1 className="text-2xl md:text-3xl font-black">George Herald Classifieds</h1>
        </div>
        <p className="text-white/80 max-w-2xl mb-4">
          Browse {totalAds} classified ads across {Object.keys(data).length - 1} categories. Find jobs, property, services, vehicles and more from the Garden Route.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/classifieds"
            className="inline-flex items-center gap-2 bg-white text-primary font-bold text-sm px-4 py-2 rounded-lg hover:bg-white/90 transition-colors"
          >
            <FileText className="h-4 w-4" />
            Browse All Classifieds
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white/20 text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
          >
            Place an Ad
          </Link>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(data).map(([sectionSlug, section]) => {
          if (sectionSlug === "all-classifieds") return null;
          const config = SECTION_CONFIG[sectionSlug];
          if (!config) return null;
          const Icon = config.icon;
          const sectionTotal = Object.values(section.subcategories).reduce((sum, s) => sum + s.count, 0);

          return (
            <div key={sectionSlug} className={`rounded-xl border-2 ${config.color} overflow-hidden hover:shadow-lg transition-shadow`}>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-foreground text-lg capitalize">{section.name}</h2>
                    <p className="text-xs text-muted-foreground">{sectionTotal} listings</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{config.description}</p>
                <div className="space-y-1.5">
                  {Object.entries(section.subcategories).map(([subSlug, sub]) => (
                    <Link
                      key={subSlug}
                      href={`/classifieds/${sectionSlug}/${subSlug}`}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/80 transition-colors group text-sm"
                    >
                      <span className="text-foreground/80 group-hover:text-primary transition-colors capitalize">
                        {sub.name}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sub.count > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {sub.count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Advertise CTA */}
      <div className="mt-10 bg-muted/50 border border-border rounded-xl p-6 md:p-8 text-center">
        <Search className="h-8 w-8 text-primary mx-auto mb-3" />
        <h3 className="text-lg font-bold mb-2">Want to advertise?</h3>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-4">
          Reach thousands of readers in the Garden Route. Place your classified ad in the George Herald today.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Contact Us to Advertise
          </Link>
          <a
            href="tel:0448742424"
            className="inline-flex items-center gap-2 bg-white border border-border text-foreground font-bold text-sm px-5 py-2.5 rounded-lg hover:border-primary/30 transition-colors"
          >
            Call 044 874 2424
          </a>
        </div>
      </div>
    </div>
  );
}
