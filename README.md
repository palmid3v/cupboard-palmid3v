# 🧺 Cupboard · PALMI-D3V

**Cupboard** es una aplicación de gestión de inventario para el hogar y el negocio. Centraliza la identidad de los productos y administra existencias, precios de referencia, vencimientos y movimientos en espacios separados, manteniendo la trazabilidad sin mezclar contextos ni balances.

Dentro del ecosistema **PALMI-D3V**, Cupboard es la fuente de verdad de las cantidades y movimientos de inventario. Las aplicaciones integradas pueden solicitar operaciones autorizadas, pero no mantienen una autoridad paralela sobre el stock.

## ✨ Funcionalidades

- 📦 **Inventario:** productos, cantidades físicas, unidades, stock mínimo y fechas de vencimiento.
- 💲 **Precios de productos:** precio de compra editable y opcional, expresado en pesos colombianos (COP), asociado al producto dentro de cada espacio de inventario.
- 🪪 **Tarjetas y detalle de producto:** consulta rápida de existencias, estado y precio registrado cuando está disponible.
- 🔄 **Movimientos trazables:** registro de entradas, consumos, compras, ajustes y reversiones, con cantidades, referencias e información de contexto cuando el origen la proporciona.
- 🔎 **Búsqueda y descubrimiento:** búsqueda por nombre o código de barras y filtros por disponibilidad o stock bajo.
- 🧭 **Organización por espacios:** separación de **Hogar** y **Negocio → Sandwichies**.
- 🛒 **Compras y planificación:** listas de compras, recetas y analítica básica para apoyar la reposición.
- 🧩 **Catálogo compartido:** la identidad del producto puede reutilizarse; cantidades, precios, vencimientos y movimientos permanecen aislados por espacio.
- 👥 **Acceso compartido:** roles e invitaciones para miembros del hogar, con permisos aplicados en Firestore.
- 📱 **PWA responsive:** interfaz adaptable e instalable en navegadores compatibles.

> **Nota sobre precios:** el campo actual representa el precio de compra del producto o presentación, no el costo unitario por porción ni el precio de venta. Los productos existentes pueden continuar sin precio registrado.

## 🏗️ Arquitectura y tecnologías

La aplicación ejecutable se encuentra en `app/` y utiliza:

| Capa | Tecnología |
| --- | --- |
| Interfaz | React 19 |
| Desarrollo y build | Vite 8 |
| Estilos | Tailwind CSS 4 |
| Backend y persistencia | Firebase 12 · Cloud Firestore |
| Identidad y sesiones | Firebase Authentication |
| Seguridad de datos | Firestore Security Rules |
| Escaneo | ZXing · html5-qrcode |
| Aplicación instalable | vite-plugin-pwa |
| Calidad | ESLint · pruebas de regresión · pruebas de Rules con emulador |

La interfaz se organiza en componentes, hooks y servicios. El acceso a datos y las operaciones de inventario se mantienen en la capa de servicios; Firestore conserva los datos persistentes y las reglas aplican el aislamiento por hogar, espacio y permisos.

## 🔗 Integración con PALMI-D3V

- 🥪 **Sandwichies:** gestiona el catálogo comercial, los pedidos y la operación de venta. Cuando corresponde, su Worker autorizado solicita consumos o reversiones en el espacio **Negocio → Sandwichies**. Cupboard conserva los balances y movimientos como fuente de verdad.
- 📅 **DayFlow:** puede consumir alertas o eventos de inventario para apoyar la planificación, sin convertirse en una base alternativa de stock.
- 📊 **Financial-D3V:** cualquier intercambio comercial futuro requiere un contrato explícito y minimizado. El precio de compra registrado en Cupboard no implica por sí solo que exista una integración financiera o un cálculo de rentabilidad.

La integración de pedidos utiliza operaciones idempotentes y registros de movimientos para facilitar la trazabilidad y los reintentos. Debido a que los proyectos Firebase son independientes, las operaciones que cruzan ambos proyectos requieren mecanismos de compensación y reconciliación.

## 🚀 Desarrollo local

Requisitos: Node.js, npm y Firebase CLI cuando se ejecuten las pruebas que dependen del emulador.

Desde la raíz del repositorio:

```powershell
cd app
npm ci
npm run dev
```

### 🧪 Validación

Ejecuta desde `app/`:

```bash
npm run lint
npm run test:regression
npm run test:rules
npm run build
```

Las pruebas de Firestore Rules requieren el emulador. Para ejecutarlas con el proyecto demo:

```powershell
firebase emulators:exec --only firestore --project demo-cupboard "npm.cmd run test:rules"
```

También existe un validador desde la raíz:

```powershell
.\scripts\validate.ps1
```

### ⚠️ Herramientas de datos

Estos scripts pueden interactuar con datos persistentes. Revisa siempre su ayuda, alcance y modo de ejecución antes de aplicarlos:

- `npm run cupboard:inventory-import` — importación de inventario; dry-run por defecto.
- `npm run cupboard:migrate-identities` — migración de identidades de productos.
- `npm run reset:data` — operación de reinicio de datos; no ejecutar sin respaldo y autorización.

No ejecutes importaciones, migraciones o reinicios reales sin revisar el plan, contar con respaldo y tener autorización explícita.

## 🔐 Seguridad y modelo de acceso

- Firebase Authentication administra la identidad y las sesiones.
- Firestore Security Rules protegen los datos y aplican permisos por hogar y espacio.
- Las operaciones administrativas y las integraciones backend deben respetar los límites de autorización definidos.
- Las credenciales de servicio del Worker no deben incorporarse a la aplicación cliente.
- Los balances físicos y los movimientos deben permanecer consistentes; las operaciones de inventario deben conservar su trazabilidad.

## 📚 Documentación

- 🧾 [Producto](docs/PRODUCT.md)
- 🏛️ [Arquitectura y modelo de datos](docs/ARCHITECTURE.md)
- 🗃️ [Modelo de datos](docs/DATA_MODEL.md)
- 🎨 [Principios de diseño](docs/DESIGN_PRINCIPLES.md)
- 🔒 [Seguridad y permisos](docs/SECURITY.md)
- 🧭 [Flujos de usuario](docs/USER_FLOWS.md)
- 🗺️ [Roadmap](docs/ROADMAP.md)
- 🤝 [Contribución](docs/CONTRIBUTING.md)
- 🧠 [Contexto del proyecto](CONTEXT.md)
- ✅ [Checkpoint de calidad](QUALITY-CHECKPOINT-2026-11-12.md)
- 📝 [Reporte de ejecución](docs/EXECUTION-REPORT-2026-11-16.md)

## 🌐 Repositorio y despliegue

- 💻 **GitHub:** [palmid3v/cupboard-palmid3v](https://github.com/palmid3v/cupboard-palmid3v)
- 🚀 **Aplicación:** [cupboard-palmid3v.vercel.app](https://cupboard-palmid3v.vercel.app)

La disponibilidad del sitio publicado y la validación local/CI son evidencias diferentes. Consulta los reportes de calidad antes de asumir que una integración, migración o flujo está habilitado en producción.

---

**Cupboard · PALMI-D3V**  
*🧱 Build · 🎨 Create · 🔧 Improve · ✅ Validate.*


## 📚 Documentation status · 2026-11-26

See [DOCUMENTATION-STATUS-2026-11-26.md](docs/DOCUMENTATION-STATUS-2026-11-26.md) for the current product scope, boundaries and release gates.
