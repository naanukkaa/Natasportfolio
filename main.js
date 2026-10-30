const T={ka:{home:"მთავარი",about:"ჩემ შესახებ",stem:"STEM კლუბი",rob:"რობოტიკის კლუბი",proj:"პროექტები",news:"სიახლეები",contact:"კონტაქტი",
h1a:"განათლება,",h1b:"ტექნოლოგიები",h1c:"და ინოვაცია",
sub:"ნატალია გელიტაშვილი — ტექნოლოგიების მასწავლებელი, STEM და რობოტიკის კლუბების ხელმძღვანელი.",
b1:"ჩემი საქმიანობა",b2:"პროექტები",photo:"აქ განთავსდება ნატალიას ფოტო (STEM მაისურით)",
s1:"წლიანი სწავლების გამოცდილება",s2:"წელი ტექნოლოგიების სწავლებაში",s3:"მათემატიკის მასწავლებლის გამოცდილება",s4:"კლუბი: STEM და რობოტიკა",
intro:"მასწავლებელი, რომელიც ტექნოლოგიებს პრაქტიკაში აქცევს",g79:"7–9 კლასები",g46:"4–6 კლასები",
latest:"ბოლო სიახლეები",empty:"სიახლეები ჯერ არ არის გამოქვეყნებული.",
pd:"STEM და რობოტიკის პროფესიული განვითარება",
pdt:"ნატალია მონაწილეობდა განათლების, მეცნიერებისა და ახალგაზრდობის სამინისტროს მიერ ორგანიზებულ STEM და რობოტიკის ბანაკებში. შერჩევა კონკურენტული იყო (რიცხვები მიახლოებითია).",
tr:"პროგრამის მონაწილე; არ არის სამინისტროს, კომაროვის ან საქართველოს ბანკის თანამშრომელი.",rights:"© ნატალია გელიტაშვილი"},
en:{home:"Home",about:"About",stem:"STEM Club",rob:"Robotics Club",proj:"Projects",news:"News",contact:"Contact",
h1a:"Education,",h1b:"Technology",h1c:"& Innovation",
sub:"Natalia Gelitashvili — Technology Teacher, STEM and Robotics Club Mentor.",
b1:"Explore My Work",b2:"View Projects",photo:"Natalia's photo (in her STEM shirt) goes here",
s1:"years of teaching experience",s2:"years teaching technology",s3:"background teaching mathematics",s4:"clubs: STEM and Robotics",
intro:"A teacher who turns technology into hands-on practice",g79:"Grades 7–9",g46:"Grades 4–6",
latest:"Latest news",empty:"No news published yet.",
pd:"STEM & Robotics professional development",
pdt:"Natalia took part in the STEM and Robotics Camps organized by the Ministry of Education, Science and Youth of Georgia. Selection was competitive (numbers are approximate).",
tr:"A participant in the program; not employed by the Ministry, Komarovi or Bank of Georgia.",rights:"© Natalia Gelitashvili"}};
let lang=localStorage.getItem("lang")||"ka";
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function apply(){document.documentElement.lang=lang;
document.querySelectorAll("[data-i]").forEach(e=>e.textContent=T[lang][e.dataset.i]);
document.querySelector(".lang").textContent=lang==="ka"?"EN":"ქართ";loadNews()}
document.querySelector(".lang").onclick=()=>{lang=lang==="ka"?"en":"ka";localStorage.setItem("lang",lang);apply()};
const hd=document.querySelector("header"),nv=document.querySelector("nav"),bg=document.querySelector(".burger");
addEventListener("scroll",()=>hd.classList.toggle("solid",scrollY>40),{passive:true});
bg.onclick=()=>{const o=nv.classList.toggle("open");bg.setAttribute("aria-expanded",o)};
nv.onclick=e=>{if(e.target.tagName==="A")nv.classList.remove("open")};
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);
e.target.querySelectorAll("[data-n]").forEach(count)}}),{threshold:.2});
document.querySelectorAll(".reveal").forEach(e=>io.observe(e));
function count(el){const n=+el.dataset.n;let c=0;const t=setInterval(()=>{el.textContent=++c;if(c>=n)clearInterval(t)},80)}
async function loadNews(){const box=document.getElementById("news"),C=window.CFG;
const none=`<p class="note">${T[lang].empty}</p>`;
if(!C.SUPABASE_URL){box.innerHTML=none;return}
try{const r=await fetch(`${C.SUPABASE_URL}/rest/v1/news?status=eq.published&order=published_at.desc&limit=4&select=*`,{headers:{apikey:C.SUPABASE_ANON_KEY}});
const d=await r.json();
box.innerHTML=d.length?d.map(n=>`<a class="card" href="news-detail.html?id=${n.id}"><div class="img">${n.main_image?`<img loading="lazy" src="${esc(n.main_image)}" alt="">`:""}<span class="badge ${n.category}">${n.category.toUpperCase()}</span></div><div class="tx"><time>${new Date(n.published_at).toLocaleDateString(lang==="ka"?"ka-GE":"en-GB")}</time><h3>${esc(n["title_"+lang]||"")}</h3><p>${esc(n["description_"+lang]||"")}</p></div></a>`).join(""):none}
catch{box.innerHTML=none}}
apply();
