
'use strict';

/* =====================================================
   SUPABASE
===================================================== */

const sb = supabase.createClient(
    CFG.SUPABASE_URL,
    CFG.SUPABASE_ANON_KEY
);

const $ = selector => document.querySelector(selector);

let cur = null;

const CFGS = {
    news: {
        label: 'სიახლე',
        fields: ['title', 'description', 'content']
    },
    projects: {
        label: 'პროექტი',
        fields: ['title', 'description']
    }
};

const LABELS = {
    title: 'სათაური',
    description: 'მოკლე აღწერა',
    content: 'სრული ტექსტი'
};


/* =====================================================
   HELPERS
===================================================== */

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[char]));

const note = message => {
    const box = $('#msg');

    if (box) {
        box.hidden = false;
        box.textContent = message;
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        alert(message);
    }
};

const setLoading = (button, loading, original = 'შენახვა') => {
    if (!button) return;

    button.disabled = loading;
    button.textContent = loading ? 'იტვირთება...' : original;
};

async function dbCount(table, filter = null) {
    let query = sb.from(table).select('*', {
        count: 'exact',
        head: true
    });

    if (filter) {
        query = query.eq(filter[0], filter[1]);
    }

    const { count, error } = await query;

    if (error) throw error;

    return count ?? 0;
}

async function uploadImage(file, directory) {
    if (!file.type.startsWith('image/')) {
        throw new Error('შესაძლებელია მხოლოდ ფოტოების ატვირთვა.');
    }

    const path = `${directory}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '_')}`;

    const { error } = await sb.storage
        .from('media')
        .upload(path, file);

    if (error) throw error;

    const { data } = sb.storage
        .from('media')
        .getPublicUrl(path);

    return data.publicUrl;
}

function getValue(form, name) {
    return form.elements.namedItem(name);
}

function getLocalDate(value) {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '';

    const offset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - offset)
        .toISOString()
        .slice(0, 16);
}


/* =====================================================
   LOGIN
===================================================== */

if ($('#lf')) {
    $('#lf').addEventListener('submit', async e => {
        e.preventDefault();

        const form = new FormData(e.target);
        const message = $('#m');
        const button = e.target.querySelector('[type="submit"]');

        setLoading(button, true, 'შესვლა');

        try {
            const { error } = await sb.auth.signInWithPassword({
                email: form.get('e'),
                password: form.get('p')
            });

            if (error) throw error;

            const { data: isAdmin, error: adminError } =
                await sb.rpc('is_admin');

            if (adminError) throw adminError;

            if (!isAdmin) {
                await sb.auth.signOut();

                throw new Error(
                    'ეს ანგარიში ადმინისტრატორების სიაში არ არის.'
                );
            }

            location.href = 'dashboard.html';

        } catch (error) {
            if (message) {
                message.textContent = error.message;
            }
        } finally {
            setLoading(button, false, 'შესვლა');
        }
    });
}


/* =====================================================
   DASHBOARD INITIALIZATION
===================================================== */

if ($('#app')) {
    (async () => {
        try {
            const {
                data: { session },
                error
            } = await sb.auth.getSession();

            if (error) throw error;

            if (!session) {
                location.href = 'login.html';
                return;
            }

            const { data: isAdmin, error: adminError } =
                await sb.rpc('is_admin');

            if (adminError) throw adminError;

            if (!isAdmin) {
                await sb.auth.signOut();
                location.href = 'login.html';
                return;
            }

            $('#app').hidden = false;

            if ($('#out')) {
                $('#out').onclick = async () => {
                    await sb.auth.signOut();
                    location.href = 'login.html';
                };
            }

            document.querySelectorAll('[data-v]').forEach(button => {
                button.onclick = () => show(button.dataset.v);
            });

            show('home');

        } catch (error) {
            console.error(error);

            $('#app').hidden = false;
            $('#app').innerHTML = `
                <div class="msg">
                    ადმინისტრაციული პანელის ჩატვირთვა ვერ მოხერხდა:
                    ${esc(error.message)}
                </div>
            `;
        }
    })();
}


/* =====================================================
   NAVIGATION
===================================================== */

