import {useEffect,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/router";
import {PublicHeader} from "@/components/layout/PublicHeader";
import {PublicFooter} from "@/components/layout/PublicFooter";
import { FaqSection } from "@/modules/faq/components/FaqSection";
import { marketplaceFaq } from "@/modules/faq/data/faqContent";
import {useAuth} from "@/modules/auth/contexts/AuthContext";
import {marketplaceService} from "@/modules/marketplace/services/marketplaceService";
interface Purchase{id:string;title:string;original_file_name:string|null;delivery_type:"FILE"|"EXTERNAL_URL";external_url:string|null;paid_at:string;}
export default function MarketplacePurchasesPage(){
 const router=useRouter();const {isAuthenticated,isLoading}=useAuth();const [items,setItems]=useState<Purchase[]>([]);const [error,setError]=useState("");
 useEffect(()=>{if(!isLoading&&!isAuthenticated)void router.replace("/login");},[isAuthenticated,isLoading,router]);
 useEffect(()=>{if(!isAuthenticated)return;let active=true;marketplaceService.purchases().then(result=>{if(active)setItems(result);}).catch(()=>{if(active)setError("Não foi possível carregar suas compras.");});return()=>{active=false;};},[isAuthenticated]);
 async function download(orderId:string){try{const url=await marketplaceService.download(orderId);window.location.assign(url);}catch{setError("Não foi possível liberar o download desta compra.");}}
 return <main className="min-h-screen bg-background"><PublicHeader/><section className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><Link href="/marketplace" className="text-sm font-semibold text-primary hover:underline">← Marketplace</Link><h1 className="mt-5 text-3xl font-extrabold text-dark">Minhas compras</h1>{error&&<p role="alert" className="mt-5 text-sm text-red-600">{error}</p>}{items.length===0?<p className="mt-8 rounded-xl border border-border bg-white p-6 text-sm text-muted">Nenhum material comprado ainda.</p>:<div className="mt-7 space-y-3">{items.map(item=><article key={item.id} className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-dark">{item.title}</h2><p className="mt-1 text-xs text-muted">{item.delivery_type==="FILE"?(item.original_file_name??"Arquivo digital"):"Google Slides"} • Compra em {new Date(item.paid_at).toLocaleDateString("pt-BR")}</p></div>{item.delivery_type==="EXTERNAL_URL"&&item.external_url?<a href={item.external_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Criar minha cópia</a>:<button type="button" onClick={()=>void download(item.id)} className="min-h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Baixar original</button>}</article>)}</div>}</section><FaqSection title="Dúvidas sobre suas compras" description="Veja como acessar arquivos adquiridos e criar cópias de materiais do Google Slides." items={marketplaceFaq}/><PublicFooter/><PublicFooter/></main>;
}
