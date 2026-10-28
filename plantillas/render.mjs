// Render de piezas de Instagram/Facebook para Kentra.
// Uso:  node plantillas/render.mjs piezas/2026-09-30/01-post.json [más .json ...]
//       node plantillas/render.mjs piezas/2026-09-30            (todos los .json de la carpeta)
// Escribe un .jpg junto a cada .json (para carruseles: NN-slide-1.jpg, NN-slide-2.jpg ...).
// Avisa con "⚠️ DESBORDE" si el texto no cabe: hay que acortarlo y volver a renderizar.

import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { pantalla } from "./app-mockups.mjs";
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
  // Paletas nuevas (21 oct 2026, regla de variedad): siempre dentro de la marca (navy + verde Kentra)
  noche:       { bg: "linear-gradient(170deg,#0B1220 0%,#101B33 60%,#14213D 100%)", fg: "#FFFFFF", muted: "rgba(255,255,255,.66)", acc: "#47C08B", card: "rgba(255,255,255,.07)", logo: "logo-blanco.png", iso: "isotipo-blanco.svg", wm: "rgba(71,192,139,.10)", dark: true, onAcc: "#0F1E38" },
  menta:       { bg: "linear-gradient(160deg,#E4F6EC 0%,#CFEEDD 100%)", fg: "#14213D", muted: "#3F5A4C", acc: "#1E8A5E", card: "#FFFFFF", logo: "logo.png", iso: "isotipo.svg", wm: "rgba(30,45,79,.06)", dark: false, onAcc: "#FFFFFF" },
  marfil:      { bg: "linear-gradient(160deg,#FBF7EF 0%,#F3ECDD 100%)", fg: "#1E2D4F", muted: "#6B6456", acc: "#2FA173", card: "#FFFFFF", logo: "logo.png", iso: "isotipo.svg", wm: "rgba(30,45,79,.05)", dark: false, onAcc: "#FFFFFF" },
  verdeoscuro: { bg: "linear-gradient(160deg,#1F6B4D 0%,#175A40 55%,#0F4530 100%)", fg: "#FFFFFF", muted: "rgba(255,255,255,.74)", acc: "#9BE7C4", card: "rgba(255,255,255,.10)", logo: "logo-blanco.png", iso: "isotipo-blanco.svg", wm: "rgba(255,255,255,.08)", dark: true, onAcc: "#0F1E38" },
};
TEMAS.navy.dark = true; TEMAS.navy.onAcc = "#0F1E38";
TEMAS.verde.dark = true; TEMAS.verde.onAcc = "#1E2D4F";
TEMAS.claro.dark = false; TEMAS.claro.onAcc = "#FFFFFF";
TEMAS.blanco.dark = false; TEMAS.blanco.onAcc = "#FFFFFF";

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
  .safe{position:absolute;left:0;right:0;top:${hist ? 230 : 0}px;bottom:${hist ? 230 : 0}px;padding:${hist ? "40px 72px" : "84px 76px"};display:flex;flex-direction:column;gap:28px}
  .kicker{display:inline-flex;align-items:center;gap:14px;font-weight:800;font-size:54px;letter-spacing:.05em;text-transform:uppercase;color:${t.acc}}
  .kicker::before{content:"";width:22px;height:22px;border-radius:50%;background:${t.acc}}
  h1{font-weight:800;line-height:1.04;letter-spacing:-.02em;font-size:${hist ? 92 : 88}px}
  h1.grande{font-size:${hist ? 110 : 104}px}
  h1.media{font-size:${hist ? 78 : 74}px}
  .sub{font-weight:500;font-size:${hist ? 52 : 48}px;line-height:1.3;color:${t.dark ? "rgba(255,255,255,.93)" : "#37425C"}}
  ${hist ? ".safe>:first-child{margin-top:auto}" : ""}
  .cta{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:24px}
  .boton{display:inline-flex;align-items:center;gap:16px;background:#06C444;color:#fff;font-weight:800;font-size:54px;padding:26px 44px;border-radius:999px;box-shadow:0 18px 40px rgba(6,196,68,.35)}
  ${tema === "verde" ? ".boton{background:#1E2D4F;box-shadow:0 18px 40px rgba(15,30,56,.35)}" : ""}
  .boton.suave{background:${tema === "verde" ? "#1E2D4F" : "#47C08B"};box-shadow:none;color:#fff}
  .url{font-weight:700;font-size:54px;color:${t.muted}}
  .logo{height:${hist ? 64 : 60}px}
  .fila{display:flex;align-items:baseline;justify-content:space-between;gap:30px}
  .fila .l{font-weight:700;font-size:48px;letter-spacing:.02em;text-transform:uppercase;color:${t.muted};white-space:nowrap}
  .fila .v{font-weight:800;font-size:84px;letter-spacing:-.02em;white-space:nowrap}
  .fila.gris .v{color:${t.muted}} .fila.rojo .v{color:#FF6B6B} .fila.verde .v{color:#47C08B}
  .fila.grande .v{font-size:110px}
  .sep{height:2px;background:${!t.dark ? "rgba(30,45,79,.12)" : "rgba(255,255,255,.14)"}}
  .caja{background:${t.card};border-radius:44px;padding:44px 48px}
  .caja.verde{background:#47C08B;color:#0F1E38}
  .caja.navy{background:#1E2D4F;color:#fff}
  .lista{display:flex;flex-direction:column;gap:26px}
  .item{display:flex;gap:24px;align-items:flex-start;font-weight:600;font-size:${hist ? 52 : 48}px;line-height:1.22}
  .item .ic{flex:none;width:58px;height:58px;border-radius:50%;background:#47C08B;color:#0F1E38;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:34px;margin-top:2px}
  .item.x .ic{background:#FF6B6B;color:#fff}
  .item.num .ic{background:${t.acc};color:${tema === "verde" ? "#fff" : t.onAcc}}
  .mascota{position:absolute;pointer-events:none;filter:drop-shadow(0 30px 40px rgba(0,0,0,.28))}
  .excel{position:absolute;pointer-events:none}
  .pill{display:inline-flex;align-items:center;gap:12px;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.35);border-radius:999px;padding:14px 30px;font-weight:700;font-size:54px}
  .claro .pill,.blanco .pill,.menta .pill,.marfil .pill{background:#E8F5EE;border-color:#BFE7D3;color:#1E2D4F}
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
  .tag{align-self:flex-start;background:${t.acc};color:${t.onAcc};font-weight:800;font-size:54px;padding:12px 26px;border-radius:14px;letter-spacing:.04em;text-transform:uppercase}
  .tag.rojo{background:#FF6B6B;color:#fff} .tag.gris{background:#CFCBCD;color:#3B3F4A}
  .burbuja{border-radius:34px;padding:26px 32px;font-weight:600;font-size:${hist ? 40 : 36}px;line-height:1.25;max-width:82%;position:relative}
  .burbuja .hora{display:none;text-align:right;font-size:22px;font-weight:600;opacity:.55;margin-top:8px}
  .fit{overflow:hidden;padding-bottom:.14em}
  `;
}

function pieFooter(t, cta, hist) {
  return `<div class="cta">
    ${t === TEMAS.verde ? `<span style="background:#fff;border-radius:22px;padding:14px 26px;display:inline-flex"><img class="logo" src="${MARCA(t.logo)}"></span>` : `<img class="logo" src="${MARCA(t.logo)}">`}
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
    ${(p.filas || []).map((f, i) => `${i ? '<div class="sep"></div>' : ""}<div class="fila ${f.color || ""} ${f.grande ? "grande" : ""}"><span class="l">${esc(f.label)}</span><span class="v">${esc(f.valor)}</span></div>${f.nota ? `<div class="muted" style="font-size:40px;line-height:1.2;margin-top:-10px">${rich(f.nota)}</div>` : ""}`).join("")}
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
    <div style="background:#8E94A3;border-radius:44px;padding:36px 30px;color:#121A2B;display:flex;flex-direction:column;gap:18px;position:relative;overflow:hidden">
      <div style="font-weight:800;font-size:40px;letter-spacing:.06em;text-transform:uppercase;color:#121A2B">${esc(p.izq?.titulo || "Excel")}</div>
      ${(p.izq?.items || []).map(i => `<div class="item x" style="font-size:48px;color:#121A2B"><span class="ic" style="width:48px;height:48px;font-size:28px">✕</span><span>${rich(i)}</span></div>`).join("")}
      <img src="${MARCA("excel.png")}" style="position:absolute;left:50%;transform:translateX(-50%);bottom:-20px;height:${hist ? 680 : 330}px;opacity:1">
    </div>
    <div style="background:linear-gradient(180deg,#47C08B,#2FA173);border-radius:44px;padding:36px 30px;color:#0F1E38;display:flex;flex-direction:column;gap:18px;position:relative;overflow:hidden">
      <div style="font-weight:800;font-size:40px;letter-spacing:.06em;text-transform:uppercase;color:#0F1E38">${esc(p.der?.titulo || "Kentra")}</div>
      ${(p.der?.items || []).map(i => `<div class="item" style="font-size:48px"><span class="ic" style="width:48px;height:48px;font-size:28px;background:#1E2D4F;color:#fff">✓</span><span>${rich(i)}</span></div>`).join("")}
      <img src="${MARCA(p.der?.figura === "telefono" ? "mascota-telefono.png" : "mascota-app.png")}" style="position:absolute;left:50%;transform:translateX(-50%);bottom:10px;height:${hist ? 660 : 340}px;filter:drop-shadow(0 20px 30px rgba(0,0,0,.25))">
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

// ---------- celular con pantalla de Kentra (mockup de la herramienta, datos demo) ----------
function telefono(p, ancho) {
  const escala = (ancho - 28) / 390;
  return `<div style="width:${ancho}px;border-radius:${Math.round(ancho * 0.12)}px;background:#0B1220;padding:14px;box-shadow:0 40px 90px rgba(0,0,0,.35)">
    <div style="width:${ancho - 28}px;height:${Math.round((ancho - 28) * 2.05)}px;border-radius:${Math.round(ancho * 0.095)}px;overflow:hidden;background:#F5F7FA;position:relative">
      <div style="position:absolute;top:0;left:0;transform-origin:0 0;transform:scale(${escala})">${pantalla(p.pantalla, p.app || {})}</div>
    </div></div>`;
}

L.app = (p, t, hist) => `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <h1 class="${p.tam || "media"}">${rich(p.titulo)}</h1>
  ${p.sub ? `<div class="sub">${rich(p.sub)}</div>` : ""}
  <div style="flex:1;min-height:0;position:relative;overflow:hidden;margin:0 -76px;-webkit-mask:linear-gradient(#000 80%,transparent);mask:linear-gradient(#000 80%,transparent)">
    <div style="position:absolute;left:${p.nota ? "38%" : "50%"};top:8px;transform:translateX(-50%)">${telefono(p, hist ? 640 : 520)}</div>
    ${p.nota ? `<div style="position:absolute;right:76px;top:${hist ? 260 : 170}px;width:${hist ? 360 : 330}px;background:#47C08B;color:#0F1E38;font-weight:800;font-size:${hist ? 38 : 34}px;line-height:1.2;padding:26px 30px;border-radius:30px;box-shadow:0 20px 40px rgba(0,0,0,.3)">${rich(p.nota)}</div>` : ""}
  </div>
  ${pieFooter(t, p.cta, hist)}`;

// ---------- slide de valor (tip numerado con ejemplo) ----------
L.valor = (p, t, hist) => `
  <div style="flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:34px">
  <div style="display:flex;align-items:center;gap:22px">
    ${p.num ? `<div style="flex:none;width:96px;height:96px;border-radius:28px;background:${p.tema === "verde" ? "#1E2D4F" : t.acc};color:${p.tema === "verde" ? "#fff" : t.onAcc};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:52px">${esc(p.num)}</div>` : ""}
    ${p.kicker ? `<div class="kicker" style="margin:0">${esc(p.kicker)}</div>` : ""}
  </div>
  <h1 class="${p.tam || "media"}">${rich(p.titulo)}</h1>
  ${p.texto ? `<div class="sub" style="color:inherit;opacity:.88">${rich(p.texto)}</div>` : ""}
  ${p.ejemplo ? `<div class="caja" style="display:flex;flex-direction:column;gap:30px;margin-top:10px;padding:48px 44px">
      ${p.ejemplo.titulo ? `<div style="font-weight:800;font-size:52px;letter-spacing:.04em;text-transform:uppercase;color:${t.acc}">${esc(p.ejemplo.titulo)}</div>` : ""}
      ${(p.ejemplo.filas || []).map(([l, v, c]) => `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:20px;font-size:56px;line-height:1.15"><span style="font-weight:600">${rich(l)}</span><b style="white-space:nowrap;color:${c === "rojo" ? "#FF6B6B" : c === "verde" ? "#47C08B" : "inherit"}">${esc(v)}</b></div>`).join("")}
    </div>` : ""}
  ${p.bullets?.length ? `<div class="lista" style="margin-top:6px">${p.bullets.map((b) => `<div class="item"><span class="ic">✓</span><span>${rich(b)}</span></div>`).join("")}</div>` : ""}
  ${p.cierre ? `<div class="sub" style="font-weight:800;color:inherit">${rich(p.cierre)}</div>` : ""}
  </div>
  ${pieFooter(t, p.cta, hist)}`;

// ---------- portada de carrusel ----------
L.portada = (p, t, hist) => {
  const visual = p.visual || "none";
  const conVisual = visual !== "none";
  const img = visual === "excel" ? MARCA("excel.png") : visual === "mascota" ? MARCA("mascota-app.png") : visual === "mascota-telefono" ? MARCA("mascota-telefono.png") : null;
  return `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <h1 class="grande fit" style="max-width:${conVisual ? 600 : 930}px;max-height:${hist ? 560 : 560}px">${rich(p.titulo)}</h1>
  ${p.sub ? `<div class="sub" style="max-width:${conVisual ? 540 : 860}px">${rich(p.sub)}</div>` : ""}
  ${p.sinPildora ? "" : `<div style="margin-top:8px"><span class="pill">Desliza →</span></div>`}
  ${img ? `<img src="${img}" style="position:absolute;right:30px;bottom:${hist ? 420 : 170}px;height:${hist ? 760 : 640}px;${visual === "excel" ? "" : "filter:drop-shadow(0 30px 40px rgba(0,0,0,.28))"}">` : ""}
  ${visual === "app" ? `<div style="position:absolute;right:-40px;top:${hist ? 820 : 470}px;transform:rotate(-6deg);height:${hist ? 700 : 690}px;overflow:hidden;-webkit-mask:linear-gradient(#000 75%,transparent);mask:linear-gradient(#000 75%,transparent)">${telefono(p, hist ? 520 : 420)}</div>` : ""}
  ${pieFooter(t, p.cta, hist)}`;
};

L.cita = (p, t, hist) => `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <div style="flex:1;display:flex;flex-direction:column;justify-content:${hist && conMascota(p) ? "flex-start" : "center"};gap:34px">
    <div class="cita fit" style="max-width:${ancho(p, hist, 40)}px${p.tamCita ? `;font-size:${p.tamCita}px` : ""}">${rich(p.titulo)}</div>
    ${p.sub ? `<div class="sub" style="max-width:${ancho(p, hist)}px">${rich(p.sub)}</div>` : ""}
  </div>
  ${pieFooter(t, p.cta, hist)}`;

// tip: numerado con pasos
L.tip = (p, t, hist) => L.lista({ ...p, numerar: true }, t, hist);

// ---------- LAYOUTS NUEVOS (21 oct 2026, regla de variedad de Gato) ----------
const figuraSrc = (f) => f === "excel" ? MARCA("excel.png") : f === "telefono" ? MARCA("mascota-telefono.png") : MARCA("mascota-app.png");
const tarjetaBlanca = (hist) => `background:#fff;color:#111;border-radius:36px;box-shadow:0 24px 60px rgba(0,0,0,.18)`;

// meme: texto arriba en tarjeta blanca (estilo "la empresa en crisis. Yo:") + figura abajo + globo
L.meme = (p, t, hist) => `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <div style="${tarjetaBlanca(hist)};padding:40px 46px;font-weight:800;font-size:${hist ? 56 : 50}px;line-height:1.15;letter-spacing:-.01em">${rich(p.arriba)}${p.abajo ? `<div style="margin-top:16px;font-weight:600;color:#555;font-size:${hist ? 46 : 42}px">${rich(p.abajo)}</div>` : ""}</div>
  <div style="flex:1;min-height:0;position:relative">
    <img src="${figuraSrc(p.figura || "app")}" style="position:absolute;left:${p.globo ? "27%" : "50%"};bottom:0;transform:translateX(-50%);height:100%;filter:drop-shadow(0 30px 40px rgba(0,0,0,.28))">
    ${p.globo ? `<div style="position:absolute;right:${hist ? 420 : 400}px;top:calc(4% + 70px);width:0;height:0;border-top:34px solid transparent;border-bottom:34px solid transparent;border-right:56px solid #47C08B;z-index:1"></div><div style="position:absolute;right:0;top:4%;width:${hist ? 420 : 400}px;background:#47C08B;color:#0F1E38;font-weight:800;font-size:${hist ? 40 : 36}px;line-height:1.2;padding:26px 30px;border-radius:30px 30px 30px 6px;box-shadow:0 20px 40px rgba(0,0,0,.3)">${rich(p.globo)}</div>` : ""}
  </div>
  ${pieFooter(t, p.cta, hist)}`;

// chat: pantallazo de una conversación (cliente / yo)
L.chat = (p, t, hist) => `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  ${p.titulo ? `<h1 class="${p.tam || "media"} fit" style="flex:none;max-height:${hist ? 260 : 240}px">${rich(p.titulo)}</h1>` : ""}
  <div style="flex:none;border-radius:40px;overflow:hidden;background:#E9EEF3;color:#111;box-shadow:0 24px 60px rgba(0,0,0,.18);display:flex;flex-direction:column">
    <div style="background:#1E2D4F;color:#fff;padding:22px 30px;display:flex;align-items:center;gap:18px"><div style="width:64px;height:64px;border-radius:50%;background:#47C08B;color:#0F1E38;font-weight:800;font-size:32px;display:flex;align-items:center;justify-content:center">${esc((p.nombre || "Cliente").slice(0, 1))}</div><div><div style="font-weight:800;font-size:48px">${esc(p.nombre || "Cliente")}</div></div></div>
    <div class="caja" style="padding:22px 28px;display:flex;flex-direction:column;gap:14px;background:none;border-radius:0">
      ${(p.chat || []).map(([q, texto, hora]) => q === "yo"
        ? `<div class="burbuja" style="align-self:flex-end;background:#D8F3E6;border-bottom-right-radius:8px">${rich(texto)}${hora ? `<span class="hora">${esc(hora)} ✓✓</span>` : ""}</div>`
        : `<div class="burbuja" style="align-self:flex-start;background:#fff;border-bottom-left-radius:8px">${rich(texto)}${hora ? `<span class="hora">${esc(hora)}</span>` : ""}</div>`).join("")}
    </div>
  </div>
  ${p.cierre ? `<div class="sub" style="font-weight:700;color:inherit">${rich(p.cierre)}</div>` : ""}
  ${pieFooter(t, p.cta, hist)}`;

// skit: dos voces (A vs B) en diálogo
L.skit = (p, t, hist) => {
  const a = p.a || { nombre: "A" }, b = p.b || { nombre: "B" };
  return `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  ${p.titulo ? `<h1 class="${p.tam || "media"} fit" style="max-height:${hist ? 260 : 240}px">${rich(p.titulo)}</h1>` : ""}
  <div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:18px;justify-content:center">
    ${(p.lineas || []).map(([q, texto]) => q === "b"
      ? `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px"><div style="font-weight:800;font-size:48px;color:${t.acc}">${esc(b.nombre)}</div><div class="burbuja" style="background:${t.acc};color:${t.onAcc};border-bottom-right-radius:8px;font-weight:700">${rich(texto)}</div></div>`
      : `<div style="display:flex;flex-direction:column;align-items:flex-start;gap:6px"><div class="muted" style="font-weight:800;font-size:48px">${esc(a.nombre)}</div><div class="burbuja" style="background:${t.card};border-bottom-left-radius:8px;${t.dark ? "" : "box-shadow:0 10px 30px rgba(0,0,0,.08)"}">${rich(texto)}</div></div>`).join("")}
  </div>
  ${p.cierre ? `<div class="sub" style="font-weight:700;color:inherit">${rich(p.cierre)}</div>` : ""}
  ${pieFooter(t, p.cta, hist)}`;
};

// reto: pregunta con número + opciones A/B/C
L.reto = (p, t, hist) => `
  <div class="tag">${esc(p.kicker || "Reto")}</div>
  <h1 class="${p.tam || ""} fit" style="max-height:${hist ? 520 : 420}px">${rich(p.titulo)}</h1>
  ${p.sub ? `<div class="sub">${rich(p.sub)}</div>` : ""}
  <div style="display:grid;grid-template-columns:${(p.opciones || []).length > 3 ? "1fr 1fr" : "1fr"};gap:18px;margin-top:6px">
    ${(p.opciones || []).map((o, i) => `<div class="caja" style="display:flex;align-items:center;gap:22px;padding:26px 30px;${o.ok ? `border:5px solid ${t.acc}` : ""}"><span style="flex:none;width:66px;height:66px;border-radius:50%;background:${o.ok ? t.acc : (t.dark ? "rgba(255,255,255,.16)" : "#E1E5EB")};color:${o.ok ? t.onAcc : "inherit"};font-weight:800;font-size:34px;display:flex;align-items:center;justify-content:center">${"ABCD"[i]}</span><span style="font-weight:700;font-size:${hist ? 44 : 40}px;line-height:1.15">${rich(o.texto || o)}</span></div>`).join("")}
  </div>
  ${p.nota ? `<div class="sub" style="font-weight:700;color:inherit">${rich(p.nota)}</div>` : ""}
  ${pieFooter(t, p.cta, hist)}`;

// frase: frase lista para copiar ante una situación
L.frase = (p, t, hist) => `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  ${p.titulo ? `<h1 class="${p.tam || "media"} fit" style="max-height:${hist ? 260 : 230}px">${rich(p.titulo)}</h1>` : ""}
  <div style="flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center">
    <div style="${tarjetaBlanca(hist)};color:#1E2D4F;padding:${hist ? "54px 50px" : "48px 48px"};position:relative">
      ${p.etiqueta ? `<div style="position:absolute;top:-30px;left:40px;background:${t.acc === "#FFFFFF" ? "#1E2D4F" : t.acc};color:${t.acc === "#FFFFFF" ? "#fff" : t.onAcc};font-weight:800;font-size:50px;letter-spacing:.04em;text-transform:uppercase;padding:12px 26px;border-radius:12px">${esc(p.etiqueta)}</div>` : ""}
      <div style="font-size:${hist ? 150 : 130}px;line-height:.6;font-weight:800;color:#47C08B;margin-top:10px">“</div>
      <div class="fit" style="font-weight:800;font-size:${p.tamFrase || (hist ? 58 : 56)}px;line-height:1.18;letter-spacing:-.01em;max-height:${hist ? 760 : 520}px">${rich(p.frase)}</div>
    </div>
    ${p.porque ? `<div class="sub" style="font-weight:700;margin-top:34px;color:inherit">${rich(p.porque)}</div>` : ""}
  </div>
  ${pieFooter(t, p.cta, hist)}`;

// antes: antes / después apilados
L.antes = (p, t, hist) => {
  const bloque = (b, ok) => `<div style="flex:1;min-height:0;border-radius:40px;padding:34px 40px;display:flex;flex-direction:column;gap:16px;${ok ? "background:linear-gradient(180deg,#47C08B,#2FA173);color:#0F1E38" : "background:linear-gradient(180deg,#E9E6E7,#D6D2D4);color:#3B3F4A"}">
      <div style="font-weight:800;font-size:30px;letter-spacing:.12em;text-transform:uppercase;${ok ? "" : "color:#6B6F7A"}">${esc(b?.titulo || (ok ? "Después" : "Antes"))}</div>
      ${(b?.items || []).map(i => `<div class="item ${ok ? "" : "x"}" style="font-size:${hist ? 40 : 36}px;color:inherit"><span class="ic" style="width:50px;height:50px;font-size:28px;${ok ? "background:#1E2D4F;color:#fff" : ""}">${ok ? "✓" : "✕"}</span><span>${rich(i)}</span></div>`).join("")}
    </div>`;
  return `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <h1 class="${p.tam || "media"} fit" style="max-height:${hist ? 260 : 230}px">${rich(p.titulo)}</h1>
  <div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:20px">${bloque(p.antes, false)}${bloque(p.despues, true)}</div>
  ${pieFooter(t, p.cta, hist)}`;
};

// mito: mito vs realidad
L.mito = (p, t, hist) => `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  ${p.titulo ? `<h1 class="${p.tam || "media"} fit" style="max-height:220px">${rich(p.titulo)}</h1>` : ""}
  <div style="flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:26px">
    <div class="caja" style="display:flex;flex-direction:column;gap:18px;border-left:14px solid #FF6B6B"><div class="tag rojo">Mito</div><div style="font-weight:700;font-size:${hist ? 50 : 46}px;line-height:1.18;opacity:.8">${rich(p.mito)}</div></div>
    <div class="caja" style="display:flex;flex-direction:column;gap:18px;border-left:14px solid ${t.acc}"><div class="tag">Realidad</div><div style="font-weight:800;font-size:${hist ? 52 : 48}px;line-height:1.16">${rich(p.realidad)}</div></div>
  </div>
  ${p.nota ? `<div class="sub">${rich(p.nota)}</div>` : ""}
  ${pieFooter(t, p.cta, hist)}`;

// encuesta: opciones con círculo para responder (sin resultados inventados)
L.encuesta = (p, t, hist) => `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <h1 class="${p.tam || ""} fit" style="max-height:${hist ? 420 : 330}px">${rich(p.titulo)}</h1>
  <div style="flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:18px">
    ${(p.opciones || []).map((o, i) => `<div style="display:flex;align-items:center;gap:24px;border:4px solid ${t.dark ? "rgba(255,255,255,.35)" : "rgba(30,45,79,.25)"};border-radius:999px;padding:22px 34px"><span style="flex:none;width:44px;height:44px;border-radius:50%;border:5px solid ${t.acc}"></span><span style="font-weight:700;font-size:${hist ? 44 : 40}px">${esc(i + 1)}. ${rich(o)}</span></div>`).join("")}
  </div>
  ${p.nota ? `<div class="sub" style="font-weight:700;color:inherit">${rich(p.nota)}</div>` : ""}
  ${pieFooter(t, p.cta, hist)}`;

// pizarra: cuenta en una pizarra blanca con el resultado encerrado en un círculo
L.pizarra = (p, t, hist) => `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <h1 class="${p.tam || "media"} fit" style="max-height:${hist ? 260 : 230}px">${rich(p.titulo)}</h1>
  <div style="flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center">
    <div style="background:#FBFBF7;color:#1E2D4F;border:14px solid #D9D4C7;border-radius:28px;padding:${40 * (p.escala || 1)}px 44px;box-shadow:inset 0 0 60px rgba(0,0,0,.06),0 24px 60px rgba(0,0,0,.18);display:flex;flex-direction:column;gap:${20 * (p.escala || 1)}px">
      ${(p.lineas || []).map(([l, v, tipo]) => tipo === "res"
        ? `<div style="border-top:6px solid #1E2D4F;margin-top:6px;padding-top:22px;display:flex;justify-content:space-between;align-items:center;gap:20px;font-weight:800;font-size:${(hist ? 48 : 44) * (p.escala || 1)}px"><span>${rich(l)}</span><span style="border:8px solid #47C08B;border-radius:999px;padding:10px 28px;color:#1E8A5E;white-space:nowrap;transform:rotate(-2deg)">${esc(v)}</span></div>`
        : `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:20px;font-weight:600;font-size:${(hist ? 42 : 38) * (p.escala || 1)}px"><span>${rich(l)}</span><b style="white-space:nowrap;color:${tipo === "rojo" ? "#E5484D" : "inherit"}">${esc(v)}</b></div>`).join("")}
    </div>
  </div>
  ${p.nota ? `<div class="sub" style="font-weight:700;color:inherit">${rich(p.nota)}</div>` : ""}
  ${pieFooter(t, p.cta, hist)}`;

// recibo: tiquete de papel con el desglose de un producto o un día
L.recibo = (p, t, hist) => {
  const zig = []; for (let x = 100; x >= 0; x -= 4) zig.push(`${x}% ${x % 8 === 0 ? "100%" : "calc(100% - 22px)"}`);
  return `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <h1 class="${p.tam || "media"} fit" style="max-height:${hist ? 260 : 230}px">${rich(p.titulo)}</h1>
  <div style="flex:1;min-height:0;display:flex;justify-content:center">
    <div style="width:${hist ? 760 : 720}px;background:#FFFDF8;color:#222;padding:40px 44px 50px;box-shadow:0 24px 60px rgba(0,0,0,.22);clip-path:polygon(0 0,100% 0,${zig.join(",")});display:flex;flex-direction:column;gap:${14 * (p.escala || 1)}px;font-size:${(hist ? 36 : 33) * (p.escala || 1)}px">
      <div style="text-align:center;font-weight:800;letter-spacing:.14em;text-transform:uppercase;font-size:30px">${esc(p.negocio || "Mi negocio")}</div>
      ${p.detalle ? `<div style="text-align:center;font-size:26px;color:#777">${esc(p.detalle)}</div>` : ""}
      <div style="border-top:4px dashed #CFCAC0;margin:8px 0"></div>
      ${(p.items || []).map(([l, v, c]) => `<div style="display:flex;justify-content:space-between;gap:20px"><span>${rich(l)}</span><b style="white-space:nowrap;color:${c === "rojo" ? "#E5484D" : c === "verde" ? "#1E8A5E" : "inherit"}">${esc(v)}</b></div>`).join("")}
      <div style="border-top:4px dashed #CFCAC0;margin:8px 0"></div>
      ${p.total ? `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:20px;font-weight:800;font-size:${(hist ? 50 : 46) * (p.escala || 1)}px"><span>${esc(p.total[0])}</span><span style="color:${String(p.total[1]).startsWith("−") ? "#E5484D" : "#1E8A5E"}">${esc(p.total[1])}</span></div>` : ""}
      ${p.pie ? `<div style="text-align:center;font-size:26px;color:#777;margin-top:6px">${rich(p.pie)}</div>` : ""}
    </div>
  </div>
  ${p.nota ? `<div class="sub" style="font-weight:700;color:inherit">${rich(p.nota)}</div>` : ""}
  ${pieFooter(t, p.cta, hist)}`;
};

// reparto: una cifra total y cómo se repartió (barra apilada + leyenda)
L.reparto = (p, t, hist) => {
  const colores = ["#47C08B", "#2FA173", "#9BE7C4", "#FFB4A2", "#F4C95D", "#8FB4FF"];
  const partes = p.partes || [];
  return `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <h1 class="${p.tam || "media"} fit" style="max-height:${hist ? 260 : 230}px">${rich(p.titulo)}</h1>
  ${p.total ? `<div style="font-weight:800;font-size:${hist ? 104 : 96}px;letter-spacing:-.03em;line-height:1">${esc(p.total)}</div>` : ""}
  <div style="display:flex;height:${hist ? 64 : 56}px;border-radius:999px;overflow:hidden;gap:4px">${partes.map(([l, v, pct], i) => `<div style="flex:${pct};background:${colores[i % colores.length]}"></div>`).join("")}</div>
  <div style="flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:${hist ? 20 : 16}px">
    ${partes.map(([l, v, pct], i) => `<div style="display:flex;align-items:center;gap:20px;font-size:${hist ? 40 : 36}px"><span style="flex:none;width:30px;height:30px;border-radius:8px;background:${colores[i % colores.length]}"></span><span style="flex:1;font-weight:600">${rich(l)}</span><b style="white-space:nowrap">${esc(v)}</b><span class="muted" style="width:110px;text-align:right;font-weight:700">${esc(pct)}${" "}%</span></div>`).join("")}
  </div>
  ${p.cierre ? `<div class="sub" style="font-weight:700;color:inherit">${rich(p.cierre)}</div>` : ""}
  ${pieFooter(t, p.cta, hist)}`;
};

// tweet: tarjeta de texto tipo publicación (postura fuerte)
L.tweet = (p, t, hist) => `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <div style="flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center">
    <div style="${tarjetaBlanca(hist)};color:#1E2D4F;padding:${hist ? "48px 50px" : "44px 48px"};display:flex;flex-direction:column;gap:26px">
      <div style="display:flex;align-items:center;gap:20px"><img src="${MARCA("isotipo.png")}" style="height:${hist ? 84 : 72}px"><div><div style="font-weight:800;font-size:${hist ? 40 : 36}px">Kentra</div><div style="font-size:${hist ? 40 : 34}px;color:#5B6478">@kentra.pro</div></div></div>
      <div class="fit" style="font-weight:700;font-size:${p.tamTexto || (hist ? 58 : 54)}px;line-height:1.2;letter-spacing:-.01em;max-height:${hist ? 900 : 640}px">${rich(p.texto)}</div>
      ${p.pie ? `<div style="font-size:${hist ? 48 : 48}px;line-height:1.25;color:#1E2D4F;font-weight:700;border-top:2px solid #E6EAF0;padding-top:20px">${rich(p.pie)}</div>` : ""}
    </div>
  </div>
  ${p.sub ? `<div class="sub">${rich(p.sub)}</div>` : ""}
  ${pieFooter(t, p.cta, hist)}`;

// split: pantalla dividida — arriba un "clip" (frase del pitch), abajo la cuenta
L.split = (p, t, hist) => `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:22px">
    <div style="flex:1;min-height:0;background:#0B1220;color:#fff;border-radius:40px;padding:36px 42px;display:flex;flex-direction:column;gap:18px;position:relative;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.25)">
      <div style="display:flex;align-items:center;gap:14px;font-weight:800;font-size:26px;letter-spacing:.1em;text-transform:uppercase;color:#FF6B6B"><span style="width:18px;height:18px;border-radius:50%;background:#FF6B6B"></span>${esc(p.arriba?.kicker || "El pitch")}</div>
      <div class="fit" style="font-weight:800;font-size:${p.arriba?.tam || (hist ? 54 : 50)}px;line-height:1.15;max-height:${hist ? 300 : 330}px">${rich(p.arriba?.texto)}</div>
      <div style="position:absolute;right:36px;bottom:30px;width:74px;height:74px;border-radius:50%;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;font-size:30px">▶</div>
    </div>
    <div style="flex:1.1;min-height:0;background:#FBFBF7;color:#1E2D4F;border-radius:40px;padding:34px 42px;display:flex;flex-direction:column;gap:14px;box-shadow:0 24px 60px rgba(0,0,0,.18)">
      <div style="font-weight:800;font-size:26px;letter-spacing:.1em;text-transform:uppercase;color:#1E8A5E">${esc(p.abajo?.kicker || "La cuenta")}</div>
      ${(p.abajo?.filas || []).map(([l, v, tipo]) => tipo === "res"
        ? `<div style="border-top:5px solid #1E2D4F;margin-top:4px;padding-top:16px;display:flex;justify-content:space-between;align-items:center;gap:20px;font-weight:800;font-size:${hist ? 44 : 40}px"><span>${rich(l)}</span><span style="border:7px solid #47C08B;border-radius:999px;padding:8px 24px;color:#1E8A5E;white-space:nowrap">${esc(v)}</span></div>`
        : `<div style="display:flex;justify-content:space-between;gap:20px;font-weight:600;font-size:${hist ? 38 : 34}px"><span>${rich(l)}</span><b style="white-space:nowrap;color:${tipo === "rojo" ? "#E5484D" : "inherit"}">${esc(v)}</b></div>`).join("")}
    </div>
  </div>
  ${p.nota ? `<div class="sub" style="font-weight:700;color:inherit">${rich(p.nota)}</div>` : ""}
  ${pieFooter(t, p.cta, hist)}`;

// fantasma: la mascota disfrazada de fantasma de sábana con carteles de hábitos a dejar
// (tendencia Halloween "Things You Should Definitely Ghost", oct 2026). Campos: titulo, sub?, carteles[3] (textos), nota?
L.fantasma = (p, t, hist) => {
  const carteles = (p.carteles || []).slice(0, 3);
  const onda = []; for (let x = 0; x <= 100; x += 1) onda.push(`${x}% ${(96.5 + 3.5 * Math.cos(x * Math.PI / 10)).toFixed(1)}%`);
  const sabana = `clip-path:polygon(0 0,100% 0,${onda.reverse().join(",")},0 100%)`;
  const W = hist ? 560 : 440, H = hist ? 720 : 560;
  const pos = [
    hist ? "left:-10px;top:0;transform:rotate(-7deg)" : "left:-10px;top:0;transform:rotate(-7deg)",
    hist ? "right:-10px;top:400px;transform:rotate(5deg)" : "right:-10px;top:300px;transform:rotate(5deg)",
    hist ? "left:0;top:620px;transform:rotate(-4deg)" : "left:0;top:470px;transform:rotate(-4deg)",
  ];
  const cartel = (txt, i) => `<div style="position:absolute;${pos[i]};width:${hist ? 500 : 420}px;z-index:2;background:#FBF4E4;color:#1E2D4F;border:6px solid #1E2D4F;border-radius:18px;padding:${hist ? "22px 26px" : "18px 22px"};box-shadow:0 18px 40px rgba(0,0,0,.35);display:flex;align-items:center;gap:16px">
      <span style="flex:none;width:52px;height:52px;border-radius:50%;background:#FF6B6B;color:#fff;font-weight:800;font-size:30px;display:flex;align-items:center;justify-content:center">✕</span>
      <span style="font-weight:800;font-size:40px;line-height:1.12;min-width:0;overflow-wrap:anywhere;text-decoration:line-through;text-decoration-thickness:3px;text-decoration-color:rgba(255,107,107,.75)">${rich(txt)}</span>
      <span style="position:absolute;left:50%;bottom:-${hist ? 60 : 50}px;width:16px;height:${hist ? 60 : 50}px;background:#8A6A3F;transform:translateX(-50%);z-index:-1"></span>
    </div>`;
  return `
  ${p.kicker ? `<div class="kicker">${esc(p.kicker)}</div>` : ""}
  <h1 class="${p.tam || "media"} fit" style="max-height:${hist ? 280 : 240}px">${rich(p.titulo)}</h1>
  ${p.sub ? `<div class="sub">${rich(p.sub)}</div>` : ""}
  <div style="flex:1;min-height:0;position:relative">
    <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:${W}px;height:${H}px;background:linear-gradient(180deg,#FFFFFF 0%,#EEF2F6 100%);border-radius:${W / 2}px ${W / 2}px 0 0;${sabana};filter:drop-shadow(0 30px 40px rgba(0,0,0,.35))">
      <div style="position:absolute;left:${W * 0.3}px;top:${H * 0.3}px;width:${W * 0.11}px;height:${W * 0.16}px;border-radius:50%;background:#14213D;transform:rotate(-6deg)"></div>
      <div style="position:absolute;left:${W * 0.58}px;top:${H * 0.3}px;width:${W * 0.11}px;height:${W * 0.16}px;border-radius:50%;background:#14213D;transform:rotate(6deg)"></div>
      <div style="position:absolute;left:${W * 0.45}px;top:${H * 0.47}px;width:${W * 0.1}px;height:${W * 0.08}px;border-radius:50%;background:#14213D"></div>
      <img src="${MARCA("isotipo.png")}" style="position:absolute;left:${W * 0.66}px;top:${H * 0.74}px;height:${W * 0.2}px">
    </div>
    ${carteles.map(cartel).join("")}
  </div>
  ${p.nota ? `<div class="sub" style="font-weight:700;color:inherit">${rich(p.nota)}</div>` : ""}
  ${pieFooter(t, p.cta, hist)}`;
};

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
  return minLetra(`<!doctype html><html><head><meta charset="utf-8"><style>${css(tema, formato)}</style></head>
  <body class="${tema}">
    ${p.marcaAgua === false ? "" : '<div class="wm"></div>'}
    ${mascotaImg(p, hist, "none")}
    <main class="safe">${layout(p, t, hist)}</main>
    ${p.pagina ? `<div style="position:absolute;top:${hist ? 270 : 40}px;right:60px;font-weight:700;font-size:54px;color:${t.muted}">${esc(p.pagina)}</div>` : ""}
  </body></html>`);
}

// Regla de Karol (QA): letra >= 40 px MEDIDA en altura de mayúscula (~0.72 del font-size): se sube todo font-size literal < 48 px a 48 px y las etiquetas cortas a 54 (27 oct 2026).
function minLetra(h) {
  return h.replace(/font-size:\s*(\d+(?:\.\d+)?)px/g, (m, n) => (parseFloat(n) < 48 ? "font-size:48px" : m));
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
    for (const el of m.querySelectorAll("div,h1")) {
      if (el.clientHeight > 0 && el.scrollHeight > el.clientHeight * 1.2 + 6 && el.textContent.trim().length > 2 && !el.querySelector("img")) { fuera++; (window.__ff = window.__ff || []).push(`${el.tagName}.${el.className}|${el.scrollHeight}>${el.clientHeight}|${el.textContent.trim().slice(0, 30)}`); }
    }
    let chicas = 0;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      const n = w.currentNode; if (!n.textContent.trim()) continue;
      const fs = parseFloat(getComputedStyle(n.parentElement).fontSize);
      if (fs < 39.5) chicas++;
    }
    return { overflowY, fuera, chicas, alto: m.scrollHeight, caja: m.clientHeight, ff: (window.__ff || []).join(' ; ') };
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
      if (spec.layout === "carrusel") {
        delete s.slides; s.pagina = s.pagina ?? `${i + 1}/${slides.length}`;
        if (!slides[i].cta) s.cta = i < slides.length - 1 ? { texto: "Desliza →", boton: false } : (spec.cta || { texto: "kentra.pro", boton: true });
      }
      const salida = spec.layout === "carrusel" ? f.replace(/\.json$/, `-${i + 1}.jpg`) : f.replace(/\.json$/, ".jpg");
      const r = await renderUno(page, s, formato, salida);
      const aviso = (r.overflowY || r.fuera ? ` ⚠️ DESBORDE (contenido ${r.alto}px > caja ${r.caja}px, ${r.fuera} bloques fuera: ${r.ff})` : "") + (r.chicas ? ` ⚠️ LETRA<40px (${r.chicas} textos)` : "");
      if (aviso) problemas++;
      console.log(`${aviso ? "⚠️" : "✅"} ${path.relative(RAIZ, salida)}${aviso}`);
    }
  }
  await b.close();
  if (problemas) { console.error(`\n${problemas} pieza(s) con desborde: acorta el texto y vuelve a renderizar.`); process.exit(2); }
}
main().catch((e) => { console.error(e); process.exit(1); });
