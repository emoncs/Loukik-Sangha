// contact.js
(() => {
  const $ = (s, p = document) => p.querySelector(s);

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav-link, .menu .btn").forEach(a => {
    const page = (a.getAttribute("data-page") || "").toLowerCase();
    if (page && page === current) a.classList.add("active");
  });

  const navToggle = $("#navToggle");
  const navMenu = $("#navMenu");

  if (navToggle && navMenu) {
    const setExpanded = (v) => navToggle.setAttribute("aria-expanded", v ? "true" : "false");
    const close = () => { navMenu.classList.remove("open"); setExpanded(false); };
    const open = () => { navMenu.classList.add("open"); setExpanded(true); };

    navToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      navMenu.classList.contains("open") ? close() : open();
    });

    document.addEventListener("click", (e) => {
      if (!navMenu.classList.contains("open")) return;
      if (navMenu.contains(e.target) || navToggle.contains(e.target)) return;
      close();
    });

    navMenu.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a) close();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) close();
    });
  }

  // FAQ accordion
  document.querySelectorAll(".faq-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      const ans = btn.nextElementSibling;
      btn.setAttribute("aria-expanded", String(!expanded));
      if (ans) ans.hidden = expanded;
      const ic = btn.querySelector(".faq-ic i");
      if (ic) ic.style.transform = expanded ? "rotate(0deg)" : "rotate(180deg)";
    });
  });

  const EMAILJS_PUBLIC_KEY = "qKiQPRBM2rIz3G6MU";
  const EMAILJS_SERVICE_ID = "service_ej46fev";
  const EMAILJS_TEMPLATE_ID = "template_1uzt9a7";

  if (window.emailjs && EMAILJS_PUBLIC_KEY) {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  const form = $("#contactForm");
  const sendBtn = $("#sendBtn");
  const statusEl = $("#status");

  const setStatus = (text, ok = false) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.style.color = ok ? "#16a34a" : "#64748b";
  };

  const setError = (text) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.style.color = "#ef4444";
  };

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const hp = form.querySelector('input[name="website"]');
    if (hp && String(hp.value || "").trim()) return;

    const name = form.querySelector('input[name="from_name"]')?.value?.trim() || "";
    const email = form.querySelector('input[name="reply_to"]')?.value?.trim() || "";
    const subject = form.querySelector('input[name="subject"]')?.value?.trim() || "";
    const message = form.querySelector('textarea[name="message"]')?.value?.trim() || "";

    if (!name || !email || !subject || !message) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!window.emailjs) {
      setError("Email service not loaded. Please try again.");
      return;
    }

    try {
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.style.opacity = ".85";
      }
      setStatus("Sending...");

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        from_name: name,
        reply_to: email,
        subject,
        message
      });

      form.reset();
      setStatus("Message sent successfully ✅", true);
    } catch (err) {
      setError("Failed to send. Please try again.");
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.style.opacity = "1";
      }
    }
  });
})();
