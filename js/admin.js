
'use strict';

const sb = supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

const $ = selector => document.querySelector(selector);

const esc = value => String(value ?? '').replace(/[&<>"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
}[char]));

const CFGS = {
    news: {
        tx: ['title', 'description', 'content'],
        label: 'News'
    },
    projects: {
        tx: ['title', 'description'],
        label: 'Projects'
    }
};

let cur = null;

/* ---------- Authentication ---------- */

if ($('#lf')) {
    $('#lf').onsubmit = async e => {
        e.preventDefault();

        const form = new FormData(e.target);

        const { error } = await sb.auth.signInWithPassword({
            email: form.get('e'),
            password: form.get('p')
        });

        if (error) {
            $('#m').textContent = error.message;
            return;
        }

        const { data: isAdmin } = await sb.rpc('is_admin');

        if (!isAdmin) {
            await sb.auth.signOut();
            $('#m').textContent = 'Login works, but this account is not in the admins table.';
            return;
        }

        location.href = 'dashboard.html';
    };
}

/* ---------- Dashboard initialization ---------- */

if ($('#app')) {
    (async () => {
        const { data: { session } } = await sb.auth.getSession();

        const { data: isAdmin } = session
            ? await sb.rpc('is_admin')
            : { data: false };

        if (!session || !isAdmin) {
            await sb.auth.signOut();
            location.href = 'login.html';
            return;
        }

        $('#app').hidden = false;

        $('#out').onclick = async () => {
            await sb.auth.signOut();
            location.href = 'login.html';
        };

        document.querySelectorAll('[data-v]').forEach(button => {
            button.onclick = () => show(button.dataset.v);
        });

        show('home');
    })();
}

/* ---------- Navigation ---------- */

function show(view) {
    document.querySelectorAll('[data-v]').forEach(button => {
        button.classList.toggle('on', button.dataset.v === view);
    });

    if (view === 'home') home();
    else if (view === 'gallery') gallery();
    else listView(view);
}

/* ---------- Shared database helpers ---------- */

async function cnt(table, filter) {
    let query = sb.from(table).select('*', {
        count: 'exact',
        head: true
    });

    if (filter) query = query.eq(...filter);

    const { count } = await query;
    return count ?? 0;
}

async function up(file, directory) {
    if (!file.type.startsWith('image/')) {
        throw new Error('Images only');
    }

    const path = `${directory}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '_')}`;

    const { error } = await sb.storage.from('media').upload(path, file);

    if (error) throw error;

    return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
}

const note = message => {
    const box = $('#msg');

    box.hidden = false;
    box.textContent = message;
    box.scrollIntoView();
};

/* ---------- Dashboard home ---------- */

async function home() {
    const [news, projects, stem, robotics] = await Promise.all([
        cnt('news'),
        cnt('projects'),
        cnt('news', ['category', 'stem']),
        cnt('news', ['category', 'robotics'])
    ]);

    $('#app').innerHTML = `
        <div class="stats2">
            <div><b>${news}</b>News posts</div>
            <div><b>${projects}</b>Projects</div>
            <div><b>${stem}</b>STEM posts</div>
            <div><b>${robotics}</b>Robotics posts</div>
        </div>

        <button class="btn2" style="background:var(--navy)"
            onclick="openForm('news')">+ New news post</button>

        <button class="btn2" style="background:var(--navy)"
            onclick="openForm('projects')">+ New project</button>
    `;
}

/* ---------- Content lists ---------- */

async function listView(table) {
    const { data } = await sb
        .from(table)
        .select('*')
        .order('created_at', { ascending: false });

    const rows = (data || []).map(row => `
        <div class="row">
            <span>
                ${esc(row.title_ka || row.title_en)}
                <small>(${row.category}${row.status ? ', ' + row.status : ''})</small>
            </span>

            <button onclick='openForm("${table}","${row.id}")'>Edit</button>
            <button onclick='del("${table}","${row.id}")'>Delete</button>
        </div>
    `).join('');

    $('#app').innerHTML = `
        <p>
            <button class="btn2" style="background:var(--navy)"
                onclick="openForm('${table}')">+ New</button>
        </p>
        ${rows || '<p>Nothing yet.</p>'}
    `;
}

