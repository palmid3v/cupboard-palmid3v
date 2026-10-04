import { useEffect, useRef, useState } from "react";
import BarcodeScanner from "./components/BarcodeScanner";
import {
  getProduct,
  saveProduct,
  getAllProducts,
  updatePortions,
} from "./services/products";

function NavigationButton({
  icon,
  label,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={[
        "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition",
        active
          ? "bg-[var(--cupboard-primary-soft)] text-[var(--cupboard-primary)]"
          : "text-[var(--cupboard-text-muted)] hover:bg-[var(--cupboard-surface-muted)] hover:text-[var(--cupboard-text)]",
      ].join(" ")}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function MobileNavigationButton({
  icon,
  label,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={[
        "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition",
        active
          ? "bg-[var(--cupboard-primary-soft)] text-[var(--cupboard-primary)]"
          : "text-[var(--cupboard-text-muted)]",
      ].join(" ")}
    >
      <span className="text-lg" aria-hidden="true">
        {icon}
      </span>

      <span>{label}</span>
    </button>
  );
}

export default function App() {
  const [view, setView] = useState("inventory");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [barcode, setBarcode] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    weight: "",
    portions: "",
    imageUrl: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [status, setStatus] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [inventoryActionError, setInventoryActionError] = useState(null);
  const [inventoryActionSuccess, setInventoryActionSuccess] = useState(null);
  const [search, setSearch] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState("all");
  const [inventorySort, setInventorySort] = useState("name");
  const [scanKey, setScanKey] = useState(0);  const [isManualEntry, setIsManualEntry] = useState(false);

  const loadProducts = async () => {
    setIsLoadingProducts(true);

    try {
      const data = await getAllProducts();
      setProducts(data);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openProduct = (item) => {
  setInventoryActionError(null);
  setInventoryActionSuccess(null);
  setSelectedProduct(item);
};


  const handleConsume = async (item) => {
  if (!item.portions || item.portions <= 0) return;
  if (updatingProductId === item.id) return;

  const newPortions = item.portions - 1;

  setUpdatingProductId(item.id);
  setInventoryActionError(null);
  setInventoryActionSuccess("");

  try {
    await updatePortions(item.id, newPortions);

    await loadProducts();

    setSelectedProduct((current) =>
      current?.id === item.id
        ? { ...current, portions: newPortions }
        : current,
    );

    setInventoryActionSuccess({
      productId: item.id,
      message: `Porciones actualizadas: ${newPortions}`,
    });

  } catch (error) {
  console.error("Error consumiendo porción:", error);

  setInventoryActionError({
    productId: item.id,
    message: "No pudimos actualizar las porciones. Inténtalo nuevamente.",
  });
} finally {
    setUpdatingProductId(null);
  }
};

  const handleAdd = async (item) => {
  if (updatingProductId === item.id) return;

  const newPortions = (item.portions || 0) + 1;

  setUpdatingProductId(item.id);
  setInventoryActionError(null);
  setInventoryActionSuccess("");

  try {
    await updatePortions(item.id, newPortions);

    await loadProducts();

    setSelectedProduct((current) =>
      current?.id === item.id
        ? { ...current, portions: newPortions }
        : current,
    );

    setInventoryActionSuccess({
      productId: item.id,
      message: `Porciones actualizadas: ${newPortions}`,
    });

  } catch (error) {
  console.error("Error agregando porción:", error);

  setInventoryActionError({
    productId: item.id,
    message: "No pudimos actualizar las porciones. Inténtalo nuevamente.",
  });
} finally {
    setUpdatingProductId(null);
  }
};

  const handleScan = async (code) => {
  setBarcode(code);
  setIsEditing(false);
  setFormError("");
  setIsLookingUp(true);

  try {
    const product = await getProduct(code);

    if (product) {
      setStatus("found");

      setForm({
        name: product.name || "",
        description: product.description || "",
        weight: product.weight || "",
        portions: product.portions || "",
        imageUrl: product.imageUrl || "",
      });
    } else {
      setStatus("new");

      setForm({
        name: "",
        description: "",
        weight: "",
        portions: "",
        imageUrl: "",
      });
    }
    } catch (error) {
    console.error("Error buscando producto:", error);

    setStatus("error");
    setFormError(
      "No pudimos consultar el producto. Inténtalo nuevamente.",
    );
  } finally {
    setIsLookingUp(false);
  }
};

  const handleChange = (event) => {
  setFormError("");

  setForm({
    ...form,
    [event.target.name]: event.target.value,
  });
};

  const nameInputRef = useRef(null);
  const weightInputRef = useRef(null);
  const portionsInputRef = useRef(null);
  const handleSave = async () => {
  setFormError("");

  const productCode = barcode.trim();
  const name = form.name.trim();
  const portionsValue = Number(form.portions);
  const weightValue =
    form.weight === "" ? null : Number(form.weight);

  if (!productCode) {
  setFormError(
    isManualEntry
      ? "Escribe el código del producto."
      : "Primero escanea un código de barras.",
  );
  return;
}

  if (!name) {
    setFormError("El nombre del producto es obligatorio.");
    nameInputRef.current?.focus();
    return;
  }

  if (
    form.portions === "" ||
    !Number.isFinite(portionsValue) ||
    portionsValue < 0
  ) {
    setFormError("Las porciones deben ser un número igual o mayor que 0.");
    portionsInputRef.current?.focus();
    return;
  }

  if (
  weightValue !== null &&
  (!Number.isFinite(weightValue) || weightValue < 0)
) {
  setFormError("El peso debe ser un número igual o mayor que 0.");
  weightInputRef.current?.focus();
  return;
}

if (isManualEntry) {
  const existingProduct = await getProduct(productCode);

  if (existingProduct) {
    setFormError(
      "Este código ya está registrado. Puedes buscarlo en tu inventario.",
    );
    return;
  }
}

setIsSaving(true);

  try {
    await saveProduct(productCode, {
      ...form,
      name,
      weight: weightValue ?? 0,
      portions: portionsValue,
    });

    setStatus("saved");
    setFormError("");

    setBarcode("");

    setForm({
      name: "",
      description: "",
      weight: "",
      portions: "",
      imageUrl: "",
    });

    setIsEditing(false);
    setIsManualEntry(false);
    setScanKey((previous) => previous + 1);

    await loadProducts();

    setView("inventory");
  } catch (error) {
    console.error(error);

    setFormError(
      "No pudimos guardar el producto. Inténtalo nuevamente.",
    );
  } finally {
    setIsSaving(false);
  }
};

  const inventorySummary = {
  products: products.length,

  portions: products.reduce(
    (total, item) => total + (Number(item.portions) || 0),
    0,
  ),

  lowStock: products.filter(
    (item) => (Number(item.portions) || 0) <= 5,
  ).length,
};

  const filteredProducts = products
  .filter((item) => {
    const searchTerm = search.trim().toLowerCase();

    const matchesSearch =
      !searchTerm ||
      item.name?.toLowerCase().includes(searchTerm) ||
      item.id?.toLowerCase().includes(searchTerm);

    const portions = Number(item.portions) || 0;

    const matchesFilter =
      inventoryFilter === "all"
        ? true
        : inventoryFilter === "low"
          ? portions <= 5
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

  
  const statusConfig = {
    found: {
      label: "Producto encontrado",
      className:
        "border-[var(--cupboard-success)]/30 bg-[var(--cupboard-primary-soft)] text-[var(--cupboard-success)]",
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

  const pageTitle = {
    inventory: "Tu inventario",
    scanner: "Scanner",
    settings: "Ajustes",
  };

  const pageDescription = {
    inventory:
      "Controla tus productos, cantidades y existencias desde un solo lugar.",
    scanner:
      "Escanea códigos de barras para buscar o registrar productos.",
    settings:
      "Personaliza Cupboard según tus preferencias.",
  };

  return (
    <div className="min-h-screen bg-[var(--cupboard-bg)] text-[var(--cupboard-text)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-[var(--cupboard-border)] bg-[var(--cupboard-surface)]/90 px-4 py-5 backdrop-blur lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--cupboard-primary-soft)] text-xl shadow-[0_8px_24px_rgb(0_0_0_/_0.2)]">📦</div>
            <div className="min-w-0">
              <p className="text-[17px] font-extrabold tracking-tight">Cupboard</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--cupboard-text-subtle)]">Tu alacena</p>
            </div>
          </div>

          <div className="mt-9">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-text-subtle)]">Workspace</p>
            <nav aria-label="Navegación principal" className="space-y-1">
              <NavigationButton icon="📦" label="Inventario" badge={products.length ? products.length + " productos" : undefined} active={view === "inventory"} onClick={() => setView("inventory")} />
              <NavigationButton icon="📷" label="Scanner" badge="Registrar producto" active={view === "scanner"} onClick={() => setView("scanner")} />
              <NavigationButton icon="⚙️" label="Ajustes" badge="Preferencias" active={view === "settings"} onClick={() => setView("settings")} />
            </nav>
          </div>

          <div className="mt-auto">
            <div className="rounded-3xl border border-[var(--cupboard-border)] bg-[linear-gradient(145deg,var(--cupboard-surface-muted),var(--cupboard-surface))] p-4 shadow-[var(--cupboard-shadow-sm)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--cupboard-text-subtle)]">Estado</p>
                  <p className="mt-1 text-sm font-semibold">Inventario conectado</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--cupboard-primary-soft)]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--cupboard-success)] shadow-[0_0_0_5px_rgb(120_168_91_/_0.10)]" />
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--cupboard-border)] pt-3">
                <span className="text-[10px] font-medium text-[var(--cupboard-text-subtle)]">Datos sincronizados</span>
                <span className="text-[10px] font-bold text-[var(--cupboard-success)]">ACTIVO</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-28 lg:pb-8">
          <div className="mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-8">
            <header className="mb-7 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-primary)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--cupboard-primary)]" />
                  {pageTitle[view]}
                </div>
                <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {view === "inventory" ? "Tu alacena, bajo control." : pageTitle[view]}
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm text-[var(--cupboard-text-muted)]">{pageDescription[view]}</p>
              </div>

              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <div className="flex items-center gap-2 rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] px-3 py-2.5">
                  <span className="h-2 w-2 rounded-full bg-[var(--cupboard-success)]" />
                  <span className="text-xs font-semibold text-[var(--cupboard-text-muted)]">Conectado</span>
                </div>
                <button type="button" onClick={() => setView("scanner")} className="rounded-2xl bg-[var(--cupboard-primary)] px-4 py-2.5 text-xs font-bold text-[#10140d] shadow-[0_8px_20px_rgb(120_168_91_/_0.14)] transition hover:-translate-y-0.5 hover:bg-[var(--cupboard-primary-hover)]">
                  + Escanear
                </button>
              </div>
            </header>

            {selectedProduct && (
              <section className="space-y-5">
                <button type="button" onClick={() => setSelectedProduct(null)} className="inline-flex items-center gap-2 rounded-xl px-1 py-2 text-sm font-semibold text-[var(--cupboard-text-muted)] transition hover:text-[var(--cupboard-text)]">
                  ← Inventario
                </button>

                <div className="overflow-hidden rounded-[2rem] border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] shadow-[var(--cupboard-shadow-md)]">
                  <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
                    <div className="flex min-h-[300px] items-center justify-center bg-[radial-gradient(circle_at_center,var(--cupboard-surface-raised),var(--cupboard-surface-muted))] p-8 lg:min-h-[480px]">
                      {selectedProduct.imageUrl ? (
                        <img
                          src={selectedProduct.imageUrl}
                          alt={selectedProduct.name || "Producto"}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                            event.currentTarget.nextElementSibling?.classList.remove("hidden");
                          }}
                          className="max-h-[360px] w-full max-w-md rounded-3xl object-contain"
                        />
                      ) : null}
                      <div
                        className={[
                          "h-44 w-44 items-center justify-center rounded-[2rem] bg-[var(--cupboard-surface)] text-7xl shadow-[var(--cupboard-shadow-md)]",
                          selectedProduct.imageUrl ? "hidden" : "flex",
                        ].join(" ")}
                        aria-hidden="true"
                      >
                        📦
                      </div>
                    </div>

                    <div className="p-6 sm:p-8 lg:p-10">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--cupboard-primary)]">Producto</p>
                      <h2 className="mt-2 text-3xl font-extrabold tracking-tight">{selectedProduct.name || "Producto sin nombre"}</h2>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--cupboard-text-muted)]">{selectedProduct.description || "Sin descripción"}</p>

                      {(() => {
                        const portions = Number(selectedProduct.portions) || 0;
                        const statusLabel = portions === 0 ? "Agotado" : portions <= 5 ? "Stock bajo" : portions <= 10 ? "Atención" : "Disponible";
                        const statusClass = portions === 0
                          ? "bg-[var(--cupboard-surface-muted)] text-[var(--cupboard-text-muted)]"
                          : portions <= 5
                            ? "bg-[var(--cupboard-danger)]/10 text-[var(--cupboard-danger)]"
                            : portions <= 10
                              ? "bg-[var(--cupboard-warning)]/10 text-[var(--cupboard-warning)]"
                              : "bg-[var(--cupboard-primary-soft)] text-[var(--cupboard-success)]";

                        return (
                          <div className="mt-8 rounded-3xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] p-5">
                            <div className="flex items-end justify-between gap-4">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-text-subtle)]">Disponibles</p>
                                <p className="mt-1 text-6xl font-extrabold tracking-tight">{portions}</p>
                                <p className="mt-1 text-xs text-[var(--cupboard-text-muted)]">porciones</p>
                              </div>
                              <span className={["inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide", statusClass].join(" ")}>{statusLabel}</span>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-2">
                              <button type="button" onClick={() => handleConsume(selectedProduct)} disabled={portions <= 0} className="rounded-2xl bg-[var(--cupboard-danger)]/10 px-4 py-3.5 text-sm font-bold text-[var(--cupboard-danger)] transition hover:bg-[var(--cupboard-danger)]/20 disabled:cursor-not-allowed disabled:opacity-30">− 1 consumir</button>
                              <button type="button" onClick={() => handleAdd(selectedProduct)} className="rounded-2xl bg-[var(--cupboard-primary-soft)] px-4 py-3.5 text-sm font-bold text-[var(--cupboard-primary)] transition hover:bg-[var(--cupboard-primary)]/20">+ 1 agregar</button>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--cupboard-text-subtle)]">Peso</p>
                          <p className="mt-1 text-lg font-bold">{selectedProduct.weight || 0} g</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--cupboard-text-subtle)]">Barcode</p>
                          <p className="mt-1 break-all font-mono text-sm font-semibold">{selectedProduct.id || "—"}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setBarcode(selectedProduct.id);
                          setForm({
                            name: selectedProduct.name || "",
                            description: selectedProduct.description || "",
                            weight: selectedProduct.weight || "",
                            portions: selectedProduct.portions || "",
                            imageUrl: selectedProduct.imageUrl || "",
                          });
                          setIsEditing(true);
                          setIsManualEntry(false);
                          setView("scanner");
                          setSelectedProduct(null);
                        }}
                        className="mt-5 w-full rounded-2xl bg-[var(--cupboard-primary)] px-5 py-4 text-sm font-bold text-[#10140d] shadow-[0_10px_24px_rgb(120_168_91_/_0.12)] transition hover:-translate-y-0.5 hover:bg-[var(--cupboard-primary-hover)]"
                      >
                        Editar producto
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {view === "inventory" && !selectedProduct && (
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
                        Tienes <span className="text-[var(--cupboard-primary)]">{inventorySummary.portions}</span> porciones disponibles.
                      </p>
                      <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--cupboard-text-muted)]">
                        {inventorySummary.lowStock > 0 ? inventorySummary.lowStock + " productos necesitan atención." : "Todo está en orden. Tu alacena está lista."}
                      </p>
                      <button type="button" onClick={() => setView("scanner")} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[var(--cupboard-primary)] px-4 py-3 text-sm font-bold text-[#10140d] transition hover:-translate-y-0.5 hover:bg-[var(--cupboard-primary-hover)]">
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

                      <label className="flex shrink-0 items-center gap-2 rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] px-3.5 py-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">Orden</span>
                        <select id="inventory-sort" value={inventorySort} onChange={(event) => setInventorySort(event.target.value)} className="max-w-[145px] bg-transparent text-xs font-bold text-[var(--cupboard-text)] outline-none">
                          <option value="name">Nombre A-Z</option>
                          <option value="recent">Más recientes</option>
                          <option value="low-stock">Menor stock</option>
                          <option value="high-stock">Mayor stock</option>
                        </select>
                      </label>
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
                      <button type="button" onClick={() => setView("scanner")} className="mt-6 rounded-2xl bg-[var(--cupboard-primary)] px-5 py-3 text-sm font-bold text-[#10140d]">📷 Escanear primer producto</button>
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
                        const isLow = portions <= 5;
                        const isWarning = portions > 5 && portions <= 10;
                        const cardStatus = portions === 0
                          ? ["Agotado", "bg-[var(--cupboard-surface-muted)] text-[var(--cupboard-text-muted)]", "border-[var(--cupboard-border)]"]
                          : isLow
                            ? ["Stock bajo", "bg-[var(--cupboard-danger)]/10 text-[var(--cupboard-danger)]", "border-[var(--cupboard-danger)]/25"]
                            : isWarning
                              ? ["Atención", "bg-[var(--cupboard-warning)]/10 text-[var(--cupboard-warning)]", "border-[var(--cupboard-warning)]/20"]
                              : ["Disponible", "bg-[var(--cupboard-primary-soft)] text-[var(--cupboard-success)]", "border-[var(--cupboard-border)]"];

                        return (
                          <article
                            key={item.id}
                            onClick={() => openProduct(item)}
                            onKeyDown={(event) => {
                              if (event.target !== event.currentTarget) return;
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                openProduct(item);
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
                                <img src={item.imageUrl} alt="" onError={(event) => { event.currentTarget.style.display = "none"; event.currentTarget.nextElementSibling?.classList.remove("hidden"); }} className="h-full w-full object-contain p-5 transition duration-300 group-hover:scale-105" />
                              ) : null}
                              <div className={[
                                "h-16 w-16 items-center justify-center rounded-2xl bg-[var(--cupboard-surface)] text-3xl shadow-[var(--cupboard-shadow-sm)]",
                                item.imageUrl ? "hidden" : "flex",
                              ].join(" ")} aria-hidden="true">📦</div>
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
                                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--cupboard-text-subtle)]">porciones</p>
                                </div>
                                <button type="button" onClick={(event) => { event.stopPropagation(); openProduct(item); }} className="rounded-xl px-2 py-1.5 text-xs font-bold text-[var(--cupboard-primary)] transition hover:bg-[var(--cupboard-primary-soft)]">Ver →</button>
                              </div>

                              {inventoryActionError?.productId === item.id && (
                                <div role="alert" aria-live="assertive" className="mt-4 rounded-xl border border-[var(--cupboard-danger)]/25 bg-[var(--cupboard-danger)]/10 px-3 py-2 text-[11px] font-medium text-[var(--cupboard-danger)]">{inventoryActionError.message}</div>
                              )}

                              {inventoryActionSuccess?.productId === item.id && (
                                <div role="status" aria-live="polite" className="mt-4 rounded-xl border border-[var(--cupboard-success)]/20 bg-[var(--cupboard-success)]/10 px-3 py-2 text-[11px] font-medium text-[var(--cupboard-success)]">{inventoryActionSuccess.message}</div>
                              )}

                              <div className="mt-4 grid grid-cols-2 gap-2">
                                <button type="button" onClick={(event) => { event.stopPropagation(); handleConsume(item); }} disabled={portions <= 0 || updatingProductId === item.id} aria-label={"Consumir una porción de " + item.name} className="rounded-xl bg-[var(--cupboard-danger)]/10 px-3 py-2.5 text-xs font-bold text-[var(--cupboard-danger)] transition hover:bg-[var(--cupboard-danger)]/20 disabled:cursor-not-allowed disabled:opacity-30">
                                  {updatingProductId === item.id ? "Guardando…" : "− 1"}
                                </button>
                                <button type="button" onClick={(event) => { event.stopPropagation(); handleAdd(item); }} disabled={updatingProductId === item.id} aria-label={"Agregar una porción de " + item.name} className="rounded-xl bg-[var(--cupboard-primary-soft)] px-3 py-2.5 text-xs font-bold text-[var(--cupboard-primary)] transition hover:bg-[var(--cupboard-primary)]/20 disabled:cursor-not-allowed disabled:opacity-30">
                                  {updatingProductId === item.id ? "Guardando…" : "+ 1"}
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
            )}

            {view === "scanner" && (
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
                        <BarcodeScanner key={scanKey} onScan={handleScan} />
                      </div>

                      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-bold">¿No puedes escanear?</p>
                          <p className="mt-1 text-xs text-[var(--cupboard-text-muted)]">Introduce el código manualmente.</p>
                        </div>
                        <button type="button" onClick={() => { setIsManualEntry(true); setBarcode(""); setStatus(""); setFormError(""); setIsEditing(true); }} className="rounded-xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] px-4 py-2.5 text-xs font-bold text-[var(--cupboard-text)] transition hover:border-[var(--cupboard-primary)]/40">Agregar manualmente</button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--cupboard-text-subtle)]">Código</p>
                          <p className="mt-1 truncate font-mono text-sm font-semibold">{isLookingUp ? "Buscando producto..." : barcode || "Esperando escaneo..."}</p>
                        </div>
                        <button type="button" onClick={() => setScanKey((previous) => previous + 1)} className="shrink-0 rounded-xl border border-[var(--cupboard-border)] px-3 py-2 text-xs font-bold text-[var(--cupboard-text-muted)] transition hover:bg-[var(--cupboard-surface-muted)] hover:text-[var(--cupboard-text)]">↻ Repetir</button>
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

                    {status && (
                      <div role="status" className={["rounded-3xl border p-5", statusConfig[status]?.className || "border-[var(--cupboard-border)] bg-[var(--cupboard-surface)]"].join(" ")}>
                        <p className="text-sm font-extrabold">
                          {status === "found" && "🟢 Producto encontrado"}
                          {status === "new" && "🆕 Producto nuevo"}
                          {status === "saved" && "✅ Producto guardado"}
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

                {isEditing && (
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

                      <div>
                        <label htmlFor="product-name" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">Nombre</label>
                        <input id="product-name" ref={nameInputRef} name="name" type="text" placeholder="Ej. Leche entera" value={form.name} onChange={handleChange} autoFocus className="w-full rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-4 py-3.5 text-sm outline-none transition placeholder:text-[var(--cupboard-text-subtle)] focus:border-[var(--cupboard-primary)] focus:ring-4 focus:ring-[var(--cupboard-primary)]/10" />
                      </div>

                      <div>
                        <label htmlFor="product-description" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">Descripción</label>
                        <textarea id="product-description" name="description" rows="1" placeholder="Describe brevemente el producto..." value={form.description} onChange={handleChange} className="min-h-[52px] w-full resize-none rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-4 py-3.5 text-sm outline-none transition placeholder:text-[var(--cupboard-text-subtle)] focus:border-[var(--cupboard-primary)] focus:ring-4 focus:ring-[var(--cupboard-primary)]/10" />
                      </div>

                      <div>
                        <label htmlFor="product-weight" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">Peso</label>
                        <div className="relative">
                          <input id="product-weight" ref={weightInputRef} name="weight" type="number" min="0" placeholder="0" value={form.weight} onChange={handleChange} className="w-full rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-4 py-3.5 pr-10 text-sm outline-none transition placeholder:text-[var(--cupboard-text-subtle)] focus:border-[var(--cupboard-primary)] focus:ring-4 focus:ring-[var(--cupboard-primary)]/10" />
                          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-bold text-[var(--cupboard-text-subtle)]">g</span>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="product-portions" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">Porciones</label>
                        <input id="product-portions" ref={portionsInputRef} name="portions" type="number" min="0" placeholder="0" value={form.portions} onChange={handleChange} className="w-full rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-4 py-3.5 text-sm outline-none transition placeholder:text-[var(--cupboard-text-subtle)] focus:border-[var(--cupboard-primary)] focus:ring-4 focus:ring-[var(--cupboard-primary)]/10" />
                      </div>

                      <div className="lg:col-span-2">
                        <label htmlFor="product-image" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">Imagen <span className="normal-case font-normal tracking-normal">· opcional</span></label>
                        <input id="product-image" name="imageUrl" type="url" placeholder="https://..." value={form.imageUrl} onChange={handleChange} className="w-full rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-4 py-3.5 text-sm outline-none transition placeholder:text-[var(--cupboard-text-subtle)] focus:border-[var(--cupboard-primary)] focus:ring-4 focus:ring-[var(--cupboard-primary)]/10" />
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
                      <button type="button" onClick={() => { if (isManualEntry) { setBarcode(""); setStatus(""); setFormError(""); setIsEditing(false); setIsManualEntry(false); setScanKey((previous) => previous + 1); return; } setIsEditing(false); }} className="rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] px-5 py-3.5 text-sm font-bold text-[var(--cupboard-text-muted)] transition hover:text-[var(--cupboard-text)]">Cancelar</button>
                      <button type="button" onClick={handleSave} disabled={!barcode || isSaving} className="rounded-2xl bg-[var(--cupboard-primary)] px-5 py-3.5 text-sm font-bold text-[#10140d] shadow-[0_8px_20px_rgb(120_168_91_/_0.12)] transition hover:-translate-y-0.5 hover:bg-[var(--cupboard-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40">{isSaving ? "Guardando..." : "Guardar producto"}</button>
                    </div>
                  </section>
                )}
              </section>
            )}

            {view === "settings" && (
              <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
                <div className="rounded-[2rem] border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-6 shadow-[var(--cupboard-shadow-sm)] sm:p-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-primary)]">Apariencia</p>
                  <h2 className="mt-2 text-2xl font-extrabold">Cupboard Dark</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--cupboard-text-muted)]">Un tema oscuro fijo inspirado en una alacena real: madera, hojas, alimentos y superficies cálidas.</p>
                  <div className="mt-7 rounded-3xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] p-5">
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cupboard-primary-soft)] text-xl">🌙</span>
                      <div>
                        <p className="text-sm font-extrabold">Tema fijo</p>
                        <p className="mt-1 text-xs text-[var(--cupboard-text-muted)]">Cupboard no cambia a light ni sigue el sistema.</p>
                      </div>
                      <span className="ml-auto rounded-full bg-[var(--cupboard-primary)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#10140d]">Activo</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-6 shadow-[var(--cupboard-shadow-sm)] sm:p-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-accent)]">Cupboard</p>
                  <h2 className="mt-2 text-2xl font-extrabold">Inventory Control</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--cupboard-text-muted)]">Una experiencia sencilla para registrar, consultar y mantener bajo control lo que tienes en casa.</p>
                  <div className="mt-7 grid grid-cols-2 gap-2">
                    {["React", "Vite", "Firebase", "PWA"].map((tag) => (
                      <span key={tag} className="rounded-xl bg-[var(--cupboard-surface-muted)] px-3 py-2.5 text-center text-xs font-bold text-[var(--cupboard-text-muted)]">{tag}</span>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      <nav aria-label="Navegación móvil" className="fixed inset-x-3 bottom-3 z-50 rounded-3xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)]/95 p-1.5 shadow-[0_20px_50px_rgb(0_0_0_/_0.42)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-1">
          <MobileNavigationButton icon="📦" label="Inventario" active={view === "inventory"} onClick={() => setView("inventory")} />
          <MobileNavigationButton icon="📷" label="Scanner" active={view === "scanner"} onClick={() => setView("scanner")} />
          <MobileNavigationButton icon="⚙️" label="Ajustes" active={view === "settings"} onClick={() => setView("settings")} />
        </div>
      </nav>
    </div>
  );
}
