/* Optional direct theme links; retry until React has attached its handlers. */
(() => {
  if (new URLSearchParams(location.search).get('theme') !== 'halloween') return;
  const labels = ['搗蛋鬼找朋友', '月來月搗蛋', '萬聖節派對'];
  let done = false;
  const choose = () => {
    if (done) return;
    const button = [...document.querySelectorAll('button')].find(
      el => labels.some(label => el.textContent.includes(label))
    );
    if (!button) return;
    if ([...button.classList].some(c => c === 'active' || c.endsWith('__active'))) {
      done = true;
      clearInterval(retry);
      delete document.documentElement.dataset.halloweenEntry;
      return;
    }
    button.click();
  };
  const retry = setInterval(choose, 150);
  choose();
  setTimeout(() => { clearInterval(retry); delete document.documentElement.dataset.halloweenEntry; }, 20000);
})();
