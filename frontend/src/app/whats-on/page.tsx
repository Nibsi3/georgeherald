import Link from "next/link";
import SectionHeader from "@/components/sections/SectionHeader";
import MostReadSidebar from "@/components/sections/MostReadSidebar";
import { getMostReadArticles } from "@/lib/scraped-data";
import { Calendar, ExternalLink } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What's On",
  description: "Events, markets, shows and activities in George and the Garden Route.",
};

export default function WhatsOnPage() {
  const mostRead = getMostReadArticles(10);

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <a href="/" className="hover:text-primary transition-colors">Home</a>
        <span>/</span>
        <span className="text-foreground font-medium">What&apos;s On</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SectionHeader title="What's On" />
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-amber-600" />
            <h2 className="text-xl font-bold mb-2">Events & Activities</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Find the latest events, markets, shows and activities happening in George and the Garden Route.
            </p>
            <Link
              href="https://www.georgeherald.com/WhatsOn"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View Events on George Herald
            </Link>
          </div>
        </div>
        <aside className="lg:col-span-1">
          <MostReadSidebar articles={mostRead} />
        </aside>
      </div>
    </div>
  );
}
