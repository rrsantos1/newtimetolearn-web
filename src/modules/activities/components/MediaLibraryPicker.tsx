import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Library, Search, X } from "lucide-react";
import { mediaLibraryService, type MediaLibraryAsset, type MediaStorageUsage } from "@/modules/activities/services/mediaLibraryService";

interface MediaLibraryPickerProps {
  onSelect: (asset: MediaLibraryAsset) => void;
  disabled: boolean;
}

function formatBytes(bytes: number, locale: string): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${units[unitIndex]}`;
}

const inputClassName = "min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-dark outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20";

export function MediaLibraryPicker({ onSelect, disabled }: Readonly<MediaLibraryPickerProps>) {
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<MediaLibraryAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [storageUsage, setStorageUsage] = useState<MediaStorageUsage | null>(null);
  const [storageUsageError, setStorageUsageError] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    mediaLibraryService.getStorageUsage()
      .then((usage) => {
        if (active) setStorageUsage(usage);
      })
      .catch(() => {
        if (active) setStorageUsageError(t("activity.media.storageError"));
      });
    return () => {
      active = false;
    };
  }, [open, t]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const assets = await mediaLibraryService.list(search);
        if (active) setItems(assets);
      } catch (requestError: unknown) {
        if (active) setError(requestError instanceof Error ? requestError.message : t("activity.media.loadError"));
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [open, search, t]);

  return (
    <>
      <button type="button" disabled={disabled} onClick={() => setOpen(true)}
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-dark hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50">
        <Library aria-hidden="true" size={16} /> {t("activity.media.library")}
      </button>
      {open && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-black/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="media-library-title">
          <section className="mx-auto my-4 max-w-5xl rounded-2xl bg-surface p-5 shadow-xl sm:my-8 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="media-library-title" className="text-xl font-bold text-dark">{t("activity.media.libraryTitle")}</h2>
                <p className="mt-1 text-sm text-muted">{t("activity.media.description")}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={t("activity.media.closeLibrary")}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            {storageUsage && (
              <section aria-label={t("activity.media.storageUsage")} className="mt-5 rounded-xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-dark">{t("activity.media.storageUsed")}</span>
                  <span className="text-muted">
                    {formatBytes(storageUsage.usageBytes, locale)}
                    {storageUsage.limitBytes !== null ? ` de ${formatBytes(storageUsage.limitBytes, locale)}` : ` · ${t("activity.media.noLimit")}`}
                  </span>
                </div>
                {storageUsage.limitBytes !== null && (
                  <div
                    className="mt-2 h-2 overflow-hidden rounded-full bg-border"
                    role="progressbar"
                    aria-label={t("activity.media.storagePercentage")}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={storageUsage.usagePercentage ?? 0}
                  >
                    <div
                      className="h-full rounded-full bg-accent transition-[width]"
                      style={{ width: `${storageUsage.usagePercentage ?? 0}%` }}
                    />
                  </div>
                )}
                <p className="mt-2 text-xs text-muted">
                  {t("activity.media.quotaHelp")}
                </p>
              </section>
            )}
            {storageUsageError && <p role="status" className="mt-3 text-xs text-muted">{storageUsageError}</p>}
            <label htmlFor="media-library-search" className="mt-5 block text-sm font-medium text-dark">{t("activity.media.searchImages")}</label>
            <div className="relative mt-1">
              <Search aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input id="media-library-search" value={search} onChange={(event) => setSearch(event.target.value)}
                placeholder={t("activity.media.searchPlaceholder")} className={`${inputClassName} pl-10`} />
            </div>
            {loading && <p role="status" className="mt-5 text-sm text-muted">{t("activity.media.loadingImages")}</p>}
            {error && <p role="alert" className="mt-5 text-sm text-red-600">{error}</p>}
            {!loading && !error && items.length === 0 && <p className="mt-5 rounded-xl bg-background p-5 text-sm text-muted">{t("activity.media.empty")}</p>}
            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((asset) => (
                <li key={asset.id}>
                  <button type="button" onClick={() => { onSelect(asset); setOpen(false); }}
                    className="w-full rounded-xl border border-border p-3 text-left transition hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                    <div className="relative aspect-video overflow-hidden rounded-lg bg-background">
                      <Image src={asset.thumbnailPublicUrl ?? asset.publicUrl} alt={asset.altText || asset.fileName} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-contain" />
                    </div>
                    <span className="mt-2 block truncate text-sm font-semibold text-dark">{asset.fileName}</span>
                    {asset.altText && <span className="mt-1 block truncate text-xs text-muted">{asset.altText}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}
