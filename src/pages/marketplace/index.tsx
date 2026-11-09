import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import {useEffect,useState} from "react";
import {PublicHeader} from "@/components/layout/PublicHeader";
import {PublicFooter} from "@/components/layout/PublicFooter";
import { FaqSection } from "@/modules/faq/components/FaqSection";
import { marketplaceFaq, marketplaceFaqEn } from "@/modules/faq/data/faqContent";
import {useAuth} from "@/modules/auth/contexts/AuthContext";
import {marketplaceService} from "@/modules/marketplace/services/marketplaceService";
import type {MarketplaceProduct} from "@/modules/marketplace/types/marketplace.types";
import {useTranslation} from "@/hooks/useTranslation";
import type { TranslationKey } from "@/lib/i18n/translations";
type MarketplaceListState={query:string;items:MarketplaceProduct[];error:string;};
const marketplaceCategoryKeys: Record<string, TranslationKey> = {
  "Apresentação": "marketplace.presentation",
  "Plano de aula": "marketplace.lessonPlan",
  "Atividade": "marketplace.activity",
  "Material complementar": "marketplace.supplementary",
};

function getMarketplaceCategoryLabel(
  category: string,
  t: (key: TranslationKey) => string,
): string {
  const key = marketplaceCategoryKeys[category];
  return key ? t(key) : category;
}

export default function MarketplacePage(){
 const {isAuthenticated}=useAuth();
 const {t,locale}=useTranslation();
 const [query,setQuery]=useState("");
 const [listState,setListState]=useState<MarketplaceListState|null>(null);
 const loading=listState?.query!==query;
 const items=listState?.query===query?listState.items:[];
 const error=listState?.query===query?listState.error:"";
 useEffect(()=>{let active=true;const loadItems=async():Promise<void>=>{try{const result=await marketplaceService.list({q:query,page:1,limit:24});if(active)setListState({query,items:result.items,error:""});}catch{if(active)setListState({query,items:[],error:t("marketplace.loadError")});}};void loadItems();return()=>{active=false;};},[query,t]);
 return <main className="min-h-screen bg-background"><Head><title>{t("marketplace.pageTitle")}</title><meta name="description" content={t("marketplace.metaDescription")} /></Head><PublicHeader/><section className="mx-auto w-full px-5 py-12 sm:px-8 lg:px-10">
 <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-accent">{t("marketplace.eyebrow")}</p><h1 className="mt-2 text-3xl font-extrabold text-dark sm:text-4xl">Marketplace</h1><p className="mt-3 text-sm leading-6 text-muted">{t("marketplace.intro")}</p></div><div className="flex flex-wrap gap-4 text-sm font-semibold"><Link href="/marketplace/purchases" className="text-primary hover:underline">{t("marketplace.myPurchases")}</Link><Link href="/teacher/marketplace/new" className="text-primary hover:underline">{t("marketplace.sellMaterial")}</Link><Link href={isAuthenticated ? "/dashboard" : "/"} className="text-primary hover:underline">{t("marketplace.backHome")}</Link></div></div>
 <label htmlFor="marketplace-search" className="mt-8 block text-sm font-semibold text-dark">{t("marketplace.searchLabel")}</label><input id="marketplace-search" value={query} onChange={event=>setQuery(event.target.value)} placeholder={t("marketplace.searchPlaceholder")} className="mt-2 min-h-12 w-full max-w-xl rounded-xl border border-border bg-white px-4 text-sm text-dark outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"/>
 {loading?<p className="mt-10 text-sm text-muted">{t("marketplace.loading")}</p>:error?<p role="alert" className="mt-10 text-sm text-red-600">{error}</p>:items.length===0?<p className="mt-10 rounded-2xl border border-border bg-white p-8 text-sm text-muted">{t("marketplace.empty")}</p>:<div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map(item=><article key={item.id} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"><div className="relative flex aspect-16/10 items-center justify-center bg-slate-100">{item.preview_pages>0?<Image src={marketplaceService.coverUrl(item.slug)} alt={t("marketplace.coverAlt").replace("{title}",item.title)} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" unoptimized={marketplaceService.shouldBypassImageOptimization()} className="object-contain p-2"/>:<span className="rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-dark">{item.delivery_type==="EXTERNAL_URL"?t("marketplace.googleSlidesCopy"):t("marketplace.previewUnavailable")}</span>}</div><div className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-accent">{getMarketplaceCategoryLabel(item.category, t)}</p><h2 className="mt-2 text-lg font-bold text-dark">{item.title}</h2><p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{item.description}</p><p className="mt-3 text-xs text-muted">{t("marketplace.byAuthor").replace("{author}",item.author_name)}</p><div className="mt-5 flex items-center justify-between gap-3"><strong className="text-lg text-dark">{(item.price_cents/100).toLocaleString(locale==="en"?"en-US":"pt-BR",{style:"currency",currency:item.currency})}</strong><Link href={`/marketplace/${encodeURIComponent(item.slug)}`} className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white! hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">{t("marketplace.viewMaterial")}</Link></div></div></article>)}</div>}
 </section><FaqSection title={t("marketplace.faqTitle")} description={t("marketplace.faqDescription")} items={locale==="en"?marketplaceFaqEn:marketplaceFaq}/><PublicFooter/></main>;
}
