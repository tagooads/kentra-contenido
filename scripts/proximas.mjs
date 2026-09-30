// Genera PROXIMAS.md: vista de lo que viene (y lo último publicado) para revisarlo desde GitHub.
import { readFile, writeFile } from "node:fs/promises";
const cal = JSON.parse(await readFile("calendario.json", "utf8"));
const ahora = Date.now();
const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const fmt = (iso) => {
  const d = new Date(new Date(iso).getTime() - 5 * 3600e3); // Bogotá
  return `${dias[d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth() + 1} · ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
};
const tipo = { historia: "Historia", post: "Post", carrusel: "Carrusel" };
const futuras = cal.piezas.filter((p) => !p.publicado && !p.error && Date.parse(p.fecha) > ahora - 12 * 3600e3).sort((a, b) => a.fecha.localeCompare(b.fecha));
const hechas = cal.piezas.filter((p) => p.publicado).sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 6);
const fallidas = cal.piezas.filter((p) => !p.publicado && p.error);

let md = `# Próximas publicaciones de Kentra\n\nSe actualiza sola cada hora. Hora de Bogotá. ${futuras.length} piezas agendadas.\n\n`;
if (fallidas.length) md += `## ⚠️ Con error\n\n${fallidas.map((p) => `- **${fmt(p.fecha)}** ${tipo[p.tipo]} \`${p.id}\`: ${p.error}`).join("\n")}\n\n`;
let dia = "";
for (const p of futuras) {
  const d = fmt(p.fecha).split(" · ")[0];
  if (d !== dia) { md += `\n## ${d[0].toUpperCase() + d.slice(1)}\n\n`; dia = d; }
  const imgs = p.imagenes.map((i) => `<img src="${i}" width="${p.tipo === "historia" ? 160 : 220}">`).join(" ");
  md += `**${fmt(p.fecha).split(" · ")[1]} — ${tipo[p.tipo]}** · ${p.pilar || ""} · \`${p.id}\`\n\n${imgs}\n\n`;
  if (p.caption) md += `<details><summary>Descripción</summary>\n\n${p.caption.replace(/\{CTA\}/g, "👉 [link de la bio en Instagram / link con UTM en Facebook]")}\n\n</details>\n\n`;
}
if (hechas.length) md += `\n## Últimas publicadas\n\n${hechas.map((p) => `- ${fmt(p.fecha)} · ${tipo[p.tipo]} \`${p.id}\`${p.media_id ? " · IG ✓" : ""}${p.fb_post_id ? " · FB ✓" : ""}`).join("\n")}\n`;
await writeFile("PROXIMAS.md", md);
console.log(`PROXIMAS.md: ${futuras.length} próximas`);
