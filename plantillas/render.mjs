// Render de piezas de Instagram/Facebook para Kentra.
// Uso:  node plantillas/render.mjs piezas/2026-09-30/01-post.json [más .json ...]
//       node plantillas/render.mjs piezas/2026-09-30            (todos los .json de la carpeta)
// Escribe un .jpg junto a cada .json (para carruseles: NN-slide-1.jpg, NN-slide-2.jpg ...).
// Avisa con "⚠️ DESBORDE" si el texto no cabe: hay que acortarlo y volver a renderizar.

import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MARCA = (f) => pathToFileURL(path.join(RAIZ, "marca", f)).href;
const FUENTE = (w) => pathToFileURL(path.join(RAIZ, "plantillas", "fuentes", `manrope-latin-${w}-normal.woff2`)).href;

const ISO_MONO = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 109 146"><path fill="#000" d="M61,9 H97 L18,88 A12.5,12.5 0 0 1 6,72 Z"/><polygon fill="#000" points="61,66 97,66 64,99 45,119 26,100"/><polygon fill="#000" points="63,99 98,134 62,134 46,120 53,108"/></svg>');

const TAMANOS = { post: [1080, 1350], historia: [1080, 1920], cuadrado: [1080, 1080] };

const TEMAS = {
  navy:   { bg: "linear-gradient(160deg,#22345A 0%,#1E2D4F 45%,#14213D 100%)", fg: "#FFFFFF", muted: "rgba(255,255,255,.72)", acc: "#47C08B", card: "rgba(255,255,255,.08)", logo: "logo-blanco.png", iso: "isotipo-blanco.svg", wm: "rgba(255,255,255,.09)" },
  verde:  { bg: "linear-gradient(160deg,#4FCB95 0%,#47C08B 50%,#2FA173 100%)", fg: "#0F1E38", muted: "rgba(15,30,56,.72)", acc: "#FFFFFF", card: "rgba(255,255,255,.28)", logo: "logo.png", iso: "isotipo.svg", wm: "rgba(255,255,255,.14)" },
  claro:  { bg: "linear-gradient(160deg,#F6FBF8 0%,#EEF6F2 100%)", fg: "#1E2D4F", muted: "#5B6478", acc: "#2FA173", card: "#FFFFFF", logo: "logo.png", iso: "isotipo.svg", wm: "rgba(30,45,79,.05)" },
  blanco: { bg: "#FFFFFF", fg: "#1E2D4F", muted: "#5B6478", acc: "#2FA173", card: "#F3F7F5", logo: "logo.png", iso: "isotipo.svg", wm: "rgba(30,45,79,.05)" },
};

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// **negrita** y __verde__ dentro de textos
const rich = (s = "") => esc(s)
  .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
  .replace(/__(.+?)__/g, '<span class="acc">$1</span>')
  .replace(/\n/g, "<br>");

