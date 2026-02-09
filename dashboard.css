/* dashboard.css */
:root{
  --bg:#f4f6fb;
  --card:rgba(255,255,255,.86);
  --card2:rgba(255,255,255,.92);
  --text:#0b1220;
  --muted:#60708b;
  --border:rgba(14,26,45,.10);

  --blue:#2563eb;
  --cyan:#0891b2;
  --teal:#0ea5a4;
  --violet:#7c3aed;

  --shadow:0 22px 48px rgba(12,24,44,.10);
  --shadow2:0 16px 30px rgba(2,6,23,.10);

  --r10:10px;
  --r12:12px;
  --r14:14px;
  --r16:16px;
  --r18:18px;
  --r22:22px;

  --ring:0 0 0 4px rgba(37,99,235,.14);
}

*{ box-sizing:border-box; }
html,body{ height:100%; }
body{
  margin:0;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif;
  color:var(--text);
  background:
    radial-gradient(900px 420px at 12% -12%, rgba(37,99,235,.12), transparent 60%),
    radial-gradient(900px 420px at 88% -18%, rgba(8,145,178,.11), transparent 55%),
    radial-gradient(700px 380px at 70% 110%, rgba(124,58,237,.08), transparent 60%),
    var(--bg);
}

.wrap{ width:min(1180px, calc(100% - 40px)); margin:0 auto; }
.main{ padding-bottom:24px; }

.topbar{
  position:sticky;
  top:0;
  z-index:50;
  background:rgba(255,255,255,.78);
  backdrop-filter:saturate(180%) blur(16px);
  border-bottom:1px solid var(--border);
  box-shadow:0 10px 26px rgba(2,6,23,.10);
}
.nav-inner{
  position:relative;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  padding:14px 0;
}

.brand{
  display:flex;
  align-items:center;
  gap:12px;
  text-decoration:none;
  color:inherit;
  min-width:240px;
}
.brand-logo{
  width:46px;
  height:46px;
  border-radius:16px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:rgba(255,255,255,.92);
  border:1px solid var(--border);
  box-shadow:0 14px 24px rgba(2,6,23,.10);
  overflow:hidden;
}
.brand-logo img{
  width:100%;
  height:100%;
  object-fit:contain;
  padding:5px;
}
.brand-text strong{
  display:block;
  font-size:18px;
  line-height:1.1;
  letter-spacing:-.15px;
}
.brand-text small{
  display:block;
  color:var(--muted);
  margin-top:3px;
  font-size:12px;
}

.menu{
  display:flex;
  align-items:center;
  gap:14px;
}
.nav-link{
  position:relative;
  text-decoration:none;
  color:rgba(11,18,32,.92);
  font-weight:900;
  font-size:13.5px;
  padding:9px 10px;
  border-radius:12px;
  letter-spacing:.12px;
  opacity:.92;
  transition:background .14s ease, opacity .14s ease, transform .14s ease;
}
.nav-link:hover{
  opacity:1;
  background:rgba(37,99,235,.08);
  transform:translateY(-1px);
}
.nav-link.active{
  color:var(--blue);
  background:rgba(37,99,235,.10);
  opacity:1;
}
.nav-link::after{
  content:"";
  position:absolute;
  left:12px;
  right:12px;
  bottom:6px;
  height:2px;
  border-radius:2px;
  background:linear-gradient(90deg, var(--blue), var(--teal));
  transform:scaleX(0);
  transform-origin:left;
  transition:transform .18s ease;
  opacity:.9;
}
.nav-link:hover::after{ transform:scaleX(1); }
.nav-link.active::after{ transform:scaleX(1); }

.nav-toggle{
  display:none;
  border:1px solid var(--border);
  background:rgba(255,255,255,.90);
  border-radius:16px;
  padding:10px 12px;
  cursor:pointer;
  box-shadow:0 14px 24px rgba(12,24,44,.12);
}

.btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  padding:10px 14px;
  border-radius:14px;
  border:1px solid transparent;
  text-decoration:none;
  font-weight:950;
  font-size:13.5px;
  cursor:pointer;
  user-select:none;
  transition:transform .12s ease, box-shadow .12s ease, background .12s ease, opacity .12s ease;
  letter-spacing:.12px;
}
.btn:active{ transform:translateY(1px); }
.btn-primary{
  color:#fff;
  background:linear-gradient(135deg, rgba(37,99,235,1), rgba(8,145,178,.96));
  box-shadow:0 18px 28px rgba(37,99,235,.22);
}
.btn-primary:hover{ box-shadow:0 24px 34px rgba(37,99,235,.26); }
.btn-soft{
  background:rgba(255,255,255,.92);
  border:1px solid var(--border);
  color:rgba(11,18,32,.94);
  box-shadow:0 14px 22px rgba(12,24,44,.08);
}
.btn-soft:hover{ background:#fff; box-shadow:0 18px 28px rgba(12,24,44,.10); }
.btn-sm{ padding:8px 12px; font-size:13px; border-radius:12px; }

.btn-danger{
  background:linear-gradient(135deg, #ef4444, #b91c1c);
  color:#fff;
  box-shadow:0 18px 26px rgba(239,68,68,.16);
}
.btn-danger:hover{ box-shadow:0 22px 32px rgba(239,68,68,.20); }

.role-badge{
  display:inline-flex;
  align-items:center;
  gap:8px;
  height:38px;
  padding:0 14px;
  border-radius:999px;
  border:1px solid rgba(16,185,129,.26);
  background:rgba(16,185,129,.10);
  color:#0f766e;
  font-weight:950;
  font-size:12.5px;
  letter-spacing:.12px;
}

input, select{
  width:100%;
  border:1px solid var(--border);
  border-radius:14px;
  padding:12px 14px;
  font-size:14px;
  outline:none;
  background:rgba(255,255,255,.92);
  transition:border-color .12s ease, box-shadow .12s ease, background .12s ease, transform .12s ease;
}
input:focus, select:focus{
  border-color:rgba(37,99,235,.65);
  box-shadow:var(--ring);
  background:#fff;
}
input::placeholder{ color:rgba(96,112,139,.92); }

.hero{ padding:34px 0 18px; }
.hero-card{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:18px;
  padding:24px;
  border-radius:26px;
  border:1px solid var(--border);
  background:
    radial-gradient(680px 280px at 20% 0%, rgba(37,99,235,.16), transparent 60%),
    radial-gradient(680px 280px at 85% 10%, rgba(8,145,178,.13), transparent 55%),
    linear-gradient(180deg, rgba(255,255,255,.86), rgba(255,255,255,.74));
  box-shadow:var(--shadow);
}
.hero-kicker{
  display:inline-flex;
  align-items:center;
  gap:10px;
  padding:9px 12px;
  border-radius:999px;
  border:1px solid rgba(37,99,235,.22);
  background:rgba(37,99,235,.08);
  color:rgba(15,23,42,.86);
  font-weight:950;
  font-size:12px;
  letter-spacing:.22px;
}
.hero-title{
  margin:10px 0 0;
  font-size:42px;
  font-weight:1000;
  letter-spacing:-.55px;
}
.hero-sub{
  margin:10px 0 0;
  color:rgba(56,70,92,.92);
  font-size:14.6px;
  line-height:1.6;
  max-width:590px;
}
.hero-meta{
  margin-top:14px;
  display:flex;
  gap:10px;
  flex-wrap:wrap;
}
.meta-pill{
  display:inline-flex;
  align-items:center;
  gap:8px;
  height:34px;
  padding:0 12px;
  border-radius:999px;
  border:1px solid rgba(14,26,45,.10);
  background:rgba(255,255,255,.80);
  box-shadow:0 14px 22px rgba(12,24,44,.07);
  color:rgba(15,23,42,.86);
  font-weight:950;
  font-size:12px;
}
.hero-right{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  justify-content:flex-end;
  max-width:380px;
}
.hero-chip{
  display:inline-flex;
  align-items:center;
  gap:10px;
  padding:10px 12px;
  border-radius:18px;
  border:1px solid rgba(14,26,45,.10);
  background:rgba(255,255,255,.90);
  box-shadow:0 14px 22px rgba(12,24,44,.08);
  color:rgba(15,23,42,.92);
  font-weight:950;
  font-size:13px;
}

.content{ padding:18px 0 42px; }

.panel{
  background:linear-gradient(180deg, var(--card2), rgba(255,255,255,.78));
  border:1px solid rgba(14,26,45,.10);
  border-radius:22px;
  padding:20px;
  box-shadow:var(--shadow);
  margin-bottom:18px;
}
.panel-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
  margin-bottom:12px;
}
.panel-badge{
  width:46px;
  height:46px;
  border-radius:18px;
  display:grid;
  place-items:center;
  border:1px solid rgba(37,99,235,.18);
  background:
    radial-gradient(240px 120px at 20% 0%, rgba(37,99,235,.18), transparent 62%),
    rgba(37,99,235,.07);
  color:rgba(15,23,42,.90);
  box-shadow:0 14px 22px rgba(12,24,44,.08);
}
.panel h2{
  margin:0 0 8px;
  font-size:18px;
  font-weight:1000;
  letter-spacing:.10px;
}
.panel h3{
  margin:0;
  font-size:14px;
  font-weight:1000;
  letter-spacing:.12px;
}

.hint{
  font-size:13px;
  color:rgba(88,104,128,.96);
  margin:8px 0 0;
  line-height:1.6;
}

.row{
  display:flex;
  gap:12px;
  flex-wrap:wrap;
  align-items:center;
}
.row.space{ justify-content:space-between; }

.grid2{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:14px;
  margin-top:14px;
}
.grid3{
  display:grid;
  grid-template-columns:repeat(3, 1fr);
  gap:12px;
}

.filebox{ flex:1; min-width:260px; }
.filebox input{ display:none; }
.filebox-ui{
  display:flex;
  align-items:center;
  gap:10px;
  padding:12px 14px;
  border-radius:14px;
  border:1px dashed rgba(37,99,235,.42);
  background:
    radial-gradient(360px 160px at 20% 0%, rgba(37,99,235,.12), transparent 60%),
    rgba(37,99,235,.06);
  font-weight:950;
  color:rgba(15,23,42,.90);
  cursor:pointer;
  transition:transform .12s ease, background .12s ease, box-shadow .12s ease;
}
.filebox-ui:hover{
  background:
    radial-gradient(360px 160px at 20% 0%, rgba(37,99,235,.14), transparent 60%),
    rgba(37,99,235,.08);
  transform:translateY(-1px);
  box-shadow:0 16px 26px rgba(12,24,44,.10);
}

.box{
  background:
    radial-gradient(520px 220px at 20% 0%, rgba(8,145,178,.12), transparent 62%),
    linear-gradient(180deg, rgba(248,250,255,.90), rgba(255,255,255,.88));
  border:1px solid rgba(14,26,45,.10);
  border-radius:20px;
  padding:14px;
  box-shadow:0 14px 24px rgba(12,24,44,.08);
}
.box-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-bottom:10px;
}
.pill{
  display:inline-flex;
  align-items:center;
  gap:8px;
  height:28px;
  padding:0 10px;
  border-radius:999px;
  border:1px solid rgba(8,145,178,.22);
  background:rgba(8,145,178,.08);
  color:rgba(15,23,42,.86);
  font-weight:950;
  font-size:12px;
}
.pre{
  font-size:12px;
  white-space:pre-wrap;
  max-height:260px;
  overflow:auto;
  color:rgba(33,47,68,.94);
  background:rgba(255,255,255,.70);
  border:1px solid rgba(14,26,45,.08);
  border-radius:16px;
  padding:12px;
}

