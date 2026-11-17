# Ejecución Cupboard — 2026-11-16

## Estado y cambios

- Repositorio `main`, commit local `9660f5e`, limpio al iniciar.
- Se añadió override de `@grpc/grpc-js` para eliminar vulnerabilidades críticas y se actualizaron dependencias transitivas (`glob`, `uuid`) en package/lockfile sin `--force`; auditoría final offline de producción: 0 vulnerabilidades.
- `src/App.jsx` carga el flujo de escaneo de forma diferida, para no descargar el lector de códigos al abrir otra vista. Se muestra un estado accesible mientras carga.
- README actualizado con independencia del Worker, ejecución de reglas con emulador y URL verificada.
- La app conserva sus servicios Firebase, reglas de hogar/negocio y fuente de inventario; no depende de Sandwichies para operar.

## Pruebas

- `npm run test:regression`: 19/19 pasó.
- `npm run lint`: pasó.
- Firestore Rules en `demo-cupboard`: 8/8 pasó con Firestore Emulator.
- Build PWA en carpeta temporal: pasó y generó `sw.js`/Workbox. Rolldown divide Firebase, React y vendor; chunk mayor observado 315.48 kB y el escáner se carga por separado.
- El build predeterminado no pudo escribir `app/dist/sw.js` (`EPERM`). No se borraron archivos; el build temporal demostró que el código compila.

## Producción

- Vercel identifica el proyecto `cupboard-palmid3v`, dominio verificado `https://cupboard-palmid3v.vercel.app` y un deployment de producción `READY`.
- La URL respondió HTTP 200 a HEAD. No se inició sesión con cuentas reales ni se ejecutaron escrituras LIVE.
- No se desplegó, no se cambiaron Firebase Rules/IAM/billing ni se ejecutaron migraciones.
- La integración con Sandwichies y sus credenciales no son requisito para el uso normal de Cupboard.

## Update 2026-11-17: reservation contract and verification

Cupboard now tracks backend-owned `reservedPortions` for the Sandwichies business workspace, derives available stock by subtracting holds, prevents client Rules writes to reservation metadata, and blocks owner UI adjustments below active holds. Local checks: ESLint passed; regression suite 19/19; Firestore Rules Emulator 9/9; PWA build succeeded to `.tmp-release-build`. The standard `app/dist/sw.js` build output failed with workspace `EPERM`; the temporary-output build completed all chunks and generated the service worker. No Firebase LIVE data, IAM or rules were changed. Sandwichies acquires a reservation on admin confirmation, not at checkout; this product gap is documented in its Worker README and prevents order activation.
