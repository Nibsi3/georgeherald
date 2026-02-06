"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, Search, X, ChevronDown, Cloud, Sun, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { mainNavigation } from "@/lib/navigation";
import type { NavItem } from "@/lib/types";

interface SearchResult {
  id: number;
  title: string;
  slug: string;
  category: string;
  publishedDate: string;
}

function DesktopNavItem({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);

  if (!item.children) {
    return (
      <Link
        href={item.href}
        className="px-3 py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={item.href}
        className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
      >
        {item.label}
        <ChevronDown className="h-3 w-3" />
      </Link>
      {open && (
        <div className="absolute top-full left-0 z-50 min-w-[200px] bg-white border border-border rounded-lg shadow-lg py-2 animate-in fade-in-0 zoom-in-95">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className="block px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-primary transition-colors"
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileNavItem({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-border/50">
      <div className="flex items-center justify-between">
        <Link
          href={item.href}
          onClick={onClose}
          className="flex-1 px-4 py-3 text-sm font-semibold text-foreground"
        >
          {item.label}
        </Link>
        {item.children && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-3 text-muted-foreground"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      {expanded && item.children && (
        <div className="bg-muted/50 pb-2">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onClose}
              className="block px-8 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      setShowDropdown(false);
      setSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      {/* Top bar */}
      <div className="bg-herald-black text-white">
        <div className="container mx-auto px-4 flex items-center justify-between h-8">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-white/70">
              {new Date().toLocaleDateString("en-ZA", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <Sun className="h-3 w-3 text-yellow-400" />
              <span>George</span>
              <span className="font-semibold">24°C</span>
            </div>
            <Link href="/contact" className="hover:text-primary transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      {/* Logo bar */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 flex items-center justify-between h-16 lg:h-20">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0">
                <div className="p-4 border-b border-border">
                  <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center">
                    <Image src="/georgeherald_logo.png" alt="George Herald" width={160} height={40} className="h-9 w-auto" />
                  </Link>
                </div>
                <nav className="overflow-y-auto max-h-[calc(100vh-80px)]">
                  {mainNavigation.map((item) => (
                    <MobileNavItem key={item.href} item={item} onClose={() => setMobileOpen(false)} />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image src="/georgeherald_logo.png" alt="George Herald" width={220} height={50} className="h-10 lg:h-12 w-auto" priority />
            </Link>
          </div>

          {/* Search & actions */}
          <div className="flex items-center gap-2" ref={searchRef}>
            {searchOpen ? (
              <div className="relative">
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex items-center gap-2 animate-in slide-in-from-right-5"
                >
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search articles..."
                      className="w-48 md:w-72 h-9 pl-9"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                    />
                  </div>
                  <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 h-9 px-3">
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setSearchOpen(false); setSearchQuery(""); setShowDropdown(false); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </form>

                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full right-0 mt-1 w-[320px] md:w-[400px] bg-white border border-border rounded-lg shadow-xl z-50 max-h-[400px] overflow-y-auto">
                    {searchResults.map((result) => (
                      <Link
                        key={result.id}
                        href={`/news/${result.slug}`}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors border-b border-border/50 last:border-0"
                        onClick={() => { setShowDropdown(false); setSearchOpen(false); setSearchQuery(""); }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug line-clamp-2">{result.title}</p>
                          <span className="text-[11px] text-primary font-semibold uppercase mt-1 block">{result.category}</span>
                        </div>
                      </Link>
                    ))}
                    <button
                      onClick={handleSearchSubmit as unknown as React.MouseEventHandler}
                      className="w-full px-4 py-2.5 text-sm font-semibold text-primary hover:bg-accent transition-colors text-center"
                    >
                      View all results for &ldquo;{searchQuery}&rdquo; →
                    </button>
                  </div>
                )}

                {showDropdown && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="absolute top-full right-0 mt-1 w-[320px] md:w-[400px] bg-white border border-border rounded-lg shadow-xl z-50 p-4 text-center">
                    <p className="text-sm text-muted-foreground">No articles found for &ldquo;{searchQuery}&rdquo;</p>
                  </div>
                )}
              </div>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
                <Search className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop navigation */}
      <nav className="hidden lg:block border-b border-border bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-11">
            <div className="flex items-center justify-center gap-1 flex-1">
              {mainNavigation.map((item) => (
                <DesktopNavItem key={item.href} item={item} />
              ))}
            </div>
            <Link
              href="/emergency-numbers"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors shrink-0"
              title="Emergency Numbers"
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden xl:inline">Emergency Numbers</span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
