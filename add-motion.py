# Run once from the natalia-site folder: python3 add-motion.py
import glob
tag='<link rel="stylesheet" href="css/motion.css">\n<script>document.documentElement.classList.add("js")</script>\n<script src="js/motion.js" defer></script>\n'
for f in glob.glob("*.html"):
    s=open(f,encoding="utf-8").read()
    if "motion.js" in s or "css/style.css" not in s: continue
    i=s.index("</head>");open(f,"w",encoding="utf-8").write(s[:i]+tag+s[i:]);print("added to",f)