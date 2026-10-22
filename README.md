# 🗄️ Cupboard — Inventario del hogar

> **by PALMI-D3V** · Producto digital en desarrollo continuo.

Aplicación de inventario doméstico pensada para saber qué productos hay en casa, buscar rápidamente y mantener las cantidades actualizadas sin la complejidad de un sistema de bodega.

## ✨ Funcionalidades

- Inventario sincronizado con Firestore
- Búsqueda por nombre o código de barras
- Filtros por stock bajo y disponibilidad
- Registro con cámara o código manual
- Detalles de producto, vencimiento y stock mínimo
- Aumentar o consumir existencias y conservar la unidad de medida por producto
- Actualizaciones optimistas con reversión ante error
- Interfaz mobile-first y base PWA

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

## Espacios de inventario

El selector permite alternar entre **Hogar** y **Negocio · Sandwichies**. Hogar conserva las rutas actuales para proteger los datos existentes; el inventario comercial y sus movimientos usan el subárbol independiente `households/{householdId}/workspaces/sandwichies/`. El catálogo de identidad de productos sigue compartido, mientras las cantidades y operaciones se separan por espacio. La membresía y los roles del hogar se aplican también al espacio comercial.
