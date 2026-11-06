import Image from "next/image";
import { ActivityCoverField } from "@/modules/activities/components/ActivityCoverField";
import { useEffect, useMemo, useState } from "react";
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
      setUploadError(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  const imageUrl = value.type === "image" && value.storageKey ? resolveImageUrl(value.storageKey, value.type === "image" ? value.publicUrl : undefined) : undefined;

  return (
    <div className="min-w-0 rounded-xl border border-border bg-background p-4">
      <label htmlFor={`${name}-type`} className={labelClass}>{title}</label>
      <select id={`${name}-type`} value={value.type} aria-invalid={invalid} onChange={(event) => onChange(event.target.value === "image" ? { type: "image", storageKey: "", altText: "" } : emptyText())} className={inputClass}>
        <option value="text">Texto</option><option value="image">Imagem</option>
      </select>
      {value.type === "text" ? (
        <div className="mt-3">
          <label htmlFor={`${name}-text`} className={labelClass}>Texto do par</label>
          <textarea id={`${name}-text`} value={value.value} aria-invalid={invalid} maxLength={300} rows={3} onChange={(event) => onChange({ type: "text", value: event.target.value })} className={inputClass} placeholder="Digite um termo, conceito ou resposta" />
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <label htmlFor={`${name}-upload`} className={labelClass}>Enviar imagem do computador</label>
          <input
            id={`${name}-upload`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => void handleFileChange(event)}
            disabled={uploading}
            className="block min-h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-dark file:mr-3 file:rounded-lg file:border-0 file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-60"
            aria-describedby={uploadError ? `${name}-upload-error` : undefined}
          />
          <p className="text-xs text-muted">JPEG, PNG, WebP ou GIF · máximo de 5 MB.</p>
          <div className="flex flex-wrap items-center gap-2">
            <MediaLibraryPicker
              disabled={uploading}
              onSelect={(asset) => {
                onChange({ type: "image", storageKey: asset.storageKey, altText: asset.altText, publicUrl: asset.publicUrl });
                setUploadError("");
              }}
            />
            {uploading && <span role="status" className="text-sm text-muted">Enviando imagem...</span>}
          </div>
          {uploadError && <p id={`${name}-upload-error`} role="alert" className="text-sm text-red-600">{uploadError}</p>}
          {value.storageKey ? (
            <div className="rounded-xl border border-border bg-surface p-3">
              {imageUrl ? (
                <div className="relative mb-3 aspect-video overflow-hidden rounded-lg bg-background">
                  <Image src={imageUrl} alt={value.altText || "Pré-visualização da imagem selecionada"} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-contain" />
                </div>
              ) : (
                <p className="mb-3 rounded-lg bg-background p-3 text-xs text-muted">Configure NEXT_PUBLIC_B2_PUBLIC_BASE_URL para visualizar a imagem.</p>
              )}
              <label htmlFor={`${name}-alt-text`} className={labelClass}>Texto alternativo</label>
              <input id={`${name}-alt-text`} value={value.altText} maxLength={250} onChange={(event) => onChange({ type: "image", storageKey: value.storageKey, altText: event.target.value, publicUrl: value.publicUrl })} className={inputClass} placeholder="Descreva a imagem" />
              <button type="button" onClick={() => onChange({ type: "image", storageKey: "", altText: "" })} className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                <Trash2 aria-hidden="true" size={15} /> Remover imagem
              </button>
            </div>
          ) : <p className="text-xs text-muted">Nenhuma imagem selecionada.</p>}
        </div>
      )}
    </div>
  );
}

