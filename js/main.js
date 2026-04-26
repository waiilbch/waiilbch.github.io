document.addEventListener('DOMContentLoaded', () => {
    loadCompetences();
    loadFormations();
    loadCertifications();
    loadProjets();
    loadVeille();
    initVeilleSearch();
    highlightNavOnScroll();
    document.getElementById('footer-year').textContent = new Date().getFullYear();
});

// ─── Compétences ────────────────────────────────────────────────────────────

async function loadCompetences() {
    const container = document.getElementById('skills-grid');
    if (!container) return;
    const data = await fetchJSON('data/competences.json');
    if (!data) return;

    container.innerHTML = data.map(s => `
        <div class="col-6 col-md-4 col-lg-2">
            <div class="skill-card">
                <div class="skill-icon" style="color:${s.couleur}">
                    <i class="${s.icone}"></i>
                </div>
                <div class="skill-name">${s.nom}</div>
            </div>
        </div>
    `).join('');
}

// ─── Formations ─────────────────────────────────────────────────────────────

async function loadFormations() {
    const container = document.getElementById('timeline-container');
    if (!container) return;
    const data = await fetchJSON('data/formations.json');
    if (!data) return;

    container.innerHTML = data.map(f => `
        <div class="timeline-item row align-items-start">
            <div class="col-md-5 text-md-end pe-md-5 mb-2 mb-md-0">
                <div class="timeline-date ${f.actif ? 'active' : ''}">${f.periode}</div>
                <div class="text-muted" style="font-size:.8125rem">${f.etablissement}</div>
            </div>
            <div class="col-md-1 d-flex justify-content-center">
                <div class="timeline-dot ${f.actif ? 'active' : ''}"></div>
            </div>
            <div class="col-md-6 ps-md-4">
                <div class="timeline-card">
                    <div class="fw-bold mb-1" style="font-size:1.0625rem;color:#0f172a">${f.titre}</div>
                    <div style="font-size:.875rem;color:#64748b;line-height:1.6">${f.description}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// ─── Certifications ──────────────────────────────────────────────────────────

async function loadCertifications() {
    const container = document.getElementById('certifs-grid');
    if (!container) return;
    const data = await fetchJSON('data/certifications.json');
    if (!data) return;

    container.innerHTML = data.map(c => `
        <div class="col-md-6 col-lg-3">
            <div class="cert-card">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="cert-domain" style="background:${c.couleur}18;color:${c.couleur}">${c.domaine}</span>
                    <div class="cert-icon" style="background:${c.couleur}">${c.initiale}</div>
                </div>
                <div class="fw-bold mb-1" style="font-size:1.0625rem;color:#0f172a">${c.nom}</div>
                <div style="font-size:.8125rem;color:#64748b;line-height:1.5">${c.description}</div>
                ${c.fichier ? `<a href="${c.fichier}" target="_blank" class="d-inline-block mt-3" style="font-size:.8125rem;font-weight:600;color:#6366f1;text-decoration:none">Voir le certificat →</a>` : ''}
            </div>
        </div>
    `).join('');
}

// ─── Projets ─────────────────────────────────────────────────────────────────

async function loadProjets() {
    const container = document.getElementById('projets-grid');
    if (!container) return;
    const data = await fetchJSON('data/projets.json');
    if (!data) return;

    container.innerHTML = data.map(p => `
        <div class="col-md-6">
            <div class="projet-card">
                <div class="projet-img">${p.image ? `<img src="${p.image}" alt="${p.titre}" style="width:100%;height:100%;object-fit:cover;">` : (p.emoji ?? '💻')}</div>
                <div class="projet-body">
                    <span class="projet-tag" style="background:${p.couleurTag}18;color:${p.couleurTag}">${p.tag}</span>
                    <div class="fw-bold mb-2" style="font-size:1.125rem;color:#0f172a">${p.titre}</div>
                    <p style="font-size:.875rem;color:#64748b;line-height:1.6">${p.description}</p>
                    <div class="d-flex flex-wrap gap-1 mt-3">
                        ${p.technologies.map(t => `<span class="tech-badge">${t}</span>`).join('')}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// ─── Veille technologique (RSS quantique) ────────────────────────────────────

const RSS_FEEDS = [
    { url: 'https://www.sciencedaily.com/rss/computers_math/quantum_computers.xml', source: 'Science Daily' },
    { url: 'https://phys.org/rss-feed/physics-news/quantum-physics/',               source: 'Phys.org' },
    { url: 'https://news.mit.edu/rss/research/quantum-computing',                   source: 'MIT News' },
    { url: 'https://www.quantamagazine.org/feed/',                                  source: 'Quanta Magazine' },
];

async function loadVeille(query = '') {
    const container = document.getElementById('veille-articles');
    const loader    = document.getElementById('veille-loader');
    const counter   = document.getElementById('veille-counter');
    if (!container) return;

    loader.style.display = 'flex';
    container.innerHTML  = '';

    const results = await Promise.allSettled(
        RSS_FEEDS.map(feed =>
            fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=10`)
                .then(r => r.json())
                .then(data => ({ feed, data }))
        )
    );

    let articles = [];
    for (const result of results) {
        if (result.status !== 'fulfilled') continue;
        const { feed, data } = result.value;
        if (data.status !== 'ok' || !data.items) continue;

        for (const item of data.items) {
            const desc = (item.description ?? '').replace(/<[^>]+>/g, '').trim();
            const date = item.pubDate ? new Date(item.pubDate) : null;
            articles.push({
                title:     item.title ?? '',
                link:      item.link  ?? '',
                desc:      desc.length > 280 ? desc.slice(0, 280) + '…' : desc,
                date:      date ? date.toLocaleDateString('fr-FR') : 'Date inconnue',
                timestamp: date ? date.getTime() : 0,
                source:    feed.source,
            });
        }
    }

    articles.sort((a, b) => b.timestamp - a.timestamp);

    const seen = new Set();
    articles = articles.filter(a => {
        const key = a.title.toLowerCase().replace(/\s+/g, '').slice(0, 40);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    if (query) {
        const q = query.toLowerCase();
        articles = articles.filter(a =>
            a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)
        );
    }

    loader.style.display = 'none';

    const slice = articles.slice(0, 8);

    if (!slice.length) {
        container.innerHTML = `<div class="veille-no-result"><i class="fa-solid fa-satellite-dish fa-2x mb-3 d-block" style="color:#334155"></i>Aucun article trouvé${query ? ` pour « ${escHtml(query)} »` : ''}.<br><small>Vérifiez votre connexion ou essayez un autre mot-clé.</small></div>`;
        if (counter) counter.textContent = '0 article';
        return;
    }

    if (counter) counter.textContent = `${articles.length} article${articles.length > 1 ? 's' : ''} trouvé${articles.length > 1 ? 's' : ''}`;

    container.innerHTML = slice.map(a => `
        <div class="veille-card">
            <div class="d-flex align-items-center gap-3 mb-3">
                <span class="veille-source">${escHtml(a.source)}</span>
                <span class="veille-date">${escHtml(a.date)}</span>
            </div>
            <a href="${escHtml(a.link)}" target="_blank" rel="noopener" class="veille-article-title d-block mb-2">${escHtml(a.title)}</a>
            ${a.desc ? `<p class="veille-article-desc mb-3">${escHtml(a.desc)}</p>` : ''}
            <a href="${escHtml(a.link)}" target="_blank" rel="noopener" class="veille-read-link">Lire l'article →</a>
        </div>
    `).join('');
}

function initVeilleSearch() {
    const input = document.getElementById('veille-search');
    const btn   = document.getElementById('veille-btn');
    if (!input || !btn) return;

    btn.addEventListener('click', () => loadVeille(input.value.trim()));
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') loadVeille(input.value.trim());
    });
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

async function fetchJSON(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.status);
        return await res.json();
    } catch (e) {
        console.error('fetchJSON error:', url, e);
        return null;
    }
}

function escHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─── Navbar active au scroll ──────────────────────────────────────────────────

function highlightNavOnScroll() {
    const sections = document.querySelectorAll('section[id]');
    const links    = document.querySelectorAll('#navbar .nav-link');

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                links.forEach(l => l.classList.remove('active', 'text-white'));
                const active = document.querySelector(`#navbar .nav-link[href="#${entry.target.id}"]`);
                if (active) active.classList.add('active', 'text-white');
            }
        });
    }, { threshold: 0.4 });

    sections.forEach(s => observer.observe(s));
}
