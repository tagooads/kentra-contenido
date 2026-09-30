// Publica en Instagram (@kentra.pro) y en la página de Facebook de Kentra las piezas de
// calendario.json cuya hora ya llegó. Lo ejecuta GitHub Actions cada hora. Sin dependencias (Node 20+).
//
// Variables: IG_TOKEN (secreto, obligatorio), IG_USER_ID (opcional), FB_PAGE_ID (opcional: si falta, no se
// publica en Facebook y las piezas se consideran completas solo con Instagram).
import { readFile, writeFile } from "node:fs/promises";

const GRAPH = "https://graph.facebook.com/v21.0";
const TOKEN = process.env.IG_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID || "17841480064403784";
const FB_PAGE_ID = process.env.FB_PAGE_ID || "956335110897891";
const REPO = process.env.GITHUB_REPOSITORY || "tagooads/kentra-contenido";
const RAW = `https://raw.githubusercontent.com/${REPO}/main/`;
const MAX_INTENTOS = 3;
const VENTANA_HORAS = 12; // no publica piezas atrasadas más de 12 h

if (!TOKEN) { console.error("Falta el secreto IG_TOKEN."); process.exit(1); }

// Llamado a la acción por plataforma. En Instagram los links del texto no son clicables: se manda a la bio.
// En Facebook sí: link directo con UTM para medir qué publicación trajo la visita.
function captionPara(pieza, plataforma) {
  const base = pieza.caption || "";
  if (plataforma === "instagram") {
    return base.replace(/\{CTA\}/g, "👉 Toca el link de nuestra bio y empieza hoy.");
  }
  const link = `https://kentra.pro/?utm_source=facebook&utm_medium=organico&utm_campaign=contenido&utm_content=${encodeURIComponent(pieza.id)}`;
  return base.replace(/\{CTA\}/g, `👉 Empieza aquí: ${link}`).replace(/link (de nuestra |en (la )?)bio/gi, link);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const url = (archivo) => (archivo.startsWith("http") ? archivo : RAW + archivo);

async function api(path, params = {}, { method = "POST", token = TOKEN } = {}) {
  const body = new URLSearchParams({ ...params, access_token: token });
  const res = method === "GET"
    ? await fetch(`${GRAPH}/${path}?${body}`)
    : await fetch(`${GRAPH}/${path}`, { method, body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(`${path}: ${json.error?.message || res.status}`);
  return json;
}

// ---------- Instagram ----------
async function esperarContenedor(id) {
  for (let i = 0; i < 40; i++) {
    const { status_code } = await api(id, { fields: "status_code" }, { method: "GET" });
    if (status_code === "FINISHED") return;
    if (status_code === "ERROR" || status_code === "EXPIRED") throw new Error(`Contenedor ${id} en estado ${status_code}`);
    await sleep(5000);
  }
  throw new Error(`Contenedor ${id} no terminó de procesar`);
}

async function publicarInstagram(pieza) {
  const imgs = pieza.imagenes || [];
  let creacion;
  if (pieza.tipo === "historia") {
    creacion = await api(`${IG_USER_ID}/media`, { media_type: "STORIES", image_url: url(imgs[0]) });
  } else if (pieza.tipo === "carrusel") {
    const hijos = [];
    for (const img of imgs) {
      const h = await api(`${IG_USER_ID}/media`, { image_url: url(img), is_carousel_item: "true" });
      await esperarContenedor(h.id);
      hijos.push(h.id);
    }
    creacion = await api(`${IG_USER_ID}/media`, { media_type: "CAROUSEL", children: hijos.join(","), caption: captionPara(pieza, "instagram") });
  } else {
    creacion = await api(`${IG_USER_ID}/media`, { image_url: url(imgs[0]), caption: captionPara(pieza, "instagram") });
  }
  await esperarContenedor(creacion.id);
  const pub = await api(`${IG_USER_ID}/media_publish`, { creation_id: creacion.id });
  return pub.id;
}

// ---------- Facebook (página) ----------
let pageToken = null;
async function tokenPagina() {
  if (pageToken) return pageToken;
  const r = await api(FB_PAGE_ID, { fields: "access_token,name" }, { method: "GET" });
  if (!r.access_token) throw new Error("No se obtuvo token de la página (¿faltan pages_manage_posts / pages_show_list en el token?)");
  pageToken = r.access_token;
  return pageToken;
}

async function publicarFacebook(pieza) {
  const t = await tokenPagina();
  const imgs = pieza.imagenes || [];
  const caption = captionPara(pieza, "facebook");
  if (pieza.tipo === "historia") {
    const foto = await api(`${FB_PAGE_ID}/photos`, { url: url(imgs[0]), published: "false" }, { token: t });
    const r = await api(`${FB_PAGE_ID}/photo_stories`, { photo_id: foto.id }, { token: t });
    return r.post_id || r.id || `story:${foto.id}`;
  }
  if (pieza.tipo === "carrusel") {
    const params = { message: caption };
    for (let i = 0; i < imgs.length; i++) {
      const foto = await api(`${FB_PAGE_ID}/photos`, { url: url(imgs[i]), published: "false" }, { token: t });
      params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: foto.id });
    }
    const r = await api(`${FB_PAGE_ID}/feed`, params, { token: t });
    return r.id;
  }
  const r = await api(`${FB_PAGE_ID}/photos`, { url: url(imgs[0]), message: caption, published: "true" }, { token: t });
  return r.post_id || r.id;
}

// ---------- Recorrido del calendario ----------
const calendario = JSON.parse(await readFile("calendario.json", "utf8"));
const ahora = Date.now();
let fallos = 0, publicadas = 0;

for (const pieza of calendario.piezas) {
  if (pieza.publicado || (pieza.intentos || 0) >= MAX_INTENTOS) continue;
  const t = Date.parse(pieza.fecha);
  if (Number.isNaN(t) || t > ahora) continue;
  if (ahora - t > VENTANA_HORAS * 3600e3) {
    pieza.error = "Se pasó la hora de publicación (más de 12 h de atraso); no se publicó.";
    pieza.intentos = MAX_INTENTOS; fallos++;
    console.error(`⏭️ ${pieza.id}: ${pieza.error}`);
    continue;
  }
  const destinos = (pieza.destinos || ["instagram", "facebook"]).filter((d) => d !== "facebook" || FB_PAGE_ID);
  const errores = [];
  if (destinos.includes("instagram") && !pieza.publicado_ig) {
    try { pieza.media_id = await publicarInstagram(pieza); pieza.publicado_ig = true; console.log(`✅ IG ${pieza.id} (${pieza.media_id})`); }
    catch (e) { errores.push(`IG: ${e.message}`); }
  }
  if (destinos.includes("facebook") && !pieza.publicado_fb) {
    try { pieza.fb_post_id = await publicarFacebook(pieza); pieza.publicado_fb = true; console.log(`✅ FB ${pieza.id} (${pieza.fb_post_id})`); }
    catch (e) { errores.push(`FB: ${e.message}`); }
  }
  const completa = (!destinos.includes("instagram") || pieza.publicado_ig) && (!destinos.includes("facebook") || pieza.publicado_fb);
  if (completa) {
    pieza.publicado = true; pieza.publicado_en = new Date().toISOString(); delete pieza.error; publicadas++;
  } else {
    pieza.intentos = (pieza.intentos || 0) + 1;
    pieza.error = errores.join(" | ");
    fallos++;
    console.error(`❌ ${pieza.id}: ${pieza.error}`);
  }
}

await writeFile("calendario.json", JSON.stringify(calendario, null, 2) + "\n");
console.log(`Publicadas: ${publicadas}. Fallos: ${fallos}.`);
if (fallos) process.exit(1); // el workflow queda en rojo y GitHub avisa por correo
