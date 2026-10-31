import Image from "next/image";
import { useState } from "react";
import { ErrorMessage, Field, FieldArray, Form, Formik } from "formik";
import { Eye, Plus, Trash2, X } from "lucide-react";
import { uploadMediaImageService } from "@/modules/activities/services/uploadMediaImageService";
import { MediaLibraryPicker } from "@/modules/activities/components/MediaLibraryPicker";
import { createQuizSchema } from "@/modules/activities/schemas/createQuizSchema";
import type { CreateQuizFormValues } from "@/modules/activities/schemas/createQuizSchema";

interface QuizFormProps {
  onSubmit: (values: CreateQuizFormValues) => Promise<void>;
  submitError?: string;
  initialValues?: CreateQuizFormValues;
  submitLabel?: string;
}

const inputClassName = "min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-dark outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20";
const labelClassName = "mb-2 block text-sm font-medium text-dark";

type QuizImageValue = {
  storageKey: string;
  altText: string;
  publicUrl?: string;
};

interface ImageAttachmentsProps {
  images: QuizImageValue[];
  idPrefix: string;
  label: string;
  onChange: (images: QuizImageValue[]) => void;
}

function resolveImageUrl(image: QuizImageValue): string | undefined {
  if (image.publicUrl) return image.publicUrl;
  const publicBaseUrl = process.env.NEXT_PUBLIC_B2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  return publicBaseUrl ? `${publicBaseUrl}/${image.storageKey}` : undefined;
}

