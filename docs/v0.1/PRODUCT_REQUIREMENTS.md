
---

# 3. `PRODUCT_REQUIREMENTS.md`

```md
# Cupboard — Product Requirements

## Estado

Versión 1.0 — Evolucionada a partir del borrador v0.1.

Los requisitos de producto se encuentran estructurados para distinguir entre:

- Estado actual.
- MVP.
- V1.
- V1.5.
- Futuro.

La implementación real debe validarse durante la auditoría inicial.

---

# 1. Propósito

Este documento define los requisitos funcionales y no funcionales de Cupboard.

Los requisitos establecen qué debe ser capaz de hacer el producto, mientras que el `ROADMAP` define cómo se organizará el trabajo para llegar a ese estado.

---

# 2. Estados de los requisitos

### CURRENT

Funcionalidad que aparentemente existe actualmente.

Debe ser confirmada mediante `TASK-000`.

### MVP

Funcionalidad necesaria para establecer el núcleo funcional de Cupboard.

### V1

Funcionalidad de la primera evolución importante.

### V1.5

Funcionalidad de evolución posterior.

### FUTURE

Funcionalidad aprobada como dirección futura, pero fuera del alcance operativo actual.

---

# 3. Requisitos funcionales

## PR-001 — Registro de productos

**Prioridad:** Crítica  
**Etapa:** MVP

El sistema debe permitir registrar productos.

El producto puede contemplar:

- Nombre.
- Descripción.
- Peso.
- Porciones.
- Imagen.
- Cantidad.
- Unidad.
- Categoría.
- Código de barras.
- Stock mínimo.
- Ubicación.
- Valor.
- Fecha de vencimiento.

El modelo final debe validarse durante la auditoría.

---

## PR-002 — Edición de productos

**Prioridad:** Crítica  
**Etapa:** MVP

El usuario debe poder modificar la información de un producto.

---

## PR-003 — Eliminación de productos

**Prioridad:** Alta  
**Etapa:** MVP

El usuario debe poder eliminar productos de acuerdo con las reglas de negocio definidas.

Debe determinarse durante el desarrollo si la eliminación es física, lógica o si debe conservar información histórica.

---

## PR-004 — Consulta de productos

**Prioridad:** Crítica  
**Etapa:** MVP

El usuario debe poder consultar productos registrados.

---

## PR-005 — Búsqueda

**Prioridad:** Alta  
**Etapa:** V1

El sistema debe permitir buscar productos mediante información relevante como:

- Nombre.
- Código de barras.
- Categoría.
- Ubicación.

---

## PR-006 — Categorías

**Prioridad:** Alta  
**Etapa:** MVP / V1

Los productos deben poder organizarse por categorías.

---

## PR-007 — Cantidades y unidades

**Prioridad:** Alta  
**Etapa:** MVP

El sistema debe manejar cantidades y unidades apropiadas para los productos.

Ejemplos:

- Unidades.
- Kilogramos.
- Litros.
- Otras unidades justificadas.

---

## PR-008 — Ubicaciones

**Prioridad:** Alta  
**Etapa:** V1

Los productos deben poder asociarse con una ubicación.

Ejemplos:

- Cocina.
- Despensa.
- Nevera.
- Almacenamiento.

---

# 4. Barcode Scanner

## PR-009 — Escaneo de códigos de barras

**Prioridad:** Crítica  
**Etapa:** MVP

El sistema debe permitir escanear códigos de barras mediante la cámara del dispositivo.

---

## PR-010 — Detección de producto existente

**Prioridad:** Crítica  
**Etapa:** MVP

Cuando un código sea escaneado, el sistema debe determinar si existe un producto asociado.

---

## PR-011 — Producto no registrado

**Prioridad:** Alta  
**Etapa:** MVP

Cuando el código no exista, el usuario debe poder iniciar el registro de un nuevo producto.

---

## PR-012 — Permisos y errores de cámara

**Prioridad:** Alta  
**Etapa:** MVP

El sistema debe manejar correctamente:

- Permiso concedido.
- Permiso denegado.
- Cámara no disponible.
- Error de cámara.
- Cancelación del proceso.

---

## PR-013 — Experiencia avanzada de scanner

**Prioridad:** Alta  
**Etapa:** V1

El scanner debe evolucionar para soportar, cuando técnicamente sea posible:

- Mejor detección.
- Mejor enfoque.
- Feedback visual.
- Linterna.
- Prevención de escaneos duplicados.
- Optimización móvil.
- iPhone.
- Android.

---

# 5. Inventario y stock

## PR-014 — Stock actual

**Prioridad:** Crítica  
**Etapa:** MVP

El sistema debe mantener la cantidad actual de inventario.

---

## PR-015 — Stock mínimo

**Prioridad:** Alta  
**Etapa:** V1

Los productos podrán definir un nivel mínimo de stock.

---

## PR-016 — Producto agotado

**Prioridad:** Alta  
**Etapa:** V1

El sistema debe identificar productos cuyo stock haya llegado a cero.

---

## PR-017 — Movimientos

**Prioridad:** Crítica  
**Etapa:** V1

El sistema debe soportar movimientos como:

- Entrada.
- Salida.
- Ajuste.

---

## PR-018 — Historial

**Prioridad:** Alta  
**Etapa:** V1

El sistema debe conservar información suficiente para consultar cambios de inventario.

---

# 6. Vencimientos

## PR-019 — Fecha de vencimiento

**Prioridad:** Alta  
**Etapa:** V1

Los productos que lo requieran deben poder registrar una fecha de vencimiento.

---

## PR-020 — Estado de vencimiento

**Prioridad:** Alta  
**Etapa:** V1

El sistema debe poder identificar:

- Próximo a vencer.
- Vencido.
- Sin vencimiento.

---

## PR-021 — Alertas de vencimiento

**Prioridad:** Media  
**Etapa:** V1

El sistema debe poder advertir sobre productos próximos a vencer.

---

# 7. Dashboard y descubrimiento

## PR-022 — Dashboard

**Prioridad:** Alta  
**Etapa:** V1

El sistema debe proporcionar una vista general del inventario.

Puede incluir:

- Total de productos.
- Valor estimado.
- Stock bajo.
- Agotados.
- Movimientos recientes.

---

## PR-023 — Filtros

**Prioridad:** Alta  
**Etapa:** V1

El usuario debe poder filtrar productos por criterios relevantes.

Ejemplos:

- Categoría.
- Ubicación.
- Stock.
- Estado.
- Vencimiento.

---

## PR-024 — Métricas

**Prioridad:** Media  
**Etapa:** V1 / V1.5

El sistema podrá presentar:

- Distribución por categoría.
- Valor del inventario.
- Movimientos.
- Consumo.
- Reposición.

---

## PR-025 — Visualizaciones

**Prioridad:** Media  
**Etapa:** V1.5

Las gráficas deben utilizarse cuando ayuden a comprender el inventario.

---

# 8. Alertas

## PR-026 — Stock bajo

**Prioridad:** Alta  
**Etapa:** V1

El sistema debe identificar productos cuyo stock esté por debajo del mínimo establecido.

---

## PR-027 — Agotados

**Prioridad:** Alta  
**Etapa:** V1

El sistema debe identificar productos agotados.

---

## PR-028 — Vencimientos

**Prioridad:** Media  
**Etapa:** V1

El sistema debe identificar productos que requieran atención por vencimiento.

---

# 9. Reposición y compras

## PR-029 — Lista de reposición

**Prioridad:** Alta  
**Etapa:** V1

El usuario debe poder mantener una lista de productos que necesitan ser comprados o repuestos.

---

## PR-030 — Candidatos de reposición

**Prioridad:** Media  
**Etapa:** V1

El sistema debe poder identificar candidatos de reposición basándose en reglas de stock.

---

## PR-031 — Estado de compra

**Prioridad:** Media  
**Etapa:** V1

Los elementos de reposición pueden tener estados como:

- Pendiente.
- Comprado.
- Cancelado.

---

## PR-032 — Entrada posterior a compra

**Prioridad:** Media  
**Etapa:** V1

Una compra completada debe poder reflejarse como una entrada de inventario.

---

# 10. Reportes

## PR-033 — Reporte de inventario

**Prioridad:** Media  
**Etapa:** V1.5

El sistema debe poder generar información resumida sobre el inventario.

---

## PR-034 — Reporte de movimientos

**Prioridad:** Media  
**Etapa:** V1.5

El usuario debe poder consultar información histórica de movimientos.

---

## PR-035 — Exportación

**Prioridad:** Media  
**Etapa:** V1.5

El sistema podrá permitir la exportación de información relevante.

El formato debe definirse según las necesidades reales.

---

# 11. Perfil y configuración

## PR-036 — Perfil

**Prioridad:** Media  
**Etapa:** V1

El sistema podrá proporcionar información y configuración relacionada con el usuario.

---

## PR-037 — Preferencias

**Prioridad:** Media  
**Etapa:** V1

Podrán existir preferencias relacionadas con:

- Unidades.
- Notificaciones.
- Inventario.
- Configuración de la aplicación.

---

# 12. UX, Responsive y Accesibilidad

## PR-038 — Responsive

**Prioridad:** Alta  
**Etapa:** MVP / V1

Cupboard debe proporcionar una experiencia funcional en:

- Móvil.
- Tablet.
- Desktop.

---

## PR-039 — Navegación por teclado

**Prioridad:** Alta  
**Etapa:** V1

Los flujos principales deben poder utilizarse mediante teclado cuando corresponda.

---

## PR-040 — Estructura semántica

**Prioridad:** Alta  
**Etapa:** V1

La interfaz debe utilizar estructura semántica y controles apropiados.

---

## PR-041 — Formularios accesibles

**Prioridad:** Alta  
**Etapa:** V1

Los formularios deben proporcionar:

- Labels.
- Validación.
- Mensajes de error.
- Manejo de focus.

---

# 13. PWA

## PR-042 — Progressive Web App

**Prioridad:** Alta  
**Etapa:** V1.5  
**Estado:** Aprobado

Cupboard debe evolucionar hacia una Progressive Web App.

Debe contemplar:

- Manifest.
- Instalabilidad.
- Iconos.
- Experiencia standalone.
- Comportamiento apropiado en dispositivos móviles.

---

## PR-043 — Capacidad Offline

**Prioridad:** Media  
**Etapa:** V1.5

La aplicación debe evaluar y posteriormente implementar capacidades offline apropiadas.

El alcance exacto debe determinarse mediante arquitectura.

---

## PR-044 — Datos offline

**Prioridad:** Media  
**Etapa:** V1.5

Información relevante del inventario podrá estar disponible sin conexión.

Debe definirse qué operaciones pueden ejecutarse de manera segura offline.

---

## PR-045 — Sincronización

**Prioridad:** Media  
**Etapa:** V1.5

Los cambios realizados offline podrán sincronizarse posteriormente con la nube.

La estrategia de resolución de conflictos debe definirse antes de implementar esta funcionalidad.

---

# 14. Seguridad

## PR-046 — Aislamiento de datos

**Prioridad:** Crítica  
**Etapa:** MVP / V1

Los usuarios solo deben poder acceder a información autorizada.

---

## PR-047 — Firestore Security Rules

**Prioridad:** Crítica  
**Etapa:** MVP / V1

Firestore debe aplicar reglas de seguridad independientes de las restricciones visuales del frontend.

---

## PR-048 — Configuración segura

**Prioridad:** Crítica  
**Etapa:** MVP

La aplicación no debe incluir secretos sensibles directamente en el código.

---

# 15. Performance

## PR-049 — Uso eficiente de Firestore

**Prioridad:** Alta  
**Etapa:** V1

La aplicación debe evitar consultas, listeners y lecturas innecesarias.

---

## PR-050 — Performance de aplicación

**Prioridad:** Media  
**Etapa:** V1.5

La aplicación debe mantener tiempos razonables de carga y respuesta en los dispositivos soportados.

---

# 16. Testing

## PR-051 — Tests de inventario

**Prioridad:** Alta  
**Etapa:** V1

Las reglas fundamentales de inventario deben contar con pruebas apropiadas.

---

## PR-052 — Tests del scanner

**Prioridad:** Alta  
**Etapa:** V1

Los flujos críticos del scanner deben ser validados.

---

## PR-053 — QA End-to-End

**Prioridad:** Alta  
**Etapa:** Production

Debe validarse el recorrido completo de la aplicación antes del release.

---

# 17. Multi-User — Futuro

## PR-054 — Multi-User

**Prioridad:** Baja  
**Etapa:** Future / V2+

La aplicación podrá evolucionar hacia múltiples usuarios.

---

## PR-055 — Inventario compartido

**Prioridad:** Baja  
**Etapa:** Future / V2+

Los usuarios podrán compartir inventarios con otros usuarios autorizados.

---

## PR-056 — Roles y permisos

**Prioridad:** Baja  
**Etapa:** Future / V2+

Podrán existir roles como:

- Owner.
- Editor.
- Viewer.

---

# 18. AI Assist — Futuro

## PR-057 — Consultas de inventario mediante IA

**Prioridad:** Baja  
**Etapa:** Future / V3+

Los usuarios podrán realizar preguntas en lenguaje natural sobre su inventario.

---

## PR-058 — Recomendaciones

**Prioridad:** Baja  
**Etapa:** Future / V3+

La IA podrá proporcionar recomendaciones relacionadas con:

- Reposición.
- Compras.
- Consumo.
- Inventario.

---

## PR-059 — Análisis predictivo

**Prioridad:** Baja  
**Etapa:** Future / V3+

La IA podrá analizar patrones históricos para generar predicciones.

---

# 19. Requisitos no funcionales

## NFR-001 — Confiabilidad

Las operaciones de inventario deben mantener consistencia de datos.

---

## NFR-002 — Seguridad

La información del usuario debe estar protegida mediante autenticación, autorización y reglas de backend apropiadas.

---

## NFR-003 — Usabilidad

Las operaciones frecuentes deben requerir la menor cantidad razonable de pasos.

---

## NFR-004 — Responsive

La aplicación debe funcionar correctamente en dispositivos móviles y desktop.

---

## NFR-005 — Accesibilidad

La aplicación debe progresar hacia buenas prácticas de accesibilidad.

---

## NFR-006 — Performance

Las consultas, renders y operaciones deben optimizarse cuando representen un impacto real.

---

## NFR-007 — Mantenibilidad

La arquitectura debe permitir evolución sin introducir complejidad innecesaria.

---

## NFR-008 — Escalabilidad

Las decisiones arquitectónicas deben permitir futuras capacidades sin diseñar prematuramente una plataforma empresarial.

---

## NFR-009 — PWA

La arquitectura debe permitir la evolución hacia una Progressive Web App.

---

## NFR-010 — Integridad offline

Si se implementa funcionamiento offline, los mecanismos de sincronización deben preservar la consistencia de los datos.

---

# 20. Casos de uso principales

### UC-001 — Registrar producto

```text
Usuario
  ↓
Crear / escanear producto
  ↓
Completar información
  ↓
Guardar
  ↓
Producto disponible en inventario