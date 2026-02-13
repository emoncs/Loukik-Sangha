// features.js — NO NAV / NO THEME / NO YEAR
(() => {
  const $ = (s, p = document) => p.querySelector(s);

  function initRitualModal() {
    const modal = $("#ritualModal");
    const backdrop = $("#ritualBackdrop");
    const closeBtn = $("#ritualClose");
    const okBtn = $("#ritualOk");

    if (!modal || !backdrop || !closeBtn || !okBtn) return;

    // prevent double-binding
    if (modal.dataset.bound === "1") return;
    modal.dataset.bound = "1";

    const open = () => {
      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("nav-lock"); // reuse existing CSS overflow lock
    };

    const close = () => {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("nav-lock");
    };

    backdrop.addEventListener("click", close);
    closeBtn.addEventListener("click", close);
    okBtn.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    // ✅ Optional: open once per day (BD time)
    const key = "ls_ritual_seen_ymd";
    const bd = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
    const ymd = `${bd.getFullYear()}-${String(bd.getMonth() + 1).padStart(2, "0")}-${String(bd.getDate()).padStart(2, "0")}`;

    let seen = "";
    try { seen = localStorage.getItem(key) || ""; } catch {}

    if (seen !== ymd) {
      open();
      try { localStorage.setItem(key, ymd); } catch {}
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRitualModal);
  } else {
    initRitualModal();
  }
})();
