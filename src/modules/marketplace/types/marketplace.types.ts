export interface MarketplaceProduct {
 id:string;slug:string;title:string;description:string;category:string;price_cents:number;currency:string;author_name:string;preview_pages:number;cover_key:string|null;delivery_type:"FILE"|"EXTERNAL_URL";
}
export interface MarketplaceListResponse {success:true;data:{items:MarketplaceProduct[];total:number;page:number;limit:number;pages:number};}
export interface MarketplaceDetailResponse {success:true;data:MarketplaceProduct&{previews:Array<{pageNumber:number}>};}
export interface MarketplaceCheckoutResponse {success:true;data:{orderId:string;checkoutUrl:string};}
