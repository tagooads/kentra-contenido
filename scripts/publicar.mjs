// Publica en Instagram (@kentra.pro) las piezas de calendario.json cuya fecha ya llegó.
// Lo ejecuta GitHub Actions cada hora. Sin dependencias: Node 20+.
import { readFile, writeFile } from "node:fs/promises";

const GRAPH = "https://graph.facebook.com/v21.0";
const TOKEN = process.env.IG_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID || "17841480064403784";
const REPO = process.env.GITHUB_REPOSITORY || "tagooads/kentra-contenido";
const RAW = `https://raw.githubusercontent.com/${REPO}/main/`;
const MAX_INTENTOS = 3;
const VENTANA_HORAS = 12; // no publica piezas atrasadas más de 12 h

if (!TOKEN) {
  console.error("Falta el secreto IG_TOKEN.");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, params = {}, method = "POST") {
  const body = new URLSearchParams({ ...params, access_token: TOKEN });
  const url = method === "GET" ? `${GRAPH}/${path}?${body}` : `${GRAPH}/${path}`;
  const res = await fetch(url, method === "GET" ? {} : { method, body });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(`${path}: ${json.error?.message || res.status}`);
  }
  return json;
}

async function esperarContenedor(id) {
  for (let i = 0; i < 30; i++) {
    const { status_code } = await api(id, { fields: "status_code" }, "GET");
    if (status_code === "FINISHED") return;
    if (status_code === "ERROR" || status_code === "EXPIRED") {
      throw new Error(`Contenedor ${id} en estado ${status_code}`);
    }
    await sleep(5000);
  }
  throw new Error(`Contenedor ${id} no terminó de procesar`);
}

const url = (archivo) => (archivo.startsWith("http") ? archivo : RAW + archivo);

async function publicar(pieza) {
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
    creacion = await api(`${IG_USER_ID}/media`, {
      media_type: "CAROUSEL",
      children: hijos.join(","),
      caption: pieza.caption || "",
    });
  } else {
    creacion = await api(`${IG_USER_ID}/media`, { image_url: url(imgs[0]), caption: pieza.caption || "" });
  }

  await esperarContenedor(creacion.id);
  const pub = await api(`${IG_USER_ID}/media_publish`, { creation_id: creacion.id });
  return pub.id;
}

const calendario = JSON.parse(await readFile("calendario.json", "utf8"));
const ahora = Date.now();
let fallos = 0;

for (const pieza of calendario.piezas) {
  if (pieza.publicado || (pieza.intentos || 0) >= MAX_INTENTOS) continue;
  const t = Date.parse(pieza.fecha);
  if (Number.isNaN(t) || t > ahora) continue;
  if (ahora - t > VENTANA_HORAS * 3600e3) {
    pieza.error = "Se pasó la hora de publicación (más de 12 h de atraso); no se publicó.";
    pieza.intentos = MAX_INTENTOS;
    fallos++;
    continue;
  }
  try {
    pieza.media_id = await publicar(pieza);
    pieza.publicado = true;
    pieza.publicado_en = new Date().toISOString();
    delete pieza.error;
    console.log(`✅ ${pieza.id} publicado (${pieza.media_id})`);
  } catch (e) {
    pieza.intentos = (pieza.intentos || 0) + 1;
    pieza.error = String(e.message || e);
    fallos++;
    console.error(`❌ ${pieza.id}: ${pieza.error}`);
  }
}

await writeFile("calendario.json", JSON.stringify(calendario, null, 2) + "\n");
if (fallos) process.exit(1); // el workflow falla y GitHub te avisa por correo
