import { Phone, AlertTriangle, Zap, Droplets, Flame, Shield, Heart, Bug, Building2, Car, Waves } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Emergency Numbers - George & Garden Route",
  description: "Important emergency contact numbers for George and the Garden Route area including police, fire, ambulance, hospitals and municipality.",
};

interface ContactEntry {
  label: string;
  number: string;
}

interface EmergencySection {
  title: string;
  icon: React.ReactNode;
  color: string;
  contacts: ContactEntry[];
}

const emergencySections: EmergencySection[] = [
  {
    title: "Ambulances",
    icon: <Heart className="h-5 w-5" />,
    color: "bg-red-50 text-red-600 border-red-200",
    contacts: [
      { label: "ER24", number: "084 124" },
      { label: "ER24 (Alt)", number: "082 372 5290" },
      { label: "Metro Ambulance", number: "044 802 2500" },
    ],
  },
  {
    title: "Animals",
    icon: <Bug className="h-5 w-5" />,
    color: "bg-green-50 text-green-600 border-green-200",
    contacts: [
      { label: "Injured Birds", number: "082 493 1298" },
      { label: "Injured Sea Birds", number: "082 364 3382" },
      { label: "Snakes", number: "083 262 5934" },
      { label: "SPCA Emergencies", number: "082 378 7348" },
      { label: "SPCA General", number: "044 878 1990" },
    ],
  },
  {
    title: "Electricity",
    icon: <Zap className="h-5 w-5" />,
    color: "bg-yellow-50 text-yellow-600 border-yellow-200",
    contacts: [
      { label: "Electricity Interruptions", number: "044 874 3917" },
      { label: "Interruptions After Hours", number: "044 801 6300" },
      { label: "General", number: "044 874 3917" },
      { label: "General (Alt)", number: "044 803 9222" },
    ],
  },
  {
    title: "Fauna & Flora",
    icon: <Bug className="h-5 w-5" />,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    contacts: [
      { label: "Crime Stop", number: "044 802 5300" },
    ],
  },
  {
    title: "Fire Department",
    icon: <Flame className="h-5 w-5" />,
    color: "bg-orange-50 text-orange-600 border-orange-200",
    contacts: [
      { label: "Emergencies", number: "044 801 6300" },
      { label: "General", number: "044 801 6360" },
    ],
  },
  {
    title: "Hospitals",
    icon: <Heart className="h-5 w-5" />,
    color: "bg-pink-50 text-pink-600 border-pink-200",
    contacts: [
      { label: "George Hospital", number: "044 802 4528" },
      { label: "George Hospital - Emergency", number: "044 802 4478" },
      { label: "Mediclinic George", number: "044 803 2000" },
      { label: "Mediclinic Geneva", number: "044 803 2000" },
    ],
  },
  {
    title: "Police",
    icon: <Shield className="h-5 w-5" />,
    color: "bg-blue-50 text-blue-600 border-blue-200",
    contacts: [
      { label: "Conville", number: "044 803 3300" },
      { label: "Crime Stop", number: "086 001 0111" },
      { label: "George", number: "044 803 4400" },
      { label: "Herold", number: "044 888 1600" },
      { label: "Pacaltsdorp", number: "044 803 9100" },
      { label: "Thembalethu", number: "044 802 8900" },
      { label: "Wilderness", number: "044 877 0011" },
    ],
  },
  {
    title: "Rescue Services",
    icon: <Waves className="h-5 w-5" />,
    color: "bg-cyan-50 text-cyan-600 border-cyan-200",
    contacts: [
      { label: "Disaster Emergencies", number: "044 805 5071" },
      { label: "Emergency Rescue", number: "10177" },
      { label: "NSRI", number: "082 990 5955" },
    ],
  },
  {
    title: "Traffic Department",
    icon: <Car className="h-5 w-5" />,
    color: "bg-slate-50 text-slate-600 border-slate-200",
    contacts: [
      { label: "General", number: "044 878 2400" },
    ],
  },
  {
    title: "Water",
    icon: <Droplets className="h-5 w-5" />,
    color: "bg-sky-50 text-sky-600 border-sky-200",
    contacts: [
      { label: "After Hours", number: "044 801 6300" },
      { label: "General", number: "044 801 9266" },
    ],
  },
  {
    title: "Municipalities",
    icon: <Building2 className="h-5 w-5" />,
    color: "bg-violet-50 text-violet-600 border-violet-200",
    contacts: [
      { label: "George Municipality", number: "044 801 9111" },
      { label: "Garden Route District Municipality", number: "044 803 1300" },
    ],
  },
  {
    title: "Anti-Fraud & Corruption",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "bg-amber-50 text-amber-600 border-amber-200",
    contacts: [
      { label: "Eden Hotline", number: "0800 21 47 64" },
    ],
  },
];

export default function EmergencyNumbersPage() {
  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <a href="/" className="hover:text-primary transition-colors">Home</a>
        <span>/</span>
        <span className="text-foreground font-medium">Emergency Numbers</span>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Phone className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Emergency Numbers</h1>
      </div>
      <p className="text-muted-foreground mb-8 max-w-2xl">
        Important emergency contact numbers for George and the Garden Route area. Save these numbers — they could save a life.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {emergencySections.map((section) => (
          <div key={section.title} className={`rounded-xl border p-5 ${section.color}`}>
            <div className="flex items-center gap-2 mb-4">
              {section.icon}
              <h2 className="font-bold text-base">{section.title}</h2>
            </div>
            <div className="space-y-2.5">
              {section.contacts.map((contact) => (
                <div key={`${contact.label}-${contact.number}`} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-foreground/80">{contact.label}</span>
                  <a
                    href={`tel:${contact.number.replace(/\s/g, "")}`}
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors whitespace-nowrap"
                  >
                    {contact.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 p-5 bg-primary/5 border border-primary/10 rounded-xl text-center">
        <p className="text-sm text-muted-foreground">
          In a life-threatening emergency, call <a href="tel:10111" className="font-bold text-primary">10111</a> (Police) or <a href="tel:10177" className="font-bold text-primary">10177</a> (Ambulance) immediately.
        </p>
      </div>
    </div>
  );
}