async function del(table, id) {
    if (!confirm('Delete permanently?')) return;

    await sb.from(table).delete().eq('id', id);
    listView(table);
}

/* ---------- Content editor ---------- */

async function openForm(table, id) {
    const config = CFGS[table];

    let row = {};

    if (id) {
        const { data } = await sb
            .from(table)
            .select('*')
            .eq('id', id)
            .single();

        row = data;
    }

    cur = {
        t: table,
        id,
        r: row,
        edited: { ka: false, en: false }
    };

    const labels = {
        title: 'Title',
        description: 'Short description',
        content: 'Full text'
    };

    const fields = config.tx.map(key => {
        const isTitle = key === 'title';
        const tag = isTitle ? 'input' : 'textarea';
        const attributes = isTitle ? '' : 'rows="4"';

        return `
            <div class="cols">
                <label>
                    ${labels[key]} (ქართული)
                    <${tag} ${attributes}
                        name="${key}_ka">${esc(row[key + '_ka'] || '')}${isTitle ? '' : '</textarea>'}
                </label>

                <label>
                    ${labels[key]} (English)
                    <${tag} ${attributes}
                        name="${key}_en">${esc(row[key + '_en'] || '')}${isTitle ? '' : '</textarea>'}
                </label>
            </div>
        `;
    }).join('');

    const extraFields = table === 'news'
        ? `
            <label>
                Status
                <select name="status">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                </select>
            </label>

            <label>
                Date
                <input type="datetime-local" name="published_at">
            </label>

            <label>
                Location (optional)
                <input name="location" value="${esc(row.location || '')}">
            </label>
        `
        : `
            <label>
                Year
                <input type="number" name="year" value="${esc(row.year ?? '')}">
            </label>

            <label>
                <span>
                    <input type="checkbox" name="featured"
                        ${row.featured ? 'checked' : ''}>
                    Featured
                </span>
            </label>
        `;

    $('#app').innerHTML = `
        <form class="f" id="ef">
            <h2>${id ? 'Edit' : 'New'} ${config.label}</h2>

            <div id="msg" class="msg" hidden role="alert"></div>

            <p>
                Write in either language, then press the translate button.
                You can correct both versions before saving.
            </p>

            ${fields}

            <div class="cols">
                <button type="button" onclick="tr('ka','en')">
                    Georgian → fill English
                </button>

                <button type="button" onclick="tr('en','ka')">
                    English → fill Georgian
                </button>
            </div>

            <label>
                Club
                <select name="category">
                    <option value="stem">STEM</option>
                    <option value="robotics">Robotics</option>
                    <option value="general">General</option>
                </select>
            </label>

            ${extraFields}

            <label>
                Main image
                <input type="file" name="main" accept="image/*">
            </label>

            <label>
                More images
                <input type="file" name="more" accept="image/*" multiple>
            </label>

            <button class="pri">Save</button>
        </form>
    `;

    const form = $('#ef');

    form.category.value = row.category || 'general';

    if (form.status) {
        form.status.value = row.status || 'draft';
    }

    if (form.published_at) {
        form.published_at.value = (
            row.published_at || new Date().toISOString()
        ).slice(0, 16);
    }

    form.addEventListener('input', e => {
        const match = (e.target.name || '').match(/_(ka|en)$/);

        if (match) cur.edited[match[1]] = true;
    });

    form.onsubmit = save;
}

/* ---------- Translation ---------- */

async function tr(from, to) {
    const form = $('#ef');

    const keys = CFGS[cur.t].tx.filter(key =>
        form[key + '_' + from].value.trim()
    );

    if (!keys.length) {
        return note('Write something in the source language first.');
    }

    const existing = keys.filter(key =>
        form[key + '_' + to].value.trim()
    );

    if (existing.length && !confirm(
        `This will overwrite the existing ${to === 'ka' ? 'Georgian' : 'English'} text. Continue?`
    )) return;

    const { data, error } = await sb.functions.invoke('translate', {
        body: {
            texts: keys.map(key => form[key + '_' + from].value),
            source: from,
            target: to
        }
    });

    if (error || !data?.translations) {
        return note(
            'Translation failed. Your text is not lost: save it as a draft and try again later.'
        );
    }

    keys.forEach((key, index) => {
        form[key + '_' + to].value = data.translations[index];
    });

    cur.orig = from;
    cur.edited[to] = false;

    note(
        `Translated. Please check the ${to === 'ka' ? 'Georgian' : 'English'} text before publishing.`
    );
}

