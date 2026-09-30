// Comprueba que el token funciona y apunta a @kentra.pro. No publica nada.
const TOKEN = process.env.IG_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID || "17841480064403784";
if (!TOKEN) {
  console.error("Falta el secreto IG_TOKEN.");
  process.exit(1);
}
const res = await fetch(
  `https://graph.facebook.com/v21.0/${IG_USER_ID}?fields=username,media_count&access_token=${TOKEN}`
);
const json = await res.json();
if (json.error) {
  console.error("❌ Token no válido:", json.error.message);
  process.exit(1);
}
const lim = await fetch(
  `https://graph.facebook.com/v21.0/${IG_USER_ID}/content_publishing_limit?fields=quota_usage,config&access_token=${TOKEN}`
).then((r) => r.json());
console.log(`✅ Conectado a @${json.username} (${json.media_count} publicaciones).`);
if (!lim.error) console.log("Cupo de publicación (24 h):", JSON.stringify(lim.data?.[0] || {}));
