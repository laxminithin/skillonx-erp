(async () => {
  const widths = [360, 390, 412, 768, 1024, 1280, 1440, 1920];
  const routes = window.__P11_ROUTES;
  const results = [];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (const route of routes) {
    for (const w of widths) {
      const f = document.createElement('iframe');
      f.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:900px;border:0;opacity:0;pointer-events:none;z-index:-1`;
      f.src = route;
      document.body.appendChild(f);
      await new Promise((r) => { f.onload = r; });
      await sleep(2200);
      const d = f.contentDocument;
      const sw = d.documentElement.scrollWidth;
      const offenders = [];
      for (const el of d.body.querySelectorAll('*')) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.right <= w + 1) continue;
        let p = el.parentElement; let clipped = false;
        while (p && p !== d.body) {
          const ox = f.contentWindow.getComputedStyle(p).overflowX;
          if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') { clipped = true; break; }
          p = p.parentElement;
        }
        if (!clipped) offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} r=${Math.round(rect.right)}`);
      }
      const unlabeled = [...d.querySelectorAll('input:not([type=hidden]),select,textarea')].filter((i) => {
        if (i.getAttribute('aria-label') || i.getAttribute('aria-labelledby') || i.closest('label')) return false;
        return !(i.id && d.querySelector(`label[for="${i.id}"]`));
      }).length;
      const unnamedButtons = [...d.querySelectorAll('button')].filter((b) => !(b.textContent.trim() || b.getAttribute('aria-label') || b.title)).length;
      const h1 = d.querySelector('h1')?.textContent?.trim() ?? null;
      results.push({ route, w, sw, overflow: sw > w + 1, offenders: offenders.slice(0, 4), unlabeled, unnamedButtons, h1 });
      f.remove();
    }
  }
  return JSON.stringify(results);
})()
