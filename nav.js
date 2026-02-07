/* ===============================
   Mobile Navigation Toggle
   Loukik Sangha
================================ */

document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("navToggle");
  const navMenu   = document.getElementById("navMenu");

  if (!navToggle || !navMenu) return;

  const setExpanded = (v) => {
    navToggle.setAttribute("aria-expanded", v ? "true" : "false");
  };

  const openMenu = () => {
    navMenu.classList.add("open");
    setExpanded(true);
  };

  const closeMenu = () => {
    navMenu.classList.remove("open");
    setExpanded(false);
  };

  // Toggle button click
  navToggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    navMenu.classList.contains("open") ? closeMenu() : openMenu();
  });

  // Click outside → close
  document.addEventListener("click", (e) => {
    if (!navMenu.classList.contains("open")) return;
    if (navMenu.contains(e.target) || navToggle.contains(e.target)) return;
    closeMenu();
  });

  // Click menu link → close
  navMenu.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link) closeMenu();
  });

  // Resize to desktop → auto close
  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) closeMenu();
  });

  // Footer year
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});
