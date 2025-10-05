// ==UserScript==
// @name         𝓒𝓱𝓲𝓵𝓵𝓪𝔁 𝓑𝓾𝓽 𝓑𝓮𝓽𝓽𝓮𝓻 (Cloud Widget)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Ultra-compact, animated clouds Discord widget. Click for settings to upload a cloud image/change colors/use glb 3D models—zero text on widget.
// @match        https://discord.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
'use strict';

const STORAGE_KEY = "discordCloudWidgetV1";
const DEFAULTS = {
    cloudImg: "", // user-supplied image dataURL or URL
    grad: 'linear-gradient(90deg,#fd1d1d 0%,#e9604c 50%,#a21766 100%)',
    glb3d: ""
};

let config = {};
Object.assign(config, DEFAULTS, GM_getValue(STORAGE_KEY, {}));

GM_addStyle(`
.dclouda-container {
  min-width:120px; max-width:195px; min-height:62px; max-height:94px; padding:0;
  display:flex;align-items:center;justify-content:center;
  background:${config.grad};border-radius:25px;
  box-shadow:0 8px 42px #ffaaaa52,0 1.5px 8px #40002625;
  border:1.5px solid #a2176699;
  backdrop-filter:blur(12px) saturate(1.3);
  overflow:hidden;position:relative; cursor:pointer;
  animation:dcloud-bgshimmer 6.1s linear infinite;
  z-index:33;
}
@keyframes dcloud-bgshimmer {
  0% { background-position:0% 50%;}
  100% { background-position:100% 50%;}
}
.dclouda-cloud {
  position:absolute;bottom:10px; width:38px;height:24px;opacity:.82;
  filter:drop-shadow(0 5px 9px #ff4e6c33) blur(0.5px) saturate(125%);
  animation: dcloud-xmove 7s linear infinite;
}
.dclouda-cloud.c2 { left:28px; animation-duration:10.2s; opacity:.39;}
.dclouda-cloud.c3 { left:65px; animation-duration:8.4s; opacity:.49;}
.dclouda-cloud.c4 { left:120px; animation-duration:13.2s; opacity:.22;}
.dclouda-cloud.c5 { left:98px; animation-duration:12s; opacity:.55;}
@keyframes dcloud-xmove {
  0% { left:-34px; }
  100% { left:180px;}
}
.dclouda-modalb {
  z-index:999999;position:fixed;top:0;left:0;width:100vw;height:100vh;
  background:rgba(25,10,20,0.88);display:flex;align-items:center;justify-content:center;
}
.dclouda-modal-i {
  background:#fff1f6;border-radius:26px;box-shadow:0 9px 44px #fd184721;
  min-width:285px;max-width:95vw;min-height:120px;max-height:99vh;overflow:auto;
  padding:31px 28px; position:relative; display:flex;flex-direction:column;align-items:center;
  font-family:inherit;font-size:1.08em;color:#81213d;animation:fadeinModal .22s;
}
@keyframes fadeinModal{from{opacity:0;}to{opacity:1;}}
.dclouda-modal-i label {display:block;margin-top:13px;}
.dclouda-modal-i .dclouda-aclose{
  font-size:2.3em;position:absolute;top:18px;right:20px;background:none;border:none;cursor:pointer;color:#c62c3f;
}
.dclouda-color-inp {margin-top:6px;}
.dclouda-modal-i input[type="file"] {margin-top:8px;}
.dclouda-modal-i input[type="color"],.dclouda-modal-i input[type="text"] {
  margin-left:7px;font-size:1.03em;border-radius:10px;padding:2.5px 12px;border:1.4px solid #e96a92;height:28px;
}
.dclouda-modal-i .dclouda-preview {
  margin:16px 0 4px 0;height:34px;
}
`);

// Fallback SVG cloud if nothing custom:
const DEFAULT_CLOUD_SVG = `<svg viewBox="0 0 60 34"><ellipse cx="23" cy="23" rx="21" ry="15" fill="#fff9" /><ellipse cx="38" cy="13" rx="21" ry="12" fill="#fff9" /></svg>`;