/* ---------- Save content ---------- */

async function save(e) {
    e.preventDefault();

    const form = e.target;
    const table = cur.t;
    const config = CFGS[table];
    const data = {};

    config.tx.forEach(key => {
        data[key + '_ka'] = form[key + '_ka'].value.trim() || null;
        data[key + '_en'] = form[key + '_en'].value.trim() || null;
    });

    data.original_lang = cur.orig || (data.title_ka ? 'ka' : 'en');
    data.category = form.category.value;

    if (table === 'news') {
        data.status = form.status.value;
        data.published_at = new Date(form.published_at.value).toISOString();
        data.location = form.location.value || null;
        data.ka_edited = cur.edited.ka;
        data.en_edited = cur.edited.en;

        if (data.status === 'published' && (!data.title_ka || !data.title_en)) {
            return note(
                'To publish, both Georgian and English titles are needed. Press a translate button, or save as draft.'
            );
        }
    } else {
        data.year = form.year.value ? +form.year.value : null;
        data.featured = form.featured.checked;
    }

    data.updated_at = new Date().toISOString();

    try {
        if (form.main.files[0]) {
            data.main_image = await up(form.main.files[0], table);
        }

        const images = [];

        for (const file of form.more.files) {
            images.push(await up(file, table));
        }

        if (table === 'news' && images.length) {
            data.gallery = [...(cur.r.gallery || []), ...images];
        }

        let id = cur.id;
        let result;

        if (id) {
            result = await sb.from(table).update(data).eq('id', id);
        } else {
            result = await sb.from(table).insert(data).select().single();
            id = result.data?.id;
        }

        if (result.error) throw result.error;

        if (table === 'projects' && images.length) {
            const { error } = await sb.from('project_images').insert(
                images.map((url, index) => ({
                    project_id: id,
                    image_url: url,
                    sort_order: index
                }))
            );

            if (error) throw error;
        }

        listView(table);

    } catch (error) {
        note('Could not save: ' + error.message);
    }
}

/* ---------- Gallery ---------- */

async function gallery() {
    const { data } = await sb
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });

    const rows = (data || []).map(item => `
        <div class="row">
            <img src="${esc(item.image_url)}" alt=""
                width="60" height="60" style="object-fit:cover">

            <span>
                ${esc(item.caption_ka || item.caption_en || '')}
                <small>(${item.category})</small>
            </span>

            <button onclick='delG("${item.id}")'>Delete</button>
        </div>
    `).join('');

    $('#app').innerHTML = `
        <form class="f" id="gf">
            <h2>Gallery</h2>

            <div id="msg" class="msg" hidden></div>

            <label>
                Photos
                <input type="file" name="p" accept="image/*" multiple required>
            </label>

            <label>
                Caption (any language, optional)
                <input name="cap">
            </label>

            <label>
                Club
                <select name="c">
                    <option value="stem">STEM</option>
                    <option value="robotics">Robotics</option>
                    <option value="general">General</option>
                </select>
            </label>

            <button class="pri">Upload</button>
        </form>

        <br>

        ${rows}
    `;

    $('#gf').onsubmit = async e => {
        e.preventDefault();

        const form = e.target;

        try {
            for (const file of form.p.files) {
                const imageUrl = await up(file, 'gallery');

                const { error } = await sb.from('gallery').insert({
                    image_url: imageUrl,
                    caption_ka: form.cap.value || null,
                    category: form.c.value
                });

                if (error) throw error;
            }

            gallery();

        } catch (error) {
            note('Upload failed: ' + error.message);
        }
    };
}

async function delG(id) {
    if (!confirm('Delete photo?')) return;

    await sb.from('gallery').delete().eq('id', id);
    gallery();
}