function css(tema, formato) {
  const t = TEMAS[tema] || TEMAS.navy;
  const [W, H] = TAMANOS[formato] || TAMANOS.post;
  const hist = formato === "historia";
  return `
  @font-face{font-family:Manrope;font-weight:400;src:url(${FUENTE(400)}) format('woff2')}
  @font-face{font-family:Manrope;font-weight:500;src:url(${FUENTE(500)}) format('woff2')}
  @font-face{font-family:Manrope;font-weight:600;src:url(${FUENTE(600)}) format('woff2')}
  @font-face{font-family:Manrope;font-weight:700;src:url(${FUENTE(700)}) format('woff2')}
  @font-face{font-family:Manrope;font-weight:800;src:url(${FUENTE(800)}) format('woff2')}
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:${W}px;height:${H}px;overflow:hidden}
  body{font-family:Manrope,system-ui,sans-serif;background:${t.bg};color:${t.fg};position:relative;-webkit-font-smoothing:antialiased}
  b{font-weight:800}
  .acc{color:${t.acc}}
  .muted{color:${t.muted}}
  .wm{position:absolute;right:-140px;bottom:${hist ? 260 : 120}px;width:760px;height:1020px;pointer-events:none;background:${t.wm};
       -webkit-mask:url("${ISO_MONO}") no-repeat center/contain;mask:url("${ISO_MONO}") no-repeat center/contain}
  .safe{position:absolute;left:0;right:0;top:${hist ? 250 : 0}px;bottom:${hist ? 300 : 0}px;padding:${hist ? "40px 72px" : "84px 76px"};display:flex;flex-direction:column;gap:28px}
  .kicker{display:inline-flex;align-items:center;gap:14px;font-weight:800;font-size:30px;letter-spacing:.12em;text-transform:uppercase;color:${t.acc}}
  .kicker::before{content:"";width:18px;height:18px;border-radius:50%;background:${t.acc}}
  h1{font-weight:800;line-height:1.04;letter-spacing:-.02em;font-size:${hist ? 92 : 88}px}
  h1.grande{font-size:${hist ? 110 : 104}px}
  h1.media{font-size:${hist ? 78 : 74}px}
  .sub{font-weight:500;font-size:${hist ? 44 : 40}px;line-height:1.3;color:${t.muted}}
  .cta{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:24px}
  .boton{display:inline-flex;align-items:center;gap:16px;background:#06C444;color:#fff;font-weight:800;font-size:40px;padding:26px 44px;border-radius:999px;box-shadow:0 18px 40px rgba(6,196,68,.35)}
  .boton.suave{background:${tema === "verde" ? "#1E2D4F" : "#47C08B"};box-shadow:none;color:#fff}
  .url{font-weight:700;font-size:36px;color:${t.muted}}
  .logo{height:${hist ? 64 : 60}px}
  .fila{display:flex;align-items:baseline;justify-content:space-between;gap:30px}
  .fila .l{font-weight:700;font-size:34px;letter-spacing:.06em;text-transform:uppercase;color:${t.muted};white-space:nowrap}
  .fila .v{font-weight:800;font-size:84px;letter-spacing:-.02em;white-space:nowrap}
  .fila.gris .v{color:${t.muted}} .fila.rojo .v{color:#FF6B6B} .fila.verde .v{color:#47C08B}
  .fila.grande .v{font-size:110px}
  .sep{height:2px;background:${tema === "claro" || tema === "blanco" ? "rgba(30,45,79,.12)" : "rgba(255,255,255,.14)"}}
  .caja{background:${t.card};border-radius:44px;padding:44px 48px}
  .caja.verde{background:#47C08B;color:#0F1E38}
  .caja.navy{background:#1E2D4F;color:#fff}
  .lista{display:flex;flex-direction:column;gap:26px}
  .item{display:flex;gap:24px;align-items:flex-start;font-weight:600;font-size:${hist ? 46 : 42}px;line-height:1.22}
  .item .ic{flex:none;width:58px;height:58px;border-radius:50%;background:#47C08B;color:#0F1E38;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:34px;margin-top:2px}
  .item.x .ic{background:#FF6B6B;color:#fff}
  .item.num .ic{background:${t.acc};color:${tema === "verde" ? "#fff" : "#0F1E38"}}
  .mascota{position:absolute;pointer-events:none;filter:drop-shadow(0 30px 40px rgba(0,0,0,.28))}
  .excel{position:absolute;pointer-events:none}
  .pill{display:inline-flex;align-items:center;gap:12px;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.35);border-radius:999px;padding:14px 26px;font-weight:700;font-size:30px}
  .claro .pill,.blanco .pill{background:#E8F5EE;border-color:#BFE7D3;color:#1E2D4F}
  .app{background:#fff;color:#1E2D4F;border-radius:40px;box-shadow:0 40px 80px rgba(0,0,0,.25);overflow:hidden}
  .app .top{background:#1E2D4F;color:#fff;padding:28px 40px;display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:30px}
  .app .kpis{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:30px 34px 10px}
  .app .kpi{border-radius:26px;padding:24px 26px;background:#F3F7F5}
  .app .kpi .n{font-size:26px;font-weight:700;color:#5B6478;letter-spacing:.06em;text-transform:uppercase}
  .app .kpi .v{font-size:54px;font-weight:800;margin-top:6px;letter-spacing:-.02em}
  .app .kpi.in .v{color:#2FA173} .app .kpi.out .v{color:#E5484D}
  .app .gan{margin:14px 34px 34px;border-radius:26px;padding:28px 30px;background:#E8F5EE;border:3px solid #47C08B;display:flex;justify-content:space-between;align-items:center}
  .app .gan .n{font-size:28px;font-weight:700;color:#1E2D4F}
  .app .gan .v{font-size:66px;font-weight:800;color:#2FA173;letter-spacing:-.02em}
  .barras{display:flex;align-items:flex-end;gap:14px;height:150px;padding:0 34px 30px}
  .barras i{flex:1;border-radius:10px 10px 4px 4px;background:#47C08B;display:block}
  .barras i.r{background:#F4A6A6}
  .precio{display:flex;flex-direction:column;gap:18px}
  .precio .plan{font-weight:800;font-size:44px;letter-spacing:.04em;text-transform:uppercase;color:${t.acc}}
  .precio .num{font-weight:800;font-size:${hist ? 190 : 170}px;line-height:1;letter-spacing:-.04em}
  .precio .num small{font-size:56px;font-weight:700;letter-spacing:0;color:${t.muted}}
  .cita{font-weight:800;font-size:${hist ? 84 : 80}px;line-height:1.1;letter-spacing:-.02em}
  .cita{border-left:16px solid ${t.acc};padding-left:44px}
  .tag{align-self:flex-start;background:${t.acc};color:${tema === "verde" ? "#1E2D4F" : (tema === "navy" ? "#0F1E38" : "#fff")};font-weight:800;font-size:30px;padding:12px 24px;border-radius:14px;letter-spacing:.08em;text-transform:uppercase}
  .fit{overflow:hidden}
  `;
}

