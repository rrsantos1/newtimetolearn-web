import {useEffect,useState} from "react";
import {Formik,Form,Field,ErrorMessage,type FormikHelpers} from "formik";
import * as Yup from "yup";
import Link from "next/link";
import {useRouter} from "next/router";
import {PublicHeader} from "@/components/layout/PublicHeader";
import {PublicFooter} from "@/components/layout/PublicFooter";
import {useAuth} from "@/modules/auth/contexts/AuthContext";
import {marketplaceService} from "@/modules/marketplace/services/marketplaceService";
import {teacherSubscriptionService} from "@/modules/subscriptions/services/teacherSubscriptionService";
interface Values{title:string;description:string;category:string;price:string;file:File|null;}
const schema=Yup.object({
 title:Yup.string().trim().min(3,"Informe pelo menos 3 caracteres.").max(180).required("Informe o título."),
 description:Yup.string().trim().min(10,"Descreva melhor o material.").max(1000).required("Informe a descrição."),
 category:Yup.string().required("Selecione uma categoria."),
 price:Yup.number().typeError("Informe um valor válido.").min(1,"O valor mínimo é R$ 1,00.").max(10000).required("Informe o preço."),
 file:Yup.mixed<File>().required("Selecione um arquivo PDF, PPT ou PPTX."),
});
export function MarketplaceProductFormPage({adminMode=false}:{adminMode?:boolean}){
 const router=useRouter();const {user,isAuthenticated,isLoading}=useAuth();
 const [subscriptionState,setSubscriptionState]=useState<"checking"|"active"|"inactive"|"error">(adminMode?"active":"checking");
 useEffect(()=>{if(!isLoading&&(!isAuthenticated||!(adminMode?user?.roles.includes("ADMIN"):user?.roles.includes("TEACHER"))))void router.replace("/login");},[adminMode,isAuthenticated,isLoading,router,user]);
 useEffect(()=>{if(adminMode||isLoading||!isAuthenticated||!user?.roles.includes("TEACHER"))return;let active=true;teacherSubscriptionService.getEntitlements().then(data=>{if(active)setSubscriptionState(data.subscriptionStatus==="ACTIVE"&&data.planCode==="TEACHER_MONTHLY"?"active":"inactive");}).catch(()=>{if(active)setSubscriptionState("error");});return()=>{active=false;};},[adminMode,isAuthenticated,isLoading,user]);
 async function submit(values:Values,helpers:FormikHelpers<Values>){
  if(!values.file){helpers.setFieldError("file","Selecione um arquivo.");helpers.setSubmitting(false);return;}
  try{
   await marketplaceService.createProduct({file:values.file,title:values.title,description:values.description,category:values.category,priceCents:Math.round(Number(values.price)*100)},adminMode?"admin":"teacher");
   const successMessage=adminMode?"Material publicado com sucesso no Marketplace.":"Material enviado para análise administrativa. Ele será publicado após aprovação.";
   helpers.resetForm({values:{title:"",description:"",category:"Apresentação",price:"",file:null},status:successMessage});
  }
  catch{helpers.setStatus("Não foi possível enviar o material. Verifique o arquivo e tente novamente.");}
  finally{helpers.setSubmitting(false);}
 }
 if(isLoading||!isAuthenticated)return <main className="min-h-screen bg-background"><PublicHeader/><p className="mx-auto max-w-3xl px-5 py-16 text-sm text-muted">Verificando acesso...</p><PublicFooter/></main>;
 if(!adminMode&&subscriptionState!=="active")return <main className="min-h-screen bg-background"><PublicHeader/><section className="mx-auto max-w-3xl px-5 py-12 sm:px-8"><h1 className="text-2xl font-extrabold text-dark">Publicação no Marketplace</h1><p role={subscriptionState==="error"?"alert":"status"} className="mt-4 rounded-xl border border-border bg-white p-5 text-sm text-muted">{subscriptionState==="checking"?"Verificando sua assinatura...":subscriptionState==="error"?"Não foi possível verificar sua assinatura. Atualize a página e tente novamente.":"A publicação de materiais para venda está disponível para professores com assinatura ativa."}</p>{subscriptionState==="inactive"&&<Link href="/teacher/subscription" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white" style={{ color: "var(--primary-foreground)" }}>Consultar assinatura</Link>}</section><PublicFooter/></main>;
 return <main className="min-h-screen bg-background"><PublicHeader/><section className="mx-auto max-w-3xl px-5 py-10 sm:px-8"><Link href={adminMode?"/admin/marketplace":"/marketplace"} className="text-sm font-semibold text-primary hover:underline">← {adminMode?"Administração do Marketplace":"Marketplace"}</Link><h1 className="mt-5 text-3xl font-extrabold text-dark">{adminMode?"Publicar material no Marketplace":"Disponibilizar material"}</h1><p className="mt-2 text-sm leading-6 text-muted">{adminMode?"Materiais cadastrados pela administração são publicados imediatamente.":"Envie uma apresentação ou documento. Após a análise administrativa, o material será publicado."} O TimeToLearn irá gerar automaticamente uma prévia de todas as páginas, protegida por marca d’água.</p><Formik<Values>initialValues={{title:"",description:"",category:"Apresentação",price:"",file:null}} validationSchema={schema} onSubmit={submit}>{({isSubmitting,status,setFieldValue})=><Form className="mt-8 space-y-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
 <div><label htmlFor="title" className="block text-sm font-semibold text-dark">Título</label><Field id="title" name="title" className="mt-2 min-h-11 w-full rounded-lg border border-border px-3 text-sm focus-visible:outline-2 focus-visible:outline-focus-ring"/><ErrorMessage name="title" component="p" className="mt-1 text-xs text-red-600"/></div>
 <div><label htmlFor="description" className="block text-sm font-semibold text-dark">Descrição</label><Field as="textarea" id="description" name="description" rows={4} className="mt-2 w-full rounded-lg border border-border p-3 text-sm focus-visible:outline-2 focus-visible:outline-focus-ring"/><ErrorMessage name="description" component="p" className="mt-1 text-xs text-red-600"/></div>
 <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="category" className="block text-sm font-semibold text-dark">Categoria</label><Field as="select" id="category" name="category" className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3 text-sm"><option>Apresentação</option><option>Plano de aula</option><option>Atividade</option><option>Material complementar</option></Field><ErrorMessage name="category" component="p" className="mt-1 text-xs text-red-600"/></div><div><label htmlFor="price" className="block text-sm font-semibold text-dark">Preço (R$)</label><Field id="price" name="price" type="number" min="1" step="0.01" placeholder="19,90" className="mt-2 min-h-11 w-full rounded-lg border border-border px-3 text-sm"/><ErrorMessage name="price" component="p" className="mt-1 text-xs text-red-600"/></div></div>
 <div><label htmlFor="file" className="block text-sm font-semibold text-dark">Arquivo original</label><input id="file" name="file" type="file" accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={event=>setFieldValue("file",event.currentTarget.files?.[0]??null)} className="mt-2 block min-h-11 w-full rounded-lg border border-border bg-white p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2"/><p className="mt-1 text-xs text-muted">PDF, PPT ou PPTX • máximo de 40 MB • até 120 páginas.</p><ErrorMessage name="file" component="p" className="mt-1 text-xs text-red-600"/></div>
 {typeof status==="string"&&<p role={status.startsWith("Não foi possível")?"alert":"status"} className={`rounded-lg p-3 text-sm ${status.startsWith("Não foi possível")?"border border-red-200 bg-red-50 text-red-700":"border border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{status}</p>}
 <button type="submit" disabled={isSubmitting} className="min-h-12 w-full rounded-xl bg-accent px-5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">{isSubmitting?"Processando apresentação...":adminMode?"Publicar material":"Enviar para aprovação"}</button>
 </Form>}</Formik></section><PublicFooter/></main>;
}
