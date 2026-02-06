import Link from "next/link";
import { ArrowLeft, ExternalLink, Phone, Calendar, Tag } from "lucide-react";
import type { Metadata } from "next";
import classifiedsData from "@/data/classifieds.json";

type ClassifiedsData = Record<string, { name: string; subcategories: Record<string, { name: string; count: number; ads: { ref: string; text: string; date: string; url: string }[] }> }>;

interface PageProps {
  params: Promise<{ section: string; subcategory: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section, subcategory } = await params;
  const data = classifiedsData as ClassifiedsData;
  const sectionData = data[section];
  const subData = sectionData?.subcategories?.[subcategory];
  const title = subData?.name || subcategory.replace(/-/g, " ");
  const sectionName = sectionData?.name || section.replace(/-/g, " ");
  return {
    title: `${title} - ${sectionName} Classifieds`,
    description: `Browse ${title} classified ads in the George Herald ${sectionName} section.`,
  };
}

export function generateStaticParams() {
  const data = classifiedsData as ClassifiedsData;
  const params: { section: string; subcategory: string }[] = [];
  for (const [section, sectionData] of Object.entries(data)) {
    if (section === "all-classifieds") continue;
    for (const subcategory of Object.keys(sectionData.subcategories)) {
      params.push({ section, subcategory });
    }
  }
  return params;
}

function extractPhoneNumbers(text: string): string[] {
  const matches = text.match(/(?:0\d{2}[\s-]?\d{3}[\s-]?\d{4}|0\d{9})/g);
  return matches || [];
}

export default async function ClassifiedSubcategoryPage({ params }: PageProps) {
  const { section, subcategory } = await params;
  const data = classifiedsData as ClassifiedsData;
  const sectionData = data[section];
  const subData = sectionData?.subcategories?.[subcategory];

  if (!subData) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
        <Link href="/classifieds" className="text-primary hover:underline">Back to Classifieds</Link>
      </div>
    );
  }

  const sectionName = sectionData.name;

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/classifieds" className="hover:text-primary transition-colors">Classifieds</Link>
        <span>/</span>
        <span className="text-foreground/70 capitalize">{sectionName}</span>
        <span>/</span>
        <span className="text-foreground font-medium">{subData.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link href="/classifieds" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-2">
            <ArrowLeft className="h-3.5 w-3.5" />
            All Classifieds
          </Link>
          <h1 className="text-2xl md:text-3xl font-black">{subData.name}</h1>
          <p className="text-sm text-muted-foreground mt-1 capitalize">{sectionName} &middot; {subData.count} listing{subData.count !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors shrink-0"
        >
          Place an Ad
        </Link>
      </div>

      {/* Other subcategories in this section */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {Object.entries(sectionData.subcategories).map(([slug, sub]) => (
          <Link
            key={slug}
            href={`/classifieds/${section}/${slug}`}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors shrink-0 ${
              slug === subcategory
                ? "bg-primary text-white"
                : "bg-muted text-foreground/70 hover:text-primary hover:bg-primary/10"
            }`}
          >
            {sub.name} ({sub.count})
          </Link>
        ))}
      </div>

      {/* Ads list */}
      {subData.ads.length > 0 ? (
        <div className="space-y-4">
          {subData.ads.map((ad) => {
            const phones = extractPhoneNumbers(ad.text);
            const cleanText = ad.text.replace(/\s*Read More\s*$/, "").trim();

            return (
              <div
                key={ad.ref}
                className="bg-white border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-base text-foreground leading-relaxed mb-3">
                      {cleanText}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {ad.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {ad.date}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Ref: {ad.ref}
                      </span>
                      {phones.map((phone) => (
                        <a
                          key={phone}
                          href={`tel:${phone.replace(/\s|-/g, "")}`}
                          className="flex items-center gap-1 text-primary font-semibold hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {phone}
                        </a>
                      ))}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground flex items-center gap-1">
                    Ref: {ad.ref}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-muted/50 border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground">No listings in this category at the moment.</p>
          <Link href="/classifieds" className="text-primary hover:underline text-sm mt-2 inline-block">
            Browse other categories
          </Link>
        </div>
      )}

      {/* Advertise CTA */}
      <div className="mt-8 bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
        <h3 className="font-bold mb-1">Want to place an ad in {subData.name}?</h3>
        <p className="text-sm text-muted-foreground mb-3">Reach thousands of readers in the Garden Route.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="bg-primary text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            Contact Us
          </Link>
          <a href="tel:0448742424" className="bg-white border border-border text-foreground font-bold text-sm px-4 py-2 rounded-lg hover:border-primary/30 transition-colors">
            044 874 2424
          </a>
        </div>
      </div>
    </div>
  );
}
