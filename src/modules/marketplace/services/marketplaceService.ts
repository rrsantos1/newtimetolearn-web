import api from "@/lib/api";
import type {MarketplaceCheckoutResponse,MarketplaceDetailResponse,MarketplaceListResponse} from "../types/marketplace.types";
export const marketplaceService={
 async list(params:{q?:string;category?:string;page?:number;limit?:number}={}){
  const response=await api.get<MarketplaceListResponse>("/marketplace",{params});
  return response.data.data;
 },
 async detail(slug:string){
  const response=await api.get<MarketplaceDetailResponse>(`/marketplace/${encodeURIComponent(slug)}`);
  return response.data.data;
 },
 async checkout(input:{slug:string;email:string}){
  const response=await api.post<MarketplaceCheckoutResponse>("/marketplace/checkout",input);
  return response.data.data;
 },
 previewUrl(slug:string,page:number){
  const base=process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/,"")??"";
  return `${base}/marketplace/${encodeURIComponent(slug)}/preview/${page}`;
 },
};
