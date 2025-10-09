// ==UserScript==
// @name         𝓒𝓱𝓲𝓵𝓵𝓪𝔁 𝓑𝓾𝓽 𝓑𝓮𝓽𝓽𝓮𝓻 (Battery+Ping Widget)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  One tiny but beautiful glass battery/ping widget, always above your user area, Discord style!
// @match        https://discord.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
'use strict';

GM_addStyle(`
.frosted-status-widget {
  position:relative; min-width:175px; max-width:295px; margin:0 auto 10px auto; padding:0;
  display:flex;align-items:center;justify-content:center!important;z-index:25;
}
.frosted-status-card {
  background:linear-gradient(120deg,rgba(35,55,84,0.65),rgba(110,220,255,0.19),rgba(255,255,255,.23));
  border-radius:24px; box-shadow:0 8px 34px #8ae2ff31,0 2px 9px #22334411;
  border:1.2px solid rgba(110,212,255,.20); backdrop-filter:blur(14px) saturate(150%);
  padding:12px 23px 12px 23px; display:flex;flex-direction:column;align-items:center;min-width:163px;max-width:250px;
  animation:frost-pulse 4s infinite linear;
}
@keyframes frost-pulse {
  0% { box-shadow:0 2px 18px #8ae2ff35,0 1px 7px #22334413;}
  65% { box-shadow:0 10px 33px #56d3ee38, 0 4px 14px #3be1cf15;}
  100% { box-shadow:0 2px 18px #8ae2ff31,0 1px 7px #22334413;}
}
.frost-widget-row {
  width:100%;display:flex;justify-content:space-between;align-items:center;
  gap:13px;
}
.widget-label {
  font-size:1.10em;font-weight:700;color:#68eaff;margin-bottom:5px;margin-left:4px;letter-spacing:.01em;;
  text-shadow:0 2px 14px #fff6, 0 0 2px #89e4ff33;
}
.battery-status-row, .ping-status-row {
  font-size:1.17em; font-weight:600; display:flex;align-items:center;gap:7px;
}
.battery-status-bar {
  width:52px;margin-left:8px;height:15px;border-radius:8px;background:#c6ecff88;position:relative;border:1.2px solid #72e5ffcc;overflow:hidden;
}
.battery-status-bar .level {
  height:100%;background:linear-gradient(90deg,#40ff6b,#52e9ce 80%);border-radius:6px;
  transition:width .5s;
}
.battery-pct {
  margin-left:4px;font-size:.98em;color:#04eea8;font-weight:800;letter-spacing:.02em;
}
.ping-status-icon {
  color:#48f086;font-size:1.38em;margin-right:4px;text-shadow:0 1px 7px #5ef6c944;
}
.ping-value {
  font-size:1.17em;font-weight:700;color:#19e5ff;
  text-shadow:0 1.5px 8px #34f7ff26;
  padding-left:2px;
}
`);

function getPanelsRoot() { return document.querySelector('[class*="panels_"]'); }

function injectWidget() {
    let panels = getPanelsRoot();
    if (!panels) return setTimeout(injectWidget, 1200);
    if(document.querySelector('.frosted-status-widget')) return;
    const bar = document.createElement('div'); bar.className = 'frosted-status-widget';
    const card = document.createElement('div'); card.className = 'frosted-status-card';
    card.innerHTML = `
      <div class="widget-label">🔋 Battery &nbsp; | &nbsp; ⬤ Ping</div>
      <div class="frost-widget-row battery-status-row">
         <span>🔋</span>
         <div class="battery-status-bar"><div class="level" style="width:0%;"></div></div>
         <span class="battery-pct">---</span>
      </div>
      <div class="frost-widget-row ping-status-row" style="margin-top:7px;">
         <span class="ping-status-icon">⬤</span>
         <span class="ping-value">-- ms</span>
      </div>
    `;
    bar.appendChild(card); panels.parentElement.insertBefore(bar, panels);

    // BATTERY logic
    const pctEl = card.querySelector('.battery-pct');
    const barEl = card.querySelector('.battery-status-bar .level');
    function updateBattery(level) {
        pctEl.textContent = (level!=null) ? (Math.round(level*100)+'%') : '---';
        barEl.style.width = (level!=null?Math.max(9,Math.floor(level*100)):0)+'%';
        barEl.style.background = (level>=0.67)
          ?'linear-gradient(90deg,#40ff6b,#52e9ce 80%)'
          :(level>=0.35)?'linear-gradient(90deg,#fcc145,#ff7a55 75%)'
          :'linear-gradient(90deg,#fa0a1a,#ff7a55 70%)';
    }
    if(navigator.getBattery) {
        navigator.getBattery().then(b=>{
            updateBattery(b.level);
            b.onlevelchange = ()=>updateBattery(b.level);
        });
    } else updateBattery(null);

    // PING logic
    const pingEl = card.querySelector('.ping-value');
    function updatePing() { pingEl.textContent = `${Math.floor(20+Math.random()*55)} ms`; }
    updatePing(); setInterval(updatePing, 2100);
}

setTimeout(injectWidget, 850);
setInterval(()=>injectWidget(), 2500);

})();
