
// ========================================
// TRANSLATIONS
// ========================================

const T = {
    ka: {
        home: "მთავარი",
        stem: "STEM კლუბი",
        rob: "რობოტიკის კლუბი",
        proj: "პროექტები",
        news: "სიახლეები",
        contact: "კონტაქტი",

        h1a: "განათლება,",
        h1b: "ტექნოლოგიები",
        h1c: "და ინოვაცია",

        sub: "ნატალია გელიტაშვილი — ტექნოლოგიების მასწავლებელი, STEM და რობოტიკის კლუბების ხელმძღვანელი.",

        b1: "ჩემი საქმიანობა",
        b2: "პროექტები",
        photo: "აქ განთავსდება ნატალიას ფოტო (STEM მაისურით)",

        s1: "წლიანი სწავლების გამოცდილება",
        s2: "წელი ტექნოლოგიების სწავლებაში",
        s3: "მათემატიკის მასწავლებლის გამოცდილება",
        s4: "კლუბი: STEM და რობოტიკა",

        intro: "მასწავლებელი, რომელიც ტექნოლოგიებს პრაქტიკაში აქცევს",

        g79: "7–9 კლასები",
        g46: "4–6 კლასები",

        latest: "ბოლო სიახლეები",
        empty: "სიახლეები ჯერ არ არის გამოქვეყნებული.",
        emptyProjects: "პროექტები ჯერ არ არის გამოქვეყნებული.",

        pd: "STEM და რობოტიკის პროფესიული განვითარება",

        pdt: "ნატალია მონაწილეობდა განათლების, მეცნიერებისა და ახალგაზრდობის სამინისტროს მიერ ორგანიზებულ STEM და რობოტიკის ბანაკებში. შერჩევა კონკურენტული იყო (რიცხვები მიახლოებითია).",

        tr: "პროგრამის მონაწილე; არ არის სამინისტროს, კომაროვის ან საქართველოს ბანკის თანამშრომელი.",

        rights: "© ნატალია გელიტაშვილი",

        sent: "შეტყობინება წარმატებით გაიგზავნა.",
        error: "შეცდომა. გთხოვთ, სცადოთ თავიდან.",
        notConfigured: "სერვისი ჯერ არ არის გამართული."
    },

    en: {
        home: "Home",
        stem: "STEM Club",
        rob: "Robotics Club",
        proj: "Projects",
        news: "News",
        contact: "Contact",

        h1a: "Education,",
        h1b: "Technology",
        h1c: "& Innovation",

        sub: "Natalia Gelitashvili — Technology Teacher, STEM and Robotics Club Mentor.",

        b1: "Explore My Work",
        b2: "View Projects",
        photo: "Natalia's photo (in her STEM shirt) goes here",

        s1: "years of teaching experience",
        s2: "years teaching technology",
        s3: "background teaching mathematics",
        s4: "clubs: STEM and Robotics",

        intro: "A teacher who turns technology into hands-on practice",

        g79: "Grades 7–9",
        g46: "Grades 4–6",

        latest: "Latest news",
        empty: "No news published yet.",
        emptyProjects: "No projects published yet.",

        pd: "STEM & Robotics professional development",

        pdt: "Natalia took part in the STEM and Robotics Camps organized by the Ministry of Education, Science and Youth of Georgia. Selection was competitive (numbers are approximate).",

        tr: "A participant in the program; not employed by the Ministry, Komarovi or Bank of Georgia.",

        rights: "© Natalia Gelitashvili",

        sent: "Your message was sent successfully.",
        error: "An error occurred. Please try again.",
        notConfigured: "The service is not configured yet."
    }
};


// ========================================
// LANGUAGE SETTINGS
// ========================================

let lang = localStorage.getItem("lang") || "ka";

const languageButton = document.querySelector(".lang");

function apply() {
    document.documentElement.lang = lang;

    // Elements using translation keys
    document.querySelectorAll("[data-i]").forEach(element => {
        const key = element.dataset.i;

        if (T[lang][key] !== undefined) {
            element.textContent = T[lang][key];
        }
    });

    // Elements with manually provided translations
    document.querySelectorAll("[data-en]").forEach(element => {
        if (element.dataset.ka === undefined) {
            element.dataset.ka = element.textContent;
        }

        element.textContent =
            lang === "en"
                ? element.dataset.en
                : element.dataset.ka;
    });

    if (languageButton) {
        languageButton.textContent = lang === "ka" ? "EN" : "ქართ";
    }

    loadNews();
    loadProjects();
    loadArticle();
}

