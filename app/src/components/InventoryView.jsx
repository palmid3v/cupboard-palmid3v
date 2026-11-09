import { useEffect, useMemo, useRef, useState } from "react";

export default function InventoryView({
  products,
  isLoadingProducts,
  onOpenProduct,
  onConsume,
  onAdd,
  canWriteInventory,
  updatingProductId,
  inventoryActionError,
  inventoryActionSuccess,
  onAddProduct,
  initialSort = "name",
  initialFilter = "all",
}) {
  const [search, setSearch] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState(initialFilter);
  const [inventorySort, setInventorySort] = useState(initialSort);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortMenuRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!sortMenuRef.current?.contains(event.target)) {
        setIsSortOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const inventorySummary = useMemo(() => ({
    products: products.length,
    portions: products.reduce(
      (total, item) => total + (Number(item.portions) || 0),
      0,
    ),
    lowStock: products.filter(
      (item) => (Number(item.portions) || 0) <= (Number(item.minStock) || 5),
    ).length,
  }), [products]);

  const filteredProducts = useMemo(() => (
    products
      .filter((item) => {
        const searchTerm = search.trim().toLowerCase();

        const matchesSearch =
          !searchTerm ||
          item.name?.toLowerCase().includes(searchTerm) ||
          item.id?.toLowerCase().includes(searchTerm);

        const portions = Number(item.portions) || 0;
        const minStock = Number(item.minStock) || 5;

        const matchesFilter =
          inventoryFilter === "all"
            ? true
            : inventoryFilter === "low"
              ? portions <= minStock
              : portions > 0;

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (inventorySort === "name") {
          return (a.name || "").localeCompare(
            b.name || "",
            "es",
            { sensitivity: "base" },
          );
        }

        if (inventorySort === "low-stock") {
          return (
            (Number(a.portions) || 0) -
            (Number(b.portions) || 0)
          );
        }

        if (inventorySort === "high-stock") {
          return (
            (Number(b.portions) || 0) -
            (Number(a.portions) || 0)
          );
        }

        if (inventorySort === "recent") {
          const aTime = a.updatedAt?.toMillis?.() || 0;
          const bTime = b.updatedAt?.toMillis?.() || 0;

          return bTime - aTime;
        }

        return 0;
      })
  ), [products, search, inventoryFilter, inventorySort]);

  return (
<>
                <section className="grid gap-4 md:grid-cols-[1.45fr_0.8fr_0.8fr]">
                  <div className="relative overflow-hidden rounded-[2rem] border border-[var(--cupboard-border)] bg-[linear-gradient(135deg,var(--cupboard-surface),var(--cupboard-surface-muted))] p-6 shadow-[var(--cupboard-shadow-sm)] sm:p-7">
                    <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-[var(--cupboard-primary)]/10 blur-3xl" />
                    <div className="relative">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🥫</span>
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--cupboard-accent)]">Resumen de alacena</span>
                      </div>
                      <p className="mt-4 max-w-lg text-2xl font-extrabold tracking-tight sm:text-3xl">
                        Controlas <span className="text-[var(--cupboard-primary)]">{inventorySummary.products}</span> productos con su unidad de medida.
                      </p>
                      <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--cupboard-text-muted)]">
                        {inventorySummary.lowStock > 0 ? inventorySummary.lowStock + " productos necesitan atención." : "Todo está en orden. Tu alacena está lista."}
                      </p>
                      <button type="button" onClick={() => onAddProduct()} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[var(--cupboard-primary)] px-4 py-3 text-sm font-bold text-[#10140d] transition hover:-translate-y-0.5 hover:bg-[var(--cupboard-primary-hover)]">
                        📷 Añadir producto <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-5 shadow-[var(--cupboard-shadow-sm)]">
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cupboard-primary-soft)]">📦</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--cupboard-text-subtle)]">Productos</span>
                    </div>
                    <p className="mt-6 text-4xl font-extrabold tracking-tight">{inventorySummary.products}</p>
                    <p className="mt-1 text-xs text-[var(--cupboard-text-muted)]">registrados</p>
                  </div>

                  <div className="rounded-[2rem] border border-[var(--cupboard-danger)]/20 bg-[var(--cupboard-surface)] p-5 shadow-[var(--cupboard-shadow-sm)]">
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cupboard-danger)]/10">⚠️</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--cupboard-danger)]">Atención</span>
                    </div>
                    <p className="mt-6 text-4xl font-extrabold tracking-tight text-[var(--cupboard-danger)]">{inventorySummary.lowStock}</p>
                    <p className="mt-1 text-xs text-[var(--cupboard-text-muted)]">con stock bajo</p>
                  </div>
                </section>

                <section className="mt-8">
                  <div className="sticky top-3 z-30 rounded-3xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)]/95 p-3 shadow-[0_16px_40px_rgb(0_0_0_/_0.18)] backdrop-blur-xl sm:p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                      <div className="relative min-w-0 flex-1">
                        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base text-[var(--cupboard-text-subtle)]">⌕</span>
                        <input type="text" placeholder="Busca por nombre o código..." aria-label="Buscar productos" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-11 py-3.5 text-sm font-medium outline-none transition placeholder:text-[var(--cupboard-text-subtle)] focus:border-[var(--cupboard-primary)] focus:ring-4 focus:ring-[var(--cupboard-primary)]/10" />
                      </div>



                      <div className="flex gap-2 overflow-x-auto pb-0.5">
                        {[
                          ["all", "Todos"],
                          ["low", "Stock bajo"],
                          ["available", "Disponibles"],
                        ].map(([value, label]) => {
                          const active = inventoryFilter === value;
                          return (
                            <button key={value} type="button" onClick={() => setInventoryFilter(value)} aria-pressed={active} className={[
                              "shrink-0 rounded-2xl px-4 py-3 text-xs font-bold transition",
                              active ? "bg-[var(--cupboard-primary)] text-[#10140d] shadow-[0_6px_16px_rgb(120_168_91_/_0.14)]" : "border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] text-[var(--cupboard-text-muted)] hover:text-[var(--cupboard-text)]",
                            ].join(" ")}>
                              {label}
                            </button>
                          );
                        })}
                      </div>

                      <div ref={sortMenuRef} className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsSortOpen((open) => !open)}
                          aria-haspopup="listbox"
                          aria-expanded={isSortOpen}
                          className="flex items-center gap-2 rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] px-3.5 py-3 text-left transition hover:border-[var(--cupboard-primary)]/40"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">Orden</span>
                          <span className="max-w-[120px] truncate text-xs font-bold text-[var(--cupboard-text)]">
                            {{
                              name: "Nombre A-Z",
                              recent: "Más recientes",
                              "low-stock": "Menor stock",
                              "high-stock": "Mayor stock",
                            }[inventorySort]}
                          </span>
                          <span
                            className={[
                              "text-[var(--cupboard-text-subtle)] transition-transform",
                              isSortOpen ? "rotate-180" : "",
                            ].join(" ")}
                            aria-hidden="true"
                          >
                            ⌄
                          </span>
                        </button>

                        {isSortOpen && (
                          <div
                            role="listbox"
                            aria-label="Ordenar inventario"
                            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[190px] overflow-hidden rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-1.5 shadow-[0_18px_45px_rgb(0_0_0_/_0.38)]"
                          >
                            {[
                              ["name", "Nombre A-Z"],
                              ["recent", "Más recientes"],
                              ["low-stock", "Menor stock"],
                              ["high-stock", "Mayor stock"],
                            ].map(([value, label]) => {
                              const active = inventorySort === value;

                              return (
                                <button
                                  key={value}
                                  type="button"
                                  role="option"
                                  aria-selected={active}
                                  onClick={() => {
                                    setInventorySort(value);
                                    setIsSortOpen(false);
                                  }}
                                  className={[
                                    "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition",
                                    active
                                      ? "bg-[var(--cupboard-primary-soft)] text-[var(--cupboard-primary)]"
                                      : "text-[var(--cupboard-text-muted)] hover:bg-[var(--cupboard-surface-muted)] hover:text-[var(--cupboard-text)]",
                                  ].join(" ")}
                                >
                                  <span>{label}</span>
                                  {active && <span aria-hidden="true">✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 mt-7 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-primary)]">Inventario</p>
                      <h2 className="mt-1 text-2xl font-extrabold tracking-tight">Tus productos</h2>
                    </div>
                    <p className="text-xs font-medium text-[var(--cupboard-text-subtle)]">{filteredProducts.length} visibles</p>
                  </div>

                  {isLoadingProducts && (
                    <div className="rounded-[2rem] border border-dashed border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] px-6 py-16 text-center">
                      <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-[var(--cupboard-primary-soft)] text-3xl">📦</div>
                      <p className="mt-5 text-base font-bold">Cargando alacena...</p>
                      <p className="mt-1 text-sm text-[var(--cupboard-text-muted)]">Estamos preparando tu inventario.</p>
                    </div>
                  )}

                  {!isLoadingProducts && products.length === 0 && (
                    <div className="rounded-[2rem] border border-dashed border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] px-6 py-16 text-center">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[var(--cupboard-primary-soft)] text-4xl">🥫</div>
                      <h3 className="mt-6 text-xl font-extrabold">Tu alacena está vacía</h3>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--cupboard-text-muted)]">Escanea tu primer producto para empezar a organizar tus existencias.</p>
                      <button type="button" onClick={() => onAddProduct()} className="mt-6 rounded-2xl bg-[var(--cupboard-primary)] px-5 py-3 text-sm font-bold text-[#10140d]">📷 Escanear primer producto</button>
                    </div>
                  )}

                  {!isLoadingProducts && products.length > 0 && filteredProducts.length === 0 && (
                    <div className="rounded-[2rem] border border-dashed border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] px-6 py-16 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--cupboard-surface-muted)] text-3xl">🔎</div>
                      <h3 className="mt-5 text-xl font-extrabold">No encontramos productos</h3>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--cupboard-text-muted)]">
                        {search.trim() ? "No hay productos que coincidan con \"" + search.trim() + "\"." : "No hay productos que coincidan con el filtro seleccionado."}
                      </p>
                      <button type="button" onClick={() => { setSearch(""); setInventoryFilter("all"); }} className="mt-6 rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] px-5 py-3 text-sm font-bold">Limpiar búsqueda</button>
                    </div>
                  )}

                  {!isLoadingProducts && filteredProducts.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {filteredProducts.map((item) => {
                        const portions = Number(item.portions) || 0;
                        const minStock = Number(item.minStock) || 5;
                        const warningStock = Math.max(minStock * 2, minStock + 1);
                        const isLow = portions <= minStock;
                        const isWarning = portions > minStock && portions <= warningStock;
                        const cardStatus = portions === 0
                          ? ["Agotado", "bg-[var(--cupboard-surface-muted)] text-[var(--cupboard-text-muted)]", "border-[var(--cupboard-border)]"]
                          : isLow
                            ? ["Stock bajo", "bg-[var(--cupboard-danger)]/10 text-[var(--cupboard-danger)]", "border-[var(--cupboard-danger)]/25"]
                            : isWarning
                              ? ["Atención", "bg-[var(--cupboard-warning)]/10 text-[var(--cupboard-warning)]", "border-[var(--cupboard-warning)]/20"]
                              : ["Disponible", "bg-[var(--cupboard-primary-soft)] text-[var(--cupboard-success)]", "border-[var(--cupboard-border)]"];

                        return (
                          <article
                            key={`${item.workspaceId || "home"}:${item.id}`}
                            onClick={() => onOpenProduct(item)}
                            onKeyDown={(event) => {
                              if (event.target !== event.currentTarget) return;
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                onOpenProduct(item);
                              }
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={"Abrir producto " + (item.name || "sin nombre")}
                            className={[
                              "group overflow-hidden rounded-[1.75rem] border bg-[var(--cupboard-surface)] shadow-[var(--cupboard-shadow-sm)] transition-all duration-200",
                              "hover:-translate-y-1 hover:border-[var(--cupboard-primary)]/30 hover:shadow-[var(--cupboard-shadow-md)] focus:outline-none focus:ring-2 focus:ring-[var(--cupboard-primary)]/30",
                              cardStatus[2],
                            ].join(" ")}
                          >
                            <div className="relative flex h-40 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,var(--cupboard-surface-raised),var(--cupboard-surface-muted))]">
                              {item.imageUrl ? (
                                <div className="flex h-[116px] w-[116px] items-center justify-center overflow-hidden rounded-[1.25rem] bg-white p-2.5 shadow-[var(--cupboard-shadow-sm)]">
                                  <img
                                    src={item.imageUrl}
                                    alt=""
                                    onError={(event) => {
                                      event.currentTarget.style.display = "none";
                                      event.currentTarget.parentElement?.classList.add("hidden");
                                      event.currentTarget.parentElement?.parentElement?.querySelector("[data-image-fallback]")?.classList.remove("hidden");
                                    }}
                                    className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-105"
                                  />
                                </div>
                              ) : null}
                              <div
                                data-image-fallback
                                className={[
                                  "h-16 w-16 items-center justify-center rounded-2xl bg-[var(--cupboard-surface)] text-3xl shadow-[var(--cupboard-shadow-sm)]",
                                  item.imageUrl ? "hidden" : "flex",
                                ].join(" ")}
                                aria-hidden="true"
                              >📦</div>
                              <span className={["absolute left-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em]", cardStatus[1]].join(" ")}>{cardStatus[0]}</span>
                            </div>

                            <div className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="truncate text-sm font-extrabold">{item.name || "Producto sin nombre"}</h3>
                                  <p className="mt-1 text-xs text-[var(--cupboard-text-muted)]">{item.weight || 0} g</p>
                                </div>
                                <span className="shrink-0 rounded-xl bg-[var(--cupboard-surface-muted)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">{item.id ? "SKU" : "ITEM"}</span>
                              </div>

                              <div className="mt-5 flex items-end justify-between gap-3">
                                <div>
                                  <p className="text-3xl font-extrabold leading-none">{portions}</p>
                                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--cupboard-text-subtle)]">{item.unit || "porciones"}</p>
                                </div>
                                <button type="button" onClick={(event) => { event.stopPropagation(); onOpenProduct(item); }} className="rounded-xl px-2 py-1.5 text-xs font-bold text-[var(--cupboard-primary)] transition hover:bg-[var(--cupboard-primary-soft)]">Ver →</button>
                              </div>

                              {inventoryActionError?.productId === item.id && inventoryActionError?.workspaceId === item.workspaceId && (
                                <div role="alert" aria-live="assertive" className="mt-4 rounded-xl border border-[var(--cupboard-danger)]/25 bg-[var(--cupboard-danger)]/10 px-3 py-2 text-[11px] font-medium text-[var(--cupboard-danger)]">{inventoryActionError.message}</div>
                              )}

                              {inventoryActionSuccess?.productId === item.id && inventoryActionSuccess?.workspaceId === item.workspaceId && (
                                <div role="status" aria-live="polite" className="mt-4 rounded-xl border border-[var(--cupboard-success)]/20 bg-[var(--cupboard-success)]/10 px-3 py-2 text-[11px] font-medium text-[var(--cupboard-success)]">{inventoryActionSuccess.message}</div>
                              )}

                              <div className="mt-4 grid grid-cols-2 gap-2">
                                <button type="button" onClick={(event) => { event.stopPropagation(); onConsume(item); }} disabled={!canWriteInventory || portions <= 0 || updatingProductId === `${item.workspaceId || "home"}:${item.id}`} aria-label={"Consumir una porción de " + item.name} className="rounded-xl bg-[var(--cupboard-danger)]/10 px-3 py-2.5 text-xs font-bold text-[var(--cupboard-danger)] transition hover:bg-[var(--cupboard-danger)]/20 disabled:cursor-not-allowed disabled:opacity-30">
                                  {updatingProductId === item.id ? "↻" : "− 1"}
                                </button>
                                <button type="button" onClick={(event) => { event.stopPropagation(); onAdd(item); }} disabled={!canWriteInventory || updatingProductId === item.id} aria-label={"Agregar una porción de " + item.name} className="rounded-xl bg-[var(--cupboard-primary-soft)] px-3 py-2.5 text-xs font-bold text-[var(--cupboard-primary)] transition hover:bg-[var(--cupboard-primary)]/20 disabled:cursor-not-allowed disabled:opacity-30">
                                  {updatingProductId === item.id ? "↻" : "+ 1"}
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
  );
}
