// ==UserScript==
// @name         𝓒𝓱𝓲𝓵𝓵𝓪𝔁 𝓑𝓾𝓽 𝓑𝓮𝓽𝓽𝓮𝓻 (News Widget)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Beautiful compact news widget for Discord. Requires user's News API key. Auto-scrolling headlines, settings panel.
// @match        https://discord.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      newsapi.org
// ==/UserScript==

(function() {
'use strict';

const STORAGE_KEY = "discordNewsWidget_v1";
const DEFAULTS = {
    apiKey: "",
    country: "us", // us, gb, ca, au, etc.
    category: "general", // business, entertainment, general, health, science, sports, technology
    refreshInterval: 300000 // 5 minutes
};

let config = {};
Object.assign(config, DEFAULTS, GM_getValue(STORAGE_KEY, {}));

let currentArticles = [];
let currentIndex = 0;
let scrollInterval = null;
let refreshTimeout = null;

GM_addStyle(`
.dnews-widget {
  min-width:240px; max-width:350px; margin:0 auto 9px auto; padding:0;
  display:flex;align-items:center;justify-content:center; z-index:35;
}
.dnews-card {
  background:linear-gradient(135deg,rgba(45,85,125,0.65),rgba(80,180,255,0.18),rgba(255,255,255,0.24));
  border-radius:28px; box-shadow:0 8px 38px #7db8ff31,0 2px 12px #22334417;
  border:1.8px solid rgba(120,200,255,.16); backdrop-filter:blur(16px) saturate(160%);
  padding:16px 22px 14px 22px; min-width:220px; max-width:330px;
  display:flex;flex-direction:column;align-items:center; position:relative; cursor:pointer;
  animation:dnews-glow 4.2s infinite linear;
}
@keyframes dnews-glow {
  0% { box-shadow:0 3px 22px #7db8ff35,0 1px 7px #22334417;}
  65% { box-shadow:0 12px 34px #13b8ec38, 0 5px 18px #3bd5d718;}
  100% { box-shadow:0 3px 22px #7db8ff35,0 1px 7px #22334417;}
}
.dnews-header {
  font-size:1.16em; font-weight:800; color:#5de4ff; margin-bottom:8px;
  text-shadow:0 2px 14px #fff7, 0 0 2px #5de4ff33; letter-spacing:.01em;
  display:flex; align-items:center; gap:8px; width:100%;
  justify-content:space-between;
}
.dnews-settings-btn {
  background:none; border:none; color:#5de4ff; font-size:1.1em; cursor:pointer;
  opacity:.7; transition:opacity .15s; padding:2px 6px; border-radius:6px;
}
.dnews-settings-btn:hover { opacity:1; background:rgba(93,228,255,0.15); }
.dnews-headline {
  font-size:1.02em; font-weight:600; color:#1a5a8a; line-height:1.3;
  text-align:center; min-height:42px; display:flex; align-items:center;
  justify-content:center; margin:4px 0; overflow:hidden; text-overflow:ellipsis;
}
.dnews-source {
  font-size:.88em; color:#4a9bc9; opacity:.8; margin-top:4px;
  font-style:italic;
}
.dnews-loading {
  color:#4a9bc9; font-size:.95em; opacity:.7;
}
.dnews-modal {
  position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:999999;
  background:rgba(20,30,45,0.92); display:flex; align-items:center; justify-content:center;
}
.dnews-modal-content {
  background:linear-gradient(135deg,#f0f8ff,#e6f3ff); border-radius:24px;
  padding:28px 32px; max-width:420px; width:90vw; position:relative;
  box-shadow:0 12px 48px rgba(93,228,255,0.25); color:#1a4a6a;
}
.dnews-modal-close {
  position:absolute; top:12px; right:18px; font-size:2.2em; background:none;
  border:none; cursor:pointer; color:#4a9bc9;
}
.dnews-modal h3 { color:#2a6a9a; margin-bottom:18px; font-size:1.25em; }
.dnews-modal label { display:block; margin-bottom:14px; font-weight:600; }
.dnews-modal input, .dnews-modal select {
  width:100%; padding:8px 12px; border:2px solid #7db8ff44; border-radius:12px;
  font-size:1.02em; margin-top:5px; background:#fff;
}
.dnews-modal input:focus, .dnews-modal select:focus {
  outline:none; border-color:#5de4ff; box-shadow:0 0 8px rgba(93,228,255,0.3);
}
.dnews-save-btn {
  background:linear-gradient(135deg,#5de4ff,#3bb8e6); color:#fff; border:none;
  padding:12px 24px; border-radius:14px; font-size:1.08em; font-weight:700;
  cursor:pointer; margin-top:16px; box-shadow:0 4px 16px rgba(93,228,255,0.4);
  transition:transform .15s;
}
.dnews-save-btn:hover { transform:translateY(-1px); }
.dnews-error { color:#e74c3c; font-size:.92em; margin-top:8px; }
`);

function getPanelsRoot() { return document.querySelector('[class*="panels_"]'); }

async function fetchNews() {
    if (!config.apiKey) {
        currentArticles = [{ title: "⚙️ Click settings to add News API key", url: "", source: { name: "Setup required" } }];
        return;
    }

    try {
        const url = `https://newsapi.org/v2/top-headlines?country=${config.country}&category=${config.category}&pageSize=20&apiKey=${config.apiKey}`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.status === 'ok' && data.articles) {
                        currentArticles = data.articles.filter(article =>
                            article.title &&
                            article.title !== '[Removed]' &&
                            article.url
                        );
                        currentIndex = 0;
                        updateNewsDisplay();
                    } else {
                        currentArticles = [{ title: "❌ Error loading news: " + (data.message || "Unknown error"), url: "", source: { name: "Error" } }];
                        updateNewsDisplay();
                    }
                } catch (e) {
                    currentArticles = [{ title: "❌ Failed to parse news data", url: "", source: { name: "Parse Error" } }];
                    updateNewsDisplay();
                }
            },
            onerror: function() {
                currentArticles = [{ title: "❌ Network error loading news", url: "", source: { name: "Network Error" } }];
                updateNewsDisplay();
            }
        });
    } catch (error) {
        currentArticles = [{ title: "❌ Error: " + error.message, url: "", source: { name: "Error" } }];
        updateNewsDisplay();
    }
}