function pieFooter(t, cta, hist) {
  return `<div class="cta">
    <img class="logo" src="${MARCA(t.logo)}">
    ${cta ? `<span class="${cta.boton ? "boton" : "url"}">${esc(cta.texto || cta)}</span>` : ""}
  </div>`;
}

// ancho máximo del texto según haya mascota o no
const conMascota = (p) => p.mascota && p.mascota !== "none";
const ancho = (p, hist, extra = 0) => (conMascota(p) ? (hist ? 520 : 540) : (hist ? 936 : 928)) + extra;

function mascotaImg(p, hist, defecto = "app") {
  const which = p.mascota || defecto;
  if (!which || which === "none") return "";
  const src = which === "excel" ? MARCA("excel.png") : MARCA(which === "telefono" ? "mascota-telefono.png" : "mascota-app.png");
  const hero = p.layout === "mascota";
  const pos = p.mascotaPos || (hist ? `right:40px;bottom:${hero ? 400 : 460}px;height:${hero ? 820 : 660}px` : `right:24px;bottom:190px;height:${hero ? 700 : 580}px`);
  return `<img class="mascota" src="${src}" style="${pos}">`;
}

// ---------- LAYOUTS ----------
const L = {};

// dato: título + filas de cifras (como el AD 87)
L.dato = (p, t, hist) => `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <h1 class="${p.tam || ""}">${rich(p.titulo)}</h1>
  ${p.sub ? `<div class="sub">${rich(p.sub)}</div>` : ""}
  <div class="caja" style="display:flex;flex-direction:column;gap:26px;margin-top:10px">
    ${(p.filas || []).map((f, i) => `${i ? '<div class="sep"></div>' : ""}<div class="fila ${f.color || ""} ${f.grande ? "grande" : ""}"><span class="l">${esc(f.label)}</span><span class="v">${esc(f.valor)}</span></div>${f.nota ? `<div class="muted" style="font-size:30px;margin-top:-14px">${rich(f.nota)}</div>` : ""}`).join("")}
  </div>
  ${p.cierre ? `<div class="sub" style="font-weight:700;color:inherit">${rich(p.cierre)}</div>` : ""}
  ${pieFooter(t, p.cta, hist)}`;

