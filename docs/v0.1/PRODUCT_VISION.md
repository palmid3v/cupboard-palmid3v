
---

# 2. `PRODUCT_VISION.md`

```md
# Cupboard — Product Vision

## Estado

Versión 1.0 — Evolucionada a partir de la definición provisional v0.1.

La visión del producto se encuentra aprobada como dirección de desarrollo, mientras que el estado real de la aplicación y el alcance exacto del MVP deben ser confirmados mediante la auditoría inicial.

---

## Definición del producto

Cupboard es una aplicación de inventario orientada principalmente a escenarios personales, domésticos y de cocina.

Su propósito es ayudar a los usuarios a:

- Registrar productos.
- Organizar productos.
- Consultar cantidades.
- Controlar stock.
- Identificar productos mediante códigos de barras.
- Detectar productos que requieren atención.
- Comprender los movimientos del inventario.
- Facilitar la reposición.

La visión de largo plazo es evolucionar Cupboard hacia una herramienta de inventario personal simple, rápida e inteligente.

---

## Problema

El problema inicial que Cupboard busca resolver es sencillo:

> Mantener control sobre qué productos existen, cuánto hay disponible y qué productos necesitan atención.

La gestión manual mediante memoria, notas, listas o herramientas desconectadas puede dificultar:

- Saber qué productos existen.
- Conocer cantidades actuales.
- Detectar faltantes.
- Identificar productos próximos a vencer.
- Entender el consumo.
- Saber qué comprar.

El problema exacto y sus prioridades deben validarse contra la implementación y los casos de uso reales durante `TASK-000`.

---

## Usuario

El usuario principal previsto es una persona que necesita administrar inventario personal o doméstico.

Los principales escenarios iniciales contemplados son:

- Inventario del hogar.
- Inventario de cocina.
- Despensa.
- Productos de limpieza.
- Almacenamiento doméstico.

En fases posteriores, la arquitectura podrá evolucionar hacia:

- Familias.
- Inventarios compartidos.
- Pequeños negocios.

El alcance final del usuario objetivo deberá validarse durante la definición del producto.

---

## Propuesta de valor

Cupboard busca ofrecer una experiencia que permita:

> **Saber qué tienes, cuánto tienes, dónde está y qué necesita atención, sin depender de listas manuales o memoria.**

La propuesta se apoya en cuatro principios:

### Escanea

Registrar o encontrar productos mediante códigos de barras.

### Organiza

Clasificar productos mediante categorías, unidades y ubicaciones.

### Controla

Mantener visibilidad sobre cantidades, stock, movimientos, vencimientos y alertas.

### Simplifica

Reducir la cantidad de pasos necesarios para gestionar el inventario.

---

## Principios de producto

### Simplicidad

La aplicación debe ser comprensible sin requerir conocimientos especializados sobre inventarios.

### Velocidad

Las acciones frecuentes deben requerir pocos pasos.

### Mobile First

El móvil es especialmente importante porque el usuario puede encontrarse físicamente frente al inventario mientras utiliza la aplicación.

### Confiabilidad

Los datos de inventario deben ser consistentes y confiables.

### Visibilidad

El sistema debe convertir datos de inventario en información útil.

### Accesibilidad

La aplicación debe progresar hacia una experiencia accesible para diferentes formas de interacción.

### Evolución progresiva

Las nuevas funcionalidades deben incorporarse sin sobrecargar innecesariamente el MVP.

---

## Pilares del producto

### 1. Inventory

El inventario constituye el núcleo de Cupboard.

Debe permitir gestionar:

- Productos.
- Cantidades.
- Unidades.
- Categorías.
- Ubicaciones.
- Stock.

---

### 2. Smart Scanner

El código de barras debe funcionar como una vía rápida de acceso al inventario.

La experiencia prevista es:

```text
Escanear
   ↓
Detectar código
   ↓
Buscar producto
   ↓
Producto existente / Producto nuevo
   ↓
Consultar o registrar