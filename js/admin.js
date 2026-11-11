const sb=supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY);
const $=s=>document.querySelector(s),esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const CFGS={news:{tx:["title","description","content"],label:"News"},projects:{tx:["title","description"],label:"Projects"}};
let cur=null;
if($("#lf"))$("#lf").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);
 const {error}=await sb.auth.signInWithPassword({email:f.get("e"),password:f.get("p")});
 if(error){$("#m").textContent=error.message;return}
  const ok=(await sb.rpc("is_admin")).data;
  if(!ok){await sb.auth.signOut();$("#m").textContent="Login works, but this account is not in the admins table.";return}
  location.href="dashboard.html"};
if($("#app"))(async()=>{const {data:{session}}=await sb.auth.getSession();
 const ok=session&&(await sb.rpc("is_admin")).data;
 if(!ok){await sb.auth.signOut();location.href="login.html";return}
 $("#app").hidden=false;$("#out").onclick=async()=>{await sb.auth.signOut();location.href="login.html"};
 document.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>show(b.dataset.v));show("home")})();
function show(v){document.querySelectorAll("[data-v]").forEach(b=>b.classList.toggle("on",b.dataset.v===v));
 if(v==="home")home();else if(v==="gallery")gallery();else listView(v)}
async function cnt(t,f){let q=sb.from(t).select("*",{count:"exact",head:true});if(f)q=q.eq(...f);return (await q).count??0}
async function home(){const [n,p,s,r]=await Promise.all([cnt("news"),cnt("projects"),cnt("news",["category","stem"]),cnt("news",["category","robotics"])]);
 $("#app").innerHTML=`<div class="stats2"><div><b>${n}</b>News posts</div><div><b>${p}</b>Projects</div><div><b>${s}</b>STEM posts</div><div><b>${r}</b>Robotics posts</div></div><button class="btn2" style="background:var(--navy)" onclick="openForm('news')">+ New news post</button> <button class="btn2" style="background:var(--navy)" onclick="openForm('projects')">+ New project</button>`}
async function listView(t){const {data}=await sb.from(t).select("*").order("created_at",{ascending:false});
 $("#app").innerHTML=`<p><button class="btn2" style="background:var(--navy)" onclick="openForm('${t}')">+ New</button></p>`+(data||[]).map(r=>`<div class="row"><span>${esc(r.title_ka||r.title_en)} <small>(${r.category}${r.status?", "+r.status:""})</small></span><button onclick='openForm("${t}","${r.id}")'>Edit</button><button onclick='del("${t}","${r.id}")'>Delete</button></div>`).join("")||"<p>Nothing yet.</p>"}
async function del(t,id){if(!confirm("Delete permanently?"))return;await sb.from(t).delete().eq("id",id);listView(t)}
async function up(file,dir){if(!file.type.startsWith("image/"))throw new Error("Images only");
 const p=`${dir}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g,"_")}`;
 const {error}=await sb.storage.from("media").upload(p,file);if(error)throw error;return sb.storage.from("media").getPublicUrl(p).data.publicUrl}
async function openForm(t,id){const c=CFGS[t];let r={};
 if(id)r=(await sb.from(t).select("*").eq("id",id).single()).data;
 cur={t,id,r,edited:{ka:false,en:false}};
 const tl={title:"Title",description:"Short description",content:"Full text"};
 $("#app").innerHTML=`<form class="f" id="ef"><h2>${id?"Edit":"New"} ${c.label}</h2><div id="msg" class="msg" hidden role="alert"></div>
 <p>Write in either language, then press the translate button. You can correct both versions before saving.</p>
 ${c.tx.map(k=>`<div class="cols"><label>${tl[k]} (ქართული)<${k==="title"?"input":"textarea rows=4"} name="${k}_ka" value="${esc(r[k+"_ka"])}">${k==="title"?"":esc(r[k+"_ka"])}${k==="title"?"":"</textarea>"}</label>
 <label>${tl[k]} (English)<${k==="title"?"input":"textarea rows=4"} name="${k}_en" value="${esc(r[k+"_en"])}">${k==="title"?"":esc(r[k+"_en"])}${k==="title"?"":"</textarea>"}</label></div>`).join("")}
 <div class="cols"><button type="button" onclick="tr('ka','en')">Georgian → fill English</button><button type="button" onclick="tr('en','ka')">English → fill Georgian</button></div>
 <label>Club<select name="category"><option value="stem">STEM</option><option value="robotics">Robotics</option><option value="general">General</option></select></label>
 ${t==="news"?`<label>Status<select name="status"><option value="draft">Draft</option><option value="published">Published</option></select></label>
 <label>Date<input type="datetime-local" name="published_at"></label><label>Location (optional)<input name="location" value="${esc(r.location)}"></label>`
 :`<label>Year<input type="number" name="year" value="${esc(r.year)}"></label><label><span><input type="checkbox" name="featured" ${r.featured?"checked":""}> Featured</span></label>`}
 <label>Main image<input type="file" name="main" accept="image/*"></label><label>More images<input type="file" name="more" accept="image/*" multiple></label>
 <button class="pri">Save</button></form>`;
 const f=$("#ef");f.category.value=r.category||"general";if(f.status)f.status.value=r.status||"draft";
 if(f.published_at)f.published_at.value=(r.published_at||new Date().toISOString()).slice(0,16);
 f.addEventListener("input",e=>{const m=(e.target.name||"").match(/_(ka|en)$/);if(m)cur.edited[m[1]]=true});
 f.onsubmit=save}