// mascota: titular grande + mascota grande
L.mascota = (p, t, hist) => `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <h1 class="${p.tam || "grande"} fit" style="max-width:${hist ? 900 : 880}px;max-height:${hist ? 360 : 330}px">${rich(p.titulo)}</h1>
  ${p.sub ? `<div class="sub" style="max-width:${ancho(p, hist)}px">${rich(p.sub)}</div>` : ""}
  ${p.items?.length ? `<div class="lista" style="max-width:${ancho(p, hist)}px">${p.items.map(i => `<div class="item"><span class="ic">✓</span><span>${rich(i)}</span></div>`).join("")}</div>` : ""}
  ${pieFooter(t, p.cta, hist)}`;

// pregunta: pregunta enorme, respuesta pequeña
L.pregunta = (p, t, hist) => `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <div style="flex:1;display:flex;flex-direction:column;justify-content:${hist && conMascota(p) ? "flex-start" : "center"};gap:40px">
    <h1 class="grande fit" style="max-width:${ancho(p, hist)}px">${rich(p.titulo)}</h1>
    ${p.sub ? `<div class="sub" style="max-width:${ancho(p, hist)}px;font-size:${hist ? 48 : 44}px">${rich(p.sub)}</div>` : ""}
  </div>
  ${pieFooter(t, p.cta, hist)}`;

// lista: titular + checklist
L.lista = (p, t, hist) => `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <h1 class="${p.tam || "media"}">${rich(p.titulo)}</h1>
  ${p.sub ? `<div class="sub">${rich(p.sub)}</div>` : ""}
  <div class="caja lista" style="margin-top:6px;max-width:${ancho(p, hist, conMascota(p) ? 40 : 0)}px">
    ${(p.items || []).map((i, n) => {
      const x = typeof i === "object" ? i : { texto: i };
      const cls = x.tipo === "x" ? "x" : (p.numerar ? "num" : "");
      const ic = x.tipo === "x" ? "✕" : (p.numerar ? n + 1 : "✓");
      return `<div class="item ${cls}"><span class="ic">${ic}</span><span>${rich(x.texto)}</span></div>`;
    }).join("")}
  </div>
  ${p.cierre ? `<div class="sub" style="font-weight:700;color:inherit">${rich(p.cierre)}</div>` : ""}
  ${pieFooter(t, p.cta, hist)}`;

// versus: Excel (gris) vs Kentra (marca)
L.versus = (p, t, hist) => `
  <h1 class="media" style="text-align:center">${rich(p.titulo || "Kentra vs Excel")}</h1>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;flex:1;min-height:0">
    <div style="background:linear-gradient(180deg,#CFCBCD,#E9E6E7);border-radius:44px;padding:36px 30px;color:#3B3F4A;display:flex;flex-direction:column;gap:18px;position:relative;overflow:hidden">
      <div style="font-weight:800;font-size:40px;letter-spacing:.06em;text-transform:uppercase;color:#6B6F7A">${esc(p.izq?.titulo || "Excel")}</div>
      ${(p.izq?.items || []).map(i => `<div class="item x" style="font-size:36px;color:#3B3F4A"><span class="ic" style="width:48px;height:48px;font-size:28px">✕</span><span>${rich(i)}</span></div>`).join("")}
      <img src="${MARCA("excel.png")}" style="position:absolute;left:50%;transform:translateX(-50%);bottom:-20px;height:${hist ? 680 : 500}px;opacity:.95">
    </div>
    <div style="background:linear-gradient(180deg,#47C08B,#2FA173);border-radius:44px;padding:36px 30px;color:#0F1E38;display:flex;flex-direction:column;gap:18px;position:relative;overflow:hidden">
      <div style="font-weight:800;font-size:40px;letter-spacing:.06em;text-transform:uppercase;color:#0F1E38">${esc(p.der?.titulo || "Kentra")}</div>
      ${(p.der?.items || []).map(i => `<div class="item" style="font-size:36px"><span class="ic" style="width:48px;height:48px;font-size:28px;background:#1E2D4F;color:#fff">✓</span><span>${rich(i)}</span></div>`).join("")}
      <img src="${MARCA("mascota-app.png")}" style="position:absolute;left:50%;transform:translateX(-50%);bottom:10px;height:${hist ? 660 : 480}px;filter:drop-shadow(0 20px 30px rgba(0,0,0,.25))">
    </div>
  </div>
  ${pieFooter(t, p.cta, hist)}`;