.search{
  position:relative;
  flex:1;
  min-width:260px;
}
.search i{
  position:absolute;
  left:14px;
  top:50%;
  transform:translateY(-50%);
  color:rgba(98,112,138,.95);
  pointer-events:none;
}
.search input{ padding-left:40px; }

.select{ max-width:160px; }

.tableWrap{
  width:100%;
  overflow:auto;
  border-radius:20px;
  border:1px solid rgba(14,26,45,.10);
  background:rgba(255,255,255,.90);
  box-shadow:0 14px 26px rgba(12,24,44,.08);
}
.tbl{
  width:100%;
  border-collapse:separate;
  border-spacing:0;
  min-width:920px;
}
.tbl th, .tbl td{
  padding:12px 14px;
  border-bottom:1px solid rgba(14,26,45,.08);
  text-align:left;
  vertical-align:middle;
}
.tbl th{
  position:sticky;
  top:0;
  background:
    radial-gradient(520px 200px at 20% 0%, rgba(37,99,235,.08), transparent 60%),
    linear-gradient(180deg, rgba(249,251,255,.98), rgba(244,246,252,.98));
  font-size:12.2px;
  font-weight:1000;
  letter-spacing:.28px;
  color:rgba(15,23,42,.92);
  z-index:1;
}
.tbl tr:hover td{ background:rgba(37,99,235,.04); }

.tbl td input.in, .tbl td select.in{
  width:100%;
  padding:10px 12px;
  border-radius:14px;
  border:1px solid rgba(14,26,45,.10);
  background:rgba(255,255,255,.92);
}
.tbl td input.in:focus, .tbl td select.in:focus{
  border-color:rgba(37,99,235,.65);
  box-shadow:var(--ring);
  background:#fff;
}
.tbl td .num{
  font-weight:950;
  color:rgba(15,23,42,.92);
}
.tbl td .mut{
  font-weight:900;
  color:rgba(88,104,128,.96);
}

