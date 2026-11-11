(()=>{const d=document,h=d.documentElement,rm=matchMedia("(prefers-reduced-motion:reduce)").matches,mob=matchMedia("(max-width:860px)").matches;
const seen=sessionStorage.getItem("seen");
const pt=d.createElement("div");pt.className="pt";h.appendChild(pt);
const pr=d.createElement("div");pr.className="prog";h.appendChild(pr);
let ld;
if(!seen&&!rm){ld=d.createElement("div");ld.className="ld";ld.innerHTML='<span class="ld-n">000</span><i class="ld-l"></i>';h.appendChild(ld)}
else if(seen&&!rm)h.classList.add("pt-in");
h.classList.add("go");
function ready(){h.classList.remove("pt-in","pt-out");h.classList.add("ready");sessionStorage.setItem("seen","1")}
function boot(){if(!ld){setTimeout(ready,seen?120:0);return}
 const n=ld.querySelector(".ld-n"),l=ld.querySelector(".ld-l"),t0=performance.now();let loaded=d.readyState==="complete";
 addEventListener("load",()=>loaded=true);
 (function tick(t){const p=Math.min((t-t0)/1100,1),v=Math.round(p*100);n.textContent=String(v).padStart(3,"0");l.style.transform=`scaleX(${p})`;
  if(p<1||!loaded)return requestAnimationFrame(tick);
  setTimeout(()=>{ld.classList.add("out");setTimeout(ready,350);setTimeout(()=>ld.remove(),1000)},250)})(t0)}
boot();
/* page transitions */
d.addEventListener("click",e=>{const a=e.target.closest("a[href]");
 if(!a||rm||e.metaKey||e.ctrlKey||e.shiftKey||a.target||a.hasAttribute("download"))return;
 const u=new URL(a.href,location);if(u.origin!==location.origin||u.pathname===location.pathname||!/\.html$|\/$/.test(u.pathname))return;
 e.preventDefault();h.classList.add("pt-out");setTimeout(()=>location.href=a.href,550)});
addEventListener("pageshow",e=>{if(e.persisted)h.classList.remove("pt-out")});
/* scroll progress + parallax */
const ph=d.querySelector(".hero .photo img");let tick=false;
addEventListener("scroll",()=>{if(tick)return;tick=true;requestAnimationFrame(()=>{tick=false;
 pr.style.transform=`scaleX(${scrollY/Math.max(1,h.scrollHeight-innerHeight)})`;
 if(ph&&!mob&&!rm&&scrollY<innerHeight)ph.style.transform=`scale(1.12) translateY(${scrollY*.06}px)`})},{passive:true});
/* hero extras */
const hero=d.querySelector(".hero");
if(hero&&!mob){const hx=d.createElement("div");hx.className="hx";
 hx.innerHTML='<i style="left:4vw;top:104px"></i><i style="right:4vw;bottom:70px"></i><i style="left:50%;top:104px"></i><b>X 0000 · Y 0000</b>';hero.appendChild(hx);
 const b=hx.querySelector("b");
 hero.addEventListener("pointermove",e=>{const r=hero.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
  hero.style.setProperty("--mx",x+"px");hero.style.setProperty("--my",y+"px");
  b.textContent=`X ${String(Math.round(x)).padStart(4,"0")} · Y ${String(Math.round(y)).padStart(4,"0")}`})}
/* club line art */
const art={stem:'<circle cx="100" cy="100" r="70"/><polygon points="100,40 160,140 40,140"/><circle cx="100" cy="100" r="22"/><line x1="10" y1="100" x2="190" y2="100"/><line x1="100" y1="10" x2="100" y2="190"/>',
 rob:'<path d="M10 40h60l20 30h50v40"/><path d="M10 100h40l20 20h70"/><path d="M30 170h50l20-30h70"/><circle cx="70" cy="40" r="6"/><circle cx="140" cy="110" r="6"/><circle cx="190" cy="40" r="6"/><rect x="95" y="90" width="30" height="30"/>'};
d.querySelectorAll(".club").forEach(c=>{const k=c.classList.contains("stem")?"stem":"rob";
 c.insertAdjacentHTML("afterbegin",`<svg class="art" viewBox="0 0 200 200" aria-hidden="true">${art[k]}</svg>`)});
/* observers */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add(e.target.matches(".club")?"drawn":"in");io.unobserve(e.target)}}),{threshold:.25});
d.querySelectorAll(".club,.steps,.section-label").forEach(el=>io.observe(el));
})();
(()=>{const d=document,h=d.documentElement,rm=matchMedia("(prefers-reduced-motion:reduce)").matches,mob=matchMedia("(max-width:860px)").matches,fine=matchMedia("(pointer:fine)").matches;
/* split inner-page titles into words */
d.querySelectorAll(".page h1").forEach(t=>{if(t.querySelector("span,i"))return;const s=t.textContent.trim();if(!s)return;
 t.setAttribute("aria-label",s);t.innerHTML=s.split(/\s+/).map((w,i)=>`<span class="w" aria-hidden="true"><i style="--i:${i}">${w}</i></span>`).join(" ")});
/* inner-page grid glow + crosshairs */
d.querySelectorAll(".page").forEach(p=>{if(mob)return;
 p.insertAdjacentHTML("beforeend",'<div class="hx"><i style="left:4vw;top:104px"></i><i style="right:4vw;bottom:40px"></i></div>');
 p.addEventListener("pointermove",e=>{const r=p.getBoundingClientRect();p.style.setProperty("--mx",e.clientX-r.left+"px");p.style.setProperty("--my",e.clientY-r.top+"px")})});
/* auto scroll-in */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const t=e.target;t.classList.add("in");io.unobserve(t);
 if(t.classList.contains("cv"))setTimeout(()=>t.classList.remove("cv","in"),1600)}),{threshold:.12,rootMargin:"0px 0px -6% 0px"});