// precio: un plan
L.precio = (p, t, hist) => `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <h1 class="${p.tam || "media"}" style="max-width:${ancho(p, hist, 60)}px">${rich(p.titulo)}</h1>
  <div class="precio" style="margin-top:6px">
    <div class="plan">${esc(p.plan || "Plan Básico")}</div>
    <div class="num">${esc(p.precio || "$15")}<small>${esc(p.periodo || "/mes")}</small></div>
    ${p.nota ? `<div class="sub" style="max-width:${ancho(p, hist)}px">${rich(p.nota)}</div>` : ""}
  </div>
  ${p.items?.length ? `<div class="lista" style="max-width:${ancho(p, hist)}px;margin-top:10px">${p.items.map(i => `<div class="item" style="font-size:${hist ? 40 : 36}px"><span class="ic" style="width:48px;height:48px;font-size:28px">✓</span><span>${rich(i)}</span></div>`).join("")}</div>` : ""}
  ${pieFooter(t, p.cta, hist)}`;

// ui: pantalla de la app (ingresos / gastos / ganancia)
L.ui = (p, t, hist) => {
  const u = p.app || {};
  const barras = (u.barras || [60, 80, 45, 90, 70, 100, 85]).map((h, i) => `<i style="height:${h}%" class="${u.rojo?.includes(i) ? "r" : ""}"></i>`).join("");
  return `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <h1 class="${p.tam || "media"}" style="max-width:${ancho(p, hist, 80)}px">${rich(p.titulo)}</h1>
  ${p.sub ? `<div class="sub" style="max-width:${ancho(p, hist)}px">${rich(p.sub)}</div>` : ""}
  <div class="app" style="width:${ancho(p, hist, conMascota(p) ? 60 : 0)}px;margin-top:6px">
    <div class="top"><span>${esc(u.negocio || "Mi negocio")}</span><span>${esc(u.mes || "Este mes")}</span></div>
    <div class="kpis">
      <div class="kpi in"><div class="n">Ingresos</div><div class="v">${esc(u.ingresos || "$0")}</div></div>
      <div class="kpi out"><div class="n">Gastos</div><div class="v">${esc(u.gastos || "$0")}</div></div>
    </div>
    <div class="gan"><span class="n">${esc(u.etiqueta || "Te quedó")}</span><span class="v">${esc(u.ganancia || "$0")}</span></div>
    <div class="barras">${barras}</div>
  </div>
  ${p.cierre ? `<div class="sub" style="font-weight:700;color:inherit;max-width:${ancho(p, hist)}px">${rich(p.cierre)}</div>` : ""}
  ${pieFooter(t, p.cta, hist)}`;
};

