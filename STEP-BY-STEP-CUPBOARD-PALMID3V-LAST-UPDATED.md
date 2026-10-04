# 🧭 STEP-BY-STEP — CUPBOARD-PALMID3V
## Roadmap detallada de implementación, validación y migración

**LAST UPDATED:** 2026-10-04  
**Proyecto:** Cupboard  
**Repository:** `palmid3v/cupboard-palmid3v`

---

# 🎯 Propósito

Este documento es el mapa operativo de Cupboard: qué ya está construido, qué sigue, qué debe validarse y exactamente cuándo será seguro migrar los datos.

> **Regla principal:** primero construimos y validamos el nuevo modelo; después migramos; solamente al final eliminamos el modelo legacy.

---

# 📍 ESTADO ACTUAL

| Fase | Estado | Objetivo |
|---|---|---|
| FASE 1 | 🟢 COMPLETADA | Catálogo global |
| FASE 2 | 🟢 APROBADA | Auditoría del modelo actual |
| FASE 3 | 🟢 APROBADA | Fundación del nuevo `inventory` |
| FASE 4 | ⏭️ SIGUIENTE | Adaptar aplicación al nuevo inventory |
| FASE 5 | ⏳ PENDIENTE | Validar movements |
| FASE 6 | ⏳ PENDIENTE | Firebase Rules para inventory |
| FASE 7 | ⏳ PENDIENTE | Preparar migración |
| FASE 8 | ⏳ PENDIENTE | Regression completa |
| FASE 9 | 🔴 BLOQUEADA | Reset + migración |
| FASE 10 | ⏳ PENDIENTE | Limpieza legacy |

---

# 🟢 FASE 1 — CATÁLOGO GLOBAL

- [x] `productCatalog/{barcode}`
- [x] Reconocimiento por barcode.
- [x] Reutilización de identidad del producto.
- [x] Preparación del catálogo desde inventario actual.
- [x] Rules iniciales del catálogo.
- [x] Documentación.
- [x] Inventario actual preservado.

### Flujo

```text
SCAN
 │
 ├─ inventory actual → FOUND
 │
 ├─ productCatalog → CATALOG
 │
 └─ ninguno → NEW
```

---

# 🟢 FASE 2 — AUDITORÍA DEL MODELO ACTUAL

**APROBADA.**

## Decisiones

### Producto global

```text
productCatalog/{barcode}
```

Responsabilidad:

- identidad;
- nombre;
- marca;
- categoría;
- descripción;
- peso;
- imagen;
- metadata de catálogo.

### Inventario del hogar

Modelo objetivo:

```text
households/{householdId}/inventory/{barcode}
```

Responsabilidad:

- porciones;
- fecha de vencimiento;
- mínimo de stock;
- notas;
- timestamps de estado del inventario.

### Movimientos

```text
households/{householdId}/movements/{movementId}
```

Responsabilidad:

- entradas;
- consumos;
- cantidades;
- razones;
- usuario;
- historial del hogar.

### Regla arquitectónica

> **Catalog = what the product is.**  
> **Inventory = what this household has.**  
> **Movements = what this household did with it.**

### Legacy identificado

```text
households/{householdId}/products/{barcode}
```

Actualmente mezcla identidad y estado de inventario.

**No se elimina todavía.**

---

# 🟢 FASE 3 — NUEVO INVENTORY

**APROBADA.**

La fundación del nuevo servicio ya está creada en:

```text
app/src/services/inventory.js
```

## Responsabilidad

El nuevo servicio define el límite de datos del inventario doméstico:

```text
households/{householdId}/inventory/{barcode}
```

## API creada

```js
getInventoryProduct(barcode)
getAllInventory()
subscribeToInventory(onData, onError)
saveInventoryProduct(barcode, data)
updateInventoryPortions(barcode, newPortions)
```

## Datos del inventory

```text
inventory/{barcode}
├── portions
├── expiryDate
├── minStock
├── notes
├── createdAt
└── updatedAt
```

## Separación

```text
productCatalog/{barcode}
├── name
├── brand
├── category
├── description
├── weight
└── imageUrl

             +

households/{householdId}/inventory/{barcode}
├── portions
├── expiryDate
├── minStock
└── notes
```

## 🚨 Importante

