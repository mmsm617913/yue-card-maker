// Keep appearance independent of quiz progress and apply it before first paint.
(function () {
  const key = 'yue_fit_reading_theme';
  let saved;
  try { saved = localStorage.getItem(key); } catch (_) {}
  let size = 'normal';
  try { size = localStorage.getItem('yue_fit_reading_size') || 'normal'; } catch (_) {}
  const sizes = {small:.9,normal:1,large:1.15,xlarge:1.3};
  if (!Object.prototype.hasOwnProperty.call(sizes,size)) size='normal';
  let dark = saved === 'dark' || (saved !== 'light' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  function apply() {
    document.documentElement.style.setProperty('--reading-scale', sizes[size]);
    document.querySelectorAll('[data-reading-size]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.readingSize===size)));
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#15191f' : '#f36f61';
    const button = document.getElementById('readingTheme');
    if (button) {
      button.textContent = dark ? '☀ 日間' : '☾ 夜間';
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? '夜間讀題已開啟，切換日間模式' : '開啟夜間讀題模式');
    }
  }
  window.toggleReadingTheme = function () {
    dark = !dark;
    try { localStorage.setItem(key, dark ? 'dark' : 'light'); } catch (_) {}
    apply();
  };
  window.setReadingSize = function (value) {
    if (!Object.prototype.hasOwnProperty.call(sizes,value)) return;
    size=value;
    try {localStorage.setItem('yue_fit_reading_size',size);} catch (_) {}
    apply();
  };
  window.syncReadingControls = function(id) {
    const controls=document.getElementById('readingControls');
    const host=id==='quiz'?document.querySelector('#quiz .screen-header'):document.getElementById('readingControlsHome');
    if(controls&&host&&controls.parentElement!==host)host.appendChild(controls);
    const menu=document.querySelector('.reading-size-menu');
    if(menu)menu.open=false;
  };
  apply();
  document.addEventListener('DOMContentLoaded', apply);
})();
