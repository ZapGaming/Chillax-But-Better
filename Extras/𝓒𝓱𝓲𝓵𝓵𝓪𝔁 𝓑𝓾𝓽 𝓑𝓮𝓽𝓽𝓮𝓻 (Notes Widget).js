// ==UserScript==
// @name         𝓒𝓱𝓲𝓵𝓵𝓪𝔁 𝓑𝓾𝓽 𝓑𝓮𝓽𝓽𝓮𝓻 (Notes Widget)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  One beautiful, ultra-compact curved notes widget with frosted glass and translucent box. Autosaves. Always above user area.
// @match        https://discord.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
'use strict';

const STORAGE_KEY = "discordUltraNotes_value";

GM_addStyle(`
.frosted-notes-bar {
  position:relative; min-width:185px; max-width:300px;
  margin:0 auto 8px auto; padding:0;
  display:flex;align-items:center;justify-content:center;
}
.frosted-notes-card {
  background:linear-gradient(120deg,rgba(35,50,70,.54),rgba(120,212,255,.29),rgba(255,255,255,.23));
  border-radius:22px; box-shadow:0 7px 50px #7dcfff33,0 1.5px 7px #21294217, 0 2px 9px #28f5ff23;
  backdrop-filter:blur(16px) saturate(160%) brightness(1.14);
  border:1.3px solid rgba(120,212,255,.22);
  padding:11px 19px 15px 19px; min-width:170px;
  display:flex;flex-direction:column;
  position:relative; z-index:1;
  animation: notesbarGlassAnim 3.5s infinite linear;
}
@keyframes notesbarGlassAnim {
  0% { box-shadow:0 3px 28px #7dcfff33,0 2px 8px #21294208;}
  60% { box-shadow:0 11px 48px #13e9ec33, 0 9px 24px #536bb515;}
  100% { box-shadow:0 3px 28px #7dcfff33,0 2px 8px #21294208;}
}
.frosted-notes-label {
  font-size:1em;font-weight:600;color:#80e5fd;
  margin-bottom:6px;letter-spacing:.03em;
  text-shadow:0 2px 16px #fff6,0 0 2px #9af1ff33;
}
.frosted-notes-textarea {
  width:180px; min-height:55px; max-height:140px;
  font-size:.99em; font-family:inherit;
  background:rgba(255,255,255,0.19);
  color:#0a2939; font-weight:500;
  border:1.2px solid #b0f6ff44; border-radius:14px;
  padding:8px 12px; box-shadow:0 2px 10px #b0f6ff13;
  outline:none; resize:vertical;
  transition:box-shadow .17s,background .14s;
  backdrop-filter:blur(5px);
  margin-bottom:7px;
}
.frosted-notes-textarea:focus {
  background:rgba(210,244,255,0.22);
  box-shadow:0 0 13px #4cd5ff28;
}
.notes-save-indicator {
  font-size:.79em;color:#57f6d9b0;align-self:end;
  margin-top:1px;margin-bottom:-2px;font-style:italic;
  opacity:.68;
}
`);

function getPanelsRoot() { return document.querySelector('[class*="panels_"]'); }

function injectNotesWidget() {
    let panels = getPanelsRoot();
    if (!panels) return setTimeout(injectNotesWidget, 1300);
    if(document.querySelector('.frosted-notes-bar')) return;
    const bar = document.createElement('div'); bar.className = 'frosted-notes-bar';
    const card = document.createElement('div'); card.className = 'frosted-notes-card';
    card.innerHTML = `<div class="frosted-notes-label">📝 Quick Notes</div>
    <textarea class="frosted-notes-textarea" spellcheck="true" placeholder="...">${GM_getValue(STORAGE_KEY,"")}</textarea>
    <span class="notes-save-indicator" style="display:none;">✓ Saved</span>`;
    bar.appendChild(card); panels.parentElement.insertBefore(bar, panels);

    let ta = card.querySelector('textarea');
    let saved = card.querySelector('.notes-save-indicator');
    ta.addEventListener('input', () => {
        GM_setValue(STORAGE_KEY, ta.value);
        saved.style.display = 'inline';
        setTimeout(()=>saved.style.display='none', 800);
    });
}

setTimeout(injectNotesWidget, 900);
// Persistence if Discord reloads UI
setInterval(()=>injectNotesWidget(), 2500);

})();
