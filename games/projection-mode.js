/* Display-only enhancement for the published static game. No game state is changed. */
(() => {
  const storageKey = "yue-card-maker-projection-mode";
  const modeClass = "projection-mode";
  const rowSelector = '[class*="games-module__"][class*="__settingRow"]';
  let enabled = false;

  try {
    enabled = localStorage.getItem(storageKey) === "on";
  } catch (_) {
    // Storage can be disabled in private browsing; the switch still works.
  }

  function render() {
    document.documentElement.classList.toggle(modeClass, enabled);
    document.querySelectorAll('[data-projection-toggle]').forEach(button => {
      button.setAttribute("aria-pressed", String(enabled));
      button.textContent = enabled ? "☾ 投影低亮度：開" : "☾ 投影低亮度：關";
    });
  }

  function addControl() {
    const row = document.querySelector(rowSelector);
    if (!row || row.querySelector('[data-projection-toggle]')) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "projection-toggle";
    button.dataset.projectionToggle = "";
    button.setAttribute("aria-label", "切換投影低亮度高對比模式");
    button.addEventListener("click", () => {
      enabled = !enabled;
      try { localStorage.setItem(storageKey, enabled ? "on" : "off"); } catch (_) {}
      render();
    });
    row.append(button);
    render();
  }

  render();
  // Wait until the exported React page has loaded before extending its controls.
  function start() {
    addControl();
    // Next.js can replace the control row during navigation.
    new MutationObserver(addControl).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
})();