function show(view) {
    document.querySelectorAll('[data-v]').forEach(button => {
        button.classList.toggle(
            'on',
            button.dataset.v === view
        );
    });

    if (view === 'home') {
        home();
    } else if (view === 'gallery') {
        gallery();
    } else if (CFGS[view]) {
        listView(view);
    }
}


/* =====================================================
   HOME
===================================================== */

async function home() {
    $('#app').innerHTML = '<p>იტვირთება...</p>';

    try {
        const [news, projects, stem, robotics] = await Promise.all([
            dbCount('news'),
            dbCount('projects'),
            dbCount('news', ['category', 'stem']),
            dbCount('news', ['category', 'robotics'])
        ]);

        $('#app').innerHTML = `
            <div class="stats2">
                <div>
                    <b>${news}</b>
                    სულ სიახლე
                </div>

                <div>
                    <b>${projects}</b>
                    სულ პროექტი
                </div>

                <div>
                    <b>${stem}</b>
                    STEM სიახლე
                </div>

                <div>
                    <b>${robotics}</b>
                    რობოტიკის სიახლე
                </div>
            </div>

            <button class="btn2"
                style="background:var(--navy)"
                onclick="openForm('news')">
                + ახალი სიახლე
            </button>

            <button class="btn2"
                style="background:var(--navy)"
                onclick="openForm('projects')">
                + ახალი პროექტი
            </button>
        `;

    } catch (error) {
        $('#app').innerHTML = `
            <p class="msg">
                მონაცემების ჩატვირთვა ვერ მოხერხდა:
                ${esc(error.message)}
            </p>
        `;
    }
}


/* =====================================================
   NEWS & PROJECTS LIST
===================================================== */

async function listView(table) {
    if (!CFGS[table]) return;

    $('#app').innerHTML = '<p>ჩანაწერები იტვირთება...</p>';

    try {
        const { data, error } = await sb
            .from(table)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const rows = (data || []).map(row => `
            <div class="row">
                <span>
                    ${esc(row.title_ka || row.title_en)}

                    <small>
                        ${esc(row.category || '')}
                        ${row.status ? ' · ' + esc(row.status === 'published' ? 'გამოქვეყნებული' : 'მონახაზი') : ''}
                    </small>
                </span>

                <button onclick="openForm('${table}','${esc(row.id)}')">
                    რედაქტირება
                </button>

                <button onclick="del('${table}','${esc(row.id)}')">
                    წაშლა
                </button>
            </div>
        `).join('');

        $('#app').innerHTML = `
            <p>
                <button class="btn2"
                    style="background:var(--navy)"
                    onclick="openForm('${table}')">
                    + ახალი ${CFGS[table].label.toLowerCase()}
                </button>
            </p>

            ${rows || '<p>ჩანაწერები ჯერ არ არის.</p>'}
        `;

    } catch (error) {
        $('#app').innerHTML = `
            <p class="msg">
                ჩატვირთვა ვერ მოხერხდა:
                ${esc(error.message)}
            </p>
        `;
    }
}


/* =====================================================
   DELETE NEWS / PROJECTS
===================================================== */

async function del(table, id) {
    if (!CFGS[table]) return;

    if (!confirm('ნამდვილად გსურთ ამ ჩანაწერის წაშლა?')) {
        return;
    }

    try {
        const { error } = await sb
            .from(table)
            .delete()
            .eq('id', id);

        if (error) throw error;

        listView(table);

    } catch (error) {
        alert('წაშლა ვერ მოხერხდა: ' + error.message);
    }
}


/* =====================================================
   CONTENT EDITOR
===================================================== */

