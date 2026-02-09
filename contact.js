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

  const revealEls = Array.from(document.querySelectorAll("[data-reveal]"));
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("reveal-in");
        io.unobserve(en.target);
      });
    }, { threshold: 0.12 });

    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("reveal-in"));
  }

  // EmailJS
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

  /* =========================
     Live Direction UI (visual + distance)
  ========================= */
  const locDiagram = $("#locDiagram");
  const originLabel = $("#originLabel");
  const locMetrics = $("#locMetrics");
  const locSub = $("#locSub");
  const useMyLocationBtn = $("#useMyLocation");
  const openDirections = $("#openDirections");
  const locBlock = document.querySelector(".loc-block");

  const SANGHA_MAP_LINK =
    locBlock?.getAttribute("data-sangha-map") ||
    "https://maps.app.goo.gl/FDKn38FqBa7oHdXX6";

  const LOUKIK_SANGHA = { lat: 22.895207, lng: 91.370986 };
  const DHAKA_CENTER = { lat: 23.8103, lng: 90.4125 };

  const toRad = (d) => d * Math.PI / 180;

  const haversineKm = (a, b) => {
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
  };

  const renderMetrics = (items) => {
    if (!locMetrics) return;
    locMetrics.innerHTML = items.map(x => `
      <span class="metric-pill"><i class="${x.icon}"></i>${x.text}</span>
    `).join("");
  };

  const setDirectionState = (state) => {
    if (!locDiagram) return;
    if (state === "loading") locDiagram.classList.add("is-loading");
    else locDiagram.classList.remove("is-loading");
  };

  const setOriginName = (coords) => {
    if (!originLabel) return "Your Location";
    const dToDhaka = haversineKm({ lat: coords.lat, lng: coords.lng }, DHAKA_CENTER);
    const name = dToDhaka <= 30 ? "Dhaka" : "Your Location";
    originLabel.textContent = name;
    return name;
  };

  const buildGoogleDirLink = (origin, destination) => {
    return (
      `https://www.google.com/maps/dir/?api=1` +
      `&origin=${encodeURIComponent(origin.lat + "," + origin.lng)}` +
      `&destination=${encodeURIComponent(destination.lat + "," + destination.lng)}` +
      `&travelmode=driving`
    );
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      renderMetrics([{ icon: "fa-solid fa-circle-xmark", text: "Geolocation not supported" }]);
      return;
    }

    setDirectionState("loading");
    renderMetrics([{ icon: "fa-solid fa-spinner", text: "Detecting your location..." }]);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const user = { lat: pos.coords.latitude, lng: pos.coords.longitude };

        const originName = setOriginName(user);

        setDirectionState("ready");
        if (locSub) locSub.textContent = `${originName} → Loukik Sangha (Live)`;

        const km = haversineKm(user, LOUKIK_SANGHA);
        const rounded = km.toFixed(1);

        renderMetrics([
          { icon: "fa-solid fa-location-dot", text: `Origin: ${originName}` },
          { icon: "fa-solid fa-road", text: `Approx distance: ${rounded} km` },
          { icon: "fa-solid fa-bolt", text: "Animated route" }
        ]);

        if (openDirections) {
          openDirections.href = buildGoogleDirLink(user, LOUKIK_SANGHA);
        }
      },
      () => {
        setDirectionState("ready");
        renderMetrics([
          { icon: "fa-solid fa-circle-exclamation", text: "Location permission denied" },
          { icon: "fa-solid fa-map", text: "Open map to navigate" }
        ]);
        if (openDirections) openDirections.href = SANGHA_MAP_LINK;
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  useMyLocationBtn?.addEventListener("click", useMyLocation);

  window.addEventListener("DOMContentLoaded", () => {
    if (openDirections) openDirections.href = SANGHA_MAP_LINK;
    setDirectionState("loading");
    renderMetrics([{ icon: "fa-solid fa-location-crosshairs", text: "Click “Use My Location” for live direction" }]);
    setDirectionState("ready");
  });
})();
