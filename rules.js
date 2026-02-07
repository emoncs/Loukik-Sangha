// rules.js (Dropdown + localStorage, works on Vercel)
(() => {
  const $ = (s, p = document) => p.querySelector(s);

  // Year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Active nav
  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav-link, .menu .btn").forEach(a => {
    const page = (a.getAttribute("data-page") || "").toLowerCase();
    if (page && page === current) a.classList.add("active");
  });

  // Mobile nav toggle
  const navToggle = $("#navToggle");
  const navMenu = $("#navMenu");
  if (navToggle && navMenu) {
    const close = () => {
      navMenu.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    };
    navToggle.addEventListener("click", () => {
      const open = !navMenu.classList.contains("open");
      navMenu.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", (e) => {
      if (!navMenu.classList.contains("open")) return;
      if (navMenu.contains(e.target) || navToggle.contains(e.target)) return;
      close();
    });
    window.addEventListener("resize", () => { if (window.innerWidth > 860) close(); });
  }

  // Language packs
  const TEXT = {
    en: {
      pillText: "Hindu Charity & Welfare",
      pageTitle: "Rules & Guidelines",
      pageSub:
        "Clear policies for donations, membership, and monthly installments to ensure transparency and dharma-driven service.",

      langTitle: "Language",
      langSub: "Choose to translate rules",

      miniNote: "Transparency • Respect • Seva",
      purposeKicker: "Our Mission",
      heroCardTitle: "Purpose",
      heroCardText:
        "Support community welfare, emergency help, religious events, and charity work with proper records.",

      p1: "Transparent records & approvals",
      p2: "Welfare-first spending policy",
      p3: "Respectful community conduct",

      pm1: "Clear Rules",
      pm2: "Proper Accounting",
      pm3: "Community Support",

      donorTitle: "Open Donation",
      donorText:
        "Anyone can donate at any time using the available donation methods. Donations are used strictly for welfare purposes.",
      memberTitle: "Membership",
      memberText:
        "Members must keep their information correct and follow respectful behavior inside the organization.",
      installTitle: "Monthly Installment",
      installText:
        "Members pay monthly installments by the last date set by the organization. Installments are not refundable.",

      orgRulesTitle: "Organization Rules",
      donationRulesTitle: "Donation Rules",
      installmentRulesTitle: "Monthly Installment Rules",
      disciplineTitle: "Respect & Discipline",

      installNotice:
        "Installments are a contribution to collective welfare and are not refundable. Late payments may affect membership benefits.",

      conductTitle: "Community Conduct",
      adminTitle: "Admin & Records",

      orgRules: [
        { ico: "fa-hands-praying", b: "Dharma & Seva:", t: "All activities must follow honesty, respect, and service to the community." },
        { ico: "fa-id-card", b: "Accurate Info:", t: "Members must keep name, phone, and address updated." },
        { ico: "fa-user-shield", b: "Privacy:", t: "Personal member information is handled carefully and shared only when necessary." },
        { ico: "fa-scale-balanced", b: "Fairness:", t: "No discrimination; all members and donors are treated respectfully." }
      ],

      donationRules: [
        { ico: "fa-hand-holding-heart", b: "Anyone can donate:", t: "Donations are open for all—members and non-members." },
        { ico: "fa-receipt", b: "Record & Proof:", t: "Every donation should include date, amount, and payment method for record keeping." },
        { ico: "fa-circle-check", b: "Proper use:", t: "Donations are used only for welfare, charity, religious programs, and approved expenses." },
        { ico: "fa-ban", b: "No personal benefit:", t: "Organization funds cannot be used for personal gain." }
      ],

      installmentRules: [
        { ico: "fa-calendar-check", b: "Pay by last date:", t: "Members must pay monthly installments within the last date set by the organization." },
        { ico: "fa-rotate-left", b: "Non-refundable:", t: "Monthly installments are not refundable under any condition." },
        { ico: "fa-triangle-exclamation", b: "Late payment:", t: "Late installments may pause member benefits/participation until cleared." },
        { ico: "fa-file-invoice", b: "Tracking:", t: "Installments will be tracked and shown in member records for transparency." }
      ],

      conduct: [
        "No abusive language, threats, or harassment.",
        "Respect religious values, elders, and organizational decisions.",
        "Avoid spreading misinformation or conflict in the community."
      ],
      admin: [
        "Any expense must be approved by authorized admins and documented.",
        "Admins maintain transparent records of income/expenses and reports when needed.",
        "Fraudulent activity may result in removal from membership."
      ]
    },

    bn: {
      pillText: "হিন্দু দাতব্য ও কল্যাণ সংস্থা",
      pageTitle: "নিয়মাবলি ও নির্দেশনা",
      pageSub:
        "দান, সদস্যপদ এবং মাসিক কিস্তি—সব কিছুর জন্য স্বচ্ছ ও সেবামূলক নীতিমালা।",

      langTitle: "ভাষা",
      langSub: "নিয়ম অনুবাদ করতে ভাষা বাছাই করুন",

      miniNote: "স্বচ্ছতা • সম্মান • সেবা",
      purposeKicker: "আমাদের লক্ষ্য",
      heroCardTitle: "উদ্দেশ্য",
      heroCardText:
        "সঠিক হিসাব-নিকাশের মাধ্যমে সমাজকল্যাণ, জরুরি সহায়তা, ধর্মীয় আয়োজন ও দাতব্য কাজ পরিচালনা।",

      p1: "স্বচ্ছ হিসাব ও অনুমোদন",
      p2: "কল্যাণমুখী ব্যয়নীতি",
      p3: "সম্মানজনক আচরণবিধি",

      pm1: "পরিষ্কার নিয়ম",
      pm2: "সঠিক হিসাব",
      pm3: "সমাজসেবা",

      donorTitle: "সবার জন্য দান",
      donorText:
        "যেকোনো ব্যক্তি যেকোনো সময় উপলব্ধ পদ্ধতিতে দান করতে পারবেন। দানের অর্থ শুধুমাত্র কল্যাণমূলক কাজে ব্যয় হবে।",
      memberTitle: "সদস্যপদ",
      memberText:
        "সদস্যদের তথ্য (নাম, ফোন, ঠিকানা) সঠিক রাখা এবং সংগঠনের শৃঙ্খলা মেনে চলা বাধ্যতামূলক।",
      installTitle: "মাসিক কিস্তি",
      installText:
        "সদস্যরা নির্ধারিত শেষ তারিখের মধ্যে মাসিক কিস্তি পরিশোধ করবেন। কিস্তির অর্থ ফেরতযোগ্য নয়।",

      orgRulesTitle: "সংগঠনের নিয়ম",
      donationRulesTitle: "দানের নিয়ম",
      installmentRulesTitle: "মাসিক কিস্তির নিয়ম",
      disciplineTitle: "সম্মান ও শৃঙ্খলা",

      installNotice:
        "মাসিক কিস্তি সামষ্টিক কল্যাণের জন্য অবদান—এটি ফেরতযোগ্য নয়। দেরিতে পরিশোধ করলে সুবিধা/অংশগ্রহণ সাময়িকভাবে স্থগিত হতে পারে।",

      conductTitle: "আচরণবিধি",
      adminTitle: "অ্যাডমিন ও হিসাব",

      orgRules: [
        { ico: "fa-hands-praying", b: "ধর্ম ও সেবা:", t: "সকল কার্যক্রম সততা, সম্মান এবং সেবার আদর্শে পরিচালিত হবে।" },
        { ico: "fa-id-card", b: "সঠিক তথ্য:", t: "সদস্যদের নাম, ফোন, ঠিকানা হালনাগাদ রাখা বাধ্যতামূলক।" },
        { ico: "fa-user-shield", b: "গোপনীয়তা:", t: "সদস্যদের ব্যক্তিগত তথ্য সতর্কতার সাথে সংরক্ষণ করা হবে।" },
        { ico: "fa-scale-balanced", b: "ন্যায়সঙ্গততা:", t: "কোনো বৈষম্য নয়—সদস্য/দাতাদের সম্মানের সাথে আচরণ করা হবে।" }
      ],

      donationRules: [
        { ico: "fa-hand-holding-heart", b: "যে কেউ দান করতে পারবেন:", t: "সদস্য বা অ-সদস্য—সবার জন্য দান উন্মুক্ত।" },
        { ico: "fa-receipt", b: "রেকর্ড ও প্রমাণ:", t: "প্রতিটি দানের তারিখ, পরিমাণ ও পেমেন্ট পদ্ধতি সংরক্ষণ করা হবে।" },
        { ico: "fa-circle-check", b: "সঠিক ব্যবহার:", t: "দান শুধুমাত্র কল্যাণ, দাতব্য, ধর্মীয় অনুষ্ঠান ও অনুমোদিত ব্যয়ে ব্যবহৃত হবে।" },
        { ico: "fa-ban", b: "ব্যক্তিগত লাভ নয়:", t: "সংগঠনের অর্থ ব্যক্তিগত উদ্দেশ্যে ব্যবহার করা যাবে না।" }
      ],

      installmentRules: [
        { ico: "fa-calendar-check", b: "শেষ তারিখের মধ্যে পরিশোধ:", t: "সদস্যরা নির্ধারিত শেষ তারিখের মধ্যে মাসিক কিস্তি দেবেন।" },
        { ico: "fa-rotate-left", b: "ফেরতযোগ্য নয়:", t: "মাসিক কিস্তির অর্থ কোনো অবস্থাতেই ফেরতযোগ্য নয়।" },
        { ico: "fa-triangle-exclamation", b: "দেরি হলে:", t: "বকেয়া থাকলে সুবিধা/অংশগ্রহণ সাময়িকভাবে বন্ধ থাকতে পারে।" },
        { ico: "fa-file-invoice", b: "ট্র্যাকিং:", t: "স্বচ্ছতার জন্য কিস্তির তথ্য সদস্য রেকর্ডে সংরক্ষিত থাকবে।" }
      ],

      conduct: [
        "গালাগালি, হুমকি বা হয়রানি করা যাবে না।",
        "ধর্মীয় মূল্যবোধ, বয়োজ্যেষ্ঠ ও সংগঠনের সিদ্ধান্তকে সম্মান করতে হবে।",
        "ভুল তথ্য ছড়ানো বা বিভেদ তৈরি করা থেকে বিরত থাকতে হবে।"
      ],
      admin: [
        "যেকোনো ব্যয় অনুমোদিত অ্যাডমিনের অনুমোদন সাপেক্ষে এবং ডকুমেন্টসহ হবে।",
        "আয়-ব্যয়ের স্বচ্ছ হিসাব রাখা ও প্রয়োজনে রিপোর্ট প্রদান করা হবে।",
        "প্রতারণা প্রমাণিত হলে সদস্যপদ বাতিল হতে পারে।"
      ]
    },

    hi: {
      pillText: "हिंदू दान एवं कल्याण संस्था",
      pageTitle: "नियम एवं दिशानिर्देश",
      pageSub:
        "दान, सदस्यता और मासिक किस्तों के लिए स्पष्ट नीतियाँ—पारदर्शिता और सेवा भावना के लिए।",

      langTitle: "भाषा",
      langSub: "नियम अनुवाद के लिए भाषा चुनें",

      miniNote: "पारदर्शिता • सम्मान • सेवा",
      purposeKicker: "हमारा लक्ष्य",
      heroCardTitle: "उद्देश्य",
      heroCardText:
        "सामुदायिक कल्याण, आपात सहायता, धार्मिक कार्यक्रम और दान कार्यों को सही रिकॉर्ड के साथ संचालित करना।",

      p1: "पारदर्शी रिकॉर्ड व अनुमोदन",
      p2: "कल्याण-प्रथम खर्च नीति",
      p3: "सम्मानजनक आचरण नियम",

      pm1: "स्पष्ट नियम",
      pm2: "सही लेखा-जोखा",
      pm3: "समुदाय सहायता",

      donorTitle: "सबके लिए दान",
      donorText:
        "कोई भी व्यक्ति किसी भी समय उपलब्ध तरीकों से दान कर सकता है। दान राशि केवल कल्याण कार्यों में उपयोग होगी।",
      memberTitle: "सदस्यता",
      memberText:
        "सदस्यों को अपनी जानकारी (नाम, फोन, पता) सही रखनी होगी और संगठन के अनुशासन का पालन करना होगा।",
      installTitle: "मासिक किस्त",
      installText:
        "सदस्य संगठन द्वारा निर्धारित अंतिम तिथि तक मासिक किस्त जमा करेंगे। किस्त राशि वापस नहीं की जाएगी।",

      orgRulesTitle: "संगठन के नियम",
      donationRulesTitle: "दान के नियम",
      installmentRulesTitle: "मासिक किस्त के नियम",
      disciplineTitle: "सम्मान एवं अनुशासन",

      installNotice:
        "मासिक किस्त सामूहिक कल्याण के लिए योगदान है और यह वापस नहीं की जाती। देर से भुगतान पर सदस्य लाभ/भागीदारी अस्थायी रूप से रुक सकती है।",

      conductTitle: "आचरण नियम",
      adminTitle: "एडमिन व रिकॉर्ड",

      orgRules: [
        { ico: "fa-hands-praying", b: "धर्म व सेवा:", t: "सभी गतिविधियाँ ईमानदारी, सम्मान और सेवा भावना के साथ हों।" },
        { ico: "fa-id-card", b: "सही जानकारी:", t: "सदस्य अपना नाम, फोन और पता अपडेट रखें।" },
        { ico: "fa-user-shield", b: "गोपनीयता:", t: "सदस्य की व्यक्तिगत जानकारी सावधानी से रखी जाएगी।" },
        { ico: "fa-scale-balanced", b: "निष्पक्षता:", t: "कोई भेदभाव नहीं—सभी के साथ सम्मानजनक व्यवहार।" }
      ],

      donationRules: [
        { ico: "fa-hand-holding-heart", b: "कोई भी दान कर सकता है:", t: "सदस्य या गैर-सदस्य—सभी के लिए दान खुला है।" },
        { ico: "fa-receipt", b: "रिकॉर्ड व प्रमाण:", t: "हर दान में तारीख, राशि और भुगतान माध्यम शामिल होना चाहिए।" },
        { ico: "fa-circle-check", b: "सही उपयोग:", t: "दान राशि केवल कल्याण, धार्मिक कार्यक्रम और स्वीकृत खर्च में उपयोग होगी।" },
        { ico: "fa-ban", b: "व्यक्तिगत लाभ नहीं:", t: "संगठन की राशि व्यक्तिगत लाभ के लिए उपयोग नहीं हो सकती।" }
      ],

      installmentRules: [
        { ico: "fa-calendar-check", b: "अंतिम तिथि तक भुगतान:", t: "सदस्य निर्धारित अंतिम तिथि तक मासिक किस्त जमा करें।" },
        { ico: "fa-rotate-left", b: "रिफंड नहीं:", t: "मासिक किस्त किसी भी स्थिति में वापस नहीं की जाएगी।" },
        { ico: "fa-triangle-exclamation", b: "देर से भुगतान:", t: "देरी होने पर लाभ/भागीदारी अस्थायी रूप से रोकी जा सकती है।" },
        { ico: "fa-file-invoice", b: "ट्रैकिंग:", t: "पारदर्शिता हेतु किस्त रिकॉर्ड सदस्य प्रोफाइल में दिखाई जा सकती है।" }
      ],

      conduct: [
        "गाली-गलौज, धमकी या उत्पीड़न नहीं।",
        "धार्मिक मूल्यों, वरिष्ठों और संगठन के निर्णयों का सम्मान करें।",
        "गलत सूचना या विवाद फैलाने से बचें।"
      ],
      admin: [
        "हर खर्च स्वीकृत एडमिन की अनुमति और दस्तावेज़ के साथ होगा।",
        "आय-व्यय का पारदर्शी रिकॉर्ड रखा जाएगा और जरूरत पर रिपोर्ट दी जाएगी।",
        "धोखाधड़ी पर सदस्यता समाप्त की जा सकती है।"
      ]
    }
  };

  const setText = (id, value) => {
    const el = $("#" + id);
    if (el) el.textContent = value;
  };

  const renderRuleList = (ulId, items) => {
    const ul = $("#" + ulId);
    if (!ul) return;
    ul.innerHTML = items.map(x => `
      <li class="rule-item">
        <span class="rule-ico"><i class="fa-solid ${x.ico}"></i></span>
        <p class="rule-text"><b>${x.b}</b> ${x.t}</p>
      </li>
    `).join("");
  };

  const renderMiniList = (ulId, items) => {
    const ul = $("#" + ulId);
    if (!ul) return;
    ul.innerHTML = items.map(t => `<li>${t}</li>`).join("");
  };

  const applyLang = (lang) => {
    const T = TEXT[lang] || TEXT.en;

    setText("pillText", T.pillText);
    setText("pageTitle", T.pageTitle);
    setText("pageSub", T.pageSub);

    setText("langTitle", T.langTitle);
    setText("langSub", T.langSub);

    setText("miniNoteText", T.miniNote);

    // Purpose card
    setText("purposeKicker", T.purposeKicker);
    setText("heroCardTitle", T.heroCardTitle);
    setText("heroCardText", T.heroCardText);
    setText("p1", T.p1);
    setText("p2", T.p2);
    setText("p3", T.p3);
    setText("pm1", T.pm1);
    setText("pm2", T.pm2);
    setText("pm3", T.pm3);

    setText("donorTitle", T.donorTitle);
    setText("donorText", T.donorText);
    setText("memberTitle", T.memberTitle);
    setText("memberText", T.memberText);
    setText("installTitle", T.installTitle);
    setText("installText", T.installText);

    setText("orgRulesTitle", T.orgRulesTitle);
    setText("donationRulesTitle", T.donationRulesTitle);
    setText("installmentRulesTitle", T.installmentRulesTitle);
    setText("disciplineTitle", T.disciplineTitle);

    setText("installNoticeText", T.installNotice);

    setText("conductTitle", T.conductTitle);
    setText("adminTitle", T.adminTitle);

    renderRuleList("orgRulesList", T.orgRules);
    renderRuleList("donationRulesList", T.donationRules);
    renderRuleList("installmentRulesList", T.installmentRules);

    renderMiniList("conductList", T.conduct);
    renderMiniList("adminList", T.admin);

    document.documentElement.lang = lang;
  };

  const langSelect = $("#langSelect");
  const saved = localStorage.getItem("loukik_lang") || "en";

  if (langSelect) {
    langSelect.value = saved;
    applyLang(saved);

    langSelect.addEventListener("change", () => {
      const lang = langSelect.value;
      localStorage.setItem("loukik_lang", lang);
      applyLang(lang);
    });
  } else {
    applyLang(saved);
  }
})();