async function openForm(table, id = null) {
    const config = CFGS[table];

    if (!config) return;

    let row = {};

    $('#app').innerHTML = '<p>ფორმა იტვირთება...</p>';

    try {
        if (id) {
            const { data, error } = await sb
                .from(table)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            row = data;
        }

        cur = {
            table,
            id,
            row,
            original: row.original_lang || null
        };

        /* ---------- Language fields ---------- */

        const fields = config.fields.map(key => {
            const isTitle = key === 'title';

            const makeField = language => {
                const name = `${key}_${language}`;
                const value = row[name] || '';

                if (isTitle) {
                    return `
                        <input
                            type="text"
                            name="${name}"
                            value="${esc(value)}"
                            required="${key === 'title' ? 'false' : 'false'}"
                        >
                    `;
                }

                return `
                    <textarea
                        name="${name}"
                        rows="4"
                    >${esc(value)}</textarea>
                `;
            };

            return `
                <div class="cols">
                    <label>
                        ${LABELS[key]} — ქართული
                        ${makeField('ka')}
                    </label>

                    <label>
                        ${LABELS[key]} — ინგლისური
                        ${makeField('en')}
                    </label>
                </div>
            `;
        }).join('');

        /* ---------- Extra fields ---------- */

        const extraFields = table === 'news'
            ? `
                <label>
                    სტატუსი

                    <select name="status">
                        <option value="draft">მონახაზი</option>
                        <option value="published">გამოქვეყნებული</option>
                    </select>
                </label>

                <label>
                    გამოქვეყნების თარიღი

                    <input
                        type="datetime-local"
                        name="published_at"
                    >
                </label>

                <label>
                    მდებარეობა (არასავალდებულო)

                    <input
                        name="location"
                        value="${esc(row.location || '')}"
                    >
                </label>
            `
            : `
                <label>
                    წელი

                    <input
                        type="number"
                        name="year"
                        value="${esc(row.year ?? '')}"
                    >
                </label>

                <label>
                    <span>
                        <input
                            type="checkbox"
                            name="featured"
                            ${row.featured ? 'checked' : ''}
                        >

                        გამორჩეული პროექტი
                    </span>
                </label>
            `;

        /* ---------- Main form ---------- */

        $('#app').innerHTML = `
            <form class="f" id="ef">

                <h2>
                    ${id ? 'ჩანაწერის რედაქტირება' : 'ახალი ' + config.label}
                </h2>

                <div id="msg" class="msg" hidden role="alert"></div>

                <p>
                    შეავსეთ ქართული ველები. შემდეგ შეგიძლიათ
                    ინგლისური ვერსია ავტომატურად თარგმნოთ
                    ან დამოუკიდებლად დაწეროთ.
                    გამოქვეყნებამდე აუცილებლად გადაამოწმეთ ტექსტები.
                </p>

                ${fields}

                <div class="cols">
                    <button type="button"
                        onclick="tr('ka','en')">
                        ქართულიდან ინგლისურად თარგმნა
                    </button>

                    <button type="button"
                        onclick="tr('en','ka')">
                        ინგლისურიდან ქართულად თარგმნა
                    </button>
                </div>

                <label>
                    კლუბი

                    <select name="category">
                        <option value="stem">STEM</option>
                        <option value="robotics">რობოტიკა</option>
                        <option value="general">ზოგადი</option>
                    </select>
                </label>

                ${extraFields}

                <label>
                    მთავარი ფოტო

                    <input
                        type="file"
                        name="main"
                        accept="image/*"
                    >
                </label>

                <label>
                    დამატებითი ფოტოები

                    <input
                        type="file"
                        name="more"
                        accept="image/*"
                        multiple
                    >
                </label>

                <div class="cols">
                    <button type="submit" class="pri">
                        შენახვა
                    </button>

                    <button type="button"
                        onclick="show('${table}')">
                        გაუქმება
                    </button>
                </div>

            </form>
        `;

        const form = $('#ef');

        form.elements.category.value = row.category || 'general';

        if (form.elements.status) {
            form.elements.status.value = row.status || 'draft';
        }

        if (form.elements.published_at) {
            form.elements.published_at.value = getLocalDate(
                row.published_at || new Date()
            );
        }

        form.onsubmit = save;

    } catch (error) {
        $('#app').innerHTML = `
            <p class="msg">
                ფორმის გახსნა ვერ მოხერხდა:
                ${esc(error.message)}
            </p>
        `;
    }
}


/* =====================================================
   TRANSLATION
===================================================== */