export function MemoryForm({ onSubmit, submitError, initialValues: suppliedInitialValues, submitLabel = "Salvar jogo da memória como rascunho" }: Readonly<Props>) {
  const [aiOpen, setAiOpen] = useState(false);
  const defaultInitialValues = useMemo<CreateMemoryFormValues>(() => ({
    name: "", description: "", difficulty: "EASY", timeLimitSeconds: 900,
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
              <div><h2 className="text-lg font-semibold text-dark">Informações da atividade</h2><p className="mt-1 text-sm text-muted">Comece com 6 pares e ajuste a quantidade conforme o conteúdo.</p></div>
              <button type="button" onClick={() => setAiOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Sparkles aria-hidden="true" size={16} /> Criar com IA</button>
            </div>
            <div className="mt-5 grid gap-5">
              <div><label htmlFor="name" className={labelClass}>Nome da atividade *</label><Field id="name" name="name" maxLength={120} className={inputClass} aria-required="true" aria-invalid={Boolean(getIn(errors, "name") && (getIn(touched, "name") || submitCount > 0))} />{getIn(errors, "name") && (getIn(touched, "name") || submitCount > 0) && <p role="alert" className="mt-1 text-sm text-red-600">{String(getIn(errors, "name"))}</p>}</div>
              <div><label htmlFor="description" className={labelClass}>Descrição</label><Field as="textarea" id="description" name="description" rows={3} maxLength={2000} className={inputClass} /></div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div><label htmlFor="difficulty" className={labelClass}>Dificuldade</label><Field as="select" id="difficulty" name="difficulty" className={inputClass}><option value="EASY">Fácil</option><option value="MEDIUM">Média</option><option value="HARD">Difícil</option></Field></div>
                <div><label htmlFor="timeLimitSeconds" className={labelClass}>Tempo limite</label><select id="timeLimitSeconds" value={values.timeLimitSeconds === null ? "" : String(values.timeLimitSeconds)} onChange={(event) => void setFieldValue("timeLimitSeconds", event.target.value === "" ? null : Number(event.target.value))} className={inputClass}><option value="300">5 minutos</option><option value="600">10 minutos</option><option value="900">15 minutos</option><option value="1200">20 minutos</option><option value="1800">30 minutos</option><option value="">Sem limite</option></select></div>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-dark">Pares para combinar</h2><p className="mt-1 text-sm text-muted">Cada lado pode ser texto ou uma imagem aprovada. Você pode misturar formatos na mesma atividade.</p></div><span className="rounded-full bg-background px-3 py-1 text-sm font-semibold text-dark">{values.content.pairs.length}/50 pares</span></div>
            <FieldArray name="content.pairs">
              {({ push, remove }) => <div className="space-y-4">
                {values.content.pairs.map((pair, index) => <fieldset key={pair.id} className="rounded-2xl border border-border p-4 sm:p-5">
                  <legend className="px-1 text-sm font-semibold text-dark">Par {index + 1}</legend>
                  <div className="grid gap-4 md:grid-cols-2">
                    <MemoryItemEditor name={`pair-${index}-first`} title="Primeiro lado" value={pair.first} invalid={Boolean(getIn(errors, `content.pairs.${index}.first`) && submitCount > 0)} onChange={(item) => void setFieldValue(`content.pairs.${index}.first`, item)} />
                    <MemoryItemEditor name={`pair-${index}-second`} title="Segundo lado" value={pair.second} invalid={Boolean(getIn(errors, `content.pairs.${index}.second`) && submitCount > 0)} onChange={(item) => void setFieldValue(`content.pairs.${index}.second`, item)} />
                  </div>
                  {([pair.first, pair.second].some((item) => item.type === "text" && !item.value.trim()) || [pair.first, pair.second].some((item) => item.type === "image" && !item.storageKey)) && submitCount > 0 && <p role="alert" className="mt-3 text-sm text-red-600">Preencha os dois lados deste par.</p>}
                  <button type="button" onClick={() => remove(index)} disabled={values.content.pairs.length <= 3} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-40"><Trash2 aria-hidden="true" size={15} /> Remover par</button>
                </fieldset>)}
                <button type="button" onClick={() => push(emptyPair())} disabled={values.content.pairs.length >= 50} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-40"><Plus aria-hidden="true" size={17} /> Adicionar par</button>
              </div>}
            </FieldArray>
          </section>
          {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{submitError}</p>}
          <div className="flex justify-end"><button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-dark px-6 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50">{isSubmitting ? "Salvando jogo..." : submitLabel}</button></div>
        </Form>
      )}
    </Formik>
  );
}
