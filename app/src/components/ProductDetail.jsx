import { useMemo, useState } from "react";

function formatExpiry(expiryDate) {
  if (!expiryDate) return "Sin fecha";

  const date = new Date(`${expiryDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return expiryDate;

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getExpiryState(expiryDate) {
  if (!expiryDate) {
    return { label: "Sin fecha de caducidad", tone: "neutral", days: null };
  }

  const target = new Date(`${expiryDate}T12:00:00`);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.ceil((target.getTime() - start.getTime()) / 86400000);

  if (diff < 0) return { label: "Producto caducado", tone: "danger", days: diff };
  if (diff === 0) return { label: "Caduca hoy", tone: "danger", days: diff };
  if (diff <= 7) return { label: `Caduca en ${diff} días`, tone: "warning", days: diff };

  return { label: `Caduca el ${formatExpiry(expiryDate)}`, tone: "success", days: diff };
}

function ProductImage({ product }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="group relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-[2rem] border border-[var(--cupboard-border)] bg-[radial-gradient(circle_at_50%_38%,var(--cupboard-surface-raised),var(--cupboard-surface-muted)_58%,var(--cupboard-surface))] p-8 sm:min-h-[390px] lg:min-h-[520px]">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--cupboard-primary)]/10 blur-3xl transition duration-700 group-hover:scale-125 group-hover:opacity-80" />

      <div className="relative flex h-56 w-56 items-center justify-center rounded-[2.5rem] border border-white/5 bg-[rgb(18_16_13_/_0.45)] p-6 shadow-[0_30px_70px_rgb(0_0_0_/_0.28)] backdrop-blur-sm transition duration-500 group-hover:-translate-y-1 group-hover:scale-[1.02] sm:h-64 sm:w-64">
        {product.imageUrl && !failed ? (
          <img
            src={product.imageUrl}
            alt={product.name || "Producto"}
            onError={() => setFailed(true)}
            className="max-h-full w-full object-contain drop-shadow-[0_18px_24px_rgb(0_0_0_/_0.28)] transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-[1.75rem] bg-[var(--cupboard-surface)] text-center">
            <span className="text-7xl transition duration-500 group-hover:-rotate-3 group-hover:scale-105" aria-hidden="true">📦</span>
            <span className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-text-subtle)]">
              Sin imagen
            </span>
          </div>
        )}
      </div>

      <span className="absolute bottom-5 left-5 rounded-full border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--cupboard-text-subtle)] backdrop-blur">
        {product.category || "Despensa"}
      </span>
    </div>
  );
}

function StatusBadge({ tone, children }) {
  const styles = {
    success: "bg-[var(--cupboard-primary-soft)] text-[var(--cupboard-success)]",
    warning: "bg-[var(--cupboard-warning)]/10 text-[var(--cupboard-warning)]",
    danger: "bg-[var(--cupboard-danger)]/10 text-[var(--cupboard-danger)]",
    neutral: "bg-[var(--cupboard-surface-muted)] text-[var(--cupboard-text-muted)]",
  };

  return (
    <span className={["inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]", styles[tone] || styles.neutral].join(" ")}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}

export default function ProductDetail({
  product,
  updatingProductId,
  canWriteInventory = true,
  canEditProduct = false,
  onConsume,
  onAdd,
  onBack,
  onEdit,
}) {
  const portions = Number(product.portions) || 0;
  const unit = product.unit || "porciones";
  const minStock = Number(product.minStock) || 5;
  const expiry = getExpiryState(product.expiryDate);
  const isUpdating = updatingProductId === product.id;
  const stockTone =
    portions === 0 ? "danger" : portions <= minStock ? "warning" : "success";
  const stockLabel =
    portions === 0 ? "Agotado" : portions <= minStock ? "Stock bajo" : "Disponible";
  const maxStock = Math.max(minStock * 3, portions, 10);
  const stockProgress = Math.min(100, Math.round((portions / maxStock) * 100));

  const stockMessage = useMemo(() => {
    if (portions === 0) return "Este producto ya no tiene existencias disponibles.";
    if (portions <= minStock) return `Quedan pocas existencias. El mínimo configurado es ${minStock} ${unit}.`;
    return "Tu inventario tiene una cantidad saludable de este producto.";
  }, [minStock, portions, unit]);

  return (
    <section className="space-y-5 animate-cupboard-enter">
      <button
        type="button"
        onClick={onBack}
        className="group inline-flex items-center gap-2 rounded-xl px-1 py-2 text-sm font-semibold text-[var(--cupboard-text-muted)] transition hover:text-[var(--cupboard-text)]"
      >
        <span className="transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true">←</span>
        Inventario
      </button>

      <div className="overflow-hidden rounded-[2.25rem] border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] shadow-[var(--cupboard-shadow-md)]">
        <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
          <ProductImage key={`${product.id}-${product.imageUrl || ""}`} product={product} />

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--cupboard-primary)]">
                Producto
              </p>
              <StatusBadge tone={stockTone}>{stockLabel}</StatusBadge>
            </div>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {product.name || "Producto sin nombre"}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--cupboard-text-muted)]">
              {product.description || "Sin descripción. Puedes añadir una desde editar producto."}
            </p>

            <div className="relative mt-7 overflow-hidden rounded-[1.75rem] border border-[var(--cupboard-border)] bg-[linear-gradient(145deg,var(--cupboard-surface-raised),var(--cupboard-surface-muted))] p-5 sm:p-6">
              <div className="absolute -right-12 -top-16 h-36 w-36 rounded-full bg-[var(--cupboard-primary)]/10 blur-3xl" />
              <div className="relative">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-text-subtle)]">
                      Disponibles
                    </p>
                    <div key={portions} className="animate-cupboard-count mt-1 text-6xl font-extrabold tracking-tight sm:text-7xl">
                      {portions}
                    </div>
                    <p className="mt-1 text-xs text-[var(--cupboard-text-muted)]">{unit}</p>
                  </div>

                  <span className="hidden text-xs font-semibold text-[var(--cupboard-text-muted)] sm:block">
                    {stockProgress}% del nivel de referencia
                  </span>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--cupboard-bg)]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stockTone === "danger"
                        ? "bg-[var(--cupboard-danger)]"
                        : stockTone === "warning"
                          ? "bg-[var(--cupboard-warning)]"
                          : "bg-[var(--cupboard-primary)]"
                    }`}
                    style={{ width: `${stockProgress}%` }}
                  />
                </div>

                <p className="mt-3 text-xs text-[var(--cupboard-text-muted)]">{stockMessage}</p>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onConsume(product)}
                    disabled={!canWriteInventory || portions <= 0 || isUpdating}
                    className="group rounded-2xl bg-[var(--cupboard-danger)]/10 px-4 py-3.5 text-sm font-bold text-[var(--cupboard-danger)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--cupboard-danger)]/20 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <span className="mr-1 transition-transform duration-300 group-hover:-translate-x-0.5">−</span>
                    Consumir
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdd(product)}
                    disabled={!canWriteInventory || isUpdating}
                    className="group rounded-2xl bg-[var(--cupboard-primary-soft)] px-4 py-3.5 text-sm font-bold text-[var(--cupboard-primary)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--cupboard-primary)]/20 disabled:opacity-50"
                  >
                    <span className="mr-1 transition-transform duration-300 group-hover:scale-125">+</span>
                    Agregar
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Inventario", product.workspaceId === "sandwichies" ? "Sandwichies" : "Cupboard", "🏷️"],
                ["Peso", product.weight ? `${product.weight} g` : "Sin registrar", "⚖️"],
                ["Código", product.id || "—", "🏷️"],
                ["Caducidad", formatExpiry(product.expiryDate), "📅"],
                ["Stock mínimo", `${minStock} ${unit}`, "📦"],
              ].map(([label, value, icon]) => (
                <div
                  key={label}
                  className="group rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[var(--cupboard-primary)]/25"
                >
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true">{icon}</span>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--cupboard-text-subtle)]">
                      {label}
                    </p>
                  </div>
                  <p className="mt-2 break-all text-sm font-bold">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className={[
              "mt-5 rounded-2xl border px-4 py-3.5 text-sm",
              expiry.tone === "danger"
                ? "border-[var(--cupboard-danger)]/20 bg-[var(--cupboard-danger)]/10 text-[var(--cupboard-danger)]"
                : expiry.tone === "warning"
                  ? "border-[var(--cupboard-warning)]/20 bg-[var(--cupboard-warning)]/10 text-[var(--cupboard-warning)]"
                  : expiry.tone === "success"
                    ? "border-[var(--cupboard-primary)]/20 bg-[var(--cupboard-primary-soft)] text-[var(--cupboard-success)]"
                    : "border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] text-[var(--cupboard-text-muted)]",
            ].join(" ")}>
              <span className="mr-2" aria-hidden="true">
                {expiry.tone === "danger" ? "🔴" : expiry.tone === "warning" ? "🟡" : expiry.tone === "success" ? "🟢" : "📅"}
              </span>
              {expiry.label}
            </div>


            {!canWriteInventory && (
              <div className="mt-5 rounded-2xl border border-[var(--cupboard-info)]/25 bg-[var(--cupboard-info)]/10 px-4 py-3 text-xs leading-5 text-[var(--cupboard-info)]">
                Modo solo lectura: este rol puede consultar el producto, pero no modificar el inventario.
              </div>
            )}

            <button
              type="button"
              onClick={() => onEdit(product)}
              disabled={!canEditProduct}
              className="mt-5 w-full rounded-2xl bg-[var(--cupboard-primary)] px-5 py-4 text-sm font-bold text-[#10140d] shadow-[0_10px_24px_rgb(120_168_91_/_0.12)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--cupboard-primary-hover)] hover:shadow-[0_14px_30px_rgb(120_168_91_/_0.18)]"
            >
              Editar producto
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