// cita: frase grande
// captura: pantallazo real de la app dentro de un celular (archivos en marca/capturas/)
L.captura = (p, t, hist) => `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <h1 class="${p.tam || "media"}">${rich(p.titulo)}</h1>
  ${p.sub ? `<div class="sub">${rich(p.sub)}</div>` : ""}
  <div style="flex:1;min-height:0;position:relative;overflow:hidden;margin:0 -76px;-webkit-mask:linear-gradient(#000 78%,transparent);mask:linear-gradient(#000 78%,transparent)">
    <div style="position:absolute;left:50%;top:6px;transform:translateX(-50%);width:${hist ? 720 : 600}px;aspect-ratio:0.46;border-radius:70px;background:#0B1220;padding:16px;box-shadow:0 40px 90px rgba(0,0,0,.35)">
      <div style="width:100%;height:100%;border-radius:56px;overflow:hidden;background:#fff">
        <img src="${MARCA("capturas/" + (p.captura || "dashboard-movil.png"))}" style="width:100%;display:block;margin-top:-${p.recorte || "0"}">
      </div>
    </div>
  </div>
  ${p.nota ? `<div style="align-self:flex-end;margin-top:-150px;position:relative;max-width:420px;background:#47C08B;color:#0F1E38;font-weight:800;font-size:${hist ? 38 : 34}px;line-height:1.2;padding:24px 30px;border-radius:28px;box-shadow:0 20px 40px rgba(0,0,0,.3)">${rich(p.nota)}</div>` : ""}
  ${pieFooter(t, p.cta, hist)}`;

L.cita = (p, t, hist) => `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <div style="flex:1;display:flex;flex-direction:column;justify-content:${hist && conMascota(p) ? "flex-start" : "center"};gap:34px">
    <div class="cita fit" style="max-width:${ancho(p, hist, 40)}px">${rich(p.titulo)}</div>
    ${p.sub ? `<div class="sub" style="max-width:${ancho(p, hist)}px">${rich(p.sub)}</div>` : ""}
  </div>
  ${pieFooter(t, p.cta, hist)}`;

// tip: numerado con pasos
L.tip = (p, t, hist) => L.lista({ ...p, numerar: true }, t, hist);

// portada / slide de carrusel: se manejan como layouts normales por slide

// Historias: si kentra.pro ya tiene las rutas cortas (/h y /q redirigen con UTM de historias), el botón las usa.
let CONFIG = {};
try { CONFIG = JSON.parse(await readFile(path.join(RAIZ, "config.json"), "utf8")); } catch {}
function ctaHistoria(cta) {
  if (!cta || !CONFIG.rutas_cortas_activas) return cta;
  const texto = typeof cta === "string" ? cta : cta.texto;
  const corto = CONFIG.rutas_cortas?.[String(texto).trim()];
  if (!corto) return cta;
  return typeof cta === "string" ? corto : { ...cta, texto: corto };
}

