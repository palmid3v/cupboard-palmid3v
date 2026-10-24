export default function ProductForm({
  isEditing,
  isManualEntry,
  barcode,
  setBarcode,
  form,
  onChange,
  nameInputRef,
  weightInputRef,
  portionsInputRef,
  formError,
  onCancel,
  onSave,
  isSaving,
  saveState,
  canWriteInventory,
  targetWorkspaceId = "home",
  onTargetWorkspaceChange,
  canChooseWorkspace = false,
}) {
  return (
    isEditing ? (
<section className="rounded-[2rem] border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-5 shadow-[var(--cupboard-shadow-sm)] sm:p-7">
                    <div className="mb-7">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-primary)]">Información</p>
                      <h2 className="mt-2 text-2xl font-extrabold">{form.name ? "Editar producto" : "Nuevo producto"}</h2>
                      <p className="mt-1.5 text-sm text-[var(--cupboard-text-muted)]">Mantén los datos de tu alacena actualizados.</p>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      <div className="lg:col-span-2">
                        <label htmlFor="product-barcode" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">{isManualEntry ? "Código del producto" : "Código de barras"}</label>
                        <input id="product-barcode" type="text" inputMode="numeric" autoComplete="off" value={barcode} onChange={(event) => { if (isManualEntry) setBarcode(event.target.value); }} readOnly={!isManualEntry} placeholder={isManualEntry ? "Ej. 123456789" : undefined} className={[
                          "w-full rounded-2xl border px-4 py-3.5 font-mono text-sm outline-none transition",
                          isManualEntry ? "border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] focus:border-[var(--cupboard-primary)] focus:ring-4 focus:ring-[var(--cupboard-primary)]/10" : "cursor-not-allowed border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] text-[var(--cupboard-text-muted)]",
                        ].join(" ")} />
                      </div>

                      {canChooseWorkspace && (
                        <div className="lg:col-span-2">
                          <label htmlFor="product-destination" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">Destino del inventario</label>
                          <select id="product-destination" value={targetWorkspaceId} onChange={(event) => onTargetWorkspaceChange(event.target.value)} className="w-full rounded-2xl border border-[var(--cupboard-primary)]/40 bg-[var(--cupboard-bg)] px-4 py-3.5 text-sm font-bold outline-none focus:border-[var(--cupboard-primary)] focus:ring-4 focus:ring-[var(--cupboard-primary)]/10">
                            <option value="home">Cupboard · Hogar</option>
                            <option value="sandwichies">Sandwichies · Negocio</option>
                          </select>
                          <p className="mt-2 text-xs text-[var(--cupboard-text-muted)]">Las existencias se guardarán únicamente en el destino seleccionado.</p>
                        </div>
                      )}

                      <div>
                        <label htmlFor="product-name" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">Nombre</label>
                        <input id="product-name" ref={nameInputRef} name="name" type="text" placeholder="Ej. Leche entera" value={form.name} onChange={onChange} autoFocus className="w-full rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-4 py-3.5 text-sm outline-none transition placeholder:text-[var(--cupboard-text-subtle)] focus:border-[var(--cupboard-primary)] focus:ring-4 focus:ring-[var(--cupboard-primary)]/10" />
                      </div>

                      <div>
                        <label htmlFor="product-description" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">Descripción</label>
                        <textarea id="product-description" name="description" rows="1" placeholder="Describe brevemente el producto..." value={form.description} onChange={onChange} className="min-h-[52px] w-full resize-none rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-4 py-3.5 text-sm outline-none transition placeholder:text-[var(--cupboard-text-subtle)] focus:border-[var(--cupboard-primary)] focus:ring-4 focus:ring-[var(--cupboard-primary)]/10" />
                      </div>

                      <div>
                        <label htmlFor="product-weight" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">Peso</label>
                        <div className="relative">
                          <input id="product-weight" ref={weightInputRef} name="weight" type="number" min="0" placeholder="0" value={form.weight} onChange={onChange} className="w-full rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-4 py-3.5 pr-10 text-sm outline-none transition placeholder:text-[var(--cupboard-text-subtle)] focus:border-[var(--cupboard-primary)] focus:ring-4 focus:ring-[var(--cupboard-primary)]/10" />
                          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-bold text-[var(--cupboard-text-subtle)]">g</span>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="product-portions" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">{form.unit && form.unit !== "porciones" ? `Cantidad disponible (${form.unit})` : "Porciones"}</label>
                        <input id="product-portions" ref={portionsInputRef} name="portions" type="number" min="0" placeholder="0" value={form.portions} onChange={onChange} className="w-full rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-4 py-3.5 text-sm outline-none transition placeholder:text-[var(--cupboard-text-subtle)] focus:border-[var(--cupboard-primary)] focus:ring-4 focus:ring-[var(--cupboard-primary)]/10" />
                      </div>

                      <div>
                        <label htmlFor="product-min-stock" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">Stock mínimo</label>
                        <input id="product-min-stock" name="minStock" type="number" min="0" placeholder="5" value={form.minStock} onChange={onChange} className="w-full rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-4 py-3.5 text-sm outline-none transition placeholder:text-[var(--cupboard-text-subtle)] focus:border-[var(--cupboard-primary)] focus:ring-4 focus:ring-[var(--cupboard-primary)]/10" />
                      </div>

                      <div>
                        <label htmlFor="product-expiry" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">Caducidad</label>
                        <input id="product-expiry" name="expiryDate" type="date" value={form.expiryDate} onChange={onChange} className="w-full rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-4 py-3.5 text-sm outline-none transition focus:border-[var(--cupboard-primary)] focus:ring-4 focus:ring-[var(--cupboard-primary)]/10" />
                      </div>

                      <div className="lg:col-span-2">
                        <label htmlFor="product-category" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">Categoría</label>
                        <input id="product-category" name="category" type="text" placeholder="Ej. Pasta, lácteos, bebidas..." value={form.category} onChange={onChange} className="w-full rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-4 py-3.5 text-sm outline-none transition placeholder:text-[var(--cupboard-text-subtle)] focus:border-[var(--cupboard-primary)] focus:ring-4 focus:ring-[var(--cupboard-primary)]/10" />
                      </div>

                      <div className="lg:col-span-2">
                        <label htmlFor="product-image" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">Imagen <span className="normal-case font-normal tracking-normal">· opcional</span></label>
                        <input id="product-image" name="imageUrl" type="url" placeholder="https://..." value={form.imageUrl} onChange={onChange} className="w-full rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-4 py-3.5 text-sm outline-none transition placeholder:text-[var(--cupboard-text-subtle)] focus:border-[var(--cupboard-primary)] focus:ring-4 focus:ring-[var(--cupboard-primary)]/10" />

                        {form.imageUrl && (
                          <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] p-3">
                            <div className="flex min-h-40 items-center justify-center rounded-xl bg-[var(--cupboard-bg)] p-4">
                              <img src={form.imageUrl} alt="Vista previa del producto" onError={(event) => { event.currentTarget.style.display = "none"; event.currentTarget.nextElementSibling?.classList.remove("hidden"); }} className="max-h-40 max-w-full rounded-xl object-contain" />
                              <div className="hidden flex-col items-center justify-center text-center"><span className="text-4xl">📦</span><span className="mt-2 text-xs text-[var(--cupboard-text-muted)]">Imagen no disponible</span></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {formError && (
                      <div id="product-form-error" role="alert" aria-live="assertive" className="mt-6 rounded-2xl border border-[var(--cupboard-danger)]/25 bg-[var(--cupboard-danger)]/10 px-4 py-3 text-sm font-medium text-[var(--cupboard-danger)]">{formError}</div>
                    )}

                    <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[var(--cupboard-border)] pt-6 sm:flex-row sm:justify-end">
                      <button type="button" onClick={onCancel} className="rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] px-5 py-3.5 text-sm font-bold text-[var(--cupboard-text-muted)] transition hover:text-[var(--cupboard-text)]">Cancelar</button>
                      <button type="button" onClick={onSave} disabled={!barcode || isSaving || !canWriteInventory} className="rounded-2xl bg-[var(--cupboard-primary)] px-5 py-3.5 text-sm font-bold text-[#10140d] shadow-[0_8px_20px_rgb(120_168_91_/_0.12)] transition hover:-translate-y-0.5 hover:bg-[var(--cupboard-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40">{isSaving ? "Guardando..." : saveState === "permission" ? "Solo lectura" : "Guardar producto"}</button>
                    </div>
                  </section>
    ) : null
  );
}
