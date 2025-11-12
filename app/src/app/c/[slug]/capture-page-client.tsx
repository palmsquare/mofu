"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type LeadMagnet = {
  id: string;
  slug: string;
  title: string;
  description: string;
  resource_type: "file" | "link";
  resource_url: string;
  template_id: string;
  tagline: string | null;
  cta_label: string | null;
  footer_note: string | null;
  fields: Array<{
    id: string;
    label: string;
    placeholder: string;
    type: string;
    required: boolean;
  }>;
};

type CapturePageClientProps = {
  leadMagnet: LeadMagnet;
};

const TEMPLATE_LAYOUTS: Record<string, "center" | "split" | "card"> = {
  "model-1": "center",
  "model-2": "split",
  "model-3": "card",
};

export function CapturePageClient({ leadMagnet }: CapturePageClientProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [consentGranted, setConsentGranted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const layout = TEMPLATE_LAYOUTS[leadMagnet.template_id] || "center";
  const tagline = leadMagnet.tagline || "";
  const ctaLabel = leadMagnet.cta_label || "Recevoir la ressource";
  const footerNote = leadMagnet.footer_note || "";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadMagnetSlug: leadMagnet.slug,
          data: formData,
          consentGranted,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur lors de la soumission" }));
        setError(errorData.error || "Erreur lors de la soumission du formulaire");
        setIsSubmitting(false);
        return;
      }

      const result = await response.json();

      // Redirect to resource
      if (result.data.resourceUrl) {
        if (result.data.resourceType === "link") {
          window.location.href = result.data.resourceUrl;
        } else {
          // For files, open in new tab or download
          window.open(result.data.resourceUrl, "_blank");
        }
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Erreur réseau lors de la soumission du formulaire");
      setIsSubmitting(false);
    }
  };

  const updateField = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {leadMagnet.fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <label className="block text-sm font-semibold text-zinc-900 dark:text-white">
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          {field.type === "textarea" ? (
            <textarea
              value={formData[field.id] || ""}
              onChange={(e) => updateField(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500 dark:border-white/10 dark:bg-black/40 dark:text-white"
              rows={4}
            />
          ) : (
            <input
              type={field.type === "email" ? "email" : "text"}
              value={formData[field.id] || ""}
              onChange={(e) => updateField(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500 dark:border-white/10 dark:bg-black/40 dark:text-white"
            />
          )}
        </div>
      ))}

      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="consent"
          checked={consentGranted}
          onChange={(e) => setConsentGranted(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="consent" className="text-xs text-zinc-600 dark:text-zinc-300">
          J'accepte de recevoir des communications par email (conformément à la politique de confidentialité)
        </label>
      </div>

      {error && <p className="text-sm font-semibold text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
      >
        {isSubmitting ? "Envoi en cours..." : ctaLabel}
      </button>

      {footerNote && <p className="text-center text-xs text-zinc-500 dark:text-zinc-300">{footerNote}</p>}
    </form>
  );

  if (layout === "split") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-white dark:from-black dark:to-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-5">
              {tagline && (
                <span className="inline-flex rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600">
                  {tagline}
                </span>
              )}
              <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">{leadMagnet.title}</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{leadMagnet.description}</p>
            </div>
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              {renderForm()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (layout === "card") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-white dark:from-black dark:to-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              {tagline && (
                <span className="inline-flex rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600">
                  {tagline}
                </span>
              )}
              <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">{leadMagnet.title}</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{leadMagnet.description}</p>
            </div>
            <div className="w-full rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-md lg:max-w-md">
              {renderForm()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: center layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-white dark:from-black dark:to-zinc-900">
      <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <div className="space-y-5">
          {tagline && (
            <span className="inline-flex rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600">
              {tagline}
            </span>
          )}
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">{leadMagnet.title}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{leadMagnet.description}</p>
        </div>
        <div className="mx-auto mt-8 max-w-xl">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            {renderForm()}
          </div>
        </div>
      </div>
    </div>
  );
}

