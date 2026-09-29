// Keep appearance independent of quiz progress and apply it before first paint.
(function () {
  const key = 'yue_fit_reading_theme';
  let saved;
  try { saved = localStorage.getItem(key); } catch (_) {}
  let dark = saved === 'dark' || (saved !== 'light' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  function apply() {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#15191f' : '#f36f61';
    const button = document.getElementById('readingTheme');
    if (button) {
      button.textContent = dark ? '☀ 切換日間' : '☾ 夜間讀題';
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? '夜間讀題已開啟，切換日間模式' : '開啟夜間讀題模式');
    }
  }
  window.toggleReadingTheme = function () {
    dark = !dark;
    try { localStorage.setItem(key, dark ? 'dark' : 'light'); } catch (_) {}
    apply();
  };
  apply();
  document.addEventListener('DOMContentLoaded', apply);
})();