La FASE 3 crea la **fundación** del nuevo modelo, pero todavía no cambia el dashboard ni el scanner para depender exclusivamente de `inventory`.

Eso corresponde a la FASE 4.

---

# 🟡 FASE 4 — ADAPTAR LA APLICACIÓN

## Scanner

Flujo definitivo:

```text
                 SCAN BARCODE
                       │
                       ▼
             ¿Existe en inventory?
                  /          \
                YES           NO
                 │             │
                 ▼             ▼
             FOUND      ¿Existe catalog?
                           /        \
                         YES         NO
                          │           │
                          ▼           ▼
                       CATALOG      NEW
```

Checklist:

- [ ] Scanner consulta nuevo inventory.
- [ ] Scanner consulta catálogo.
- [ ] Producto reconocido se prellena.
- [ ] Producto nuevo permite completar datos.
- [ ] No se duplican fichas globales.
- [ ] Stock inicial permanece separado.

## Dashboard

- [ ] Leer inventory.
- [ ] Buscar inventory.
- [ ] Filtrar inventory.
- [ ] Ordenar inventory.
- [ ] Mostrar identidad desde catálogo.
- [ ] Mostrar stock desde inventory.

## Product Detail

- [ ] Identidad desde catálogo.
- [ ] Stock desde inventory.
- [ ] Edición de metadata global separada de edición de stock.

---

# 🟡 FASE 5 — MOVEMENTS

## Principio

Los movimientos pertenecen al hogar.

```text
productCatalog/750123
└── Coca-Cola

House A
├── inventory/750123 → 3
└── movements/... → +2

House B
├── inventory/750123 → 7
└── movements/... → -1
```

Checklist:

- [ ] `addMovement()` sigue siendo household-scoped.
- [ ] Consumir afecta únicamente al hogar actual.
- [ ] Agregar stock afecta únicamente al hogar actual.
- [ ] Historial permanece aislado.
- [ ] `userId` permanece disponible.
- [ ] `reason` permanece disponible.
- [ ] Catalog nunca almacena stock.

---

# 🟠 FASE 6 — FIREBASE RULES

## productCatalog

- [x] Read autenticado/verificado.
- [x] Create controlado.
- [x] Update limitado.
- [x] Delete bloqueado.

## inventory

- [ ] Read solamente para miembros.
- [ ] Create según rol.
- [ ] Update según rol.
- [ ] Delete según política.
- [ ] Acceso cruzado entre hogares bloqueado.
- [ ] Email verification obligatoria.

## Roles

```text
OWNER / ADMIN
EDITOR
MEMBER
NO MEMBER
UNVERIFIED
```

Todos deben probarse.

---

# 🟠 FASE 7 — PREPARAR MIGRACIÓN

## Mapping

```text
households/{id}/products/{barcode}
             │
             ├── identidad ──► productCatalog/{barcode}
             │
             └── estado ─────► inventory/{barcode}
```

Checklist:

- [ ] Mapping definitivo de campos.
- [ ] Procedimiento idempotente.
- [ ] Sin duplicados.
- [ ] Porciones preservadas.
- [ ] Expiry preservado.
- [ ] Min stock preservado.
- [ ] Imágenes preservadas en catálogo.
- [ ] Movements intactos.
- [ ] Conteos antes/después.
- [ ] Procedimiento de recuperación.

---

# 🔴 FASE 8 — REGRESSION COMPLETA

## Authentication

- [ ] Registro.
- [ ] Email verification.
- [ ] Login.
- [ ] Logout.
- [ ] Invite.
- [ ] Join household.

## Scanner

- [ ] Producto existente.
- [ ] Producto del catálogo.
- [ ] Producto nuevo.
- [ ] Entrada manual.
- [ ] Cámara.
- [ ] Retry.

## Inventory

- [ ] Crear.
- [ ] Agregar stock.
- [ ] Consumir.
- [ ] Editar.
- [ ] Buscar.
- [ ] Filtrar.
- [ ] Ordenar.
- [ ] Detalle.

## Permissions

- [ ] Owner.
- [ ] Editor.
- [ ] Member.
- [ ] Usuario externo.
- [ ] Usuario no verificado.

## PWA / quality

- [ ] `npm run lint`.
- [ ] `npm run build`.
- [ ] Manifest.
- [ ] Service worker.
- [ ] Instalación.
- [ ] Mobile layout.
- [ ] Scanner mobile.

