// Pantallas de Kentra dibujadas en HTML (datos de demostración, nunca de clientes reales).
// Se diseñan a 390 px de ancho (celular) y se escalan dentro del marco del teléfono.
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const C = { navy: "#1E2D4F", verde: "#2FA173", verdeClaro: "#E8F5EE", rojo: "#E5484D", rojoClaro: "#FDECEC", gris: "#6B7385", fondo: "#F5F7FA", borde: "#E6EAF0", morado: "#4F46E5" };

const barraEstado = `<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 26px 6px;font-weight:700;font-size:15px;color:#111">
  <span>9:41</span><span style="letter-spacing:2px">▮▮▮ ◠ ▭</span></div>`;

const cabecera = (negocio) => `<div style="display:flex;align-items:center;gap:12px;padding:10px 20px 14px;border-bottom:1px solid ${C.borde};background:#fff">
  <span style="font-size:20px;color:${C.navy}">☰</span>
  <span style="flex:1;text-align:center;font-weight:800;font-size:17px;color:${C.navy}">${esc(negocio)}</span>
  <span style="width:20px"></span></div>`;

const tarjeta = (html, extra = "") => `<div style="background:#fff;border-radius:20px;padding:16px 18px;box-shadow:0 2px 10px rgba(20,30,60,.06);${extra}">${html}</div>`;
const etiqueta = (t) => `<div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${C.gris}">${esc(t)}</div>`;

