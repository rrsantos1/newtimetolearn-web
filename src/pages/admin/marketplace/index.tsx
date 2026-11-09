import {useEffect,useState} from "react";
import {useRouter} from "next/router";
import Link from "next/link";
import {PublicHeader} from "@/components/layout/PublicHeader";
import {PublicFooter} from "@/components/layout/PublicFooter";
import { FaqSection } from "@/modules/faq/components/FaqSection";
import { adminFaq, adminFaqEn } from "@/modules/faq/data/faqContent";
import {useTranslation} from "@/hooks/useTranslation";
import {useAuth} from "@/modules/auth/contexts/AuthContext";
import {marketplaceService} from "@/modules/marketplace/services/marketplaceService";
interface PendingProduct{id:string;title:string;description:string;category:string;price_cents:number;author_name:string;created_at:string;delivery_type:"FILE"|"EXTERNAL_URL";external_url:string|null;}
export default function MarketplaceModerationPage(){
 const router=useRouter();
 const {user,isAuthenticated,isLoading}=useAuth();
 const {t,locale}=useTranslation();
 const [items,setItems]=useState<PendingProduct[]>([]);
 const [error,setError]=useState("");
 const [busyId,setBusyId]=useState("");

 useEffect(()=>{
    if(!isLoading&&(!isAuthenticated||!user?.roles.includes("ADMIN")))
        void router.replace("/login");
    },[isAuthenticated,isLoading,router,user]);
    
 useEffect(()=>{if(!isAuthenticated||!user?.roles.includes("ADMIN"))return;let active=true;marketplaceService.pendingModeration().then(data=>{if(active)setItems(data);}).catch(()=>{if(active)setError(t("marketplace.pendingLoadError"));});return()=>{active=false;};},[isAuthenticated,user,t]);
 async function review(productId:string,approved:boolean){setBusyId(productId);setError("");try{await marketplaceService.review({productId,approved});setItems(current=>current.filter(item=>item.id!==productId));}catch{setError(t("marketplace.reviewDecisionError"));}finally{setBusyId("");}}
 return <main className="min-h-screen bg-background"><PublicHeader/><section className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><Link href="/marketplace" className="text-sm font-semibold text-primary hover:underline">{t("marketplace.pageTitle")}</Link><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="mt-5 text-3xl font-extrabold text-dark">{t("marketplace.adminReviewTitle")}</h1><p className="mt-2 text-sm text-muted">{t("marketplace.adminReviewDescription")}</p></div><Link href="/admin/marketplace/new" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>{t("marketplace.registerOwnResource")}</Link></div>{error&&<p role="alert" className="mt-5 text-sm text-red-600">{error}</p>}{items.length===0?<p className="mt-8 rounded-xl border border-border bg-white p-6 text-sm text-muted">{t("marketplace.noPendingResources")}</p>:<div className="mt-7 space-y-4">{items.map(item=><article key={item.id} className="rounded-2xl border border-border bg-white p-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-lg font-bold text-dark">{item.title}</h2><p className="mt-1 text-xs text-muted">{item.category} • {item.author_name} • {(item.price_cents/100).toLocaleString(locale==="en"?"en-US":"pt-BR",{style:"currency",currency:"BRL"})}</p></div><time className="text-xs text-muted">{new Date(item.created_at).toLocaleDateString(locale==="en"?"en-US":"pt-BR")}</time></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">{item.description}</p><p className="mt-2 text-xs font-semibold text-muted">{t("marketplace.delivery")} {item.delivery_type==="FILE"?t("marketplace.fileDelivery"):t("marketplace.slidesDelivery")}</p>{item.delivery_type==="EXTERNAL_URL"&&item.external_url&&<a href={item.external_url.replace(/\/copy(?:\?.*)?$/,"/edit")} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-sm font-semibold text-primary underline">{t("marketplace.reviewResource")}</a>}<div className="mt-5 flex flex-wrap gap-3"><button type="button" disabled={busyId===item.id} onClick={()=>void review(item.id,true)} className="min-h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">{t("marketplace.approvePublish")}</button><button type="button" disabled={busyId===item.id} onClick={()=>void review(item.id,false)} className="min-h-10 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">{t("marketplace.reject")}</button></div></article>)}</div>}</section><FaqSection title={t("faq.adminMarketplaceTitle")} description={t("faq.adminMarketplaceDescription")} items={locale==="en"?adminFaqEn:adminFaq}/><PublicFooter/></main>;
}