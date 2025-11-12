"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { BuilderHeader } from "./builder-header";

export type UploadSource =
  | { type: "file"; name: string; size: number; url?: string }
  | { type: "link"; url: string };

type FieldType = "text" | "email" | "textarea";

type FormField = {
  id: string;
  label: string;
  placeholder: string;
  type: FieldType;
  required: boolean;
};

type TemplateLayout = "center" | "split" | "card";

type Template = {
  id: string;
  title: string;
  description: string;
  layout: TemplateLayout;
  defaultTagline?: string;
  showImage: boolean;
};

const TEMPLATE_LIBRARY: Template[] = [
  {
    id: "model-1",
    title: "Modèle 1",
    description: "Hero centré avec formulaire juste en dessous. Idéal pour une landing simple.",
    layout: "center",
    defaultTagline: "Ressource gratuite",
    showImage: false,
  },
  {
    id: "model-2",
    title: "Modèle 2",
    description: "Formulaire à gauche et visuel à droite. Parfait pour mettre une couverture ou une vidéo.",
    layout: "split",
    defaultTagline: "Nouveau",
    showImage: true,
  },
  {
    id: "model-3",
    title: "Modèle 3",
    description: "Carte encadrée avec formulaire mis en avant et note de réassurance en dessous.",
    layout: "card",
    defaultTagline: "Checklist",
    showImage: false,
  },
];

const DEFAULT_FIELDS: FormField[] = [
  {
    id: "field-name",
    label: "Nom",
    placeholder: "Ton prénom et ton nom",
    type: "text",
    required: true,
  },
  {
    id: "field-email",
    label: "Adresse e-mail",
    placeholder: "ton@email.com",
    type: "email",
    required: true,
  },
];

const FIELD_TYPES: Array<{ value: FieldType; label: string }> = [
  { value: "text", label: "Texte court" },
  { value: "email", label: "Email" },
  { value: "textarea", label: "Paragraphe" },
];

const FREE_QUOTA_MB = 20;
const FREE_DOWNLOAD_LIMIT = 50;
const DEFAULT_DESCRIPTION =
  "Télécharge ce guide gratuit et découvre les étapes clés pour trouver tes prochains clients.";
const DEFAULT_CTA = "Recevoir la ressource";
const DEFAULT_NOTE = "+ 1000 personnes accompagnées";

const generateFieldId = () => `field_${Math.random().toString(36).slice(2, 10)}`;

type LeadMagnetWizardProps = {
  initialSource: UploadSource;
  initialTitle?: string | null;
  onResetSource?: () => void;
};

