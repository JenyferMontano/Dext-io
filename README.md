# Dext.io

**Dext.io** es una aplicación web de una sola página (**SPA**) inspirada en Reddit: feed de publicaciones, comunidades y perfiles. Está hecha con **React**, **Vite** y **React Router**, e incluye una **PWA** con **Service Worker manual**, cachés avanzadas y soporte **sin conexión**. La interfaz está en **español**.

Este documento sirve como **guía técnica** y como **guion para una exposición** (resume la sección 8 al final).

### Índice

1. [Descripción general](#1-descripción-general-del-proyecto)  
2. [Arquitectura](#2-arquitectura)  
3. [Módulos principales](#3-módulos-principales)  
4. [Manejo de datos](#4-manejo-de-datos)  
5. [PWA y Service Worker](#5-pwa-y-service-worker)  
6. [Funcionalidades avanzadas](#6-funcionalidades-avanzadas)  
7. [Experiencia de usuario](#7-experiencia-de-usuario)  
8. [Cómo explicarlo en una exposición](#8-cómo-explicarlo-en-una-exposición)  
· [Ejecución local, scripts y anexos](#requisitos-previos)

---

## 1. Descripción general del proyecto

### ¿Qué es Dext.io?

Es una **plataforma de demostración** que imita lo esencial de un foro tipo Reddit: ver publicaciones en un feed, explorar **comunidades** (como “subreddits”) y consultar un **perfil de usuario** con sus posts. No hay base de datos ni servidor propio: los datos son **simulados** (archivo JSON) y, opcionalmente, se enriquecen con una API pública de prueba cuando hay internet.

### ¿Qué problema resuelve?

En el ámbito académico no “resuelve” un negocio real, pero **demuestra** cómo:

- Construir una **SPA moderna** con rutas sin recargar la página.
- Hacer que la app **funcione aunque falle la red**, gracias al **caché** y a datos de respaldo.
- Aplicar conceptos de **PWA**: instalación, manifiesto, Service Worker y estrategias de caché.

Es decir: integra **frontend estructurado + PWA + offline** en un solo proyecto pequeño y entendible.

### ¿Por qué es una SPA?

Una **SPA (Single Page Application)** carga **una sola página HTML** y, a partir de ahí, **JavaScript** (React) pinta y cambia lo que ve el usuario. Al pasar de “Inicio” a “Comunidades”, **no se vuelve a pedir todo el HTML al servidor**: solo cambia la vista dentro del mismo documento. Eso hace la navegación **rápida y fluida**, similar a una app nativa, y encaja bien con el enrutado del lado del cliente (**React Router**).

---

## 2. Arquitectura

### Cómo funciona la SPA (React + Router)

- **React** divide la interfaz en **componentes** reutilizables (barra de navegación, tarjeta de post, etc.).
- **React Router** asocia **rutas URL** (por ejemplo `/c/tech`) con **componentes de página** concretos.
- **`App.jsx`** declara un `<Routes>` con todas las rutas; **`main.jsx`** monta la app dentro de `<BrowserRouter>` para que el historial del navegador y las URLs funcionen bien.

### Cómo se navega sin recargar la página

Los enlaces internos usan **`<Link>`** (de React Router), no `<a href>` a páginas HTML distintas. Al hacer clic:

1. Cambia la **URL** en la barra de direcciones.
2. React Router **elige qué “página” mostrar** según la ruta.
3. **No** se descarga otro documento HTML completo: solo se actualiza el **árbol de componentes** en el mismo `#root`.

Eso es lo que se entiende por **navegación del lado del cliente**.

### Estructura del proyecto

| Carpeta / archivo | Función |
|-------------------|---------|
| **`src/pages/`** | Pantallas completas: Inicio, listado de comunidades, feed por comunidad, perfil. |
| **`src/components/`** | Piezas reutilizables: barra superior, tarjeta de post, banner offline, imagen con fallback, etc. |
| **`src/services/`** | Lógica de **datos**: leer `mock-data.json`, paginar, filtros, datos de respaldo. |
| **`src/router/routes.js`** | Rutas centralizadas (evita escribir URLs a mano en muchos sitios). |
| **`src/utils/`** | Utilidades, por ejemplo el registro de **Background Sync** para la demo. |
| **`public/`** | Archivos **estáticos** servidos tal cual: manifiesto PWA, Service Worker, JSON de datos, iconos. |

Tras **`npm run build`**, Vite genera **`dist/`** con el HTML, los JS/CSS empaquetados y una copia de **`public/`**.

---

## 3. Módulos principales

### Inicio (feed) — ruta `/`

**Qué hace:** Muestra un **listado de publicaciones** con **scroll infinito**: al acercarse al final, se cargan más entradas (paginación por páginas en el servicio).

**Internamente:** La página **`Home.jsx`** llama a **`getPosts`** en `postsService.js`. Puede mezclar posts del JSON local con unas pocas entradas de demostración desde **JSONPlaceholder** si hay conexión. Los **votos** en cada tarjeta son **solo en memoria** (no se guardan en servidor).

### Comunidades — rutas `/communities` y `/c/:slug`

**Qué hace:** En **`/communities`** se listan las comunidades (nombre, descripción, miembros). Al entrar en una, por ejemplo **`/c/tech`**, **`CommunityFeed.jsx`** muestra solo los posts de esa comunidad.

**Internamente:** Se filtra por `communityId` / `slug` en el servicio de posts. El scroll infinito funciona igual que en Inicio, pero con el filtro aplicado.

### Perfil de usuario — ruta `/user/:userId`

**Qué hace:** Muestra datos de un usuario simulado (nombre, bio, karma, fecha de alta) y **solo sus publicaciones**.

**Internamente:** **`Profile.jsx`** usa **`getUser`** y **`getPosts`** con `userId`. No hay autenticación: el usuario principal de demo es **`u1`** (visible desde el enlace “Perfil” en la barra).

---

## 4. Manejo de datos

### De dónde vienen los datos

1. **Fuente principal:** **`public/mock-data.json`** — comunidades, un usuario de ejemplo y una lista de posts (títulos, textos, votos, imágenes opcionales).
2. **Respaldo embebido:** **`src/services/fallbackData.js`** — un JSON mínimo en código por si **no se puede leer** el archivo (por ejemplo, primera visita sin red y sin nada en caché).
3. **Opcional con red:** **`postsService.js`** puede pedir algunos posts a **JSONPlaceholder** y mostrarlos como publicaciones de demostración con texto en español.

El **Service Worker** puede **guardar en caché** la respuesta de `mock-data.json`, de modo que en visitas posteriores **no hace falta red** para leer esos datos.

### Qué pasa si no hay internet

- Si **ya hubo una visita con éxito**, el SW suele poder **servir el JSON y el shell** desde caché → la app sigue mostrando contenido.
- Si **nunca hubo carga exitosa** y no hay caché, entra el **`fallbackData`** → al menos un mensaje coherente de “sin conexión”.
- Un **banner** avisa que estás offline; las **imágenes** que fallen cargan **`no-image.png`**.

---

## 5. PWA y Service Worker

### Qué es un Service Worker (idea simple)

Es un **script que el navegador ejecuta en segundo plano**, separado de la pestaña visible. **Intercepta las peticiones de red** (`fetch`) y puede **decidir** si responder con la red, con la caché o con una mezcla. Así la app puede **seguir funcionando** o degradarse con elegancia cuando la red falla. El archivo está en **`public/serviceworker.js`** y se registra desde **`main.jsx`**.

### Ciclo de vida básico

| Fase | Qué ocurre |
|------|------------|
| **install** | Primera instalación del SW: suele **precargar** URLs críticas (HTML, manifiesto, JSON, imagen de fallback) en la caché **estática**. Luego `skipWaiting()` para activarse pronto. |
| **activate** | El SW toma control: se **borran cachés viejas** de versiones anteriores y se limita el tamaño de las cachés actuales. |
| **fetch** | En cada petición HTTP relevante, el SW aplica la **estrategia** elegida (red primero, caché primero, carrera, etc.). |

Además existen otros eventos del SW que **no** son el ciclo principal, pero sí aparecen en este proyecto: **`sync`** (Background Sync) y **`push`** (notificaciones). Están descritos en la [sección 6](#6-funcionalidades-avanzadas).

### Tipos de caché en este proyecto

| Nombre | Uso típico |
|--------|------------|
| **`static-v1`** | **Shell y estáticos** del propio sitio (HTML, JS/CSS del build, iconos, etc.): contenido que no cambia en cada petición de la misma forma que un JSON dinámico. |
| **`dynamic-v1`** | **Respuestas variables**: JSON de datos, HTML de navegación, llamadas a APIs. Es lo que más se usa para **offline** con contenido ya visitado. |
| **`immutable-v1`** | Recursos de **CDN** con URLs versionadas (fuentes, librerías): se pueden cachear de forma muy agresiva porque la URL “nueva” es otro recurso. |

Los nombres llevan **`v1`** para poder subir a **`v2`** y borrar lo obsoleto en `activate`.

### Estrategias de caché utilizadas

- **Cache First:** primero mira la caché; si no hay, va a la red y guarda. Buena para **JS/CSS/imágenes** del propio dominio que no cambian en cada segundo.
- **Network First:** primero la red; si falla, usa la caché. Ideal para **datos** que quieres frescos pero con **respaldo offline**.
- **Red + caché en carrera (*race*):** compite red y caché; la que responda válida primero gana, con **fallbacks** si algo falla. Muy útil para **mejorar la sensación de velocidad** y seguir teniendo plan B.

Además hay **límite de entradas** (`MAX_ITEMS`) y **limpieza** para no llenar el disco.

### Cómo funciona el modo offline

1. El usuario visita la app **con conexión** → el SW **instala** y **llena** cachés.
2. Si luego **no hay red**, el evento **`fetch`** sigue activo: muchas peticiones se responden desde **`dynamic-v1`** o **`static-v1`**.
3. Si falta algo que nunca se cacheó, se intenta **SPA shell** (`index.html`) para rutas de navegación, o **mensaje/plantilla** de error.
4. El **manifiesto** (`manifest.json`) permite **instalar** la app en la pantalla de inicio con aspecto **standalone**.

---

## 6. Funcionalidades avanzadas

### Background Sync

La **API de sincronización en segundo plano** permite **registrar una tarea** que el navegador ejecutará cuando vuelva la conectividad (por ejemplo, reenviar un formulario). En este proyecto está **simulada**: el SW escucha el evento **`sync`** con la etiqueta **`dext-sync-posts`** y solo hace **logs** en consola, como si en el futuro se enviaran votos o borradores al servidor. Desde el pie de página se puede **registrar** esa sincronización (si el navegador lo permite).

### Push notifications (simuladas)

Las notificaciones **push** reales requieren servidor, claves y permisos. Aquí el SW escucha el evento **`push`** y **registra en consola** que habría llegado un mensaje — es una **demostración del hook**, no una notificación real al usuario. Sirve para explicar en clase **dónde** encajaría el código real (`showNotification`, etc.).

---

## 7. Experiencia de usuario

### Diseño responsivo

Los estilos en **`index.css`** usan un enfoque **mobile-first**: anchos máximos, rejillas flexibles, tipografía que escala y navegación que se adapta a pantallas pequeñas. La idea es que **móvil, tablet y escritorio** lean bien el mismo layout en tarjetas.

### Comportamiento offline

- **Banner** cuando `navigator.onLine` es falso.
- **Datos:** caché del SW + `fallbackData` si hace falta.
- **Navegación SPA:** si el shell está cacheado, muchas rutas siguen abriendo la app aunque no haya red (limitado por lo que ya se haya guardado).

### Fallback de imágenes

**`SafeImage`** intenta cargar la URL remota; si **falla** (404, CORS, offline), sustituye por **`/no-image.png`**. El Service Worker también puede **devolver esa imagen** para peticiones de imágenes externas que fallen.

---

## 8. Cómo explicarlo en una exposición

### Versión corta (2–3 minutos)

> “**Dext.io** es una aplicación web tipo Reddit construida como **SPA con React**: una sola página HTML y el resto son vistas que cambian con **React Router**, sin recargar el sitio entero.  
> Los datos vienen de un **JSON local** y, si hay internet, de una API de prueba. Lo importante del trabajo es la **PWA**: un **Service Worker** que yo mismo programé, con **tres cachés** y estrategias distintas — **caché primero**, **red primero** y **carrera** — para que la app **aguante sin conexión** cuando ya se visitó antes.  
> Además hay demos de **Background Sync** y **push** en la consola, y la interfaz es **responsive** con **fallback** de imágenes.”

### Frases clave que puedes decir

- “**SPA**: una página, muchas vistas; el servidor no entrega HTML nuevo en cada clic.”
- “**React Router** enlaza la URL con el componente que toca; la experiencia es como una app.”
- “El **Service Worker** es un **intermediario** entre la app y la red: puede **cachear** y **decidir** qué servir sin conexión.”
- “**static / dynamic / immutable** son tres **cajones** de caché con **propósitos distintos**.”
- “**Offline** aquí no es magia: es **contenido ya guardado** más **datos de respaldo** en código.”

### Cómo explicar conceptos técnicos con sencillez

| Concepto | Analogía o explicación breve |
|----------|-------------------------------|
| **SPA** | Como un **solo lienzo** donde cambias lo pintado, en lugar de pedir un **cuadro nuevo** al almacén cada vez. |
| **Service Worker** | Un **ayudante invisible** que puede tener **copias** de archivos y **decidir** si te da la copia o va a internet. |
| **Cache First** | “**Si tengo fotocopia**, la uso; si no, imprimo.” |
| **Network First** | “**Intento lo nuevo** en internet; si no va, **uso la fotocopia**.” |
| **Race** | “**Red y caché corren**; el primero que llega con una respuesta válida gana.” |
| **PWA** | Un sitio web que se puede **instalar** y **comportarse** más como aplicación nativa. |

---

## Requisitos previos

- **[Node.js](https://nodejs.org/) 18+** (incluye `npm`).

---

## Cómo ejecutar el proyecto

### Instalación

```bash
cd dext-io
npm install
```

`npm install` ejecuta la generación de iconos PNG y **`no-image.png`** (`scripts/generate-icons.mjs`, usa **`pngjs`**). Si falla:

```bash
npm run icons
```

### Desarrollo

```bash
npm run dev
```

Por defecto: **http://localhost:5173**. Los Service Workers funcionan en **localhost** (HTTP).

### Producción

```bash
npm run build
npm run preview
```

**`preview`** sirve **`dist/`** (p. ej. **http://localhost:4173**) y es lo más parecido a producción para probar PWA e instalación.

---

## Scripts npm

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo Vite. |
| `npm run build` | Compila la SPA en `dist/`. |
| `npm run preview` | Vista previa de la build. |
| `npm run icons` | Regenera iconos PNG y `no-image.png`. |

---

## Estructura de carpetas (referencia rápida)

```
dext-io/
├── index.html
├── vite.config.js
├── package.json
├── scripts/generate-icons.mjs
├── public/
│   ├── manifest.json
│   ├── serviceworker.js
│   ├── mock-data.json
│   ├── no-image.png
│   └── icons/
└── src/
    ├── main.jsx, App.jsx, index.css
    ├── components/
    ├── pages/
    ├── services/
    ├── router/
    └── utils/
```

---

## Probar sin conexión

1. Arranca `npm run dev` o `npm run preview`.
2. Abre la app **con red** al menos una vez.
3. DevTools → **Aplicación** → **Service Workers** → comprobar registro.
4. **Red** → **Sin conexión** → recargar y navegar.

---

## Licencia

MIT — proyecto educativo / demostración.
