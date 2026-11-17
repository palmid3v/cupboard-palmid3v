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

La importación o migración de inventario debe revisarse en modo de simulación antes de aplicar cambios. No se deben ejecutar operaciones destructivas o importaciones reales sin respaldo y autorización.

## Desarrollo

La aplicación se encuentra en `app/`. Desde esa carpeta instala dependencias y utiliza los scripts declarados en `app/package.json` para desarrollo, lint, build y pruebas. Las pruebas de reglas requieren el entorno de emulación de Firebase.

Revisa cuidadosamente las herramientas de migración e importación antes de ejecutarlas: algunas admiten un modo de aplicación que modifica datos persistentes.

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