const note=(m)=>{const b=$("#msg");b.hidden=false;b.textContent=m;b.scrollIntoView()};
async function tr(from,to){const f=$("#ef"),keys=CFGS[cur.t].tx.filter(k=>f[k+"_"+from].value.trim());
 if(!keys.length)return note("Write something in the source language first.");
 const clash=keys.filter(k=>f[k+"_"+to].value.trim());
 if(clash.length&&!confirm("This will overwrite the existing "+(to==="ka"?"Georgian":"English")+" text. Continue?"))return;
 const {data,error}=await sb.functions.invoke("translate",{body:{texts:keys.map(k=>f[k+"_"+from].value),source:from,target:to}});
 if(error||!data?.translations)return note("Translation failed. Your text is not lost: save it as a draft and try again later.");
 keys.forEach((k,i)=>f[k+"_"+to].value=data.translations[i]);cur.orig=from;cur.edited[to]=false;note("Translated. Please check the "+(to==="ka"?"Georgian":"English")+" text before publishing.")}
async function save(e){e.preventDefault();const f=e.target,t=cur.t,c=CFGS[t],d={};
 c.tx.forEach(k=>{d[k+"_ka"]=f[k+"_ka"].value.trim()||null;d[k+"_en"]=f[k+"_en"].value.trim()||null});
 d.original_lang=cur.orig||(d.title_ka?"ka":"en");d.category=f.category.value;
 if(t==="news"){d.status=f.status.value;d.published_at=new Date(f.published_at.value).toISOString();d.location=f.location.value||null;d.ka_edited=cur.edited.ka;d.en_edited=cur.edited.en;
  if(d.status==="published"&&(!d.title_ka||!d.title_en))return note("To publish, both Georgian and English titles are needed. Press a translate button, or save as draft.")}
 else{d.year=f.year.value?+f.year.value:null;d.featured=f.featured.checked}
 d.updated_at=new Date().toISOString();
 try{if(f.main.files[0])d.main_image=await up(f.main.files[0],t);
  const more=[...f.more.files];const urls=[];for(const m of more)urls.push(await up(m,t));
  if(t==="news"&&urls.length)d.gallery=[...(cur.r.gallery||[]),...urls];
  let id=cur.id,res;if(id)res=await sb.from(t).update(d).eq("id",id);else{res=await sb.from(t).insert(d).select().single();id=res.data?.id}
  if(res.error)throw res.error;
  if(t==="projects"&&urls.length)await sb.from("project_images").insert(urls.map((u,i)=>({project_id:id,image_url:u,sort_order:i})));
  listView(t)}catch(x){note("Could not save: "+x.message)}}
async function gallery(){const {data}=await sb.from("gallery").select("*").order("created_at",{ascending:false});
 $("#app").innerHTML=`<form class="f" id="gf"><h2>Gallery</h2><div id="msg" class="msg" hidden></div><label>Photos<input type="file" name="p" accept="image/*" multiple required></label>
 <label>Caption (any language, optional)<input name="cap"></label><label>Club<select name="c"><option value="stem">STEM</option><option value="robotics">Robotics</option><option value="general">General</option></select></label><button class="pri">Upload</button></form><br>`+
 (data||[]).map(g=>`<div class="row"><img src="${esc(g.image_url)}" alt="" width="60" height="60" style="object-fit:cover"><span>${esc(g.caption_ka||g.caption_en||"")} <small>(${g.category})</small></span><button onclick='delG("${g.id}")'>Delete</button></div>`).join("");
 $("#gf").onsubmit=async e=>{e.preventDefault();const f=e.target;try{for(const p of f.p.files)await sb.from("gallery").insert({image_url:await up(p,"gallery"),caption_ka:f.cap.value||null,category:f.c.value});gallery()}catch(x){note("Upload failed: "+x.message)}}}
async function delG(id){if(confirm("Delete photo?")){await sb.from("gallery").delete().eq("id",id);gallery()}}