export function LeadMagnetWizard({ initialSource, initialTitle, onResetSource }: LeadMagnetWizardProps) {
  const router = useRouter();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATE_LIBRARY[0].id);
  const template = useMemo(
    () => TEMPLATE_LIBRARY.find((item) => item.id === selectedTemplateId) ?? TEMPLATE_LIBRARY[0],
    [selectedTemplateId]
  );

  const [tagline, setTagline] = useState(template.defaultTagline ?? "");
  const [title, setTitle] = useState(initialTitle ?? "Ton lead magnet");
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [ctaLabel, setCtaLabel] = useState(DEFAULT_CTA);
  const [footerNote, setFooterNote] = useState(DEFAULT_NOTE);
  const [fields, setFields] = useState<FormField[]>(DEFAULT_FIELDS);
  const [downloadLimit, setDownloadLimit] = useState<number>(FREE_DOWNLOAD_LIMIT);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const quotaUsage = initialSource.type === "file" ? Math.min((initialSource.size / (1024 * 1024)) / FREE_QUOTA_MB, 1) : 0;
  const quotaRemaining =
    initialSource.type === "file" ? Math.max(FREE_QUOTA_MB - initialSource.size / (1024 * 1024), 0) : FREE_QUOTA_MB;

  const handleTemplateChange = (templateId: string) => {
    const nextTemplate = TEMPLATE_LIBRARY.find((item) => item.id === templateId);
    if (!nextTemplate) return;

    setSelectedTemplateId(templateId);
    if (!tagline || tagline === template.defaultTagline) {
      setTagline(nextTemplate.defaultTagline ?? "");
    }
    if (!nextTemplate.showImage) {
      setImageDataUrl(null);
    }
  };

  const updateField = (id: string, update: Partial<Omit<FormField, "id">>) => {
    setFields((prev) => prev.map((field) => (field.id === id ? { ...field, ...update } : field)));
  };

  const toggleFieldRequired = (id: string) => {
    setFields((prev) =>
      prev.map((field) => (field.id === id ? { ...field, required: !field.required } : field))
    );
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((field) => field.id !== id));
  };

  const addCustomField = () => {
    setFields((prev) => [
      ...prev,
      {
        id: generateFieldId(),
        label: "Nouveau champ",
        placeholder: "Saisie ici…",
        type: "text",
        required: false,
      },
    ]);
  };

  const resetForm = () => {
    setTagline(template.defaultTagline ?? "");
    setTitle(initialTitle ?? "Ton lead magnet");
    setDescription(DEFAULT_DESCRIPTION);
    setCtaLabel(DEFAULT_CTA);
    setFooterNote(DEFAULT_NOTE);
    setFields(DEFAULT_FIELDS);
    setDownloadLimit(FREE_DOWNLOAD_LIMIT);
    setGeneratedUrl(null);
    setStatusMessage(null);
    setImageDataUrl(template.showImage ? imageDataUrl : null);
  };

  const handleGenerate = async () => {
    if (!fields.some((field) => field.type === "email")) {
      setStatusMessage("Ajoute un champ email pour collecter les adresses.");
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      let resourceUrl: string;
      if (initialSource.type === "link") {
        resourceUrl = initialSource.url;
      } else {
        // For file type, use the uploaded URL if available, otherwise use file:// protocol
        const fileSource = initialSource as { type: "file"; name: string; size: number; url?: string };
        resourceUrl = fileSource.url || `file://${fileSource.name}`;
      }

      const response = await fetch("/api/lead-magnets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          resourceType: initialSource.type,
          resourceUrl,
          downloadLimit,
          templateId: selectedTemplateId,
          fields,
          tagline,
          ctaLabel,
          footerNote,
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        setStatusMessage(errorPayload?.error ?? "Impossible de sauvegarder le lead magnet.");
        setGeneratedUrl(null);
        return;
      }

      const payload = (await response.json()) as { data?: { shareUrl?: string; slug?: string } };
      const shareUrl = payload.data?.shareUrl ?? null;
      const slug = payload.data?.slug ?? null;
      
      if (shareUrl && slug) {
        // Redirect to success page with the share URL
        router.push(`/success?url=${encodeURIComponent(shareUrl)}&slug=${encodeURIComponent(slug)}`);
      } else {
        setStatusMessage("Erreur: Impossible de récupérer le lien partageable.");
      }
    } catch (error) {
      console.error("[LeadMagnetWizard] POST /api/lead-magnets", error);
      setStatusMessage("Erreur réseau pendant la sauvegarde.");
      setGeneratedUrl(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const templateSupportsImage = template.showImage;

  const handleFieldLabelChange = (id: string, value: string) => {
    updateField(id, { label: value || "Champ" });
  };

  const handleFieldPlaceholderChange = (id: string, value: string) => {
    updateField(id, { placeholder: value });
  };

  return (
    <section className="space-y-10">
      <BuilderHeader onPublish={handleGenerate} isPublishing={isSaving} />
      
      <div className="rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-black/40">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-zinc-900/5 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:bg-white/10 dark:text-zinc-200">
              Étape 2 · Personnalisation
            </span>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Construis ta page de capture
            </h2>
            <p className="max-w-xl text-sm text-zinc-500 dark:text-zinc-300">
              Ta ressource est prête. Choisis un modèle, ajuste le contenu directement dans l’aperçu et prépare ton lien
              partageable.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-3xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide">Ressource connectée</p>
                {initialSource.type === "file" ? (
                  <p>
                    {initialSource.name} • {(initialSource.size / (1024 * 1024)).toFixed(1)} Mo
                  </p>
                ) : (
                  <p className="truncate">{initialSource.url}</p>
                )}
              </div>
              {onResetSource && (
                <button
                  type="button"
                  onClick={onResetSource}
                  className="rounded-full border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700 transition hover:border-indigo-300 hover:text-indigo-900 dark:border-indigo-400 dark:text-indigo-100 dark:hover:border-indigo-300"
                >
                  Changer
                </button>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700/80 dark:text-indigo-100/80">
                Quota gratuit
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-500/20">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${Math.round(quotaUsage * 100)}%` }}
                />
              </div>
              <p className="text-xs text-indigo-900/70 dark:text-indigo-100/70">
                {initialSource.type === "file"
                  ? `${(initialSource.size / (1024 * 1024)).toFixed(1)} Mo utilisés • ${quotaRemaining.toFixed(1)} Mo restants`
                  : "Lien externe — quota inchangé"}
              </p>
              <p className="text-xs text-indigo-900/70 dark:text-indigo-100/70">
                Téléchargements inclus : {downloadLimit === 0 ? "illimité" : downloadLimit}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="space-y-6 rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black/40">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-200">Choisis un modèle</h3>
            <div className="space-y-3">
              {TEMPLATE_LIBRARY.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTemplateChange(item.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    selectedTemplateId === item.id
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-100"
                      : "border-zinc-200 bg-zinc-50 hover:border-indigo-200 dark:border-white/10 dark:bg-white/5"
                  }`}
                >
                  <p className="text-sm font-semibold">Modèle {index + 1}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-300">{item.description}</p>
                </button>
              ))}
            </div>
          </section>

          {templateSupportsImage && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-200">Visuel</h3>
                {imageDataUrl && (
                  <button
                    type="button"
                    onClick={() => setImageDataUrl(null)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-200 dark:hover:text-indigo-100"
                  >
                    Retirer l’image
                  </button>
                )}
              </div>
              <div
                onDrop={handleImageDrop}
                onDragOver={(event) => event.preventDefault()}
                className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-500 transition hover:border-indigo-300 hover:bg-zinc-100 dark:border-white/10 dark:bg-black/40 dark:text-zinc-300"
              >
                {imageDataUrl ? (
                  <div className="relative h-full w-full overflow-hidden rounded-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageDataUrl} alt="Visuel du lead magnet" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <>
                    <p>Glisse une image (JPG, PNG)</p>
                    <p>ou</p>
                    <label className="cursor-pointer rounded-full bg-indigo-600 px-3 py-1 text-white">
                      Importer
                      <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                    </label>
                  </>
                )}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-200">Champs du formulaire</h3>
              <button
                type="button"
                onClick={addCustomField}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-200 dark:hover:text-indigo-100"
              >
                + Ajouter
              </button>
            </div>
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field.id} className="rounded-2xl border border-zinc-200/70 p-4 dark:border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-3 text-sm">
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-300">
                          Label
                        </label>
                        <input
                          value={field.label}
                          onChange={(event) => updateField(field.id, { label: event.target.value })}
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500 dark:border-white/10 dark:bg-black/40 dark:text-white"
                        />
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-300">
                            Placeholder
                          </label>
                          <input
                            value={field.placeholder}
                            onChange={(event) => updateField(field.id, { placeholder: event.target.value })}
                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500 dark:border-white/10 dark:bg-black/40 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-300">
                            Type
                          </label>
                          <select
                            value={field.type}
                            onChange={(event) => updateField(field.id, { type: event.target.value as FieldType })}
                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500 dark:border-white/10 dark:bg-black/40 dark:text-white"
                          >
                            {FIELD_TYPES.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFieldRequired(field.id)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          field.required
                            ? "bg-indigo-600 text-white"
                            : "bg-zinc-200 text-zinc-700 dark:bg-white/10 dark:text-white"
                        }`}
                      >
                        {field.required ? "Obligatoire" : "Optionnel"}
                      </button>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeField(field.id)}
                          className="text-xs font-semibold text-red-500 hover:text-red-600 dark:text-red-300 dark:hover:text-red-200"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-200">Limite de téléchargements</label>
            <input
              type="number"
              min={0}
              value={downloadLimit}
              onChange={(event) => setDownloadLimit(Number(event.target.value))}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500 dark:border-white/10 dark:bg-black/40 dark:text-white"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-300">Astuce : mets 0 pour rendre le téléchargement illimité.</p>
          </section>

          <button
            type="button"
            onClick={resetForm}
            className="w-full rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-white/15 dark:text-zinc-200 dark:hover:border-white/30"
          >
            Réinitialiser
          </button>
          {statusMessage && (
            <p className="text-xs font-semibold text-red-500 dark:text-red-300">{statusMessage}</p>
          )}
        </div>

        <div className="space-y-6">
          <PreviewCard
            template={template}
            tagline={tagline}
            title={title}
            description={description}
            ctaLabel={ctaLabel}
            footerNote={footerNote}
            fields={fields}
            showImage={templateSupportsImage}
            imageDataUrl={imageDataUrl}
            onTaglineChange={setTagline}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onCtaLabelChange={setCtaLabel}
            onFooterNoteChange={setFooterNote}
            onFieldLabelChange={handleFieldLabelChange}
            onFieldPlaceholderChange={handleFieldPlaceholderChange}
          />

          {generatedUrl && (
            <section className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Ton lien est prêt 🎉</h3>
                  </div>
                  <p className="mb-4 text-sm text-gray-700">
                    Crée un compte pour suivre les téléchargements, exporter les leads et gérer plusieurs magnets.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <a
                      href="/signup"
                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Créer mon compte
                    </a>
                    <a
                      href="/login"
                      className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      J'ai déjà un compte
                    </a>
                  </div>
                </div>
              </div>
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {generatedUrl ? (
              <section className="space-y-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-100">
                <p className="text-lg font-semibold">Lien prêt à partager</p>
                <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm text-emerald-700 dark:bg-white/10 dark:text-emerald-100">
                  <span className="truncate">{generatedUrl}</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(generatedUrl)}
                    className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Copier
                  </button>
                </div>
                <p className="text-xs text-emerald-900/70 dark:text-emerald-100/80">
                  Chaque téléchargement sera enregistré automatiquement dans ton dashboard.
                </p>
              </section>
            ) : (
              <section className="space-y-3 rounded-3xl border border-dashed border-zinc-300 bg-white/60 p-6 text-sm text-zinc-500 shadow-sm dark:border-white/20 dark:bg-white/5 dark:text-zinc-300">
                <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-100">Ton lien apparaîtra ici</p>
                <p>
                  Dès que tu génères la page, nous t’indiquons le lien partageable. Tu pourras le copier en un clic pour le
                  diffuser à ton audience.
                </p>
              </section>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

type PreviewCardProps = {
  template: Template;
  tagline: string;
  title: string;
  description: string;
  ctaLabel: string;
  footerNote: string;
  fields: FormField[];
  showImage: boolean;
  imageDataUrl: string | null;
  onTaglineChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCtaLabelChange: (value: string) => void;
  onFooterNoteChange: (value: string) => void;
  onFieldLabelChange: (id: string, value: string) => void;
  onFieldPlaceholderChange: (id: string, value: string) => void;
};

function PreviewCard({
  template,
  tagline,
  title,
  description,
  ctaLabel,
  footerNote,
  fields,
  showImage,
  imageDataUrl,
  onTaglineChange,
  onTitleChange,
  onDescriptionChange,
  onCtaLabelChange,
  onFooterNoteChange,
  onFieldLabelChange,
  onFieldPlaceholderChange,
}: PreviewCardProps) {
  const containerClass =
    "rounded-3xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-white text-zinc-900 shadow-sm";

  const FormFieldPreview = ({ field }: { field: FormField }) => (
    <div className="space-y-2 text-left">
      <EditableText
        value={field.label}
        placeholder="Label du champ"
        onChange={(value) => onFieldLabelChange(field.id, value)}
        className="text-xs font-semibold uppercase tracking-wide text-zinc-600 focus:ring-offset-2"
      />
      <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
        <EditableText
          value={field.placeholder}
          placeholder="Placeholder…"
          onChange={(value) => onFieldPlaceholderChange(field.id, value)}
          className="text-sm text-zinc-500 focus:ring-offset-2"
        />
      </div>
    </div>
  );

  if (template.layout === "split") {
    return (
      <div className={containerClass}>
        <div className="grid gap-8 px-6 py-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5">
            {tagline.trim() && (
              <EditableTag
                value={tagline}
                placeholder="Tagline"
                onChange={onTaglineChange}
                className="inline-flex rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600"
              />
            )}
            <EditableHeading value={title} onChange={onTitleChange} />
            <EditableParagraph value={description} onChange={onDescriptionChange} />
            <div className="space-y-3">
              {fields.map((field) => (
                <FormFieldPreview key={field.id} field={field} />
              ))}
            </div>
            <EditableButton value={ctaLabel} onChange={onCtaLabelChange} />
            {footerNote.trim() && (
              <EditableParagraph
                value={footerNote}
                onChange={onFooterNoteChange}
                className="text-xs text-zinc-500"
              />
            )}
          </div>
          {showImage && (
            <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-100 p-6">
              {imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageDataUrl} alt="Aperçu visuel" className="h-full w-full rounded-xl object-cover" />
              ) : (
                <span className="text-xs text-zinc-400">Ajoute un visuel depuis le panneau de gauche.</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (template.layout === "card") {
    return (
      <div className={containerClass}>
        <div className="flex flex-col gap-6 px-6 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            {tagline.trim() && (
              <EditableTag
                value={tagline}
                placeholder="Tagline"
                onChange={onTaglineChange}
                className="inline-flex rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600"
              />
            )}
            <EditableHeading value={title} onChange={onTitleChange} />
            <EditableParagraph value={description} onChange={onDescriptionChange} />
          </div>
          <div className="w-full rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-md lg:max-w-md">
            <div className="space-y-3">
              {fields.map((field) => (
                <FormFieldPreview key={field.id} field={field} />
              ))}
              <EditableButton value={ctaLabel} onChange={onCtaLabelChange} />
              {footerNote.trim() && (
                <EditableParagraph
                  value={footerNote}
                  onChange={onFooterNoteChange}
                  className="text-center text-xs text-zinc-500"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="space-y-5 px-6 py-8 text-center">
        {tagline.trim() && (
          <EditableTag
            value={tagline}
            placeholder="Tagline"
            onChange={onTaglineChange}
            className="mx-auto inline-flex rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600"
          />
        )}
        <EditableHeading value={title} onChange={onTitleChange} className="mx-auto max-w-2xl" />
        <EditableParagraph
          value={description}
          onChange={onDescriptionChange}
          className="mx-auto max-w-2xl text-sm text-zinc-600"
        />
        <div className="mx-auto max-w-xl space-y-3">
          {fields.map((field) => (
            <FormFieldPreview key={field.id} field={field} />
          ))}
          <EditableButton value={ctaLabel} onChange={onCtaLabelChange} />
        </div>
        {footerNote.trim() && (
          <EditableParagraph
            value={footerNote}
            onChange={onFooterNoteChange}
            className="text-xs text-zinc-500"
          />
        )}
      </div>
    </div>
  );
}

type EditableProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

function EditableHeading({ value, onChange, className }: EditableProps) {
  return (
    <EditableText
      value={value}
      onChange={(newValue) => onChange(newValue || "Titre de ta page")}
      placeholder="Titre de ta page"
      className={`text-3xl font-semibold text-zinc-900 focus:outline-none ${className ?? ""}`}
    />
  );
}

function EditableParagraph({ value, onChange, placeholder = "Ajoute un texte…", className }: EditableProps) {
  return (
    <EditableText
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`text-sm text-zinc-600 focus:outline-none ${className ?? ""}`}
      multiline
    />
  );
}

function EditableTag({ value, onChange, placeholder = "Tagline", className }: EditableProps) {
  return (
    <EditableText
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`${className ?? ""} cursor-text focus:outline-none`}
    />
  );
}

type EditableTextProps = EditableProps & { multiline?: boolean };

function EditableText({ value, onChange, placeholder = "", className, multiline = false }: EditableTextProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleBlur = () => {
    const text = ref.current?.textContent ?? "";
    onChange(text.trim());
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!multiline && event.key === "Enter") {
      event.preventDefault();
      ref.current?.blur();
    }
  };

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={placeholder}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`cursor-text rounded-md px-1 outline-none focus:ring-2 focus:ring-indigo-500 ${className ?? ""}`}
    >
      {value || placeholder}
    </div>
  );
}

type EditableButtonProps = {
  value: string;
  onChange: (value: string) => void;
};

function EditableButton({ value, onChange }: EditableButtonProps) {
  return (
    <EditableText
      value={value}
      onChange={(next) => onChange(next || DEFAULT_CTA)}
      className="block w-full rounded-full bg-indigo-600 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:ring-offset-2 focus:ring-offset-white"
    />
  );
}