async function tr(from, to) {
    const form = $('#ef');

    if (!form || !cur) return;

    const config = CFGS[cur.table];

    const keys = config.fields.filter(key => {
        return getValue(form, `${key}_${from}`).value.trim();
    });

    if (!keys.length) {
        note('ჯერ შეავსეთ ტექსტი, რომლის თარგმნაც გსურთ.');
        return;
    }

    const existing = keys.filter(key => {
        return getValue(form, `${key}_${to}`).value.trim();
    });

    if (existing.length) {
        const language = to === 'ka' ? 'ქართულ' : 'ინგლისურ';

        if (!confirm(
            `არსებული ${language} ტექსტი შეიცვლება. გსურთ გაგრძელება?`
        )) {
            return;
        }
    }

    const buttons = form.querySelectorAll('button[type="button"]');

    buttons.forEach(button => button.disabled = true);

    note('მიმდინარეობს თარგმნა...');

    try {
        const texts = keys.map(key => {
            return getValue(form, `${key}_${from}`).value.trim();
        });

        const { data, error } = await sb.functions.invoke('translate', {
            body: {
                texts,
                source: from,
                target: to
            }
        });

        if (error) throw error;

        if (!data || !Array.isArray(data.translations)) {
            throw new Error('თარგმნის სერვისმა არასწორი პასუხი დააბრუნა.');
        }

        if (data.translations.length !== keys.length) {
            throw new Error('თარგმნილი ტექსტების რაოდენობა არ ემთხვევა.');
        }

        keys.forEach((key, index) => {
            getValue(form, `${key}_${to}`).value =
                data.translations[index];
        });

        cur.original = from;

        note(
            `თარგმნა დასრულდა! გადაამოწმეთ ${to === 'ka' ? 'ქართული' : 'ინგლისური'} ტექსტი.`
        );

    } catch (error) {
        console.error('Translation error:', error);

        const message =
            error?.context?.error ||
            error?.message ||
            'უცნობი შეცდომა';

        note('თარგმნა ვერ მოხერხდა: ' + message);
    }finally {
        buttons.forEach(button => button.disabled = false);
    }
}


/* =====================================================
   SAVE NEWS / PROJECTS
===================================================== */

async function save(e) {
    e.preventDefault();

    const form = e.target;
    const button = form.querySelector('[type="submit"]');

    if (!cur) return;

    const table = cur.table;
    const config = CFGS[table];

    setLoading(button, true);

    try {
        const data = {};

        /* ---------- Text fields ---------- */

        config.fields.forEach(key => {
            data[`${key}_ka`] =
                getValue(form, `${key}_ka`).value.trim() || null;

            data[`${key}_en`] =
                getValue(form, `${key}_en`).value.trim() || null;
        });

        data.original_lang =
            cur.original || (data.title_ka ? 'ka' : 'en');

        data.category = form.elements.category.value;

        /* ---------- News fields ---------- */

        if (table === 'news') {
            data.status = form.elements.status.value;

            const date = form.elements.published_at.value;

            data.published_at = date
                ? new Date(date).toISOString()
                : new Date().toISOString();

            data.location =
                form.elements.location.value.trim() || null;

            data.ka_edited = false;
            data.en_edited = false;

            if (data.status === 'published') {
                if (!data.title_ka || !data.title_en) {
                    throw new Error(
                        'გამოსაქვეყნებლად აუცილებელია სათაური ორივე ენაზე.'
                    );
                }
            }
        }

        /* ---------- Project fields ---------- */

        if (table === 'projects') {
            const year = form.elements.year.value;

            data.year = year ? Number(year) : null;
            data.featured = form.elements.featured.checked;
        }

        /* ---------- Image uploads ---------- */

        const mainFile = form.elements.main.files[0];

        if (mainFile) {
            data.main_image = await uploadImage(mainFile, table);
        }

        const uploadedImages = [];

        for (const file of form.elements.more.files) {
            const url = await uploadImage(file, table);
            uploadedImages.push(url);
        }

        /* ---------- Insert / Update ---------- */

        let id = cur.id;

        if (id) {
            const { error } = await sb
                .from(table)
                .update(data)
                .eq('id', id);

            if (error) throw error;

        } else {
            const { data: inserted, error } = await sb
                .from(table)
                .insert(data)
                .select()
                .single();

            if (error) throw error;

            id = inserted.id;
        }

        /* ---------- News gallery ---------- */

        if (table === 'news' && uploadedImages.length) {
            const existingImages = cur.row.gallery || [];

            const { error } = await sb
                .from('news')
                .update({
                    gallery: [...existingImages, ...uploadedImages]
                })
                .eq('id', id);

            if (error) throw error;
        }

        /* ---------- Project images ---------- */

        if (table === 'projects' && uploadedImages.length) {
            const { error } = await sb
                .from('project_images')
                .insert(
                    uploadedImages.map((url, index) => ({
                        project_id: id,
                        image_url: url,
                        sort_order: index
                    }))
                );

            if (error) throw error;
        }

        alert('ჩანაწერი წარმატებით შეინახა!');

        show(table);

    } catch (error) {
        console.error('Save error:', error);

        note('შენახვა ვერ მოხერხდა: ' + error.message);

    } finally {
        if (button.isConnected) {
            setLoading(button, false, 'შენახვა');
        }
    }
}