---

# 🔴 FASE 9 — ⚠️ AHORA SÍ: RESET + MIGRACIÓN

## 🚨 GATE DE SEGURIDAD

Esta fase **NO está habilitada todavía**.

Antes de llegar aquí deben estar aprobadas:

- [x] FASE 1 — Catálogo.
- [x] FASE 2 — Auditoría.
- [x] FASE 3 — Fundación inventory.
- [ ] FASE 4 — App.
- [ ] FASE 5 — Movements.
- [ ] FASE 6 — Rules.
- [ ] FASE 7 — Migration.
- [ ] FASE 8 — Regression.

Cuando todo esté listo, el aviso oficial será:

> # ⚠️ AHORA SÍ: RESET + MIGRACIÓN

## Orden obligatorio

```text
BACKUP
   ↓
VALIDATE
   ↓
MIGRATE
   ↓
VERIFY
   ↓
REMOVE LEGACY
```

Nunca:

```text
DELETE
  ↓
HOPE
```

---

# 🧹 FASE 10 — LIMPIEZA FINAL

Después de validar la migración:

- [ ] Eliminar dependencias de `products`.
- [ ] Eliminar funciones legacy.
- [ ] Eliminar imports obsoletos.
- [ ] Simplificar servicios.
- [ ] Revisar Rules.
- [ ] Actualizar README.
- [ ] Actualizar Architecture.
- [ ] Actualizar Data Model.
- [ ] Actualizar Security.
- [ ] Actualizar Roadmap.
- [ ] Documentar migración.
- [ ] Crear changelog.
- [ ] Ejecutar lint.
- [ ] Ejecutar build.

---

# 🏁 DEFINITION OF DONE

Cupboard estará migrado cuando:

- [ ] `productCatalog` sea la fuente global de identidad.
- [ ] `inventory` sea la fuente de stock.
- [ ] `movements` permanezca household-scoped.
- [ ] Scanner reconozca productos globalmente.
- [ ] Dos hogares puedan tener stocks diferentes del mismo producto.
- [ ] Rules impidan acceso cruzado.
- [ ] No existan dependencias críticas del legacy.
- [ ] Regression esté aprobada.
- [ ] Lint y build pasen.
- [ ] Documentación esté sincronizada.

---

# 🗺️ ARQUITECTURA FINAL

```text
                    ┌──────────────────┐
                    │  PRODUCT CATALOG │
                    │  Global / Shared │
                    └────────┬─────────┘
                             │
                       barcode identity
                             │
              ┌──────────────┴──────────────┐
              │                             │
       ┌──────▼──────┐               ┌──────▼──────┐
       │  HOUSE A    │               │  HOUSE B    │
       │  inventory  │               │  inventory  │
       └──────┬──────┘               └──────┬──────┘
              │                             │
          stock A                        stock B
              │                             │
       ┌──────▼──────┐               ┌──────▼──────┐
       │  movements  │               │  movements  │
       └─────────────┘               └─────────────┘
```

---

# 📌 PRÓXIMO PASO

## 🟡 FASE 4 — ADAPTAR LA APLICACIÓN

Ahora que FASE 2 y FASE 3 están aprobadas, el siguiente objetivo es conectar el nuevo `inventory.js` con:

1. Scanner.
2. Dashboard.
3. Product Detail.
4. Search/filter/sort.
5. Portion updates.
6. Product registration.

**No reset todavía.** 🛡️

---

# 📝 HISTORIAL

### 2026-10-04

- 🟢 FASE 1 aprobada: shared product catalog.
- 🟢 FASE 2 aprobada: auditoría y separación conceptual de responsabilidades.
- 🟢 FASE 3 aprobada: nuevo servicio `inventory.js`.
- 🟡 FASE 4 siguiente.
- 🔴 Reset + migración continúa bloqueado.

---

# 🚨 RECORDATORIO PERMANENTE

Mientras FASE 9 no esté habilitada:

```text
❌ No borrar Firebase
❌ No borrar households/*/products
❌ No borrar usuarios
❌ No ejecutar migración destructiva
❌ No asumir que el reset ya está autorizado
```

El objetivo es una migración:

**segura → comprobable → documentada → controlada → limpia.** 🚀
