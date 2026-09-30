# kentra-contenido

Contenido orgánico de Instagram de Kentra (@kentra.pro) y su publicación automática.

## Cómo funciona

1. Claude diseña las piezas (JPEG) en `piezas/AAAA-MM-DD/` y las agenda en `calendario.json`.
2. El workflow **Publicar en Instagram** corre cada hora y publica lo que ya tocó, con la API oficial de Instagram (Graph API).
3. Marca cada pieza como `publicado: true` con su `media_id`. Si algo falla, el workflow queda en rojo y GitHub avisa por correo.

## Formato de `calendario.json`

```json
{
  "id": "2026-10-01-post",
  "fecha": "2026-10-01T12:00:00-05:00",
  "tipo": "post | carrusel | historia",
  "imagenes": ["piezas/2026-10-01/post.jpg"],
  "caption": "Texto del post (las historias no llevan texto)"
}
```

Reglas de Instagram: JPEG de máximo 8 MB. Posts y carruseles entre 4:5 y 1.91:1 (usamos 1080×1350); historias 9:16 (1080×1920). Carrusel: de 2 a 10 imágenes. Límite: 50 publicaciones cada 24 h.

## Configuración (una sola vez)

- Secreto `IG_TOKEN`: token de usuario del sistema de Meta con `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`.
- Variable `IG_USER_ID` (opcional): `17841480064403784` (@kentra.pro).
- El repositorio debe ser **público**, para que Instagram pueda descargar las imágenes.
- Prueba: Actions → **Verificar conexión con Instagram** → Run workflow.
