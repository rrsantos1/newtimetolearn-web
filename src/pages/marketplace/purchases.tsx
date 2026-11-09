
import type { TranslationKey } from "@/lib/i18n/translations";import {useEffect,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/router";
import {PublicHeader} from "@/components/layout/PublicHeader";
import {PublicFooter} from "@/components/layout/PublicFooter";
import { FaqSection } from "@/modules/faq/components/FaqSection";
import { marketplaceFaq, marketplaceFaqEn } from "@/modules/faq/data/faqContent";
import {useTranslation} from "@/hooks/useTranslation";
import {useAuth} from "@/modules/auth/contexts/AuthContext";
import {marketplaceService} from "@/modules/marketplace/services/marketplaceService";
interface Purchase{id:string;title:string;original_file_name:string|null;delivery_type:"FILE"|"EXTERNAL_URL";external_url:string|null;paid_at:string;}
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

export default function MarketplacePurchasesPage(){
 const router=useRouter();const {isAuthenticated,isLoading}=useAuth();const {t,locale}=useTranslation();const [items,setItems]=useState<Purchase[]>([]);const [error,setError]=useState("");
 useEffect(()=>{if(!isLoading&&!isAuthenticated)void router.replace("/login");},[isAuthenticated,isLoading,router]);
 useEffect(()=>{if(!isAuthenticated)return;let active=true;marketplaceService.purchases().then(result=>{if(active)setItems(result);}).catch(()=>{if(active)setError(t("marketplace.purchaseLoadError"));});return()=>{active=false;};},[isAuthenticated,t]);
 async function download(orderId:string){try{const url=await marketplaceService.download(orderId);window.location.assign(url);}catch{setError(t("marketplace.downloadError"));}}
 return <main className="min-h-screen bg-background"><PublicHeader/><section className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><Link href="/marketplace" className="text-sm font-semibold text-primary hover:underline">{t("marketplace.backToMarketplace")}</Link><h1 className="mt-5 text-3xl font-extrabold text-dark">{t("marketplace.purchasesTitle")}</h1>{error&&<p role="alert" className="mt-5 text-sm text-red-600">{error}</p>}{items.length===0?<p className="mt-8 rounded-xl border border-border bg-white p-6 text-sm text-muted">{t("marketplace.noPurchases")}</p>:<div className="mt-7 space-y-3">{items.map(item=><article key={item.id} className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-dark">{item.title}</h2><p className="mt-1 text-xs text-muted">{item.delivery_type==="FILE"?(item.original_file_name??t("marketplace.digitalFile")) : t("marketplace.googleSlides")} • {t("marketplace.purchasedOn").replace("{date}",new Date(item.paid_at).toLocaleDateString(locale==="en"?"en-US":"pt-BR"))}</p></div>{item.delivery_type==="EXTERNAL_URL"&&item.external_url?<a href={item.external_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">{t("marketplace.createCopy")}</a>:<button type="button" onClick={()=>void download(item.id)} className="min-h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">{t("marketplace.downloadOriginal")}</button>}</article>)}</div>}</section><FaqSection title={t("marketplace.purchasesFaqTitle")} description={t("marketplace.purchasesFaqDescription")} items={locale==="en"?marketplaceFaqEn:marketplaceFaq}/><PublicFooter/></main>;
}
