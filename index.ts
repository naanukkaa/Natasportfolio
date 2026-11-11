import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Content-Type":"application/json"};
const out=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:cors});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:req.headers.get("Authorization")??""}}});
 const {data:ok}=await sb.rpc("is_admin");
 if(!ok)return out({error:"forbidden"},403);
 const {texts,source,target}=await req.json();
 if(!Array.isArray(texts)||!["ka","en"].includes(source)||!["ka","en"].includes(target))return out({error:"bad request"},400);
 const r=await fetch(`https://translation.googleapis.com/language/translate/v2?key=${Deno.env.get("GOOGLE_TRANSLATE_KEY")}`,
  {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({q:texts,source,target,format:"text"})});
 if(!r.ok)return out({error:"translation failed"},502);
 const j=await r.json();
 return out({translations:j.data.translations.map((t:any)=>t.translatedText)});
});
