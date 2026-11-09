import Image from "next/image";
import { ActivityCoverField } from "@/modules/activities/components/ActivityCoverField";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { translateValidationMessage } from "@/modules/activities/components/LocalizedErrorMessage";
import { Field, FieldArray, Form, Formik, getIn, useFormikContext } from "formik";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { AiActivitySuggestionsPanel } from "@/modules/activities/components/AiActivitySuggestionsPanel";
import { MediaLibraryPicker } from "@/modules/activities/components/MediaLibraryPicker";
import { createMemorySchema, type CreateMemoryFormValues, type MemoryItemValue } from "@/modules/activities/schemas/createMemorySchema";
import { uploadMediaImageService } from "@/modules/activities/services/uploadMediaImageService";

function ScrollToFirstError() {
  const { errors, submitCount, isValidating } = useFormikContext<CreateMemoryFormValues>();
  const [handledSubmitCount, setHandledSubmitCount] = useState(0);

  useEffect(() => {
    if (submitCount <= handledSubmitCount || isValidating || Object.keys(errors).length === 0) return;

    const timeoutId = window.setTimeout(() => {
      const invalidField = document.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?? document.querySelector<HTMLElement>('[name="name"]');
      invalidField?.scrollIntoView({ behavior: "smooth", block: "center" });
      invalidField?.focus({ preventScroll: true });
      setHandledSubmitCount(submitCount);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [errors, handledSubmitCount, isValidating, submitCount]);

  return null;
}

interface Props {
  onSubmit: (values: CreateMemoryFormValues) => Promise<void>;
  submitError?: string;
  initialValues?: CreateMemoryFormValues;
  submitLabel?: string;
}

const inputClass = "min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-dark focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
const labelClass = "mb-2 block text-sm font-medium text-dark";

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `pair-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyText(): MemoryItemValue {
  return { type: "text", value: "" };
}

function emptyPair() {
  return { id: createId(), first: emptyText(), second: emptyText() };
}

function resolveImageUrl(storageKey: string, publicUrl?: string): string | undefined {
  if (publicUrl) return publicUrl;
  const publicBaseUrl = process.env.NEXT_PUBLIC_B2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  return publicBaseUrl ? `${publicBaseUrl}/${storageKey}` : undefined;
}

export function MemoryItemEditor({ name, value, onChange, title, invalid }: Readonly<{
  name: string; value: MemoryItemValue; title: string; invalid: boolean; onChange: (item: MemoryItemValue) => void;
}>) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    setUploadError("");
    setUploading(true);
    try {
      const uploaded = await uploadMediaImageService.execute(file);
      onChange({ type: "image", storageKey: uploaded.storageKey, altText: uploaded.altText, publicUrl: uploaded.publicUrl });
    } catch (error: unknown) {
      setUploadError(error instanceof Error ? error.message : t("activity.cover.uploadError"));
    } finally {
      setUploading(false);
    }
  }

  const imageUrl = value.type === "image" && value.storageKey ? resolveImageUrl(value.storageKey, value.type === "image" ? value.publicUrl : undefined) : undefined;

  return (
    <div className="min-w-0 rounded-xl border border-border bg-background p-4">
      <label htmlFor={`${name}-type`} className={labelClass}>{title}</label>
      <select id={`${name}-type`} value={value.type} aria-invalid={invalid} onChange={(event) => onChange(event.target.value === "image" ? { type: "image", storageKey: "", altText: "" } : emptyText())} className={inputClass}>
        <option value="text">{t("activity.form.text")}</option><option value="image">{t("activity.form.image")}</option>
      </select>
      {value.type === "text" ? (
        <div className="mt-3">
          <label htmlFor={`${name}-text`} className={labelClass}>{t("activity.form.pairText")}</label>
          <textarea id={`${name}-text`} value={value.value} aria-invalid={invalid} maxLength={300} rows={3} onChange={(event) => onChange({ type: "text", value: event.target.value })} className={inputClass} placeholder={t("activity.form.enterTerm")} />
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <label htmlFor={`${name}-upload`} className={labelClass}>{t("activity.form.uploadFromComputer")}</label>
          <input
            id={`${name}-upload`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => void handleFileChange(event)}
            disabled={uploading}
            className="block min-h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-dark file:mr-3 file:rounded-lg file:border-0 file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-60"
            aria-describedby={uploadError ? `${name}-upload-error` : undefined}
          />
          <p className="text-xs text-muted">{t("activity.form.imageHelp")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <MediaLibraryPicker
              disabled={uploading}
              onSelect={(asset) => {
                onChange({ type: "image", storageKey: asset.storageKey, altText: asset.altText, publicUrl: asset.publicUrl });
                setUploadError("");
              }}
            />
            {uploading && <span role="status" className="text-sm text-muted">{t("activity.form.uploading")}</span>}
          </div>
          {uploadError && <p id={`${name}-upload-error`} role="alert" className="text-sm text-red-600">{uploadError}</p>}
          {value.storageKey ? (
            <div className="rounded-xl border border-border bg-surface p-3">
              {imageUrl ? (
                <div className="relative mb-3 aspect-video overflow-hidden rounded-lg bg-background">
                  <Image src={imageUrl} alt={value.altText || t("activity.form.selectedImagePreview")} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-contain" />
                </div>
              ) : (
                <p className="mb-3 rounded-lg bg-background p-3 text-xs text-muted">{t("activity.form.configureImageBase")}</p>
              )}
              <label htmlFor={`${name}-alt-text`} className={labelClass}>{t("activity.form.alternativeText")}</label>
              <input id={`${name}-alt-text`} value={value.altText} maxLength={250} onChange={(event) => onChange({ type: "image", storageKey: value.storageKey, altText: event.target.value, publicUrl: value.publicUrl })} className={inputClass} placeholder={t("activity.form.imageDescription")} />
              <button type="button" onClick={() => onChange({ type: "image", storageKey: "", altText: "" })} className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                <Trash2 aria-hidden="true" size={15} /> {t("activity.form.removeImage")}
              </button>
            </div>
          ) : <p className="text-xs text-muted">{t("activity.form.noImage")}</p>}
        </div>
      )}
    </div>
  );
}

export function MemoryForm({ onSubmit, submitError, initialValues: suppliedInitialValues, submitLabel }: Readonly<Props>) {
  const { t, locale } = useTranslation();
  const effectiveSubmitLabel = submitLabel ?? t("activity.form.saveDraft");
  const [aiOpen, setAiOpen] = useState(false);
  const defaultInitialValues = useMemo<CreateMemoryFormValues>(() => ({
    name: "", description: "", difficulty: "EASY",
    content: { pairs: Array.from({ length: 6 }, () => emptyPair()) },
  }), []);
  const initialValues = suppliedInitialValues ?? defaultInitialValues;
  return (
    <Formik<CreateMemoryFormValues> initialValues={initialValues} enableReinitialize validationSchema={createMemorySchema} onSubmit={onSubmit}>
      {({ values, errors, touched, submitCount, isSubmitting, setFieldValue }) => (
        <Form noValidate className="space-y-6">
          <ScrollToFirstError />
          <ActivityCoverField />
          <AiActivitySuggestionsPanel activityType="memory" open={aiOpen} onClose={() => setAiOpen(false)} />
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-lg font-semibold text-dark">{t("activity.form.info")}</h2><p className="mt-1 text-sm text-muted">{t("activity.form.startWithPairs")}</p></div>
              <button type="button" onClick={() => setAiOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Sparkles aria-hidden="true" size={16} /> Criar com IA</button>
            </div>
            <div className="mt-5 grid gap-5">
              <div><label htmlFor="name" className={labelClass}>Nome da atividade *</label><Field id="name" name="name" maxLength={120} className={inputClass} aria-required="true" aria-invalid={Boolean(getIn(errors, "name") && (getIn(touched, "name") || submitCount > 0))} />{getIn(errors, "name") && (getIn(touched, "name") || submitCount > 0) && <p role="alert" className="mt-1 text-sm text-red-600">{translateValidationMessage(String(getIn(errors, "name")), locale)}</p>}</div>
              <div><label htmlFor="description" className={labelClass}>{t("activity.form.description")}</label><Field as="textarea" id="description" name="description" rows={3} maxLength={2000} className={inputClass} /></div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div><label htmlFor="difficulty" className={labelClass}>{t("activity.form.difficulty")}</label><Field as="select" id="difficulty" name="difficulty" className={inputClass}><option value="EASY">{t("activity.form.easy")}</option><option value="MEDIUM">{t("activity.form.medium")}</option><option value="HARD">{t("activity.form.hard")}</option></Field></div>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-dark">{t("activity.form.pairs")}</h2><p className="mt-1 text-sm text-muted">{t("activity.form.pairs")}</p></div><span className="rounded-full bg-background px-3 py-1 text-sm font-semibold text-dark">{values.content.pairs.length}/50 pares</span></div>
            <FieldArray name="content.pairs">
              {({ push, remove }) => <div className="space-y-4">
                {values.content.pairs.map((pair, index) => <fieldset key={pair.id} className="rounded-2xl border border-border p-4 sm:p-5">
                  <legend className="px-1 text-sm font-semibold text-dark">{t("activity.form.pair")} {index + 1}</legend>
                  <div className="grid gap-4 md:grid-cols-2">
                    <MemoryItemEditor name={`pair-${index}-first`} title={t("activity.form.firstSide")} value={pair.first} invalid={Boolean(getIn(errors, `content.pairs.${index}.first`) && submitCount > 0)} onChange={(item) => void setFieldValue(`content.pairs.${index}.first`, item)} />
                    <MemoryItemEditor name={`pair-${index}-second`} title={t("activity.form.secondSide")} value={pair.second} invalid={Boolean(getIn(errors, `content.pairs.${index}.second`) && submitCount > 0)} onChange={(item) => void setFieldValue(`content.pairs.${index}.second`, item)} />
                  </div>
                  {([pair.first, pair.second].some((item) => item.type === "text" && !item.value.trim()) || [pair.first, pair.second].some((item) => item.type === "image" && !item.storageKey)) && submitCount > 0 && <p role="alert" className="mt-3 text-sm text-red-600">{t("activity.form.fillBothSides")}</p>}
                  <button type="button" onClick={() => remove(index)} disabled={values.content.pairs.length <= 3} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-40"><Trash2 aria-hidden="true" size={15} /> {t("activity.form.removePair")}</button>
                </fieldset>)}
                <button type="button" onClick={() => push(emptyPair())} disabled={values.content.pairs.length >= 50} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-40"><Plus aria-hidden="true" size={17} /> {t("activity.form.addPair")}</button>
              </div>}
            </FieldArray>
          </section>
          {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{submitError}</p>}
          <div className="flex justify-end"><button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-dark px-6 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50">{isSubmitting ? t("activity.form.saving") : effectiveSubmitLabel}</button></div>
        </Form>
      )}
    </Formik>
  );
}
