/* nav.js — Mobile menu fix (guaranteed) */
(function () {
  function initNav() {
    const btn  = document.getElementById("navToggle");
    const menu = document.getElementById("navMenu");
    if (!btn || !menu) return false;

    // prevent double-binding
    if (btn.dataset.bound === "1") return true;
    btn.dataset.bound = "1";

    const setExpanded = (v) => btn.setAttribute("aria-expanded", v ? "true" : "false");

    const openMenu = () => {
      menu.classList.add("open");
      // fallback (if CSS fails)
      menu.style.display = "flex";
      setExpanded(true);
    };

    const closeMenu = () => {
      menu.classList.remove("open");
      // fallback for mobile where CSS uses display:none
      if (window.innerWidth <= 860) menu.style.display = "none";
      else menu.style.display = "";
      setExpanded(false);
    };

    const toggleMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (menu.classList.contains("open")) closeMenu();
      else openMenu();
    };

    // click + touch support
    btn.addEventListener("click", toggleMenu, { passive: false });
    btn.addEventListener("touchstart", toggleMenu, { passive: false });

    // click outside closes
    document.addEventListener("click", (e) => {
      if (!menu.classList.contains("open")) return;
      if (menu.contains(e.target) || btn.contains(e.target)) return;
      closeMenu();
    });

    // link click closes
    menu.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("a");
      if (a) closeMenu();
    });

    // resize → reset
    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) {
        menu.style.display = ""; // desktop layout
        menu.classList.remove("open");
        setExpanded(false);
      } else {
        if (!menu.classList.contains("open")) menu.style.display = "none";
      }
    });

    // init correct state
    if (window.innerWidth <= 860) {
      if (!menu.classList.contains("open")) menu.style.display = "none";
      setExpanded(false);
    }

    // footer year
    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();

    return true;
  }

  // Try now
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNav);
  } else {
    initNav();
  }

  // Extra retry (in case something loads late)
  setTimeout(initNav, 300);
})();
