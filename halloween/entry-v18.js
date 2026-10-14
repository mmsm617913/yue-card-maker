/* Optional direct theme links; normal entry keeps the existing default. */
(() => {
  if (new URLSearchParams(location.search).get('theme') !== 'halloween') return;
  let done = false;
  const choose = () => {
    if (done) return;
    const button = [...document.querySelectorAll('button')].find(
      el => (el.textContent.includes('搗蛋鬼找朋友') || el.textContent.includes('月來月搗蛋') || el.textContent.includes('萬聖節派對'))
    );
    if (!button) return;
    done = true;
    observer.disconnect();
    button.click();
  };
  const observer = new MutationObserver(choose);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  choose();
  setTimeout(() => observer.disconnect(), 20000);
})();
