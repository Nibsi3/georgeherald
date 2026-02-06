import Link from "next/link";
import { Phone, Mail, MapPin, Clock, Newspaper, MessageSquareText } from "lucide-react";
import ContactForm from "@/components/forms/ContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact the George Herald newsroom, advertising, and editorial team.",
};

const departments = [
  {
    name: "Editorial Department",
    members: [
      { role: "Managing Editor", name: "Suzette Herrer", email: "suzette@telegraaf.co.za" },
      { role: "Editor", name: "Lizette da Silva", email: "lizette@georgeherald.com" },
      { role: "News Editor", name: "Kristy Kolberg", email: "kristy@georgeherald.com" },
      { role: "English Sub Editor", name: "Liryke Ferreira", email: "liryke@georgeherald.com" },
      { role: "Afrikaans Sub Editor", name: "Emsie Martin", email: "emsie@georgeherald.com" },
      { role: "Journalist", name: "Alida de Beer", email: "alida@georgeherald.com" },
      { role: "Journalist", name: "Michelle Pienaar", email: "michelle@georgeherald.com" },
      { role: "Journalist", name: "Marguerite van Ginkel", email: "marguerite@georgeherald.com" },
    ],
  },
  {
    name: "Sales Department",
    members: [
      { role: "Group Sales Manager", name: "Julinda Aucamp", email: "julinda@georgeherald.com" },
      { role: "Sales Manager", name: "Rozanne Olivier", email: "rozanne@georgeherald.com" },
      { role: "Sales Executive", name: "Ilana van der Merwe", email: "ilana@georgeherald.com" },
      { role: "Sales Executive", name: "Glenda Richardson", email: "glenda@georgeherald.com" },
      { role: "Sales Executive", name: "Chantel Brummer", email: "chantel@georgeherald.com" },
    ],
  },
  {
    name: "Digital Department",
    members: [
      { role: "Head of Digital", name: "Ilse Schoonraad", email: "ilse@georgeherald.com" },
      { role: "Digital Content Administrator", name: "Dorothy Ings", email: "dorothy@georgeherald.com" },
      { role: "Social Media Co-ordinator", name: "Esté Smit", email: "este@georgeherald.com" },
      { role: "Digital Producer", name: "Cameron Squire", email: "cameron@georgeherald.com" },
    ],
  },
  {
    name: "Classified Sales",
    members: [
      { role: "Classified Manager", name: "Lo-An-Nel Breytenbach", email: "lo-an-nel@georgeherald.com" },
      { role: "Classified Sales", name: "Bongi Make-Grootboom", email: "bongi@georgeherald.com" },
      { role: "Receptionist", name: "Marinda Williams", email: "marinda@georgeherald.com" },
    ],
  },
  {
    name: "Administration",
    members: [
      { role: "Group CEO", name: "Servaas De Kock", email: "servaas@telegraaf.co.za" },
      { role: "Group Admin Manager", name: "Janien Gericke", email: "janien@telegraaf.co.za" },
      { role: "Bookkeeper", name: "Estelle Olivier", email: "estelle@telegraaf.co.za" },
    ],
  },
];

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Contact Us</span>
      </div>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black mb-2">Contact Us</h1>
        <p className="text-muted-foreground mb-8">
          Get in touch with the George Herald team. We&apos;d love to hear from you.
        </p>

        {/* Quick contact cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
            <Phone className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-bold text-sm mb-1">Phone</h3>
            <a href="tel:0448742424" className="text-primary font-semibold hover:underline">044 874 2424</a>
            <p className="text-xs text-muted-foreground mt-1">Fax: 044 874 1393</p>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
            <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-bold text-sm mb-1">Email</h3>
            <a href="mailto:news@georgeherald.com" className="text-primary font-semibold hover:underline text-sm">news@georgeherald.com</a>
            <p className="text-xs text-muted-foreground mt-1">For news tips & stories</p>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
            <MapPin className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-bold text-sm mb-1">Address</h3>
            <p className="text-sm font-semibold">13 Ring Road</p>
            <p className="text-xs text-muted-foreground">George Industria, 6536</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white border border-border rounded-2xl p-6 lg:p-8 mb-12 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Send Us a Message</h2>
              <p className="text-sm text-muted-foreground">Select a department and we&apos;ll direct your message to the right team.</p>
            </div>
          </div>
          <ContactForm />
        </div>

        {/* Postal & publication info */}
        <div className="bg-muted/50 rounded-xl p-6 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Newspaper className="h-5 w-5 text-primary" />
                <h3 className="font-bold">About George Herald</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                George Herald is published every Thursday by Group Editors Company (Pty) Ltd (Registration Number 1963/002133/07).
                We are part of the Group Editors family of publications serving the Garden Route and Karoo.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-bold">Contact Details</h3>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><strong>Editor:</strong> <a href="mailto:lizette@georgeherald.com" className="text-primary hover:underline">lizette@georgeherald.com</a></li>
                <li><strong>Advertising &amp; Notices:</strong> <a href="mailto:advertise@georgeherald.com" className="text-primary hover:underline">advertise@georgeherald.com</a></li>
                <li><strong>Legal Notices:</strong> <a href="mailto:legal@georgeherald.com" className="text-primary hover:underline">legal@georgeherald.com</a></li>
                <li><strong>Postal:</strong> PO Box 806, George Industria, 6530</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sister publications */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4">Group Editors Publications</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The publishers and printers of the following weekly publications:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              "George Herald (Thursday)",
              "Knysna-Plett Herald (Thursday)",
              "Oudtshoorn Courant (Thursday)",
              "Graaff-Reinet Advertiser (Online)",
              "Suid-Kaap Forum (Friday)",
              "Mossel Bay Advertiser (Friday)",
            ].map((pub) => (
              <div key={pub} className="bg-background border rounded-lg px-4 py-3 text-sm font-medium">
                {pub}
              </div>
            ))}
          </div>
        </div>

        {/* Departments */}
        <h2 className="text-xl font-bold mb-6">Our Team</h2>
        <div className="space-y-8 mb-12">
          {departments.map((dept) => (
            <div key={dept.name}>
              <h3 className="font-bold text-lg text-primary mb-3">{dept.name}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dept.members.map((m) => (
                  <div key={m.email} className="bg-background border rounded-lg px-4 py-3">
                    <p className="font-semibold text-sm">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                    <a href={`mailto:${m.email}`} className="text-xs text-primary hover:underline">{m.email}</a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Press Council notice */}
        <div className="border-t pt-8 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            George Herald proudly displays the &ldquo;FAIR&rdquo; stamp of the Press Council of South Africa, indicating our commitment to adhere to the Code of Ethics for Print and online media which prescribes that our reportage is truthful, accurate and fair. Should you wish to lodge a complaint about our news coverage, please lodge a complaint on the Press Council&apos;s website, <a href="https://www.presscouncil.org.za" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.presscouncil.org.za</a> or email the complaint to <a href="mailto:qcomplaints@presscouncil.org.za" className="text-primary hover:underline">qcomplaints@presscouncil.org.za</a>. Contact the Press Council on 011 484 3612.
          </p>
        </div>
      </div>
    </div>
  );
}
