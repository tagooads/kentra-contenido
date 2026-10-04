# Memoria del agente — qué ha funcionado y qué no

Regla: registrar hechos y hipótesis, no opiniones. Una línea por aprendizaje, con fecha. Cuando una hipótesis se confirma o se descarta, se marca.

## Punto de partida (2026-09-29)

- @kentra.pro tenía 5 publicaciones (enero 2026): el post "Adiós al caos en tu negocio" fue el que más conversación generó (14 comentarios); "Nuevos planes disponibles" el de más likes (15). Los 3 reels de lanzamiento: 8–10 likes. La cuenta arranca casi de cero: la constancia (3 piezas diarias) es la primera meta.
- Lo que más vende en anuncios pagos de Kentra (histórico): captura real del producto + precio visible en botón verde, sin caras ni avatares. Las piezas `ui` y `precio` imitan ese patrón.
- Anuncio orgánico de referencia aprobado por Gato: "¿Cuánto te quedó este mes?" (facturaste / gastos / te quedó) → layout `dato`.

## Hipótesis a comprobar

- H1 (sem 1): los posts `dato` con cifras lado a lado generan más guardados que los `mascota` de titular. → pendiente
- H2 (sem 1): la historia de las 19:00 con pregunta y botón a kentra.pro/quiz trae más clics que la de las 08:00. → pendiente (medir con visitas al quiz)
- H3 (sem 1): `versus` (Excel vs Kentra) es el formato con más comentarios. → pendiente
- H4 (sem 2): la objeción con humor y mascota («Yo lo llevo todo en la cabeza», sáb 10) supera en comentarios al `dato` del lunes. → pendiente
- H5 (sem 2): el carrusel educativo de 6 slides (jue 8) es la pieza con más guardados de la semana. → pendiente
- H6 (sem 2): la historia de vertical con pantalla `ui` (salón, freelancer) trae más clics a kentra.pro que la historia `cita`. → pendiente (medir con visitas)
- H7 (sem 1, leído 4 oct): los carruseles superan a los posts de una imagen. → **confirmada en volumen bajo**: 4 carruseles con 2–3 likes vs 5 posts con 1–2. El mejor: carrusel de ganancia real con caso en cifras (cafetería, 3 likes).
- H8 (sem 4): pedir una respuesta concreta ("responde sí o no", "responde 1 o 2", "¿cuántas versiones tienes?") saca los primeros comentarios; hasta hoy 0 comentarios en todas las piezas nuevas. → pendiente (jue 15, dom 18 ×2, mar 13)
- H9 (sem 4): carruseles "calculadora" con una cifra final (punto de equilibrio, margen por producto, colchón, tarifa por hora) se guardan/likean más que los de lista de errores o señales. → pendiente

## Registro semanal

- **Semana 1 (30 sep – 4 oct)**: 15 piezas generadas por Claude en la sesión inicial; publicación automática activada solo en Instagram (Facebook queda pendiente del token con `pages_manage_posts`).
- **Semana 2 (5 – 11 oct)**: 21 piezas producidas el 29 sep (noche de Bogotá), antes de que se publicara nada de la semana 1, así que no hay likes ni comentarios propios que leer todavía (IG sigue con las 5 publicaciones de enero). Qué se probó: gancho "Vendiste más. ¿Ganaste más?" con caso de tienda online (`dato`); objeción con humor y mascota ("lo llevo todo en la cabeza"); carrusel de 4 señales (`cita` × 4 + cierre `lista`); dos verticales nuevas en historia `ui` (salón de belleza y freelancer); plan Pro a $20 como pieza de precio (semana 1 fue el Básico); una sola pieza de garantía (dom 19:00). Mezcla: ganancia 4, funcionalidades 4, educación 4, objeciones 3, excel 2, precio 2, verticales 2; fondos navy 10 / verde 5 / claro-blanco 6; mascota en 10 de 21. Hallazgo de render: en `cita` y `pregunta` con mascota, títulos de más de ~40 caracteres se apilan en 5–6 líneas; mejor ≤ 45 aunque el límite sea 70.
- **Para la semana 3**: primera lectura real de likes/comentarios por `media_id` (semana 1 y 2). Comprobar H1–H6. Verticales pendientes: restaurante ya salió (sem 1), salón y freelancer (sem 2); siguen tienda online (como post), creativos y comercio de barrio. No repetir "lo llevo en la cabeza", "vendiste más", "4 señales", "sin permanencia", "el mes termina cuando sabes" hasta el 1 de noviembre.
- **Lectura del 4 oct (semana 1)**: `ads_get_ig_media` devuelve likes y comentarios pero no guardados ni alcance. Feed: carrusel ganancia real 30 sep 3 likes; carruseles 4 gastos / 5 errores / precio torta 2 c/u; cita "saldo del banco" 2; pregunta Excel, tip "pagar lo personal", cita «muy pequeño» y lista "no necesitas saber de finanzas" 1 c/u; 0 comentarios en todo. Mejores: carrusel ganancia real, carruseles educativos, cita saldo del banco. Peores: objeciones (cita y lista) y pregunta Excel. Hipótesis: el valor práctico con cifras gana; las objeciones sin caso concreto no enganchan. Los posts de 10:00 y 18:00 del 1 oct no aparecen en la API (revisar si se publicaron). Error a no repetir: el caption del 3 oct 10:00 escribió "kentra.pro/quiz" en el texto.
- **Semana 4 (12 – 18 oct)**: 35 piezas producidas el 4 oct. Qué se prueba: 5 carruseles "calculadora" (punto de equilibrio, margen por producto, colchón de 3 meses, mes en 4 semanas, tarifa por hora de freelancer) + 2 de Kentra (5 preguntas a KentrAI, comparación de planes); 4 piezas que piden respuesta en comentarios; vertical tienda de barrio con "lo fiado" (`dato`) y tienda online (`dato`); funciones nuevas en post: equipo con roles, importación de extracto, recordatorios contra recargos; 4 historias `app` (alertas, dashboard, importar, KentrAI). Mezcla feed: ganancia 5, educación 4, funcionalidades 4, excel 3, verticales 2, objeciones 2, precio 1. Fondos navy 16 / verde 8 / claro-blanco 11; mascota en 13 de 35.
- **Arreglo de plantilla (4 oct)**: los títulos con auto-ajuste (`.fit`: portada, pregunta, cita, mascota) cortaban las letras con cola (g, p, q) de la última línea. Se agregó `padding-bottom:.14em` a `.fit` en `render.mjs`. Las piezas de semanas anteriores no se re-renderizaron.
- **Para la semana 5**: medir H7–H9 con likes y comentarios del 12–18; si las preguntas con respuesta siguen en 0 comentarios, probar historia con pregunta + post con encuesta escrita en el caption. No repetir hasta el 8 de noviembre: punto de equilibrio, margen por producto, colchón, mes en 4 semanas, tarifa por hora, "lo fiado", "recargo por pagar tarde", "cuentas_final", "empiezo el próximo mes". Verticales pendientes: restaurante (como carrusel), comercio de barrio ya salió; probar salón con caso de precio por servicio.
- Prueba de acceso del agente OK: 2026-09-29 20:49 (Bogotá)
