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
 async createProduct(input:{file:File;title:string;description:string;category:string;priceCents:number}){\n  const response=await api.post("/marketplace/products",input.file,{headers:{"Content-Type":input.file.type,"x-file-name":encodeURIComponent(input.file.name),"x-marketplace-title":input.title,"x-marketplace-description":input.description,"x-marketplace-category":input.category,"x-marketplace-price-cents":String(input.priceCents)}});\n  return response.data.data as {id:string;status:string};\n },\n async purchases(){const response=await api.get<{success:true;data:Array<{id:string;title:string;original_file_name:string;paid_at:string}>}>("/marketplace/me/purchases");return response.data.data;},\n async download(orderId:string){const response=await api.get<{success:true;data:{downloadUrl:string}}>("/marketplace/me/orders/"+encodeURIComponent(orderId)+"/download");return response.data.data.downloadUrl;},\n async checkout(input:{slug:string;email:string}){
  const response=await api.post<MarketplaceCheckoutResponse>("/marketplace/checkout",input);
  return response.data.data;
 },
 previewUrl(slug:string,page:number){
  const base=process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/,"")??"";
  return `${base}/marketplace/${encodeURIComponent(slug)}/preview/${page}`;
 },
};
