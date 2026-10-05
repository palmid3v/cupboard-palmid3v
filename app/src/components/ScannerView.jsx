import BarcodeScanner from "./BarcodeScanner";
import ProductForm from "./ProductForm";

const statusConfig = {
  found: {
    label: "Producto encontrado en tu alacena",
    className:
      "border-[var(--cupboard-success)]/30 bg-[var(--cupboard-primary-soft)] text-[var(--cupboard-success)]",
  },
  catalog: {
    label: "Producto reconocido · listo para agregar",
    className:
      "border-[var(--cupboard-primary)]/30 bg-[var(--cupboard-primary-soft)] text-[var(--cupboard-primary)]",
  },
  new: {
    label: "Producto nuevo · completa la información",
    className:
      "border-[var(--cupboard-warning)]/30 bg-amber-500/10 text-[var(--cupboard-warning)]",
  },
  saved: {
    label: "Producto guardado correctamente",
    className:
      "border-[var(--cupboard-success)]/30 bg-[var(--cupboard-primary-soft)] text-[var(--cupboard-success)]",
  },
  error: {
    label: "No pudimos guardar el producto",
    className:
      "border-[var(--cupboard-danger)]/30 bg-red-500/10 text-[var(--cupboard-danger)]",
  },
};

export default function ScannerView({
  onScan,
  scannerRestart,
  barcode,
  isLookingUp,
  onStartManualEntry,
  onRestartScanner,
  roleKnown,
  userRole,
  status,
  form,
  isEditing,
  setIsEditing,
  isManualEntry,
  setBarcode,
  formError,
  isSaving,
  saveState,
  canWriteInventory,
  handleChange,
  handleSave,
  handleCancelEdit,
  nameInputRef,
  weightInputRef,
  portionsInputRef,
}) {
  return (
<section className="space-y-5">
                <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                  <section className="overflow-hidden rounded-[2rem] border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] shadow-[var(--cupboard-shadow-md)]">
                    <div className="border-b border-[var(--cupboard-border)] px-5 py-5 sm:px-7">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-primary)]">Añadir a la alacena</p>
                          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Escanea un producto</h2>
                          <p className="mt-1.5 max-w-lg text-sm leading-6 text-[var(--cupboard-text-muted)]">Apunta la cámara al código de barras. Cupboard buscará el producto automáticamente.</p>
                        </div>
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--cupboard-primary-soft)] text-xl">📷</span>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6">
                      <div className="overflow-hidden rounded-[1.5rem] border border-[var(--cupboard-border)] bg-black shadow-inner">
                        <BarcodeScanner onScan={onScan} restartToken={scannerRestart} />
                      </div>

                      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-bold">¿No puedes escanear?</p>
                          <p className="mt-1 text-xs text-[var(--cupboard-text-muted)]">Introduce el código manualmente.</p>
                        </div>
                        <button type="button" onClick={onStartManualEntry} className="rounded-xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] px-4 py-2.5 text-xs font-bold text-[var(--cupboard-text)] transition hover:border-[var(--cupboard-primary)]/40">Agregar manualmente</button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--cupboard-text-subtle)]">Código</p>
                          <p className="mt-1 truncate font-mono text-sm font-semibold">{isLookingUp ? "Buscando producto..." : barcode || "Esperando escaneo..."}</p>
                        </div>
                        <button type="button" onClick={onRestartScanner} className="shrink-0 rounded-xl border border-[var(--cupboard-border)] px-3 py-2 text-xs font-bold text-[var(--cupboard-text-muted)] transition hover:bg-[var(--cupboard-surface-muted)] hover:text-[var(--cupboard-text)]">↻ Repetir</button>
                      </div>
                    </div>
                  </section>

                  <div className="space-y-4">
                    {isLookingUp && (
                      <div role="status" aria-live="polite" className="rounded-3xl border border-[var(--cupboard-primary)]/20 bg-[var(--cupboard-primary-soft)] p-5">
                        <p className="text-sm font-bold text-[var(--cupboard-primary)]">Buscando producto...</p>
                        <p className="mt-1 text-xs text-[var(--cupboard-text-muted)]">Consultando tu inventario.</p>
                      </div>
                    )}

                    {roleKnown && userRole === "member" && (
                      <div role="status" aria-live="polite" className="rounded-3xl border border-[var(--cupboard-info)]/25 bg-[var(--cupboard-info)]/10 p-5">
                        <p className="text-sm font-extrabold text-[var(--cupboard-info)]">Modo solo lectura</p>
                        <p className="mt-1 text-xs leading-5 text-[var(--cupboard-text-muted)]">Puedes consultar y escanear productos, pero necesitas un editor o propietario para guardar cambios.</p>
                      </div>
                    )}

                    {status && (
                      <div role="status" className={["rounded-3xl border p-5", statusConfig[status]?.className || "border-[var(--cupboard-border)] bg-[var(--cupboard-surface)]"].join(" ")}>
                        <p className="text-sm font-extrabold">
                          {status === "found" && "🟢 Producto encontrado"}
                          {status === "new" && "🆕 Producto nuevo"}
                          {status === "saved" && "✅ Producto guardado"}
                          {status === "permission" && "🔒 Guardado no disponible para este rol"}
                          {status === "error" && "⚠️ No pudimos guardar el producto"}
                        </p>
                        <p className="mt-1 text-xs opacity-80">{statusConfig[status]?.label || status}</p>
                      </div>
                    )}

                    {status === "new" && barcode && (
                      <div className="rounded-3xl border border-[var(--cupboard-warning)]/20 bg-[var(--cupboard-warning)]/10 p-5">
                        <p className="text-sm font-bold text-[var(--cupboard-warning)]">Este producto es nuevo.</p>
                        <p className="mt-1 text-xs leading-5 text-[var(--cupboard-text-muted)]">Completa los datos para agregarlo a tu alacena.</p>
                      </div>
                    )}

                    {barcode && !isEditing && (
                      <section className="rounded-3xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-5 shadow-[var(--cupboard-shadow-sm)]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--cupboard-primary)]">Producto</p>
                        <h2 className="mt-2 text-xl font-extrabold">{form.name || "Nuevo producto"}</h2>
                        <div className="mt-5 grid gap-2 sm:grid-cols-3">
                          <div className="rounded-2xl bg-[var(--cupboard-surface-muted)] p-4"><p className="text-[10px] uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">Descripción</p><p className="mt-1 text-sm font-semibold">{form.description || "—"}</p></div>
                          <div className="rounded-2xl bg-[var(--cupboard-surface-muted)] p-4"><p className="text-[10px] uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">Peso</p><p className="mt-1 text-sm font-semibold">{form.weight || 0} g</p></div>
                          <div className="rounded-2xl bg-[var(--cupboard-surface-muted)] p-4"><p className="text-[10px] uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">Porciones</p><p className="mt-1 text-sm font-semibold">{form.portions || 0}</p></div>
                        </div>
                        <button type="button" onClick={() => setIsEditing(true)} className="mt-4 w-full rounded-2xl bg-[var(--cupboard-primary)] px-4 py-3.5 text-sm font-bold text-[#10140d]">Editar producto</button>
                      </section>
                    )}
                  </div>
                </div>

                <ProductForm
                  isEditing={isEditing}
                  isManualEntry={isManualEntry}
                  barcode={barcode}
                  setBarcode={setBarcode}
                  form={form}
                  onChange={handleChange}
                  nameInputRef={nameInputRef}
                  weightInputRef={weightInputRef}
                  portionsInputRef={portionsInputRef}
                  formError={formError}
                  onCancel={handleCancelEdit}
                  onSave={handleSave}
                  isSaving={isSaving}
                  saveState={saveState}
                  canWriteInventory={canWriteInventory}
                />
              </section>
  );
}