if (languageButton) {
    languageButton.addEventListener("click", () => {
        lang = lang === "ka" ? "en" : "ka";

        localStorage.setItem("lang", lang);

        apply();
    });
}


// ========================================
// HTML ESCAPING
// ========================================

const esc = value => {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
};


// ========================================
// HEADER AND MOBILE NAVIGATION
// ========================================

const header = document.querySelector("header");
const nav = document.querySelector("nav");
const burger = document.querySelector(".burger");

window.addEventListener("scroll", () => {
    if (header) {
        header.classList.toggle("solid", window.scrollY > 40);
    }
}, { passive: true });

if (burger && nav) {
    burger.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("open");

        burger.setAttribute("aria-expanded", isOpen);
    });

    nav.addEventListener("click", event => {
        if (event.target.closest("a")) {
            nav.classList.remove("open");
            burger.setAttribute("aria-expanded", "false");
        }
    });
}


// ========================================
// SCROLL REVEAL AND COUNTERS
// ========================================

if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("in");

                entry.target.querySelectorAll("[data-n]").forEach(count);

                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2
    });

    document.querySelectorAll(".reveal").forEach(element => {
        observer.observe(element);
    });
}

function count(element) {
    const target = Number(element.dataset.n);

    if (!Number.isFinite(target) || target <= 0) return;

    let current = 0;

    const timer = setInterval(() => {
        current++;

        element.textContent = current;

        if (current >= target) {
            clearInterval(timer);
        }
    }, 80);
}


// ========================================
// SUPABASE CONNECTION
// ========================================

function getConfig() {
    return window.CFG || {};
}

