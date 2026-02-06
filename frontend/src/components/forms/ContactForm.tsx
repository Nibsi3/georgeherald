"use client";

import { useState } from "react";
import { Send, CheckCircle, Loader2 } from "lucide-react";

const DEPARTMENTS = [
  {
    value: "editorial",
    label: "Editorial / News Tips",
    email: "news@georgeherald.com",
    description: "Send news tips, story ideas, or editorial enquiries",
  },
  {
    value: "editor",
    label: "Editor",
    email: "lizette@georgeherald.com",
    description: "Contact the Editor directly",
  },
  {
    value: "advertising",
    label: "Advertising & Sales",
    email: "advertise@georgeherald.com",
    description: "Advertising rates, bookings and display ads",
  },
  {
    value: "classifieds",
    label: "Classified Ads",
    email: "lo-an-nel@georgeherald.com",
    description: "Place or manage classified advertisements",
  },
  {
    value: "digital",
    label: "Digital / Online",
    email: "ilse@georgeherald.com",
    description: "Digital advertising, website and social media",
  },
  {
    value: "legal",
    label: "Legal Notices",
    email: "legal@georgeherald.com",
    description: "Submit or enquire about legal notices",
  },
  {
    value: "accounts",
    label: "Accounts / Administration",
    email: "estelle@telegraaf.co.za",
    description: "Billing, payments and account queries",
  },
  {
    value: "general",
    label: "General Enquiry",
    email: "news@georgeherald.com",
    description: "Any other enquiries",
  },
];

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const selectedDept = DEPARTMENTS.find((d) => d.value === formData.department);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;

    setStatus("sending");

    // Build mailto link as fallback (since we don't have a backend API)
    const mailtoSubject = encodeURIComponent(`[${selectedDept.label}] ${formData.subject}`);
    const mailtoBody = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone || "N/A"}\nDepartment: ${selectedDept.label}\n\n${formData.message}`
    );
    const mailtoUrl = `mailto:${selectedDept.email}?subject=${mailtoSubject}&body=${mailtoBody}`;

    // Open mail client
    window.location.href = mailtoUrl;

    // Show success state after a brief delay
    setTimeout(() => {
      setStatus("sent");
    }, 1000);
  };

  if (status === "sent") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-green-900 mb-2">Message Ready to Send</h3>
        <p className="text-green-700 mb-2">
          Your email client should have opened with your message to <strong>{selectedDept?.label}</strong>.
        </p>
        <p className="text-sm text-green-600 mb-6">
          If it didn&apos;t open, you can email <a href={`mailto:${selectedDept?.email}`} className="underline font-semibold">{selectedDept?.email}</a> directly.
        </p>
        <button
          onClick={() => {
            setStatus("idle");
            setFormData({ name: "", email: "", phone: "", department: "", subject: "", message: "" });
          }}
          className="text-sm font-semibold text-green-700 hover:text-green-900 underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold mb-1.5">
            Full Name <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold mb-1.5">
            Email Address <span className="text-primary">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold mb-1.5">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="044 000 0000"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label htmlFor="department" className="block text-sm font-semibold mb-1.5">
            Department <span className="text-primary">*</span>
          </label>
          <select
            id="department"
            name="department"
            required
            value={formData.department}
            onChange={handleChange}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          >
            <option value="">Select a department...</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedDept && (
        <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm">
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">{selectedDept.label}:</span>{" "}
            {selectedDept.description}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Your message will be sent to <span className="font-semibold text-primary">{selectedDept.email}</span>
          </p>
        </div>
      )}

      <div>
        <label htmlFor="subject" className="block text-sm font-semibold mb-1.5">
          Subject <span className="text-primary">*</span>
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          required
          value={formData.subject}
          onChange={handleChange}
          placeholder="Brief description of your enquiry"
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold mb-1.5">
          Message <span className="text-primary">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          value={formData.message}
          onChange={handleChange}
          placeholder="Type your message here..."
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending" || !formData.department}
        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
      >
        {status === "sending" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening email client...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send Message
          </>
        )}
      </button>
    </form>
  );
}