.warn{
  margin-top:12px;
  display:flex;
  align-items:flex-start;
  gap:10px;
  padding:12px 14px;
  border-radius:18px;
  border:1px solid rgba(245,158,11,.28);
  background:
    radial-gradient(420px 160px at 20% 0%, rgba(245,158,11,.14), transparent 60%),
    rgba(245,158,11,.10);
  color:rgba(120,73,0,.92);
  font-weight:950;
  font-size:13px;
}

.sep{
  margin:16px 0;
  border:none;
  border-top:1px solid rgba(14,26,45,.10);
}

.kpi3{
  display:grid;
  grid-template-columns:repeat(3, 1fr);
  gap:12px;
}
.kpi{
  border:1px solid rgba(14,26,45,.10);
  border-radius:20px;
  padding:14px;
  background:
    radial-gradient(520px 200px at 20% 0%, rgba(37,99,235,.11), transparent 60%),
    linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.78));
  box-shadow:0 16px 30px rgba(12,24,44,.08);
}
.kpi-top{
  display:flex;
  align-items:center;
  gap:10px;
}
.kpi-ic{
  width:38px;
  height:38px;
  border-radius:16px;
  display:grid;
  place-items:center;
  border:1px solid rgba(37,99,235,.18);
  background:rgba(37,99,235,.08);
}
.kpi-lbl{
  color:rgba(88,104,128,.95);
  font-weight:1000;
  font-size:12.4px;
  letter-spacing:.15px;
}
.kpi-val{
  margin-top:10px;
  font-size:24px;
  font-weight:1100;
  letter-spacing:-.25px;
  color:rgba(15,23,42,.95);
}

.footer{
  margin-top:10px;
  background:
    radial-gradient(780px 300px at 20% 0%, rgba(255,255,255,.14), transparent 62%),
    linear-gradient(90deg, #2f6bd8 0%, #108fb1 42%, #0ea36a 100%);
  color:#eaf2ff;
}
.footer-grid{
  display:grid;
  grid-template-columns:1.2fr .8fr 1fr;
  gap:26px;
  padding:46px 0 36px;
}
.f-title{
  margin:0 0 12px;
  font-weight:1100;
  letter-spacing:.25px;
}
.f-text{
  margin:0 0 10px;
  opacity:.95;
  line-height:1.7;
  font-size:13.6px;
}
.f-link{
  display:block;
  color:#eaf2ff;
  text-decoration:none;
  margin:8px 0;
  font-size:13.6px;
  opacity:.95;
}
.f-link:hover{ opacity:1; text-decoration:underline; }

.f-brand{
  display:flex;
  align-items:flex-start;
  gap:12px;
}
.f-logo{
  width:52px;
  height:52px;
  border-radius:18px;
  object-fit:cover;
  background:rgba(255,255,255,.12);
  border:1px solid rgba(255,255,255,.22);
  padding:7px;
}

.f-social{
  margin-top:14px;
  display:flex;
  align-items:center;
  gap:10px;
  flex-wrap:wrap;
}
.f-social-btn{
  width:42px;
  height:42px;
  display:grid;
  place-items:center;
  border-radius:16px;
  color:#eaf2ff;
  text-decoration:none;
  border:1px solid rgba(255,255,255,.25);
  background:rgba(255,255,255,.10);
  transition:transform .15s ease, background .15s ease, opacity .15s ease;
}
.f-social-btn:hover{
  transform:translateY(-2px);
  background:rgba(255,255,255,.18);
  opacity:1;
}

.f-bottom{ padding:0 0 18px; }
.f-line{
  height:1px;
  background:rgba(255,255,255,.35);
  margin-bottom:14px;
}
.f-copy{
  text-align:center;
  opacity:.96;
  font-size:13px;
}

.save-member-btn{
  justify-self:start;
  width:fit-content;
}

@media (max-width: 980px){
  .grid2{ grid-template-columns:1fr; }
  .grid3{ grid-template-columns:1fr; }
  .kpi3{ grid-template-columns:1fr; }
  .hero-title{ font-size:36px; }
  .footer-grid{ grid-template-columns:1fr; }
  .hero-card{ flex-direction:column; }
  .hero-right{ justify-content:flex-start; max-width:unset; }
}

@media (max-width: 860px){
  .nav-toggle{ display:inline-flex; }
  .menu{
    position:absolute;
    top:72px;
    right:20px;
    left:20px;
    background:rgba(255,255,255,.90);
    backdrop-filter:saturate(160%) blur(18px);
    border:1px solid rgba(14,26,45,.12);
    border-radius:22px;
    padding:14px;
    box-shadow:0 30px 52px rgba(12,24,44,.16);
    display:none;
    flex-direction:column;
    gap:10px;
    z-index:9999;
  }
  .menu.open{ display:flex; }
  .btn{ width:100%; }
  .nav-link{ width:100%; text-align:center; }
}