function getPanelsRoot() { return document.querySelector('[class*="panels_"]'); }
function showCloudWidget() {
    let panels = getPanelsRoot(); if (!panels) return setTimeout(showCloudWidget, 1300);
    if(document.querySelector('.dclouda-container')) return;

    // WIDGET
    const bar = document.createElement('div'); bar.className = 'dclouda-container';
    function cloudEl(cls, extra) {
        let el = document.createElement('span');
        el.className = `dclouda-cloud ${cls||""}`;
        if(config.glb3d){
            // Don't show cloud if 3D
            el.style.display="none"; return el;
        }
        if(config.cloudImg) {
            el.innerHTML = `<img src="${config.cloudImg}" style="width:100%;height:100%;object-fit:contain;"/>`;
        } else {
            el.innerHTML = DEFAULT_CLOUD_SVG;
        }
        if (extra) for(let k in extra) el.style[k]=extra[k];
        return el;
    }
    // Optionally show 3D model if glb set
    let glbModelViewer;
    if(config.glb3d) {
        glbModelViewer = document.createElement('model-viewer');
        glbModelViewer.setAttribute('src', config.glb3d.trim());
        glbModelViewer.setAttribute('auto-rotate','');
        glbModelViewer.setAttribute('camera-controls','');
        glbModelViewer.style.width="110px"; glbModelViewer.style.height="67px";
        glbModelViewer.style.margin="6px auto 0 auto";
        // Load model-viewer web component if not already loaded
        if(!window.customElements.get('model-viewer')){
            const s=document.createElement('script');s.type='module';s.src='https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
            document.head.appendChild(s);
        }
        bar.appendChild(glbModelViewer);
    } else {
        bar.appendChild(cloudEl("",{top:"21px"}));
        bar.appendChild(cloudEl("c2",{top:"14px"}));
        bar.appendChild(cloudEl("c3",{top:"19px"}));
        bar.appendChild(cloudEl("c4",{top:"8px"}));
        bar.appendChild(cloudEl("c5",{top:'15px'}));
    }
    panels.parentElement.insertBefore(bar, panels);

    // Tap/Click to open SETTINGS
    bar.onclick = (e) => {
      if(e.target.tagName==='INPUT'||e.target.closest('.dclouda-modal-i'))return;
      showSettingsModal();
    };
}

function showSettingsModal() {
    if(document.querySelector('.dclouda-modalb')) return;
    const modal = document.createElement('div'); modal.className = "dclouda-modalb";
    const content = document.createElement('div'); content.className = "dclouda-modal-i";
    content.innerHTML = `
      <button class="dclouda-aclose">&times;</button>
      <h2>Cloud Widget Settings</h2>
      <label>Cloud image:<br>
        <input id="dclouda-imgfile" type="file" accept="image/*">
        <button id="dclouda-imgurl-btn" style="margin-left:7px;">URL</button>
      </label>
      <div class="dclouda-preview"></div>
      <label>Background gradient (CSS):<br>
        <input id="dclouda-gradinp" type="text" value="${config.grad}">
      </label>
      <label>3D .glb model (optional):<br>
        <input id="dclouda-glb" type="text" value="${config.glb3d||""}" placeholder="Paste GLB URL here...">
        <span style="font-size:.83em;color:#a03;opacity:.61">(overrides clouds)</span>
      </label>
      <button id="dclouda-save" style="margin-top:23px;font-size:1.09em;">Save</button>
    `;
    modal.appendChild(content); document.body.appendChild(modal);

    const close = content.querySelector('.dclouda-aclose');
    close.onclick = ()=>modal.remove();

    // Preview
    const preview = content.querySelector('.dclouda-preview');
    function updatePreview(imgsrc) {
      preview.innerHTML = imgsrc ? `<img src="${imgsrc}" style="height:34px;border-radius:9px;box-shadow:0 2px 9px #d69bff3a;">` : DEFAULT_CLOUD_SVG;
    }
    updatePreview(config.cloudImg);

    content.querySelector('#dclouda-imgfile').onchange = e => {
      let f = e.target.files[0];
      if(!f) return;
      const r = new FileReader();
      r.onload = ev => updatePreview(ev.target.result);
      r.readAsDataURL(f);
    };

    // Enter URL alternative
    content.querySelector('#dclouda-imgurl-btn').onclick = () => {
      let url = prompt("Paste direct image URL:");
      if(url && url.length > 6) updatePreview(url);
    };

    content.querySelector('#dclouda-save').onclick = () => {
      // Save image
      const fileInput = content.querySelector('#dclouda-imgfile');
      let finalImg = preview.querySelector('img') ? preview.querySelector('img').src : "";
      config.cloudImg = finalImg.startsWith('data:')||finalImg.startsWith('http') ? finalImg : "";
      // Save gradient
      config.grad = content.querySelector('#dclouda-gradinp').value;
      // Model url
      config.glb3d = content.querySelector('#dclouda-glb').value.trim();
      GM_setValue(STORAGE_KEY, config); modal.remove();
      document.querySelector('.dclouda-container')?.remove();
      setTimeout(showCloudWidget, 140);
    };
}

setTimeout(showCloudWidget, 800);
setInterval(showCloudWidget, 2200);

})();
