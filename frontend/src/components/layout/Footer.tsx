import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.71a8.19 8.19 0 004.76 1.52V6.79a4.84 4.84 0 01-1-.1z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-herald-black text-white">
      {/* Main footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center mb-4">
              <Image src="/georgeherald_logo.png" alt="George Herald" width={180} height={45} className="h-10 w-auto brightness-0 invert" />
            </Link>
            <p className="text-sm text-white/60 mb-4 leading-relaxed">
              Your trusted source for local news, sport, and community stories from the Garden Route.
              Serving George and the greater Eden district since 1963.
            </p>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/GeorgeHeraldNews/" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-primary transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://x.com/GeorgeHerald" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-primary transition-colors" aria-label="X (Twitter)">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/georgeheraldnews/" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-primary transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.youtube.com/channel/UCrTKSG0b9GJSoT7kLPa7qCw/videos?view_as=subscriber" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-primary transition-colors" aria-label="YouTube">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="https://www.tiktok.com/@thegeorgeherald" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-primary transition-colors" aria-label="TikTok">
                <TikTokIcon className="h-5 w-5" />
              </a>
            </div>
            <div className="mt-3">
              <a
                href="https://whatsapp.com/channel/0029VaNwpHsFcovzVDNsRk2X"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-3 py-2 rounded transition-colors"
              >
                Follow us on WhatsApp
              </a>
            </div>
          </div>

          {/* News */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4">News</h3>
            <ul className="space-y-2">
              {[
                { label: "Top Stories", href: "/news/category/top-stories" },
                { label: "Local News", href: "/news/category/local" },
                { label: "Crime", href: "/news/category/crime" },
                { label: "Business", href: "/news/category/business" },
                { label: "Politics", href: "/news/category/politics" },
                { label: "Environment", href: "/news/category/environment" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* More */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4">More</h3>
            <ul className="space-y-2">
              {[
                { label: "Sport", href: "/sport" },
                { label: "Lifestyle", href: "/lifestyle" },
                { label: "Videos", href: "/videos" },
                { label: "Galleries", href: "/galleries" },
                { label: "Schools", href: "/schools" },
                { label: "Classifieds", href: "/classifieds" },
                { label: "Community", href: "/community" },
                { label: "Opinion", href: "/opinion" },
                { label: "Contact Us", href: "/contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span className="text-sm text-white/60">13 Ring Road, George Industria, 6536</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <a href="tel:0448742424" className="text-sm text-white/60 hover:text-primary transition-colors">044 874 2424</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <a href="mailto:news@georgeherald.com" className="text-sm text-white/60 hover:text-primary transition-colors">news@georgeherald.com</a>
              </li>
            </ul>
            <p className="text-xs text-white/40 mt-3">Fax: 044 874 1393</p>
            <p className="text-xs text-white/40 mt-1">PO Box 806, George Industria, 6530</p>
          </div>
        </div>
      </div>

      {/* Press Council */}
      <Separator className="bg-white/10" />
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <p className="text-xs text-white/60 leading-relaxed">
            George Herald proudly displays the <strong className="text-white/80">&ldquo;FAIR&rdquo;</strong> stamp of the Press Council of South Africa,
            indicating our commitment to adhere to the Code of Ethics for Print and Online Media which prescribes that our reportage is truthful, accurate and fair.
            Should you wish to lodge a complaint about our news coverage, please lodge a complaint on the Press Council&apos;s website,{" "}
            <a href="https://www.presscouncil.org.za" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.presscouncil.org.za</a>{" "}
            or email the complaint to{" "}
            <a href="mailto:enquiries@ombudsman.org.za" className="text-primary hover:underline">enquiries@ombudsman.org.za</a>.
            Contact the Press Council on{" "}
            <a href="tel:0114843612" className="text-primary hover:underline">011 484 3612</a>.
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <Separator className="bg-white/10" />
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} Group Editors Company (Pty) Ltd, Registration Number 1963/002133/07 t/a George Herald. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="hover:text-white/60 transition-colors">Contact Us</Link>
            <a href="https://www.presscouncil.org.za" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">Press Council</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
