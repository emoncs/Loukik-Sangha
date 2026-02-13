(() => {
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));

  const clampInt = (n, min, max) => Math.max(min, Math.min(max, n));

  const toMoneyInt = (v) => {
    const n = Number(String(v ?? "").replace(/[^\d]/g, ""));
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
  };

  /* =========================
     (12) Dark Mode
     - Adds/removes: html[data-theme="dark"]
     - Saves to localStorage: theme=dark|light
  ========================= */
  const THEME_KEY = "theme";
  const root = document.documentElement;

  function applyTheme(mode) {
    const m = mode === "dark" ? "dark" : "light";
    if (m === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");

    try { localStorage.setItem(THEME_KEY, m); } catch {}

    const icon = $("#themeIcon");
    const text = $("#themeText");
    if (icon) icon.className = m === "dark" ? "fa-solid fa-moon" : "fa-solid fa-sun";
    if (text) text.textContent = m === "dark" ? "Dark" : "Light";

    const btn = $("#themeToggle");
    if (btn) btn.setAttribute("aria-pressed", m === "dark" ? "true" : "false");
  }

  function initTheme() {
    let saved = "";
    try { saved = localStorage.getItem(THEME_KEY) || ""; } catch {}

    if (saved === "dark" || saved === "light") {
      applyTheme(saved);
      return;
    }

    let prefersDark = false;
    try {
      prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {}

    applyTheme(prefersDark ? "dark" : "light");
  }

  function toggleTheme() {
    const isDark = root.getAttribute("data-theme") === "dark";
    applyTheme(isDark ? "light" : "dark");
  }

  initTheme();

  const themeBtn = $("#themeToggle");
  themeBtn?.addEventListener("click", toggleTheme);


  /* =========================
     (23) Donation QR Download
     - donationQR: <img id="donationQR" src="Images/bkash-qr.png">
     - downloadQRBtn: <button id="downloadQRBtn">
  ========================= */
  async function downloadImageAsFile(imgEl, filename = "donation-qr.png") {
    const src = imgEl?.getAttribute("src");
    if (!src) return;

    const res = await fetch(src, { cache: "no-cache" });
    const blob = await res.blob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const qrImg = $("#donationQR");
  const qrBtn = $("#downloadQRBtn");
  qrBtn?.addEventListener("click", async () => {
    try {
      await downloadImageAsFile(qrImg, "LoukikSangha-Donation-QR.png");
    } catch {}
  });


  /* =========================
     (33) Donation Calculator
     - donationAmount: input
     - donationCalcResult: output area (div/p)
     Optional:
     - quick buttons: <button data-amt="500">৳500</button>
  ========================= */
  const amtInput = $("#donationAmount");
  const out = $("#donationCalcResult");

  const CONFIG = {
    min: 10,
    max: 500000,
    rounding: 1,
    items: [
      { label: "Food support", unitCost: 150, unitText: "meal(s)" },
      { label: "Medicine support", unitCost: 300, unitText: "basic pack(s)" },
      { label: "Education support", unitCost: 500, unitText: "day(s) of study" }
    ]
  };

  function formatBDT(n) {
    const x = Number(n || 0);
    return x.toLocaleString("en-US");
  }

  function calcLines(amount) {
    const lines = CONFIG.items.map(it => {
      const units = Math.floor(amount / it.unitCost);
      return { ...it, units };
    });

    const best = [...lines].sort((a, b) => b.units - a.units)[0];
    return { lines, best };
  }

  function renderCalc(amount) {
    if (!out) return;

    const a = clampInt(amount, CONFIG.min, CONFIG.max);
    if (!a) {
      out.textContent = "Enter an amount to see the impact.";
      return;
    }

    const { lines, best } = calcLines(a);

    const parts = [];
    parts.push(`Estimated impact for ৳${formatBDT(a)}:`);

    lines.forEach(it => {
      parts.push(`• ${it.label}: ~${it.units} ${it.unitText}`);
    });

    if (best && best.units > 0) {
      parts.push(`Tip: This amount can cover the most in “${best.label}”.`);
    }

    out.textContent = parts.join("\n");
  }

  function handleCalcInput() {
    const amount = toMoneyInt(amtInput?.value);
    renderCalc(amount);
  }

  amtInput?.addEventListener("input", handleCalcInput);
  amtInput?.addEventListener("blur", () => {
    if (!amtInput) return;
    const n = clampInt(toMoneyInt(amtInput.value), CONFIG.min, CONFIG.max);
    if (!n) return;
    amtInput.value = String(n);
    renderCalc(n);
  });

  $$("[data-amt]").forEach(btn => {
    btn.addEventListener("click", () => {
      const v = toMoneyInt(btn.getAttribute("data-amt"));
      if (!amtInput) return;
      amtInput.value = String(v);
      renderCalc(v);
      amtInput.focus();
    });
  });

  if (amtInput && out) renderCalc(toMoneyInt(amtInput.value));
})();