function ImageAttachments({ images, idPrefix, label, onChange }: Readonly<ImageAttachmentsProps>) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    if (images.length >= 5) {
      setError("Você pode anexar no máximo 5 imagens neste campo.");
      return;
    }

    setError("");
    setUploading(true);
    try {
      const uploaded = await uploadQuizImageService.execute(file);
      onChange([...images, uploaded]);
    } catch (uploadError: unknown) {
      setError(uploadError instanceof Error ? uploadError.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <label htmlFor={`${idPrefix}-upload`} className="block text-sm font-medium text-dark">{label}</label>
      <div className="flex flex-wrap items-center gap-3">
        <input
          id={`${idPrefix}-upload`}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(event) => void handleFileChange(event)}
          disabled={uploading || images.length >= 5}
          className="block min-h-11 w-full min-w-0 max-w-xl rounded-xl border border-border bg-surface px-3 py-2 text-sm text-dark file:mr-3 file:rounded-lg file:border-0 file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-60"
          aria-describedby={error ? `${idPrefix}-error` : undefined}
        />
        <MediaLibraryPicker
          disabled={uploading || images.length >= 5}
          onSelect={(asset) => onChange([...images, { storageKey: asset.storageKey, publicUrl: asset.publicUrl, altText: asset.altText }])}
        />
        {uploading && <span role="status" className="text-sm text-muted">Enviando imagem...</span>}
      </div>
      <p className="text-xs text-muted">JPEG, PNG, WebP ou GIF · máximo de 5 MB por imagem · até 5 imagens.</p>
      {error && <p id={`${idPrefix}-error`} role="alert" className="text-sm text-red-600">{error}</p>}
      {images.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => {
            const imageUrl = resolveImageUrl(image);
            return (
              <li key={image.storageKey} className="rounded-xl border border-border p-3">
                {imageUrl ? (
                  <div className="relative mb-3 aspect-video overflow-hidden rounded-lg bg-background">
                    <Image src={imageUrl} alt={image.altText || `Imagem ${index + 1}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" unoptimized className="object-contain" />
                  </div>
                ) : (
                  <p className="mb-3 rounded-lg bg-background p-3 text-xs text-muted">Configure NEXT_PUBLIC_B2_PUBLIC_BASE_URL para visualizar esta imagem após reabrir o Quiz.</p>
                )}
                <label htmlFor={`${idPrefix}-alt-${index}`} className="mb-1 block text-xs font-medium text-dark">Texto alternativo</label>
                <input
                  id={`${idPrefix}-alt-${index}`}
                  value={image.altText}
                  maxLength={250}
                  onChange={(event) => onChange(images.map((item, itemIndex) => itemIndex === index ? { ...item, altText: event.target.value } : item))}
                  className={inputClassName}
                  placeholder="Descreva a imagem"
                />
                <button type="button" onClick={() => onChange(images.filter((item) => item.storageKey !== image.storageKey))}
                  className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  <Trash2 aria-hidden="true" size={15} /> Remover imagem
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function createId(): string {
  return globalThis.crypto.randomUUID();
}

function createOption(index: number) {
  return { id: createId(), text: `Alternativa ${index + 1}`, images: [] as { storageKey: string; altText: string }[] };
}

function createQuestion() {
  const options = [createOption(0), createOption(1), createOption(2), createOption(3)];
  return {
    id: createId(),
    statement: "",
    images: [] as { storageKey: string; altText: string }[],
    options,
    correctOptionId: options[0].id,
    explanation: "",
  };
}

const initialValues: CreateQuizFormValues = {
  name: "",
  description: "",
  difficulty: "EASY",
  timeLimitSeconds: 900,
  content: { questions: [createQuestion()] },
};

export function QuizForm({ onSubmit, submitError, initialValues: suppliedInitialValues, submitLabel = "Salvar Quiz como rascunho" }: Readonly<QuizFormProps>) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const formInitialValues = suppliedInitialValues ?? initialValues;

  return (
    <Formik<CreateQuizFormValues>
      initialValues={formInitialValues}
      enableReinitialize
      validationSchema={createQuizSchema}
      onSubmit={onSubmit}
    >
      {({ values, isSubmitting, setFieldValue }) => (
        <Form className="space-y-6">
          <div className="flex justify-end">
            <button type="button" onClick={() => setPreviewOpen(true)}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-dark hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
              <Eye aria-hidden="true" size={17} /> Pré-visualizar Quiz
            </button>
          </div>
          {previewOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="quiz-preview-title">
              <section className="mx-auto my-4 max-w-4xl rounded-2xl bg-surface p-5 shadow-xl sm:my-8 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Pré-visualização do professor</p>
                    <h2 id="quiz-preview-title" className="mt-2 text-2xl font-bold text-dark">{values.name.trim() || "Quiz sem título"}</h2>
                    {values.description?.trim() && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{values.description}</p>}
                  </div>
                  <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Fechar pré-visualização" className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                    <X aria-hidden="true" size={18} />
                  </button>
                </div>
                <p className="mt-3 text-sm text-muted">{values.content.questions.length} {values.content.questions.length === 1 ? "questão" : "questões"} · {values.timeLimitSeconds === null ? "Sem limite de tempo" : `${Math.floor((values.timeLimitSeconds ?? 900) / 60)} minutos`}</p>
                <div className="mt-6 space-y-5">
                  {values.content.questions.map((question, questionIndex) => (
                    <article key={question.id} className="rounded-xl border border-border p-4 sm:p-5">
                      <h3 className="text-sm font-semibold text-muted">Questão {questionIndex + 1}</h3>
                      <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-dark">{question.statement || "Enunciado não preenchido."}</p>
                      {question.images.length > 0 && <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">{question.images.map((image, index) => {
                        const imageUrl = resolveImageUrl(image);
                        return imageUrl ? <div key={image.storageKey} className="relative aspect-video overflow-hidden rounded-xl bg-background"><Image src={imageUrl} alt={image.altText || `Imagem do enunciado ${index + 1}`} fill sizes="(max-width: 640px) 100vw, 50vw" unoptimized className="object-contain" /></div> : null;
                      })}</div>}
                      <ol className="mt-4 space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <li key={option.id} className={`rounded-xl border p-3 text-sm ${question.correctOptionId === option.id ? "border-green-500 bg-green-50 text-green-900" : "border-border text-dark"}`}>
                            <span className="mr-2 font-semibold">{String.fromCharCode(65 + optionIndex)}.</span>
                            {option.text?.trim() || (option.images?.length ? "Alternativa com imagem" : "Alternativa sem conteúdo")}
                            {option.images?.length > 0 && <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">{option.images.map((image, index) => {
                              const imageUrl = resolveImageUrl(image);
                              return imageUrl ? <div key={image.storageKey} className="relative aspect-video overflow-hidden rounded-lg bg-background"><Image src={imageUrl} alt={image.altText || `Imagem da alternativa ${index + 1}`} fill sizes="(max-width: 640px) 100vw, 50vw" unoptimized className="object-contain" /></div> : null;
                            })}</div>}
                            {question.correctOptionId === option.id && <span className="ml-2 font-semibold">— Resposta correta</span>}
                          </li>
                        ))}
                      </ol>
                      {question.explanation?.trim() && <p className="mt-4 rounded-lg bg-background p-3 text-sm leading-6 text-muted"><strong>Explicação:</strong> {question.explanation}</p>}
                    </article>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button type="button" onClick={() => setPreviewOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-dark px-5 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>Voltar à edição</button>
                </div>
              </section>
            </div>
          )}
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-semibold text-dark">Informações do Quiz</h2>
            <div className="mt-5 grid gap-5">
              <div>
                <label htmlFor="name" className={labelClassName}>Nome do Quiz *</label>
                <Field id="name" name="name" maxLength={120} className={inputClassName} aria-required="true" />
                <ErrorMessage name="name" component="p" className="mt-1 text-sm text-red-600" />
              </div>
              <div>
                <label htmlFor="description" className={labelClassName}>Descrição</label>
                <Field as="textarea" id="description" name="description" rows={3} maxLength={2000} className={inputClassName} />
                <ErrorMessage name="description" component="p" className="mt-1 text-sm text-red-600" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="difficulty" className={labelClassName}>Dificuldade</label>
                  <Field as="select" id="difficulty" name="difficulty" className={inputClassName}>
                    <option value="EASY">Fácil</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HARD">Difícil</option>
                  </Field>
                </div>
                <div>
                  <label htmlFor="timeLimitSeconds" className={labelClassName}>Tempo limite</label>
                  <Field as="select" id="timeLimitSeconds" name="timeLimitSeconds" className={inputClassName}
                    value={values.timeLimitSeconds === null ? "" : String(values.timeLimitSeconds)}
                    onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                      void setFieldValue("timeLimitSeconds", event.target.value === "" ? null : Number(event.target.value));
                    }}>
                    <option value="300">5 minutos</option>
                    <option value="600">10 minutos</option>
                    <option value="900">15 minutos</option>
                    <option value="1200">20 minutos</option>
                    <option value="1800">30 minutos</option>
                  </Field>
                  <label className="mt-3 flex items-center gap-2 text-sm text-muted">
                    <input type="checkbox" checked={values.timeLimitSeconds === null}
                      onChange={(event) => void setFieldValue("timeLimitSeconds", event.target.checked ? null : 900)}
                      className="size-4 rounded border-border accent-accent" />
                    Sem limite de tempo
                  </label>
                </div>
              </div>
            </div>
          </section>

          <FieldArray name="content.questions">
            {({ push, remove }) => (
              <div className="space-y-5">
                {values.content.questions.map((question, questionIndex) => (
                  <section key={question.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold text-dark">Questão {questionIndex + 1}</h2>
                      <button type="button" onClick={() => remove(questionIndex)} disabled={values.content.questions.length <= 1}
                        aria-label={`Remover questão ${questionIndex + 1}`} title="Remover questão"
                        className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-muted hover:border-red-300 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-40">
                        <Trash2 aria-hidden="true" size={18} />
                      </button>
                    </div>
                    <div>
                      <label htmlFor={`content.questions.${questionIndex}.statement`} className={labelClassName}>Enunciado *</label>
                      <Field as="textarea" id={`content.questions.${questionIndex}.statement`} name={`content.questions.${questionIndex}.statement`} rows={3} maxLength={2000} className={inputClassName} />
                      <ErrorMessage name={`content.questions.${questionIndex}.statement`} component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                    <ImageAttachments
                      idPrefix={`question-${question.id}-images`}
                      label="Imagens do enunciado"
                      images={question.images}
                      onChange={(images) => void setFieldValue(`content.questions.${questionIndex}.images`, images)}
                    />

                    <FieldArray name={`content.questions.${questionIndex}.options`}>
                      {({ push: pushOption, remove: removeOption }) => (
                        <fieldset className="mt-5 space-y-3">
                          <legend className="mb-3 text-sm font-semibold text-dark">Alternativas (marque a correta)</legend>
                          {question.options.map((option, optionIndex) => (
                            <div key={option.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                              <input type="radio" name={`correct-option-${question.id}`} checked={question.correctOptionId === option.id}
                                onChange={() => void setFieldValue(`content.questions.${questionIndex}.correctOptionId`, option.id)}
                                aria-label={`Marcar alternativa ${optionIndex + 1} como correta da questão ${questionIndex + 1}`}
                                className="mt-3 size-4 accent-accent" />
                              <div className="min-w-0 flex-1">
                                <label htmlFor={`content.questions.${questionIndex}.options.${optionIndex}.text`} className="sr-only">Texto da alternativa {optionIndex + 1}</label>
                                <Field id={`content.questions.${questionIndex}.options.${optionIndex}.text`} name={`content.questions.${questionIndex}.options.${optionIndex}.text`} maxLength={1000} placeholder={`Alternativa ${optionIndex + 1}`} className={inputClassName} />
                                <ErrorMessage name={`content.questions.${questionIndex}.options.${optionIndex}.text`} component="p" className="mt-1 text-sm text-red-600" />
                                <ImageAttachments
                                  idPrefix={`question-${question.id}-option-${option.id}-images`}
                                  label="Imagens da alternativa"
                                  images={option.images}
                                  onChange={(images) => void setFieldValue(`content.questions.${questionIndex}.options.${optionIndex}.images`, images)}
                                />
                              </div>
                              <button type="button" onClick={() => {
                                const nextOptions = question.options.filter((item) => item.id !== option.id);
                                removeOption(optionIndex);
                                if (question.correctOptionId === option.id && nextOptions[0]) {
                                  void setFieldValue(`content.questions.${questionIndex}.correctOptionId`, nextOptions[0].id);
                                }
                              }} disabled={question.options.length <= 3} aria-label={`Remover alternativa ${optionIndex + 1}`}
                                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-40">
                                <Trash2 aria-hidden="true" size={17} />
                              </button>
                            </div>
                          ))}
                          <ErrorMessage name={`content.questions.${questionIndex}.options`} component="p" className="text-sm text-red-600" />
                          <button type="button" onClick={() => pushOption(createOption(question.options.length))} disabled={question.options.length >= 6}
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-40">
                            <Plus aria-hidden="true" size={16} /> Adicionar alternativa
                          </button>
                        </fieldset>
                      )}
                    </FieldArray>

                    <div className="mt-5">
                      <label htmlFor={`content.questions.${questionIndex}.explanation`} className={labelClassName}>Explicação após responder (opcional)</label>
                      <Field as="textarea" id={`content.questions.${questionIndex}.explanation`} name={`content.questions.${questionIndex}.explanation`} rows={2} maxLength={2000} className={inputClassName} />
                      <ErrorMessage name={`content.questions.${questionIndex}.explanation`} component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </section>
                ))}
                <button type="button" onClick={() => push(createQuestion())}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-dark hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  <Plus aria-hidden="true" size={18} /> Adicionar questão
                </button>
              </div>
            )}
          </FieldArray>

          {submitError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{submitError}</div>}
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dark px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
              style={{ color: "var(--primary-foreground)" }}>
              {isSubmitting ? "Salvando Quiz..." : submitLabel}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