function html(p, formato) {
  if (formato === "historia") p = { ...p, cta: ctaHistoria(p.cta) };
  const tema = p.tema || "navy";
  const t = TEMAS[tema] || TEMAS.navy;
  const hist = formato === "historia";
  const layout = L[p.layout] || L.mascota;
  const [W, H] = TAMANOS[formato] || TAMANOS.post;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css(tema, formato)}</style></head>
  <body class="${tema}">
    ${p.marcaAgua === false ? "" : '<div class="wm"></div>'}
    ${mascotaImg(p, hist, "none")}
    <main class="safe">${layout(p, t, hist)}</main>
    ${p.pagina ? `<div style="position:absolute;top:${hist ? 270 : 40}px;right:60px;font-weight:700;font-size:28px;color:${t.muted}">${esc(p.pagina)}</div>` : ""}
  </body></html>`;
}

async function browser() {
  const { chromium } = require("playwright-core");
  const candidates = [process.env.CHROME_PATH, "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].filter(Boolean);
  let executablePath;
  for (const c of candidates) if (existsSync(c)) { executablePath = c; break; }
  if (!executablePath) {
    // buscar cualquier chromium instalado por playwright
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
    try { for (const d of await readdir(base)) if (d.startsWith("chromium-")) { const p = path.join(base, d, "chrome-linux", "chrome"); if (existsSync(p)) executablePath = p; } } catch {}
  }
  return chromium.launch({ executablePath, args: ["--no-sandbox", "--disable-gpu", "--font-render-hinting=none"] });
}

async function renderUno(page, spec, formato, salida) {
  const [W, H] = TAMANOS[formato] || TAMANOS.post;
  await page.setViewportSize({ width: W, height: H });
  // Se escribe a un archivo temporal y se abre por file:// para que carguen fuentes e imágenes locales
  const tmp = path.join(os.tmpdir(), `kentra-render-${process.pid}.html`);
  await writeFile(tmp, html(spec, formato));
  await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    // auto-ajuste de textos .fit: baja la fuente hasta que quepa en su caja
    const main = document.querySelector("main");
    for (const el of document.querySelectorAll(".fit")) {
      let size = parseFloat(getComputedStyle(el).fontSize);
      // tolerancia: con line-height ajustado, Chrome reporta unos px de más por los descendentes
      const cabe = () => el.scrollHeight <= el.clientHeight + size * 0.3 && el.scrollWidth <= el.clientWidth + 1 && main.scrollHeight <= main.clientHeight + 1;
      for (let i = 0; i < 40 && !cabe() && size > 40; i++) { size -= 3; el.style.fontSize = size + "px"; }
    }
  });
  await page.waitForTimeout(150);
  const desborde = await page.evaluate(() => {
    const m = document.querySelector("main");
    const r = m.getBoundingClientRect();
    const overflowY = m.scrollHeight > m.clientHeight + 2;
    let fuera = 0;
    for (const el of m.querySelectorAll("h1,.sub,.item,.fila,.cta,.app,.caja,.cita,.precio")) {
      const b = el.getBoundingClientRect();
      if (b.bottom > r.bottom + 2 || b.right > r.right + 2 || b.left < r.left - 2) fuera++;
    }
    return { overflowY, fuera, alto: m.scrollHeight, caja: m.clientHeight };
  });
  await page.screenshot({ path: salida, type: "jpeg", quality: 92 });
  return desborde;
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length) { console.error("Uso: node plantillas/render.mjs <archivo.json | carpeta> ..."); process.exit(1); }
  const archivos = [];
  for (const a of args) {
    const s = await stat(a);
    if (s.isDirectory()) {
      for (const f of (await readdir(a)).sort()) if (f.endsWith(".json")) archivos.push(path.join(a, f));
    } else {
      archivos.push(a);
    }
  }
  const b = await browser();
  const page = await b.newPage();
  let problemas = 0;
  for (const f of archivos) {
    const spec = JSON.parse(await readFile(f, "utf8"));
    const formato = spec.formato || "post";
    const slides = spec.layout === "carrusel" ? spec.slides : [spec];
    for (let i = 0; i < slides.length; i++) {
      const s = { ...spec, ...slides[i], layout: slides[i].layout || spec.slideLayout || "mascota" };
      if (spec.layout === "carrusel") { delete s.slides; s.pagina = s.pagina ?? `${i + 1}/${slides.length}`; }
      const salida = spec.layout === "carrusel" ? f.replace(/\.json$/, `-${i + 1}.jpg`) : f.replace(/\.json$/, ".jpg");
      const r = await renderUno(page, s, formato, salida);
      const aviso = r.overflowY || r.fuera ? ` ⚠️ DESBORDE (contenido ${r.alto}px > caja ${r.caja}px, ${r.fuera} bloques fuera)` : "";
      if (aviso) problemas++;
      console.log(`${aviso ? "⚠️" : "✅"} ${path.relative(RAIZ, salida)}${aviso}`);
    }
  }
  await b.close();
  if (problemas) { console.error(`\n${problemas} pieza(s) con desborde: acorta el texto y vuelve a renderizar.`); process.exit(2); }
}
main().catch((e) => { console.error(e); process.exit(1); });