function updateNewsDisplay() {
    const headline = document.querySelector('.dnews-headline');
    const source = document.querySelector('.dnews-source');

    if (!headline || !source || currentArticles.length === 0) return;

    const article = currentArticles[currentIndex];
    headline.textContent = article.title;
    source.textContent = article.source?.name || "Unknown Source";

    // Auto-scroll to next article
    currentIndex = (currentIndex + 1) % currentArticles.length;
}

function startAutoScroll() {
    if (scrollInterval) clearInterval(scrollInterval);
    scrollInterval = setInterval(updateNewsDisplay, 4000); // Change headline every 4 seconds
}

function scheduleRefresh() {
    if (refreshTimeout) clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(() => {
        fetchNews();
        scheduleRefresh();
    }, config.refreshInterval);
}

function showSettingsModal() {
    if (document.querySelector('.dnews-modal')) return;

    const modal = document.createElement('div');
    modal.className = 'dnews-modal';
    modal.innerHTML = `
        <div class="dnews-modal-content">
            <button class="dnews-modal-close">&times;</button>
            <h3>📰 News Widget Settings</h3>

            <label>
                News API Key:
                <input type="password" id="dnews-api-key" value="${config.apiKey}" placeholder="Get free key from newsapi.org">
                <div class="dnews-error" style="display:none;">API key is required</div>
            </label>

            <label>
                Country:
                <select id="dnews-country">
                    <option value="us" ${config.country==='us'?'selected':''}>🇺🇸 United States</option>
                    <option value="gb" ${config.country==='gb'?'selected':''}>🇬🇧 United Kingdom</option>
                    <option value="ca" ${config.country==='ca'?'selected':''}>🇨🇦 Canada</option>
                    <option value="au" ${config.country==='au'?'selected':''}>🇦🇺 Australia</option>
                    <option value="de" ${config.country==='de'?'selected':''}>🇩🇪 Germany</option>
                    <option value="fr" ${config.country==='fr'?'selected':''}>🇫🇷 France</option>
                    <option value="jp" ${config.country==='jp'?'selected':''}>🇯🇵 Japan</option>
                    <option value="in" ${config.country==='in'?'selected':''}>🇮🇳 India</option>
                </select>
            </label>

            <label>
                Category:
                <select id="dnews-category">
                    <option value="general" ${config.category==='general'?'selected':''}>📰 General</option>
                    <option value="business" ${config.category==='business'?'selected':''}>💼 Business</option>
                    <option value="technology" ${config.category==='technology'?'selected':''}>💻 Technology</option>
                    <option value="science" ${config.category==='science'?'selected':''}>🔬 Science</option>
                    <option value="health" ${config.category==='health'?'selected':''}>🏥 Health</option>
                    <option value="sports" ${config.category==='sports'?'selected':''}>⚽ Sports</option>
                    <option value="entertainment" ${config.category==='entertainment'?'selected':''}>🎬 Entertainment</option>
                </select>
            </label>

            <button class="dnews-save-btn">💾 Save Settings</button>

            <div style="margin-top:16px; font-size:.9em; opacity:.8;">
                💡 Get your free API key at <strong>newsapi.org</strong><br>
                📱 Click headlines to read full articles
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Event handlers
    modal.querySelector('.dnews-modal-close').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.querySelector('.dnews-save-btn').onclick = () => {
        const apiKey = modal.querySelector('#dnews-api-key').value.trim();
        const country = modal.querySelector('#dnews-country').value;
        const category = modal.querySelector('#dnews-category').value;
        const errorEl = modal.querySelector('.dnews-error');

        if (!apiKey) {
            errorEl.style.display = 'block';
            errorEl.textContent = 'API key is required. Get one free at newsapi.org';
            return;
        }

        // Save config
        config.apiKey = apiKey;
        config.country = country;
        config.category = category;
        GM_setValue(STORAGE_KEY, config);

        modal.remove();

        // Refresh news with new settings
        fetchNews();
        scheduleRefresh();
    };
}

function injectNewsWidget() {
    let panels = getPanelsRoot();
    if (!panels) return setTimeout(injectNewsWidget, 1200);
    if (document.querySelector('.dnews-widget')) return;

    const widget = document.createElement('div');
    widget.className = 'dnews-widget';

    const card = document.createElement('div');
    card.className = 'dnews-card';

    card.innerHTML = `
        <div class="dnews-header">
            <span>📰 News</span>
            <button class="dnews-settings-btn" title="Settings">⚙️</button>
        </div>
        <div class="dnews-headline">Loading news...</div>
        <div class="dnews-source dnews-loading">Please wait...</div>
    `;

    widget.appendChild(card);
    panels.parentElement.insertBefore(widget, panels);

    // Event handlers
    card.querySelector('.dnews-settings-btn').onclick = (e) => {
        e.stopPropagation();
        showSettingsModal();
    };

    card.onclick = () => {
        if (currentArticles.length > 0 && currentArticles[currentIndex - 1]?.url) {
            window.open(currentArticles[currentIndex - 1].url, '_blank');
        }
    };

    // Initialize
    fetchNews();
    startAutoScroll();
    scheduleRefresh();
}

// Start the widget
setTimeout(injectNewsWidget, 900);
setInterval(() => { if (!document.querySelector('.dnews-widget')) injectNewsWidget(); }, 2500);

})();