/* =====================================================
   GALLERY
===================================================== */

async function gallery() {
    $('#app').innerHTML = '<p>გალერეა იტვირთება...</p>';

    try {
        const { data, error } = await sb
            .from('gallery')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const rows = (data || []).map(item => `
            <div class="row">

                <img
                    src="${esc(item.image_url)}"
                    alt=""
                    width="60"
                    height="60"
                    style="object-fit:cover"
                >

                <span>
                    ${esc(item.caption_ka || item.caption_en || 'აღწერის გარეშე')}

                    <small>
                        ${esc(item.category || '')}
                    </small>
                </span>

                <button onclick="delG('${esc(item.id)}')">
                    წაშლა
                </button>

            </div>
        `).join('');

        $('#app').innerHTML = `
            <form class="f" id="gf">

                <h2>გალერეა</h2>

                <div id="msg" class="msg" hidden role="alert"></div>

                <label>
                    ფოტოების არჩევა

                    <input
                        type="file"
                        name="p"
                        accept="image/*"
                        multiple
                        required
                    >
                </label>

                <label>
                    ფოტოს აღწერა (არასავალდებულო)

                    <input
                        name="cap"
                        placeholder="მაგალითად: STEM კლუბის შეხვედრა"
                    >
                </label>

                <label>
                    კლუბი

                    <select name="c">
                        <option value="stem">STEM</option>
                        <option value="robotics">რობოტიკა</option>
                        <option value="general">ზოგადი</option>
                    </select>
                </label>

                <button type="submit" class="pri">
                    ფოტოების ატვირთვა
                </button>

            </form>

            <br>

            <h3>ატვირთული ფოტოები</h3>

            ${rows || '<p>გალერეა ჯერ ცარიელია.</p>'}
        `;

        $('#gf').onsubmit = async e => {
            e.preventDefault();

            const form = e.target;
            const button = form.querySelector('[type="submit"]');

            setLoading(button, true, 'ფოტოების ატვირთვა');

            try {
                const files = Array.from(form.elements.p.files);

                if (!files.length) {
                    throw new Error('აირჩიეთ მინიმუმ ერთი ფოტო.');
                }

                for (const file of files) {
                    const imageUrl = await uploadImage(file, 'gallery');

                    const { error } = await sb
                        .from('gallery')
                        .insert({
                            image_url: imageUrl,
                            caption_ka: form.elements.cap.value.trim() || null,
                            category: form.elements.c.value
                        });

                    if (error) throw error;
                }

                alert('ფოტოები წარმატებით აიტვირთა!');

                gallery();

            } catch (error) {
                note('ფოტოების ატვირთვა ვერ მოხერხდა: ' + error.message);

            } finally {
                if (button.isConnected) {
                    setLoading(button, false, 'ფოტოების ატვირთვა');
                }
            }
        };

    } catch (error) {
        $('#app').innerHTML = `
            <p class="msg">
                გალერეის ჩატვირთვა ვერ მოხერხდა:
                ${esc(error.message)}
            </p>
        `;
    }
}


/* =====================================================
   DELETE GALLERY PHOTO
===================================================== */

async function delG(id) {
    if (!confirm('ნამდვილად გსურთ ამ ფოტოს წაშლა?')) {
        return;
    }

    try {
        const { error } = await sb
            .from('gallery')
            .delete()
            .eq('id', id);

        if (error) throw error;

        gallery();

    } catch (error) {
        alert('ფოტოს წაშლა ვერ მოხერხდა: ' + error.message);
    }
}


/* =====================================================
   GLOBAL FUNCTIONS
===================================================== */

window.show = show;
window.openForm = openForm;
window.del = del;
window.delG = delG;
window.tr = tr;
