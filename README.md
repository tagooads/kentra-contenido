# kentra-contenido

Contenido orgánico de Kentra en Instagram (@kentra.pro) y Facebook, producido por un agente de Claude y publicado automáticamente.

## Cómo funciona

1. **Cada domingo** una tarea programada de Claude lee `AGENTE.md` (el cerebro del agente), investiga la competencia, diseña las 21 piezas de la semana (3 al día: historia 08:00, post 12:00, historia 19:00), las revisa y las deja agendadas en `calendario.json`.
2. **Cada hora** el workflow *Publicar en Instagram y Facebook* publica lo que ya tocó, usando la API oficial de Meta. Marca cada pieza como publicada con su `media_id` / `fb_post_id`.
3. **Si algo falla**, el workflow queda en rojo y GitHub avisa por correo. Si todo va bien, no hay avisos.

## Archivos

| Archivo | Qué es |
|---|---|
| `AGENTE.md` | Instrucciones completas del agente: voz, pilares, cadencia, layouts, procedimiento semanal, QA |
| `producto.md` | Hechos de Kentra (planes, precios, funciones). Única fuente para cifras |
| `competencia.md` | Competidores a vigilar (page_ids de la Biblioteca de anuncios) y cómo responde Kentra |
| `memoria.md` | Aprendizajes: qué funcionó, hipótesis, registro semanal |
| `investigacion/` | Un informe corto por semana |
| `calendario.json` | Piezas agendadas y su estado de publicación |
| `piezas/AAAA-MM-DD/` | Los JSON de cada pieza y sus JPG renderizados |
| `plantillas/render.mjs` | Renderizador (HTML + Playwright). `plantillas/ejemplos/` tiene un ejemplo por layout |
| `marca/` | Logo, isotipo, mascota (con y sin teléfono) y personaje Excel, con fondo transparente |
| `scripts/publicar.mjs` | Publica en Instagram y Facebook lo pendiente del calendario |
| `scripts/verificar.mjs` | Prueba el token sin publicar nada |

## Comandos

```bash
npm install                                  # una vez (playwright-core)
node plantillas/render.mjs piezas/2026-10-06 # renderiza una carpeta (o un .json)
IG_TOKEN=... node scripts/verificar.mjs      # prueba el token
```

## Configuración (Settings → Secrets and variables → Actions)

- Secreto `IG_TOKEN`: token de usuario del sistema de Meta (BM PIxel, app "Kentra Publicador") con `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `business_management` y, para Facebook, `pages_manage_posts`.
- Variable `IG_USER_ID`: `17841480064403784` (@kentra.pro). Opcional, es el valor por defecto.
- Variable `FB_PAGE_ID`: `956335110897891` (página de Kentra). Mientras no exista, solo se publica en Instagram.
- El repositorio debe ser **público** para que Meta pueda descargar las imágenes.

## Reglas de Instagram

JPEG de máximo 8 MB. Posts y carruseles entre 4:5 y 1.91:1 (usamos 1080×1350); historias 9:16 (1080×1920). Carrusel: 2 a 10 imágenes. Límite: 50 publicaciones cada 24 h.