const PANTALLAS = {
  dashboard: (a) => `
    ${cabecera(a.negocio || "Café La Esquina")}
    <div style="padding:14px 16px;display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;gap:8px"><span style="border:1px solid ${C.borde};border-radius:999px;padding:7px 14px;font-size:13px;background:#fff">${esc(a.mes || "Septiembre")} ⌄</span><span style="border:1px solid ${C.borde};border-radius:999px;padding:7px 14px;font-size:13px;background:#fff">2026 ⌄</span></div>
      ${a.vencidas ? tarjeta(`<div style="display:flex;gap:12px;align-items:center"><div style="width:38px;height:38px;border-radius:12px;background:#FAD4D6;display:flex;align-items:center;justify-content:center;color:${C.rojo};font-weight:800">!</div><div><div style="font-size:11px;font-weight:800;color:${C.rojo};letter-spacing:.08em">${esc(a.vencidas)}</div><div style="font-size:22px;font-weight:800;color:${C.rojo}">${esc(a.vencidasValor || "")}</div></div></div>`, `background:${C.rojoClaro};border:1px solid #F7C5C8`) : ""}
      ${tarjeta(`${etiqueta("Saldo neto")}<div style="font-size:38px;font-weight:800;color:${C.navy};letter-spacing:-.02em;margin:4px 0 8px">${esc(a.ganancia || "$1.450.000")}</div>
        <span style="display:inline-block;border:1px solid #BFE7D3;background:${C.verdeClaro};color:${C.verde};font-weight:700;font-size:12px;border-radius:999px;padding:4px 10px">${esc(a.margen || "17,3 % de margen")}</span>
        ${a.vsMes ? `<span style="display:inline-block;margin-left:6px;border:1px solid #BFE7D3;background:${C.verdeClaro};color:${C.verde};font-weight:700;font-size:12px;border-radius:999px;padding:4px 10px">↗ ${esc(a.vsMes)}</span>` : ""}`, `background:linear-gradient(135deg,#fff 40%,#E3F6EC)`)}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${tarjeta(`${etiqueta("Ingresos")}<div style="font-size:22px;font-weight:800;color:${C.verde};margin-top:8px">${esc(a.ingresos || "$8.400.000")}</div>`)}
        ${tarjeta(`${etiqueta("Gastos")}<div style="font-size:22px;font-weight:800;color:${C.rojo};margin-top:8px">${esc(a.gastos || "$6.950.000")}</div>`)}
      </div>
      ${tarjeta(`${etiqueta("Últimos 7 meses")}<div style="display:flex;align-items:flex-end;gap:8px;height:90px;margin-top:10px">${(a.barras || [55, 70, 40, 85, 65, 95, 80]).map((h, i) => `<i style="flex:1;height:${h}%;border-radius:6px 6px 2px 2px;background:${(a.rojo || []).includes(i) ? "#F4A6A6" : "#47C08B"};display:block"></i>`).join("")}</div>`)}
    </div>`,

  categorias: (a) => `
    ${cabecera(a.negocio || "Café La Esquina")}
    <div style="padding:14px 16px;display:flex;flex-direction:column;gap:10px">
      <div style="font-weight:800;font-size:20px;color:${C.navy};padding:4px 4px 2px">Gastos por categoría</div>
      <div style="font-size:13px;color:${C.gris};padding:0 4px 6px">${esc(a.mes || "Septiembre")} · presupuesto vs. real</div>
      ${(a.categorias || [["Insumos", "$2.900.000", 96], ["Arriendo", "$1.800.000", 100], ["Nómina", "$1.500.000", 88], ["Domicilios", "$430.000", 128], ["Comisiones", "$320.000", 64]]).map(([n, v, pct]) => tarjeta(`
        <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-weight:700;font-size:15px;color:${C.navy}">${esc(n)}</span><span style="font-weight:800;font-size:15px;color:${pct > 100 ? C.rojo : C.navy}">${esc(v)}</span></div>
        <div style="height:8px;border-radius:99px;background:${C.fondo};margin-top:10px;overflow:hidden"><i style="display:block;height:100%;width:${Math.min(pct, 100)}%;background:${pct > 100 ? C.rojo : "#47C08B"};border-radius:99px"></i></div>
        <div style="font-size:12px;margin-top:6px;color:${pct > 100 ? C.rojo : C.gris};font-weight:${pct > 100 ? 700 : 500}">${pct > 100 ? `⚠ ${pct - 100} % sobre el presupuesto` : `${pct} % del presupuesto`}</div>`, "padding:14px 16px")).join("")}
    </div>`,

  comprobante: (a) => `
    ${cabecera(a.negocio || "Estudio Luna")}
    <div style="padding:16px">
      ${tarjeta(`
        <div style="display:flex;justify-content:space-between;align-items:center"><div style="width:54px;height:54px;border-radius:14px;background:${C.navy};color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:12px;text-align:center;line-height:1.1">TU<br>LOGO</div><span style="background:${C.verdeClaro};color:${C.verde};font-weight:800;font-size:12px;border-radius:999px;padding:6px 12px">PAGADO</span></div>
        <div style="font-weight:800;font-size:20px;color:${C.navy};margin-top:16px">Comprobante de pago</div>
        <div style="font-size:13px;color:${C.gris};margin-top:2px">N.º ${esc(a.numero || "0127")} · ${esc(a.fecha || "28 sep 2026")}</div>
        <div style="height:1px;background:${C.borde};margin:14px 0"></div>
        ${etiqueta("Cliente")}<div style="font-size:15px;font-weight:700;color:${C.navy};margin:4px 0 12px">${esc(a.cliente || "Carolina Pérez")}</div>
        ${(a.items || [["Diseño de logo", "$450.000"], ["Manual de marca", "$300.000"]]).map(([n, v]) => `<div style="display:flex;justify-content:space-between;font-size:14px;padding:6px 0;color:${C.navy}"><span>${esc(n)}</span><b>${esc(v)}</b></div>`).join("")}
        <div style="height:1px;background:${C.borde};margin:10px 0"></div>
        <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-weight:700;color:${C.gris}">Total</span><span style="font-size:28px;font-weight:800;color:${C.verde}">${esc(a.total || "$750.000")}</span></div>`, "padding:20px")}
      <div style="margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="background:${C.navy};color:#fff;text-align:center;font-weight:700;border-radius:14px;padding:12px;font-size:14px">Descargar PDF</div>
        <div style="background:#25D366;color:#fff;text-align:center;font-weight:700;border-radius:14px;padding:12px;font-size:14px">Enviar por WhatsApp</div>
      </div>
    </div>`,

  alertas: (a) => `
    ${cabecera(a.negocio || "Tienda Nube Verde")}
    <div style="padding:14px 16px;display:flex;flex-direction:column;gap:10px">
      <div style="font-weight:800;font-size:20px;color:${C.navy};padding:4px">Alertas</div>
      ${(a.alertas || [["rojo", "Pago a proveedor vence mañana", "Distribuidora Andina · $1.200.000"], ["amarillo", "Cuota 3 de 6 de la tarjeta", "Vence el 5 oct · $380.000"], ["rojo", "Domicilios superó el presupuesto", "28 % por encima este mes"], ["verde", "Te pagó Carolina Pérez", "$750.000 · registrado solo"]]).map(([c, t, s]) => {
        const col = c === "rojo" ? C.rojo : c === "verde" ? C.verde : "#D39B0B";
        const bg = c === "rojo" ? C.rojoClaro : c === "verde" ? C.verdeClaro : "#FDF5E1";
        return tarjeta(`<div style="display:flex;gap:12px;align-items:flex-start"><div style="width:34px;height:34px;flex:none;border-radius:10px;background:${bg};color:${col};display:flex;align-items:center;justify-content:center;font-weight:800">${c === "verde" ? "✓" : "!"}</div><div><div style="font-weight:700;font-size:15px;color:${C.navy}">${esc(t)}</div><div style="font-size:13px;color:${C.gris};margin-top:3px">${esc(s)}</div></div></div>`, "padding:14px 16px");
      }).join("")}
    </div>`,

  kentrai: (a) => `
    ${cabecera("KentrAI")}
    <div style="padding:16px;display:flex;flex-direction:column;gap:12px;background:${C.fondo};min-height:700px">
      ${(a.chat || [["yo", "¿En qué gasté más este mes?"], ["ia", "En **insumos**: $2.900.000, el 42 % de tus gastos. Subieron 12 % frente a agosto."], ["yo", "¿Cuánto puedo reinvertir?"], ["ia", "Te quedaron **$1.450.000**. Si guardas un colchón del 30 %, puedes reinvertir **$1.015.000**."]]).map(([q, t]) => {
        const html = esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
        return q === "yo"
          ? `<div style="align-self:flex-end;max-width:78%;background:${C.navy};color:#fff;border-radius:18px 18px 4px 18px;padding:12px 14px;font-size:15px;line-height:1.35">${html}</div>`
          : `<div style="align-self:flex-start;max-width:84%;background:#fff;color:${C.navy};border-radius:18px 18px 18px 4px;padding:12px 14px;font-size:15px;line-height:1.4;box-shadow:0 2px 10px rgba(20,30,60,.06)"><div style="font-size:11px;font-weight:800;color:${C.verde};letter-spacing:.08em;margin-bottom:4px">✦ KENTRAI</div>${html}</div>`;
      }).join("")}
    </div>`,

  importar: (a) => `
    ${cabecera(a.negocio || "Café La Esquina")}
    <div style="padding:14px 16px;display:flex;flex-direction:column;gap:10px">
      <div style="font-weight:800;font-size:20px;color:${C.navy};padding:4px">Importación con IA</div>
      ${tarjeta(`<div style="display:flex;gap:12px;align-items:center"><div style="width:42px;height:42px;border-radius:12px;background:${C.verdeClaro};color:${C.verde};display:flex;align-items:center;justify-content:center;font-weight:800">CSV</div><div><div style="font-weight:700;color:${C.navy};font-size:15px">${esc(a.archivo || "extracto-septiembre.csv")}</div><div style="font-size:13px;color:${C.verde};font-weight:700">✓ ${esc(a.detectados || "46 movimientos detectados")}</div></div></div>`, `border:2px dashed #BFE7D3`)}
      ${(a.movimientos || [["Distribuidora Andina", "Insumos", "−$620.000"], ["Pago Rappi", "Ventas", "+$1.240.000"], ["Arriendo local", "Arriendo", "−$1.800.000"], ["Comisión pasarela", "Comisiones", "−$38.400"], ["Transferencia cliente", "Ventas", "+$450.000"]]).map(([n, cat, v]) => tarjeta(`<div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:700;font-size:14px;color:${C.navy}">${esc(n)}</div><span style="display:inline-block;margin-top:4px;background:${C.fondo};border-radius:999px;padding:3px 10px;font-size:12px;color:${C.gris}">${esc(cat)}</span></div><b style="font-size:15px;color:${v.startsWith("+") ? C.verde : C.rojo}">${esc(v)}</b></div>`, "padding:12px 16px")).join("")}
    </div>`,

  negocios: (a) => `
    ${cabecera("Mis negocios")}
    <div style="padding:14px 16px;display:flex;flex-direction:column;gap:10px">
      ${(a.negocios || [["Café La Esquina", "COP", "$1.450.000", "+12 %"], ["Tienda online", "USD", "US$ 820", "+4 %"], ["Food truck", "MXN", "MX$ 18.400", "−3 %"]]).map(([n, mon, g, v]) => tarjeta(`<div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:800;font-size:16px;color:${C.navy}">${esc(n)}</div><div style="font-size:12px;color:${C.gris};margin-top:2px">Moneda: ${esc(mon)}</div></div><div style="text-align:right"><div style="font-weight:800;font-size:18px;color:${C.verde}">${esc(g)}</div><div style="font-size:12px;font-weight:700;color:${v.startsWith("−") ? C.rojo : C.verde}">${esc(v)} vs. mes anterior</div></div></div>`, "padding:16px")).join("")}
      <div style="border:2px dashed ${C.borde};border-radius:18px;padding:14px;text-align:center;color:${C.gris};font-weight:700">+ Agregar negocio</div>
    </div>`,
};

export function pantalla(tipo = "dashboard", datos = {}) {
  const f = PANTALLAS[tipo] || PANTALLAS.dashboard;
  return `<div style="width:390px;background:${C.fondo};font-family:Manrope,system-ui,sans-serif;min-height:844px">${barraEstado}${f(datos)}</div>`;
}
export const TIPOS_PANTALLA = Object.keys(PANTALLAS);
