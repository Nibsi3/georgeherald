"use client";

import { useEffect } from "react";

export default function GoogleTranslateLoader() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const w = window as unknown as {
      googleTranslateElementInit?: () => void;
      google?: any;
      __gh_translate_loaded__?: boolean;
    };

    if (w.__gh_translate_loaded__) return;
    w.__gh_translate_loaded__ = true;

    w.googleTranslateElementInit = () => {
      try {
        if (!w.google?.translate?.TranslateElement) return;
        new w.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,af,zu,xh,st,nso,tn,ts,ss,ve,nr",
            layout: w.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          "google_translate_element"
        );
      } catch {
        // ignore
      }
    };

    if (document.getElementById("google-translate-script")) return;

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // keep script across navigations
    };
  }, []);

  return null;
}
