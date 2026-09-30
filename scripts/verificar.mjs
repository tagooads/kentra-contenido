// Comprueba que el token funciona: cuenta de Instagram, cupo de publicación y (si está configurada) la página de Facebook.
// No publica nada.
const TOKEN = process.env.IG_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID || "17841480064403784";
const FB_PAGE_ID = process.env.FB_PAGE_ID || "";
const GRAPH = "https://graph.facebook.com/v21.0";
if (!TOKEN) { console.error("Falta el secreto IG_TOKEN."); process.exit(1); }

const get = (path, fields) => fetch(`${GRAPH}/${path}?fields=${fields}&access_token=${TOKEN}`).then((r) => r.json());

let mal = 0;
const ig = await get(IG_USER_ID, "username,media_count");
if (ig.error) { console.error("❌ Instagram: token no válido:", ig.error.message); mal++; }
else console.log(`✅ Instagram: conectado a @${ig.username} (${ig.media_count} publicaciones).`);

const lim = await get(`${IG_USER_ID}/content_publishing_limit`, "quota_usage,config");
if (!lim.error) console.log("   Cupo de publicación usado (24 h):", JSON.stringify(lim.data?.[0]?.quota_usage ?? lim.data));

if (FB_PAGE_ID) {
  const pg = await get(FB_PAGE_ID, "name,access_token");
  if (pg.error) { console.error("❌ Facebook: no se pudo leer la página:", pg.error.message); mal++; }
  else if (!pg.access_token) { console.error(`❌ Facebook: la página "${pg.name}" se lee pero no da token de publicación. Falta el permiso pages_manage_posts en el token.`); mal++; }
  else console.log(`✅ Facebook: página "${pg.name}" lista para publicar.`);
} else {
  console.log("ℹ️ Facebook: no configurado (falta la variable FB_PAGE_ID). Solo se publicará en Instagram.");
}

const perms = await get("me/permissions", "permission,status");
if (!perms.error && perms.data) {
  const ok = perms.data.filter((p) => p.status === "granted").map((p) => p.permission);
  console.log("   Permisos del token:", ok.join(", "));
  for (const req of ["instagram_basic", "instagram_content_publish"]) if (!ok.includes(req)) { console.error(`❌ Falta el permiso ${req}`); mal++; }
  if (FB_PAGE_ID && !ok.includes("pages_manage_posts")) { console.error("❌ Falta el permiso pages_manage_posts (necesario para Facebook)"); mal++; }
}
process.exit(mal ? 1 : 0);
