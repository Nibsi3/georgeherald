"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface ShareButtonsProps {
  title: string;
  slug: string;
}

export default function ShareButtons({ title, slug }: ShareButtonsProps) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/news/${slug}`);
  }, [slug]);

  if (!url) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-sm font-semibold text-muted-foreground">Share:</span>
      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Facebook
        </a>
      </Button>
      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          X / Twitter
        </a>
      </Button>
      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + url)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>
      </Button>
      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
      </Button>
      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
        <a
          href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(title + "\n\n" + url)}`}
        >
          Email
        </a>
      </Button>
    </div>
  );
}
