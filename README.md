# Cupboard

**Cupboard** es una aplicación de gestión de inventario para el hogar y el negocio. Centraliza la identidad de los productos y registra existencias, vencimientos y movimientos en espacios separados, para mantener trazabilidad sin mezclar contextos ni balances.

En el ecosistema PALMI-D3V, Cupboard es la fuente de verdad de las cantidades y movimientos de inventario. Sandwichies puede solicitar consumos comerciales, pero no mantiene una segunda autoridad de stock.

## Producto

- **Inventario:** productos, cantidades disponibles, unidades, stock mínimo y fechas de vencimiento.
- **Registro de movimientos:** entradas, consumos y ajustes con historial trazable.
- **Descubrimiento:** búsqueda por nombre o código de barras y filtros por disponibilidad o stock bajo.
- **Organización:** espacios independientes para **Hogar** y **Negocio → Sandwichies**.
- **Compras y planificación:** listas de compras, recetas y analítica básica para apoyar la reposición.
- **Catálogo compartido:** la identidad del producto puede reutilizarse, mientras cantidades, vencimientos y movimientos permanecen aislados por espacio.
- **Acceso compartido:** roles e invitaciones para miembros del hogar, con permisos aplicados en Firestore.

La interfaz es responsive y puede instalarse como PWA en navegadores compatibles.

## Arquitectura y tecnologías

La aplicación está en `app/` y utiliza **React 19**, **Vite 8**, **Tailwind CSS 4** y **Firebase 12**, con Cloud Firestore como persistencia. Firebase Authentication gestiona identidad y sesiones; Firebase Rules aplican aislamiento de datos, membresías y permisos.

El registro de productos admite captura por cámara y códigos de barras mediante ZXing y html5-qrcode. La experiencia PWA se genera con vite-plugin-pwa.

Las herramientas de desarrollo incluyen ESLint, pruebas de regresión y pruebas de Firestore Rules con emulador. Las versiones y scripts ejecutables se mantienen en `app/package.json`.

## Integración dentro de PALMI-D3V

- **Sandwichies** es responsable del catálogo comercial, pedidos y operación de venta; Cupboard conserva las existencias y movimientos.
- **DayFlow** puede consumir alertas o eventos de inventario para planificación, sin convertirse en una base alternativa de stock.
- **Financial-D3V** no recibe datos financieros privados desde Cupboard. Cualquier intercambio comercial futuro requiere un contrato explícito y minimizado.

<<<<<<< HEAD
```powershell
cd app
npm ci
npm run dev
npm run lint
npm run build
npm run test:regression
npm run test:rules
```

Cupboard funciona de forma independiente: Authentication y Firestore son sus dependencias propias; las rutas del Worker de Sandwichies no forman parte del inicio ni de las operaciones de Cupboard. Para ejecutar las pruebas de Rules, usa el emulador Firestore con el proyecto demo `demo-cupboard`:

```powershell
firebase emulators:exec --only firestore --project demo-cupboard "npm.cmd run test:rules"
```

La integración comercial es adicional y unidireccional desde Sandwichies: el Worker autorizado solicita operaciones sobre el espacio Negocio → Sandwichies; Cupboard conserva los balances y movimientos como fuente de verdad. La aplicación cliente de Cupboard no recibe ni consume las credenciales del Worker.

La URL de producción actualmente verificada es [https://cupboard-palmid3v.vercel.app](https://cupboard-palmid3v.vercel.app). El dominio aparece verificado en el proyecto Vercel `cupboard-palmid3v` y respondió HTTP 200 en una comprobación HEAD el 2026-11-17. Esto verifica que la página se sirve; no sustituye las pruebas de autenticación contra Firebase LIVE.

Herramientas de inventario:
- `npm run cupboard:inventory-import` — dry-run por defecto; revisar ayuda/script antes de aplicar.
- `npm run cupboard:migrate-identities` — migración de identidades; no ejecutar sin revisar el alcance.
=======
La importación o migración de inventario debe revisarse en modo de simulación antes de aplicar cambios. No se deben ejecutar operaciones destructivas o importaciones reales sin respaldo y autorización.

## Desarrollo
>>>>>>> 647ad841cf75abda7d7c7eb2861ef47bb0a24fbb

La aplicación se encuentra en `app/`. Desde esa carpeta instala dependencias y utiliza los scripts declarados en `app/package.json` para desarrollo, lint, build y pruebas. Las pruebas de reglas requieren el entorno de emulación de Firebase.

Revisa cuidadosamente las herramientas de migración e importación antes de ejecutarlas: algunas admiten un modo de aplicación que modifica datos persistentes.

<<<<<<< HEAD
Cupboard es propietario del catálogo compartido y de los balances/movimientos de inventario. Sandwichies solicita consumos; DayFlow consume alertas; ninguno sustituye la autoridad de Cupboard.

## Sandwichies stock reservations

The `Negocio -> Sandwichies` workspace is the only inventory namespace used by the Sandwichies Worker. Physical `portions` remain authoritative; `reservedPortions` records active order holds and the UI displays available stock as `portions - reservedPortions`. Cupboard Firestore Rules prevent browser clients from forging reservation counters or mutating backend reservation records. Owner stock updates and manual movements run through Firestore transactions and cannot reduce physical stock below active reservations.

The Worker stores idempotent reservation records under `households/{householdId}/workspaces/sandwichies/reservations/`, checks every product and balance transactionally, then consumes the reservation in a second transaction that also writes the traceable movement. Pending-order cancellation releases a hold; consumed-order cancellation uses one idempotent reversal. The two Firebase projects do not share a transaction, so this remains a retry-safe saga with reconciliation required for failed cross-project compensation.

Verification on 2026-11-17: Cupboard ESLint passed, regression tests passed 19/19, Firestore Rules Emulator passed 9/9, and a Vite PWA build passed to a temporary output directory. The default `app/dist/sw.js` output path returned `EPERM` in this workspace, so the successful build used `.tmp-release-build`. These local checks do not verify Firebase LIVE IAM, authentication, or inventory data.
=======
## Documentación

- [Producto](docs/PRODUCT.md)
- [Arquitectura y modelo de datos](docs/ARCHITECTURE.md)
- [Seguridad y permisos](docs/SECURITY.md)
- [Roadmap](docs/ROADMAP.md)
- [Contexto del proyecto](CONTEXT.md)
- [Checkpoint de calidad](QUALITY-CHECKPOINT-2026-11-12.md)

## Repositorio y despliegue

- Repositorio: [palmid3v/cupboard-palmid3v](https://github.com/palmid3v/cupboard-palmid3v)
- Sitio web: [cupboard-palmid3v.vercel.app](https://cupboard-palmid3v.vercel.app)

El sitio publicado y la validación local/CI son evidencias diferentes; consulta los checkpoints antes de asumir que una integración o migración está habilitada.

---

**Cupboard · PALMI-D3V**  
*Build · Create · Improve · Validate.*
>>>>>>> 647ad841cf75abda7d7c7eb2861ef47bb0a24fbb