d.querySelectorAll("main section:not(.hero):not(.page) .wrap:not(.reveal)>*:not(.news):not(.clubs), .form>*, .contact-info>*").forEach((el,i)=>{
 el.classList.add("mv");el.style.setProperty("--i",Math.min([...el.parentNode.children].indexOf(el),6));io.observe(el)});
/* cards loaded later from Supabase */
const tagCards=root=>root.querySelectorAll(".card:not(.cv)").forEach((c,i)=>{if(c.dataset.t)return;c.dataset.t=1;c.classList.add("cv");c.style.setProperty("--i",Math.min(i,8));io.observe(c)});
d.querySelectorAll(".news").forEach(n=>{tagCards(n);new MutationObserver(()=>tagCards(n)).observe(n,{childList:true})});
/* marquee */
const hero=d.querySelector(".hero");
if(hero){const s="EDUCATION ✦ TECHNOLOGY ✦ INNOVATION ✦ STEM ✦ ROBOTICS ✦ ",m=d.createElement("div");m.className="mq";m.setAttribute("aria-hidden","true");
 m.innerHTML=`<div><span>${s.repeat(4)}</span><span>${s.repeat(4)}</span></div>`;hero.after(m)}
/* hero text drifts + fades on scroll */
const ht=d.querySelector(".hero-text");
if(ht&&!mob&&!rm)addEventListener("scroll",()=>{const p=Math.min(scrollY/innerHeight,1);ht.style.transform=`translateY(${p*120}px)`;ht.style.opacity=1-p*1.15},{passive:true});
/* cursor ring + magnetic buttons */
if(fine&&!mob&&!rm){const c=d.createElement("div");c.className="cur";h.appendChild(c);let x=0,y=0,tx=0,ty=0;
 addEventListener("pointermove",e=>{tx=e.clientX;ty=e.clientY;c.classList.add("on")});
 (function f(){x+=(tx-x)*.18;y+=(ty-y)*.18;c.style.transform=`translate(${x}px,${y}px)`;requestAnimationFrame(f)})();
 d.addEventListener("pointerover",e=>c.classList.toggle("big",!!e.target.closest("a,button,.card")));
 d.querySelectorAll(".btn").forEach(b=>{b.addEventListener("pointermove",e=>{const r=b.getBoundingClientRect();b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.2}px,${(e.clientY-r.top-r.height/2)*.35}px)`});b.addEventListener("pointerleave",()=>b.style.transform="")})}
})();
/* phone: slow scroll-linked photo drift + header hides on scroll down, returns on scroll up */
(()=>{const mob=matchMedia("(max-width:860px)").matches,rm=matchMedia("(prefers-reduced-motion:reduce)").matches;if(!mob||rm)return;
const hd=document.querySelector("header"),im=document.querySelector(".hero .photo img");let last=0,t=false;
addEventListener("scroll",()=>{if(t)return;t=true;requestAnimationFrame(()=>{t=false;const y=scrollY;
 if(hd&&!document.querySelector("nav.open")){hd.style.transform=(y>last&&y>160)?"translateY(-100%)":"none"}
 last=y;if(im&&y<innerHeight)im.style.transform=`scale(1.1) translateY(${y*.05}px)`})},{passive:true});
if(document.querySelector("header"))document.querySelector("header").style.transition="transform .4s,background .35s"})();