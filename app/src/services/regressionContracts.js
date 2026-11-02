export function canWriteInventory(role) {
  return role === "admin" || role === "editor";
}

export function getSaveErrorState(code) {
  if (code === "permission-denied") return "permission";
  if (["unavailable", "network-request-failed"].includes(code)) return "network";
  return "unknown";
}

export function getSaveErrorMessage(code) {
  const messages = {
    "permission-denied":
      "No tienes permisos para modificar esta alacena.",
    unavailable:
      "No pudimos conectar con la base de datos. Revisa tu conexión e inténtalo nuevamente.",
    "failed-precondition":
      "La base de datos no está disponible en este momento. Inténtalo nuevamente.",
    "network-request-failed":
      "La red no está disponible. Revisa tu conexión e inténtalo nuevamente.",
  };

  return (
    messages[code] ||
    "No pudimos guardar el producto. Revisa los datos e inténtalo nuevamente."
  );
}

export function getStockState(portions, minStock = 5) {
  const quantity = Number(portions) || 0;
  const threshold = Math.max(0, Number(minStock) || 5);

  if (quantity === 0) return "empty";
  if (quantity <= threshold) return "low";
  if (quantity <= Math.max(threshold * 2, threshold + 1)) return "warning";
  return "available";
}

export function resolveRecognitionSource({ inventory, catalog }) {
  if (inventory) return "inventory";
  if (catalog) return "catalog";
  return "new";
}

export function getScannerErrorState(error = {}) {
  if (error.name === "NotAllowedError") {
    return { title: "Permiso de cámara", action: "Permitir acceso" };
  }

  if (error.name === "NotFoundError") {
    return { title: "No encontramos una cámara", action: "Revisar cámara" };
  }

  if (error.name === "NotReadableError") {
    return { title: "La cámara está ocupada", action: "Intentar nuevamente" };
  }

  if (error.name === "AbortError") {
    return { title: "La cámara se interrumpió", action: "Reiniciar cámara" };
  }

  return {
    title: "No pudimos iniciar la cámara",
    action: "Intentar nuevamente",
  };
}

export function movementIsAtomic(source) {
  return source.includes("writeBatch") &&
    source.includes("batch.commit()") &&
    source.includes("movementRef(workspaceId)");
}
