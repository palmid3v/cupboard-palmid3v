# 🗄️ 𝐂𝐮𝐩𝐛𝐨𝐚𝐫𝐝 — Inventario central

> **PALMI-D3V** · Inventario de Hogar y Negocio → Sandwichies.

## 🎯 Producto
Cupboard mantiene identidad de productos compartida y existencias separadas por espacio. El administrador puede consultar Hogar y Negocio desde una experiencia central, sin mezclar balances, vencimientos ni movimientos.

## ✨ Capacidades y base técnica
- Inventario Firestore, búsqueda por nombre/código de barras y filtros por disponibilidad/stock bajo.
- Registro con cámara o código manual; detalle, vencimiento y stock mínimo.
- Entradas, consumos, historial de movimientos y unidades por producto.
- Lista de compras, recetas, analítica básica y enriquecimiento de catálogo.
- Espacios separados: **Hogar** y **Negocio → Sandwichies**.
- Catálogo compartido: identidad de producto común; cantidades, caducidad y movimientos permanecen aislados.
- Roles de hogar, invitaciones, verificación de correo y permisos aplicados por Firestore Rules.
- Interfaz responsive/PWA, temas PALMI-D3V.
- **Stack declarado en app/package.json:** React 19, Vite 8, Tailwind CSS 4, Firebase 12, Firebase Admin 14 (herramientas), ZXing, html5-qrcode y vite-plugin-pwa.

## 📊 Estado del proyecto
**Avance estimado de fases de arquitectura/producto: 85%.** La base de inventario y separación de espacios está implementada; quedan validaciones de importación histórica, operación en dispositivos, despliegue y endurecimiento de integraciones.

- Fases de catálogo compartido, modelo de datos, inventario, runtime, movimientos, Rules, migración y regresión: documentadas como implementadas.
- Administración central Hogar + Sandwichies: implementada.
- Importación inicial no destructiva desde Sandwichies: herramienta disponible en dry-run; aplicación real pendiente de revisión explícita.
- Validación de CI, dispositivos, sincronización y permisos reales debe distinguirse de pruebas locales.

Este porcentaje es una estimación por hitos documentados, no una certificación de producción.

## 🧭 Evolución de producto
1. Catálogo de identidad compartida.
2. Separación de inventario Hogar y Negocio.
3. Consolidación de movimientos, vencimientos, stock bajo y lista de compras.
4. Integración con Sandwichies: el pedido confirmado solicita consumo idempotente; Cupboard conserva autoridad sobre balances.
5. Exponer señales de stock bajo/vencimientos a DayFlow mediante un contrato de eventos, sin trasladar la propiedad del inventario.

## 🔒 Seguridad y límite de release
- Firestore es la persistencia del inventario; Rules aplican autenticación, verificación de correo, membresía y roles.
- El inventario Sandwichies es de acceso del propietario/administrador; no asignarlo a miembros domésticos.
- Hogar y Negocio no comparten balances ni movimientos.
- Importación `cupboard:inventory-import` funciona en dry-run por defecto; `--apply` modifica datos y requiere revisión/autorización explícita.
- No ejecutar `reset:data`, migraciones destructivas ni importación real sin backup, mapeo revisado y autorización.
- La presencia de una integración en código no prueba que IAM/configuración remota estén operativos.

## 🧪 Desarrollo local
Desde el repositorio:

```powershell
cd app
npm install
npm run dev
npm run lint
npm run build
npm run test:regression
npm run test:rules
```

Herramientas de inventario:
- `npm run cupboard:inventory-import` — dry-run por defecto; revisar ayuda/script antes de aplicar.
- `npm run cupboard:migrate-identities` — migración de identidades; no ejecutar sin revisar el alcance.

## 📚 Documentación clave
- `CONTEXT.md` — estado y límites del sistema.
- `docs/PRODUCT.md` — producto.
- `docs/ARCHITECTURE.md` — arquitectura y modelo de datos.
- `docs/SECURITY.md` — autenticación, roles y Rules.
- `docs/ROADMAP.md` — fases, hitos y pendientes.
- [PALMI-D3V ecosystem handoff](https://github.com/palmid3v/PALMI-D3V-Connected-Workspace/blob/main/AI-HANDOFF-2026-11-01.md).

## 🤝 Identidad
**Cupboard · PALMI-D3V** — *Build · Create · Improve · Validate.*

Cupboard es propietario del catálogo compartido y de los balances/movimientos de inventario. Sandwichies solicita consumos; DayFlow consume alertas; ninguno sustituye la autoridad de Cupboard.