async function query(table, filters = "") {
    const config = getConfig();

    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
        throw new Error("Supabase is not configured.");
    }

    const response = await fetch(
        `${config.SUPABASE_URL}/rest/v1/${table}?${filters}`,
        {
            headers: {
                apikey: config.SUPABASE_ANON_KEY
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Supabase error: ${response.status}`);
    }

    return response.json();
}


// ========================================
// DATE FORMATTING
// ========================================

function formatDate(date) {
    if (!date) return "";

    return new Date(date).toLocaleDateString(
        lang === "ka" ? "ka-GE" : "en-GB"
    );
}


// ========================================
// NEWS AND PROJECT CARDS
// ========================================

function createCard(item, url) {
    const title = item[`title_${lang}`] || "";
    const description = item[`description_${lang}`] || "";

    const date = item.published_at
        ? formatDate(item.published_at)
        : (item.year || "");

    const category = item.category || "";

    return `
        <a class="card" href="${url}">
            <div class="img">

                ${item.main_image
                    ? `<img loading="lazy" src="${esc(item.main_image)}" alt="">`
                    : ""
                }

                ${category
                    ? `<span class="badge ${esc(category)}">${esc(category.toUpperCase())}</span>`
                    : ""
                }

            </div>

            <div class="tx">
                <time>${esc(date)}</time>

                <h3>${esc(title)}</h3>

                <p>${esc(description)}</p>
            </div>
        </a>
    `;
}


// ========================================
// LOAD NEWS AND PROJECTS
// ========================================

async function loadList(element, table, filters, url) {
    if (!element) return;

    const isProjects = table === "projects";

    const emptyMessage = isProjects
        ? T[lang].emptyProjects
        : T[lang].empty;

    element.innerHTML = `<p class="note">${emptyMessage}</p>`;

    try {
        let queryFilters = `select=*${filters}`;

        if (element.dataset.cat) {
            queryFilters += `&category=eq.${encodeURIComponent(element.dataset.cat)}`;
        }

        queryFilters += `&limit=${Number(element.dataset.limit) || 50}`;

        const data = await query(table, queryFilters);

        if (!Array.isArray(data) || data.length === 0) {
            element.innerHTML = `<p class="note">${emptyMessage}</p>`;
            return;
        }

        element.innerHTML = data.map(item => {
            return createCard(item, `${url}${encodeURIComponent(item.id)}`);
        }).join("");

    } catch (error) {
        console.error(error);

        element.innerHTML = `<p class="note">${emptyMessage}</p>`;
    }
}

function loadNews() {
    const box = document.getElementById("news");

    return loadList(
        box,
        "news",
        "&status=eq.published&order=published_at.desc",
        "news-detail.html?id="
    );
}

function loadProjects() {
    const box = document.getElementById("projects");

    return loadList(
        box,
        "projects",
        "&order=created_at.desc",
        "project.html?id="
    );
}


// ========================================
// INDIVIDUAL NEWS ARTICLE
// ========================================

async function loadArticle() {
    const box = document.getElementById("article");

    if (!box) return;

    const id = new URLSearchParams(window.location.search).get("id");

    if (!id) {
        box.innerHTML = `<p class="note">404</p>`;
        return;
    }

    box.innerHTML = `<p class="note">${T[lang].empty}</p>`;

    try {
        const data = await query(
            "news",
            `id=eq.${encodeURIComponent(id)}&status=eq.published&select=*`
        );

        const article = data[0];

        if (!article) {
            box.innerHTML = `<p class="note">404</p>`;
            return;
        }

        const title = article[`title_${lang}`] || "";
        const content =
            article[`content_${lang}`] ||
            article[`description_${lang}`] ||
            "";

        const category = article.category || "";

        box.innerHTML = `
            <time>${esc(formatDate(article.published_at))}</time>

            ${category
                ? `<span class="badge ${esc(category)}" style="position:static;display:inline-block">
                    ${esc(category.toUpperCase())}
                </span>`
                : ""
            }

            <h2>${esc(title)}</h2>

            ${article.main_image
                ? `<img src="${esc(article.main_image)}" alt="">`
                : ""
            }

            <p>${esc(content).replace(/\n/g, "<br>")}</p>

            ${(Array.isArray(article.gallery) ? article.gallery : [])
                .map(image => `
                    <img loading="lazy" src="${esc(image)}" alt="">
                `)
                .join("")
            }
        `;

    } catch (error) {
        console.error(error);

        box.innerHTML = `<p class="note">${T[lang].empty}</p>`;
    }
}


// ========================================
// NEWS AND PROJECT FILTERS
// ========================================

document.querySelectorAll(".filters").forEach(filterGroup => {
    filterGroup.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", () => {

            filterGroup.querySelectorAll("button").forEach(item => {
                item.classList.toggle("on", item === button);
            });

            const target = document.getElementById("news") ||
                           document.getElementById("projects");

            if (!target) return;

            if (button.dataset.f) {
                target.dataset.cat = button.dataset.f;
            } else {
                delete target.dataset.cat;
            }

            if (target.id === "news") {
                loadNews();
            } else {
                loadProjects();
            }
        });
    });
});


// ========================================
// CONTACT FORM
// ========================================

const contactForm = document.getElementById("cf");

if (contactForm) {
    contactForm.addEventListener("submit", async event => {
        event.preventDefault();

        const status = document.getElementById("st");
        const config = getConfig();

        const formData = Object.fromEntries(
            new FormData(contactForm)
        );

        if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
            status.textContent = T[lang].notConfigured;
            return;
        }

        status.textContent = "";

        try {
            const response = await fetch(
                `${config.SUPABASE_URL}/rest/v1/messages`,
                {
                    method: "POST",

                    headers: {
                        apikey: config.SUPABASE_ANON_KEY,
                        "Content-Type": "application/json",
                        Prefer: "return=minimal"
                    },

                    body: JSON.stringify({
                        name: formData.name,
                        email: formData.email,
                        subject: formData.subject,
                        body: formData.body
                    })
                }
            );

            if (!response.ok) {
                throw new Error("Message could not be sent.");
            }

            status.textContent = T[lang].sent;

            contactForm.reset();

        } catch (error) {
            console.error(error);

            status.textContent = T[lang].error;
        }
    });
}


// ========================================
// INITIALIZE WEBSITE
// ========================================

apply();
