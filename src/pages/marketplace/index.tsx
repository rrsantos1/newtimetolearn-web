import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import {useEffect,useState} from "react";
import {PublicHeader} from "@/components/layout/PublicHeader";
import {PublicFooter} from "@/components/layout/PublicFooter";
import {useAuth} from "@/modules/auth/contexts/AuthContext";
import {marketplaceService} from "@/modules/marketplace/services/marketplaceService";
import type {MarketplaceProduct} from "@/modules/marketplace/types/marketplace.types";
type MarketplaceListState={query:string;items:MarketplaceProduct[];error:string;};
export default function MarketplacePage(){
 const {isAuthenticated}=useAuth();
 const [query,setQuery]=useState("");
 const [listState,setListState]=useState<MarketplaceListState|null>(null);
 const loading=listState?.query!==query;
 const items=listState?.query===query?listState.items:[];
 const error=listState?.query===query?listState.error:"";
 useEffect(()=>{let active=true;const loadItems=async():Promise<void>=>{try{const result=await marketplaceService.list({q:query,page:1,limit:24});if(active)setListState({query,items:result.items,error:""});}catch{if(active)setListState({query,items:[],error:"Não foi possível carregar os materiais."});}};void loadItems();return()=>{active=false;};},[query]);
 return <main className="min-h-screen bg-background"><Head><title>Marketplace | TimeToLearn</title><meta name="description" content="Apresentações e materiais didáticos para suas aulas." /></Head><PublicHeader/><section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Materiais didáticos</p><h1 className="mt-2 text-3xl font-extrabold text-dark sm:text-4xl">Marketplace</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Apresentações e recursos preparados por professores. Confira todas as páginas antes de adquirir.</p></div><div className="flex flex-wrap gap-4 text-sm font-semibold"><Link href="/marketplace/purchases" className="text-primary hover:underline">Minhas compras</Link><Link href="/teacher/marketplace/new" className="text-primary hover:underline">Vender material</Link><Link href={isAuthenticated ? "/dashboard" : "/"} className="text-primary hover:underline">Voltar ao início</Link></div></div>
 <label htmlFor="marketplace-search" className="mt-8 block text-sm font-semibold text-dark">Buscar materiais</label><input id="marketplace-search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Digite um título ou assunto" className="mt-2 min-h-12 w-full max-w-xl rounded-xl border border-border bg-white px-4 text-sm text-dark outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"/>
 {loading?<p className="mt-10 text-sm text-muted">Carregando materiais...</p>:error?<p role="alert" className="mt-10 text-sm text-red-600">{error}</p>:items.length===0?<p className="mt-10 rounded-2xl border border-border bg-white p-8 text-sm text-muted">Ainda não há materiais publicados nesta categoria.</p>:<div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map(item=><article key={item.id} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"><div className="relative flex aspect-16/10 items-center justify-center bg-slate-100">{item.preview_pages>0?<Image src={marketplaceService.coverUrl(item.slug)} alt={`Capa do material ${item.title}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" unoptimized={marketplaceService.shouldBypassImageOptimization()} className="object-contain p-2"/>:<span className="rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-dark">{item.delivery_type==="EXTERNAL_URL"?"Google Slides • Cópia digital":"Prévia indisponível"}</span>}</div><div className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-accent">{item.category}</p><h2 className="mt-2 text-lg font-bold text-dark">{item.title}</h2><p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{item.description}</p><p className="mt-3 text-xs text-muted">Por {item.author_name}</p><div className="mt-5 flex items-center justify-between gap-3"><strong className="text-lg text-dark">{(item.price_cents/100).toLocaleString("pt-BR",{style:"currency",currency:item.currency})}</strong><Link href={`/marketplace/${encodeURIComponent(item.slug)}`} className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Ver material</Link></div></div></article>)}</div>}
 </section><PublicFooter/></main>;
}
