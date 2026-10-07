# Vivi y Oliver · 13.02.2027 💍

Invitación web a nuestra boda. Sitio estático (HTML + CSS + JS), sin dependencias ni paso de build.

## Estructura

```
index.html              Página principal
css/styles.css          Estilos (colores en las variables de :root)
js/main.js              Cuenta regresiva, animación del casete y saludo personalizado
assets/vivi-y-oliver.jpg Foto
```

## Verla en local

Abre `index.html` en el navegador, o sirve la carpeta:

```bash
npx serve .
```

## Pendiente antes de publicar

- [x] **Confirmar asistencia**: el botón abre el formulario de Google. Con `?para=Nombre`, el nombre llega pre-rellenado (`entry.424204634` en `js/main.js`).
- [ ] **Regalos**: reemplazar `REEMPLAZAR_CON_TU_ENLACE_BANCARIO` en `index.html` por el link real.
- [ ] Opcional: cuando el sitio tenga dominio, poner la URL absoluta en `og:image` (WhatsApp necesita URL completa para mostrar la foto en la vista previa).

## Invitaciones personalizadas

Agrega `?para=Nombre` (o `#para=Nombre`) al link y aparecerá un saludo arriba:

```
https://TU-USUARIO.github.io/noscasamos-app/?para=Tía%20Carmen
```

## Publicar con GitHub Pages

1. Crea un repositorio vacío en GitHub (p. ej. `noscasamos-app`).
2. Sube el código:
   ```bash
   git add .
   git commit -m "Invitación de boda"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/noscasamos-app.git
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / root**.
4. En un par de minutos queda en `https://TU-USUARIO.github.io/noscasamos-app/`.

También funciona tal cual en Netlify, Vercel o Cloudflare Pages (arrastrar la carpeta o conectar el repo, sin comando de build).
