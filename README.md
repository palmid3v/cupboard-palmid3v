# 🗄️ Cupboard — Inventario central de Cupboard y Sandwichies

> **by PALMI-D3V** · Producto digital en desarrollo continuo.

Aplicación de inventario con espacios independientes para el hogar (Cupboard) y el negocio (Sandwichies). El administrador puede consultar ambos desde una vista central, sin mezclar sus existencias ni sus movimientos.

## ✨ Funcionalidades

- Inventario sincronizado con Firestore
- Búsqueda por nombre o código de barras
- Filtros por stock bajo y disponibilidad
- Registro con cámara o código manual
- Detalles de producto, vencimiento y stock mínimo
- Aumentar o consumir existencias y conservar la unidad de medida por producto
- Actualizaciones optimistas con reversión ante error
- Interfaz mobile-first y base PWA
- Temas PALMI-D3V con modos oscuro, claro y sistema
- Color principal personalizado con preferencias locales

## 🛠️ Tecnología

React · Vite · Firebase/Firestore · @zxing/browser · PWA

## 🚀 Ejecutar el proyecto

```bash
cd app
npm install
npm run dev
```

Consulta los documentos del proyecto antes de configurar servicios, credenciales o despliegues. Los comandos pueden variar según el entorno y las dependencias instaladas.

## 📍 Estado del proyecto

MVP funcional en desarrollo; la prioridad documentada es endurecer el flujo de escaneo, reconocimiento, registro e inventario en dispositivos reales.

## 📚 Documentación

`docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/ROADMAP.md`

La documentación técnica describe la arquitectura, las decisiones, las pruebas y el trabajo pendiente. Las funcionalidades futuras no se consideran implementadas hasta que exista evidencia en el código y validación correspondiente.

## 🤝 Créditos

Diseñado y desarrollado bajo la identidad **PALMI-D3V**.

---

*Build · Create · Improve · Validate*

## Apariencia

Cupboard integra el motor visual PALMI-D3V en `app/src/theme-engine`. Desde Ajustes puedes elegir una paleta, modo de apariencia y color principal. Las preferencias se guardan localmente y no alteran los datos, permisos ni movimientos del inventario. La fuente canónica de la librería es `palmid3v/bgc-changer-palmid3v/packages/theme-engine`.

## Administración central de inventario

- El administrador ve en una sola vista los inventarios de **Cupboard** y **Sandwichies**, con filtros y etiquetas que indican el destino de cada producto.
- Al registrar un producto, el administrador elige el destino. La identidad del producto vive en el catálogo compartido; cantidades, caducidad, stock mínimo y movimientos siguen separados por espacio.
- Desde el detalle se puede revisar el destino del producto y editar su información. Los productos existentes conservan su destino durante la edición; un traslado entre inventarios requiere una operación explícita, no se hace silenciosamente.
- Solo el administrador puede crear productos o editar sus datos de catálogo y configuración de inventario. Los editores autorizados pueden ajustar cantidades de Hogar; Firestore Rules valida los permisos en el servidor.
- El inventario de Cupboard/Hogar permanece intacto. Para inicializar el espacio comercial con existencias históricas de Sandwichies existe `npm run cupboard:inventory-import`; corre en modo `dry-run` por defecto, importa solo documentos faltantes y nunca sobrescribe balances existentes ni los que ya estén marcados como reflejados desde Cupboard. La importación real requiere credenciales administrativas con acceso a ambos proyectos Firebase.

Ejecuta desde `app/` después de completar `.env` con los IDs de ambos proyectos y el hogar de Cupboard:

```powershell
npm run cupboard:inventory-import
npm run cupboard:inventory-import -- --apply
```

La primera orden solo presenta el plan. Revisa cantidades, asociaciones y registros omitidos antes de ejecutar la segunda. Usa Application Default Credentials con permisos de lectura en Sandwichies y escritura en Cupboard; nunca guardes claves de servicio en Git.

## Espacios de inventario

El selector de espacio sigue disponible para herramientas específicas. La vista de inventario del administrador reúne Hogar y Negocio · Sandwichies, pero las cantidades y movimientos se mantienen separados. El catálogo de identidad es compartido. Sandwichies conserva su aplicación y refleja el inventario comercial de Cupboard mediante una integración servidor-a-servidor; las existencias no se deben editar en una segunda fuente de verdad.

## PALMI-D3V Connected Workspace

Cupboard runs alongside DayFlow, Cupboard, Sandwichies and Financial-D3v through [PALMI-D3V Connected Workspace](https://github.com/palmid3v/PALMI-D3V-Connected-Workspace). For shared runtime ports, cross-project ownership, implementation status, technology map, safety constraints and AI continuation instructions, see the [ecosystem AI handoff](https://github.com/palmid3v/PALMI-D3V-Connected-Workspace/blob/main/AI-HANDOFF-2026-11-01.md).
