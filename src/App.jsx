import { useEffect, useRef, useState } from "react";
import BarcodeScanner from "./components/BarcodeScanner";
import {
  getProduct,
  saveProduct,
  getAllProducts,
  updatePortions,
} from "./services/products";

const THEME_KEY = "cupboard-theme";

function getInitialTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);

  if (
    savedTheme === "light" ||
    savedTheme === "dark" ||
    savedTheme === "system"
  ) {
    return savedTheme;
  }

  return "system";
}

function applyTheme(theme) {
  const root = document.documentElement;

  if (theme === "system") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    root.dataset.theme = prefersDark ? "dark" : "light";
    return;
  }

  root.dataset.theme = theme;
}

function ThemeButton({ value, current, children, onClick }) {
  const active = current === value;

  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      aria-pressed={active}
      className={[
        "rounded-lg px-3 py-2 text-xs font-medium transition",
        active
          ? "bg-[var(--cupboard-primary)] text-white shadow-sm"
          : "text-[var(--cupboard-text-muted)] hover:bg-[var(--cupboard-surface-muted)] hover:text-[var(--cupboard-text)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

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
  const [scanKey, setScanKey] = useState(0);
  const [theme, setTheme] = useState(getInitialTheme);
  const [isManualEntry, setIsManualEntry] = useState(false);

  const loadProducts = async () => {
    const data = await getAllProducts();
    setProducts(data);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)",
    );

    const handleChange = () => applyTheme("system");

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [theme]);

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
    <div className="min-h-screen bg-[var(--cupboard-bg)] text-[var(--cupboard-text)] transition-colors duration-200">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px]">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] px-5 py-6 lg:flex lg:flex-col">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cupboard-primary-soft)] text-xl">
              📦
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight">
                Cupboard
              </p>

              <p className="text-xs text-[var(--cupboard-text-muted)]">
                Inventory Control
              </p>
            </div>
          </div>

          <nav
            aria-label="Navegación principal"
            className="space-y-2"
          >
            <NavigationButton
              icon="📦"
              label="Inventario"
              active={view === "inventory"}
              onClick={() => setView("inventory")}
            />

            <NavigationButton
              icon="📷"
              label="Scanner"
              active={view === "scanner"}
              onClick={() => setView("scanner")}
            />

            <NavigationButton
              icon="⚙️"
              label="Ajustes"
              active={view === "settings"}
              onClick={() => setView("settings")}
            />
          </nav>

          <div className="mt-auto rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cupboard-text-muted)]">
              Estado
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--cupboard-success)]" />

              <span className="text-sm">
                Inventario conectado
              </span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-10 lg:pb-8 lg:pt-8">
          {/* Header */}
          <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-[var(--cupboard-primary)]">
                {pageTitle[view]}
              </p>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {pageTitle[view]}
              </h1>

              <p className="mt-2 max-w-xl text-sm text-[var(--cupboard-text-muted)] sm:text-base">
                {pageDescription[view]}
              </p>
            </div>

            <div className="flex w-fit items-center gap-1 rounded-xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-1">
              <ThemeButton
                value="light"
                current={theme}
                onClick={setTheme}
              >
                ☀️
              </ThemeButton>

              <ThemeButton
                value="dark"
                current={theme}
                onClick={setTheme}
              >
                🌙
              </ThemeButton>

              <ThemeButton
                value="system"
                current={theme}
                onClick={setTheme}
              >
                ⚙️
              </ThemeButton>
            </div>
          </header>
{/* PRODUCT DETAIL */}
{selectedProduct && (
  <section className="space-y-6">
    <button
      type="button"
      onClick={() => setSelectedProduct(null)}
      className="rounded-xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--cupboard-text-muted)] transition hover:bg-[var(--cupboard-surface-muted)] hover:text-[var(--cupboard-text)] focus:outline-none focus:ring-2 focus:ring-[var(--cupboard-primary)]/30"
    >
      ← Volver al inventario
    </button>

    <div className="overflow-hidden rounded-3xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] shadow-[var(--cupboard-shadow-md)]">
      <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Product visual */}
        <div className="flex min-h-[280px] items-center justify-center bg-[var(--cupboard-surface-muted)] p-8 lg:min-h-[420px]">
          {selectedProduct.imageUrl ? (
  <img
    src={selectedProduct.imageUrl}
    alt={selectedProduct.name || "Producto"}
    onError={(event) => {
      event.currentTarget.style.display = "none";
      event.currentTarget.nextElementSibling?.classList.remove("hidden");
    }}
    className="max-h-[360px] w-full max-w-md rounded-2xl object-contain"
  />
) : null}

<div
  className={`${selectedProduct.imageUrl ? "hidden " : ""}flex h-40 w-40 items-center justify-center rounded-3xl bg-[var(--cupboard-surface)] text-7xl`}
  aria-hidden="true"
>
  📦
</div>
        </div>

        {/* Product information */}
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold text-[var(--cupboard-primary)]">
              Producto
            </p>

            <h2 className="mt-1 text-3xl font-bold tracking-tight">
              {selectedProduct.name || "Producto sin nombre"}
            </h2>

            <p className="mt-2 text-sm text-[var(--cupboard-text-muted)]">
              {selectedProduct.description || "Sin descripción"}
            </p>
          </div>

          {(() => {
            const portions =
              Number(selectedProduct.portions) || 0;

            return (
              <div className="mb-6 rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cupboard-text-muted)]">
                      Porciones disponibles
                    </p>

                    <p className="mt-2 text-5xl font-bold">
                      {portions}
                    </p>
                  </div>

                  <div>
                    {portions === 0 && (
                      <span className="rounded-full bg-[var(--cupboard-surface)] px-3 py-1.5 text-xs font-bold text-[var(--cupboard-text-muted)]">
                        Agotado
                      </span>
                    )}

                    {portions > 0 && portions <= 5 && (
                      <span className="rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-bold text-[var(--cupboard-danger)]">
                        Stock bajo
                      </span>
                    )}

                    {portions > 5 && portions <= 10 && (
                      <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-[var(--cupboard-warning)]">
                        Atención
                      </span>
                    )}

                    {portions > 10 && (
                      <span className="rounded-full bg-[var(--cupboard-primary-soft)] px-3 py-1.5 text-xs font-bold text-[var(--cupboard-success)]">
                        Disponible
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleConsume(selectedProduct)
                    }
                    disabled={portions <= 0}
                    className="rounded-xl bg-[var(--cupboard-danger)]/10 px-4 py-3 font-bold text-[var(--cupboard-danger)] transition hover:bg-[var(--cupboard-danger)]/20 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    − 1
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleAdd(selectedProduct)
                    }
                    className="rounded-xl bg-[var(--cupboard-primary-soft)] px-4 py-3 font-bold text-[var(--cupboard-primary)] transition hover:brightness-95"
                  >
                    + 1
                  </button>
                </div>
              </div>
            );
          })()}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--cupboard-border)] p-4">
              <p className="text-xs text-[var(--cupboard-text-muted)]">
                Peso
              </p>

              <p className="mt-1 font-semibold">
                {selectedProduct.weight || 0} g
              </p>
            </div>

            <div className="rounded-xl border border-[var(--cupboard-border)] p-4">
              <p className="text-xs text-[var(--cupboard-text-muted)]">
                Barcode
              </p>

              <p className="mt-1 break-all font-mono text-sm font-semibold">
                {selectedProduct.id || "—"}
              </p>
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
            className="mt-6 w-full rounded-2xl bg-[var(--cupboard-primary)] px-5 py-4 font-semibold text-white shadow-[var(--cupboard-shadow-md)] transition hover:bg-[var(--cupboard-primary-hover)]"
          >
            ✎ Editar producto
          </button>
        </div>
      </div>
    </div>
  </section>
)}
          {/* INVENTORY */}
          {view === "inventory" && !selectedProduct && (
            <>
              <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-5 shadow-[var(--cupboard-shadow-sm)]">
                  <p className="text-sm text-[var(--cupboard-text-muted)]">
                    Productos
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {products.length}
                  </p>

                  <p className="mt-1 text-xs text-[var(--cupboard-text-muted)]">
                    registrados
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-5 shadow-[var(--cupboard-shadow-sm)]">
                  <p className="text-sm text-[var(--cupboard-text-muted)]">
                    Porciones
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {inventorySummary.portions}
                  </p>

                  <p className="mt-1 text-xs text-[var(--cupboard-text-muted)]">
                    disponibles
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-5 shadow-[var(--cupboard-shadow-sm)]">
                  <p className="text-sm text-[var(--cupboard-text-muted)]">
                    Stock bajo
                  </p>

                  <p className="mt-2 text-3xl font-bold text-[var(--cupboard-danger)]">
                    {inventorySummary.lowStock}
                  </p>

                  <p className="mt-1 text-xs text-[var(--cupboard-text-muted)]">
                    necesitan atención
                  </p>
                </div>
              </section>

              <section className="mb-10 rounded-3xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-5 shadow-[var(--cupboard-shadow-sm)] sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--cupboard-primary)]">
                      Acciones rápidas
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      Gestiona tu inventario
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setView("scanner")}
                    className="rounded-xl bg-[var(--cupboard-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--cupboard-primary-hover)]"
                  >
                    📷 Escanear producto
                  </button>
                </div>
              </section>

              <section>
  <div className="mb-5">
    <p className="text-sm font-semibold text-[var(--cupboard-primary)]">
      Inventario
    </p>

    <h2 className="text-2xl font-bold">
      Tus productos
    </h2>
  </div>

  <div className="space-y-4">
    <input
      type="text"
      placeholder="Buscar producto..."
      aria-label="Buscar productos"
      value={search}
      onChange={(event) => setSearch(event.target.value)}
      className="w-full rounded-xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--cupboard-text-muted)] focus:border-[var(--cupboard-primary)] focus:ring-2 focus:ring-[var(--cupboard-primary)]/20"
    />

    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-4 shadow-[var(--cupboard-shadow-sm)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cupboard-primary-soft)] text-xl">
            📦
          </div>

          <div>
            <p className="text-2xl font-bold">
              {inventorySummary.products}
            </p>

            <p className="text-xs font-medium text-[var(--cupboard-text-muted)]">
              Productos
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-4 shadow-[var(--cupboard-shadow-sm)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cupboard-primary-soft)] text-xl">
            🥫
          </div>

          <div>
            <p className="text-2xl font-bold">
              {inventorySummary.portions}
            </p>

            <p className="text-xs font-medium text-[var(--cupboard-text-muted)]">
              Porciones
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-4 shadow-[var(--cupboard-shadow-sm)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cupboard-danger)]/10 text-xl">
            ⚠️
          </div>

          <div>
            <p className="text-2xl font-bold text-[var(--cupboard-danger)]">
              {inventorySummary.lowStock}
            </p>

            <p className="text-xs font-medium text-[var(--cupboard-text-muted)]">
              Stock bajo
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="flex flex-wrap gap-2">
      {[
        ["all", "Todos"],
        ["low", "Stock bajo"],
        ["available", "Disponibles"],
      ].map(([value, label]) => {
        const active = inventoryFilter === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => setInventoryFilter(value)}
            aria-pressed={active}
            className={[
              "rounded-full px-3 py-2 text-xs font-semibold transition",
              active
                ? "bg-[var(--cupboard-primary)] text-white"
                : "border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] text-[var(--cupboard-text-muted)] hover:bg-[var(--cupboard-surface-muted)] hover:text-[var(--cupboard-text)]",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>

    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <label
        htmlFor="inventory-sort"
        className="text-sm font-semibold"
      >
        Ordenar por
      </label>

      <select
        id="inventory-sort"
        value={inventorySort}
        onChange={(event) => setInventorySort(event.target.value)}
        className="rounded-xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] px-4 py-2.5 text-sm font-medium text-[var(--cupboard-text)] outline-none transition focus:border-[var(--cupboard-primary)] focus:ring-2 focus:ring-[var(--cupboard-primary)]/20"
      >
        <option value="name">Nombre A-Z</option>
        <option value="recent">Más recientes</option>
        <option value="low-stock">Menor stock</option>
        <option value="high-stock">Mayor stock</option>
      </select>
    </div>
  </div>

                {products.length === 0 && (
  <div className="rounded-3xl border border-dashed border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] px-6 py-12 text-center shadow-[var(--cupboard-shadow-sm)]">
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--cupboard-primary-soft)] text-4xl">
      📦
    </div>

    <h3 className="mt-6 text-xl font-bold">
      Tu inventario está vacío
    </h3>

    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--cupboard-text-muted)]">
      Escanea tu primer producto para comenzar a organizar
      y controlar tu inventario.
    </p>

    <button
      type="button"
      onClick={() => setView("scanner")}
      className="mt-6 rounded-xl bg-[var(--cupboard-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--cupboard-primary-hover)]"
    >
      📷 Escanear producto
    </button>
  </div>
)}

                {products.length > 0 &&
  filteredProducts.length === 0 && (
    <div className="rounded-3xl border border-dashed border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] px-6 py-12 text-center shadow-[var(--cupboard-shadow-sm)]">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--cupboard-surface-muted)] text-4xl">
        🔎
      </div>

      <h3 className="mt-6 text-xl font-bold">
        No encontramos productos
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--cupboard-text-muted)]">
        {search.trim()
          ? `No hay productos que coincidan con "${search.trim()}".`
          : "No hay productos que coincidan con el filtro seleccionado."}
      </p>

      <button
        type="button"
        onClick={() => {
          setSearch("");
          setInventoryFilter("all");
        }}
        className="mt-6 rounded-xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] px-5 py-3 text-sm font-semibold transition hover:bg-[var(--cupboard-surface-muted)]"
      >
        Limpiar búsqueda y filtros
      </button>
    </div>
  )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((item) => {
                    const portions = Number(item.portions) || 0;

                    const isLow = portions <= 5;
                    const isWarning =
                      portions > 5 && portions <= 10;

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
  aria-label={`Abrir producto ${item.name || "sin nombre"}`}
  className={[
    "group rounded-2xl border bg-[var(--cupboard-surface)] p-4 shadow-[var(--cupboard-shadow-sm)] transition duration-200",
    "hover:-translate-y-0.5 hover:shadow-[var(--cupboard-shadow-md)] focus:outline-none focus:ring-2 focus:ring-[var(--cupboard-primary)]/30",
    portions === 0
      ? "border-[var(--cupboard-border)]"
      : portions <= 5
        ? "border-[var(--cupboard-danger)]/40"
        : portions <= 10
          ? "border-[var(--cupboard-warning)]/40"
          : "border-[var(--cupboard-success)]/30",
  ].join(" ")}
>
  <div className="flex items-start gap-3">
  {item.imageUrl ? (
  <img
    src={item.imageUrl}
    alt=""
    onError={(event) => {
      event.currentTarget.style.display = "none";
      event.currentTarget.nextElementSibling?.classList.remove("hidden");
    }}
    className="h-14 w-14 shrink-0 rounded-xl object-cover"
  />
) : null}

<div
  className={`${item.imageUrl ? "hidden " : ""}flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--cupboard-surface-muted)] text-2xl`}
  aria-hidden="true"
>
  📦
</div>

  <div className="min-w-0 flex-1">
    <h3 className="truncate text-base font-bold">
      {item.name || "Producto sin nombre"}
    </h3>

    <p className="mt-1 text-xs text-[var(--cupboard-text-muted)]">
      {item.weight || 0} g
    </p>

    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        openProduct(item);
      }}
      aria-label={`Ver producto ${item.name || "sin nombre"}`}
      className="mt-2 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--cupboard-primary)] transition hover:bg-[var(--cupboard-primary-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--cupboard-primary)]/30"
    >
      Ver producto →
    </button>
  </div>
</div>

  <div className="mt-5 flex items-end justify-between">
    <div>
      <p className="text-4xl font-bold leading-none">
        {portions}
      </p>

      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--cupboard-text-muted)]">
        porciones
      </p>
    </div>

    <div>
      {portions === 0 && (
        <span className="inline-flex rounded-full bg-[var(--cupboard-surface-muted)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--cupboard-text-muted)]">
          Agotado
        </span>
      )}

      {portions > 0 && portions <= 5 && (
        <span className="inline-flex rounded-full bg-red-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--cupboard-danger)]">
          Stock bajo
        </span>
      )}

      {portions > 5 && portions <= 10 && (
        <span className="inline-flex rounded-full bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--cupboard-warning)]">
          Atención
        </span>
      )}

      {portions > 10 && (
        <span className="inline-flex rounded-full bg-[var(--cupboard-primary-soft)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--cupboard-success)]">
          Disponible
        </span>
      )}
    </div>
  </div>

      {inventoryActionError?.productId === item.id && (
  <div
    role="alert"
    aria-live="assertive"
    className="mb-3 rounded-xl border border-[var(--cupboard-danger)]/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-[var(--cupboard-danger)]"
  >
    {inventoryActionError.message}
  </div>
)}

      {inventoryActionSuccess?.productId === item.id && (
        <div
          role="status"
          aria-live="polite"
          className="mb-3 rounded-xl border border-[var(--cupboard-success)]/30 bg-[var(--cupboard-success)]/10 px-3 py-2 text-xs font-medium text-[var(--cupboard-success)]"
        >
          {inventoryActionSuccess.message}
        </div>
      )}

    <div className="mt-5 grid grid-cols-2 gap-2">
        <button
            type="button"
            onClick={(event) => {
            event.stopPropagation();
            handleConsume(item);
            }}
            disabled={portions <= 0 || updatingProductId === item.id}
            aria-label={`Consumir una porción de ${item.name}`}
            aria-busy={updatingProductId === item.id}
            className="rounded-xl bg-[var(--cupboard-danger)]/10 px-3 py-2.5 text-sm font-bold text-[var(--cupboard-danger)] transition hover:bg-[var(--cupboard-danger)]/20 disabled:cursor-not-allowed disabled:opacity-30"
            >
            {updatingProductId === item.id ? "Guardando…" : "− 1"}
        </button>

        <button
            type="button"
            onClick={(event) => {
            event.stopPropagation();
            handleAdd(item);
            }}
            disabled={updatingProductId === item.id}
            aria-label={`Agregar una porción de ${item.name}`}
            aria-busy={updatingProductId === item.id}
            className="rounded-xl bg-[var(--cupboard-primary-soft)] px-3 py-2.5 text-sm font-bold text-[var(--cupboard-primary)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-30"
            >
            {updatingProductId === item.id ? "Guardando…" : "+ 1"}
        </button>
    </div>
</article>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {/* SCANNER */}
          {view === "scanner" && (
            <section className="space-y-6">
              <section className="overflow-hidden rounded-3xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] shadow-[var(--cupboard-shadow-md)]">
                <div className="border-b border-[var(--cupboard-border)] px-5 py-5 sm:px-6">
                  <p className="text-sm font-semibold text-[var(--cupboard-primary)]">
                    Scanner
                  </p>

                  <h2 className="mt-1 text-xl font-bold">
                    Registra un producto rápidamente
                  </h2>

                  <p className="mt-1 text-sm text-[var(--cupboard-text-muted)]">
                    Escanea un código de barras para buscar o registrar un
                    producto.
                  </p>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="overflow-hidden rounded-2xl border border-[var(--cupboard-border)] bg-black">
                    <BarcodeScanner
                      key={scanKey}
                      onScan={handleScan}
                    />
                  </div>

                    <div className="mb-4 rounded-xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] px-4 py-3">
                        <p className="text-sm font-semibold">
                          📷 Escanea un producto
                        </p>

                        <p className="mt-1 text-xs text-[var(--cupboard-text-muted)]">
                          Apunta la cámara hacia el código de barras para identificarlo.
                        </p>

                        <div className="mt-4 flex flex-col items-start gap-2 border-t border-[var(--cupboard-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs text-[var(--cupboard-text-muted)]">
                            ¿No puedes escanear el producto?
                          </p>

                          <button
                            type="button"
                            onClick={() => {
                              setIsManualEntry(true);
                              setBarcode("");
                              setStatus("");
                              setFormError("");
                              setIsEditing(true);
                            }}
                            className="rounded-xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--cupboard-text-muted)] transition hover:bg-[var(--cupboard-surface-muted)] hover:text-[var(--cupboard-text)] focus:outline-none focus:ring-2 focus:ring-[var(--cupboard-primary)]/30"
                          >
                            Agregar manualmente
                          </button>
                        </div>
                      </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--cupboard-text-muted)]">
                        Barcode
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {isLookingUp
                          ? "Buscando producto..."
                          : barcode
                            ? barcode
                            : "Esperando escaneo..."}                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setScanKey((previous) => previous + 1)
                      }
                      className="rounded-xl border border-[var(--cupboard-border)] px-4 py-3 text-sm font-medium text-[var(--cupboard-text-muted)] transition hover:bg-[var(--cupboard-surface-muted)] hover:text-[var(--cupboard-text)]"
                    >
                      ↻ Escanear nuevamente
                    </button>
                  </div>
                </div>
              </section>

{isLookingUp && (
  <div
    role="status"
    aria-live="polite"
    className="rounded-2xl border border-[var(--cupboard-primary)]/30 bg-[var(--cupboard-primary)]/10 px-4 py-4"
  >
    <p className="text-sm font-bold text-[var(--cupboard-primary)]">
      Buscando producto...
    </p>

    <p className="mt-1 text-xs text-[var(--cupboard-text-muted)]">
      Estamos consultando tu inventario.
    </p>
  </div>
)}

              {status && (
  <div
    role="status"
    className={`rounded-2xl border px-4 py-4 ${
      statusConfig[status]?.className ||
      "border-[var(--cupboard-border)]"
    }`}
  >
    <p className="text-sm font-bold">
      {status === "found" && "🟢 Producto encontrado"}

      {status === "new" && "🆕 Producto nuevo"}

      {status === "saved" && "✅ Producto guardado"}

      {status === "error" && "⚠️ No pudimos guardar el producto"}
    </p>

    <p className="mt-1 text-xs opacity-80">
      {statusConfig[status]?.label || status}
    </p>
  </div>
)}
          {status === "new" && barcode && (
  <div className="rounded-2xl border border-[var(--cupboard-warning)]/30 bg-amber-500/10 px-4 py-4">
    <p className="text-sm font-semibold text-[var(--cupboard-warning)]">
      Este código todavía no está registrado.
    </p>

    <p className="mt-1 text-xs text-[var(--cupboard-text-muted)]">
      Completa la información del producto para agregarlo a tu inventario.
    </p>
  </div>
)}
              {barcode && !isEditing && (
                <section className="rounded-3xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-5 shadow-[var(--cupboard-shadow-sm)] sm:p-6">
                  <div className="mb-5">
                    <p className="text-sm font-semibold text-[var(--cupboard-primary)]">
                      Producto
                    </p>

                    <h2 className="text-2xl font-bold">
                      {form.name || "Nuevo producto"}
                    </h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-[var(--cupboard-surface-muted)] p-4">
                      <p className="text-xs text-[var(--cupboard-text-muted)]">
                        Descripción
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {form.description || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[var(--cupboard-surface-muted)] p-4">
                      <p className="text-xs text-[var(--cupboard-text-muted)]">
                        Peso
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {form.weight || 0} g
                      </p>
                    </div>

                    <div className="rounded-xl bg-[var(--cupboard-surface-muted)] p-4">
                      <p className="text-xs text-[var(--cupboard-text-muted)]">
                        Porciones
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {form.portions || 0}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--cupboard-primary)] px-4 py-3 font-semibold text-white shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--cupboard-primary)]/30"
                  >
                    ✎ Editar producto
                  </button>
                </section>
              )}

              {isEditing && (
  <section className="rounded-3xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-5 shadow-[var(--cupboard-shadow-sm)] sm:p-6">
    <div className="mb-6">
      <p className="text-sm font-semibold text-[var(--cupboard-primary)]">
        Información del producto
      </p>

      <h2 className="mt-1 text-2xl font-bold">
        {form.name ? "Editar producto" : "Nuevo producto"}
      </h2>

      <p className="mt-2 text-sm text-[var(--cupboard-text-muted)]">
        Completa la información para mantener tu inventario actualizado.
      </p>
    </div>

    <div className="space-y-5">
      {/* Barcode */}
      <div>
        <label
            htmlFor="product-barcode"
            className="mb-2 block text-sm font-semibold"
          >
            {isManualEntry ? "Código del producto" : "Código de barras"}
          </label>

              <input
                  id="product-barcode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={barcode}
                  onChange={(event) => {
                    if (isManualEntry) {
                      setBarcode(event.target.value);
                    }
                  }}
                  readOnly={!isManualEntry}
                  placeholder={
                    isManualEntry
                      ? "Ej. 123456789"
                      : undefined
                  }
                  className={[
                    "w-full rounded-xl border border-[var(--cupboard-border)] px-4 py-3 font-mono text-sm outline-none transition",
                    isManualEntry
                      ? "bg-[var(--cupboard-surface)] focus:border-[var(--cupboard-primary)] focus:ring-2 focus:ring-[var(--cupboard-primary)]/20"
                      : "cursor-not-allowed bg-[var(--cupboard-surface-muted)] text-[var(--cupboard-text-muted)]",
                  ].join(" ")}
                />

            <p className="mt-1.5 text-xs text-[var(--cupboard-text-muted)]">
              {isManualEntry
                ? "Escribe el número que identifica este producto."
                : "El código de barras identifica este producto y no puede modificarse."}
            </p>
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor="product-name"
          className="mb-2 block text-sm font-semibold"
        >
          Nombre
        </label>

        <input
  id="product-name"
  ref={nameInputRef}
  name="name"
  type="text"
  placeholder="Ej. Leche entera"
  value={form.name}
  onChange={handleChange}
  autoFocus
  aria-invalid={formError === "El nombre del producto es obligatorio."}
  aria-describedby={
    formError === "El nombre del producto es obligatorio."
      ? "product-form-error"
      : undefined
  }
  className={[
    "w-full rounded-xl border bg-[var(--cupboard-surface-muted)] px-4 py-3 text-sm outline-none transition",
    "placeholder:text-[var(--cupboard-text-muted)]",
    formError === "El nombre del producto es obligatorio."
      ? "border-[var(--cupboard-danger)] focus:border-[var(--cupboard-danger)] focus:ring-2 focus:ring-[var(--cupboard-danger)]/20"
      : "border-[var(--cupboard-border)] focus:border-[var(--cupboard-primary)] focus:ring-2 focus:ring-[var(--cupboard-primary)]/20",
  ].join(" ")}
/>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="product-description"
          className="mb-2 block text-sm font-semibold"
        >
          Descripción
        </label>

        <textarea
          id="product-description"
          name="description"
          rows="3"
          placeholder="Describe brevemente el producto..."
          value={form.description}
          onChange={handleChange}
          className="w-full resize-none rounded-xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--cupboard-text-muted)] focus:border-[var(--cupboard-primary)] focus:ring-2 focus:ring-[var(--cupboard-primary)]/20"
        />
      </div>

      {/* Weight + Portions */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="product-weight"
            className="mb-2 block text-sm font-semibold"
          >
            Peso
          </label>

          <div className="relative">
            <input
              id="product-weight"
              ref={weightInputRef}
              aria-invalid={
                  formError === "El peso debe ser un número igual o mayor que 0."
                }
                aria-describedby={
                  formError === "El peso debe ser un número igual o mayor que 0."
                    ? "product-form-error"
                    : undefined
                }
              name="weight"
              type="number"
              min="0"
              placeholder="0"
              value={form.weight}
              onChange={handleChange}
              className={[
  "w-full rounded-xl border bg-[var(--cupboard-surface-muted)] px-4 py-3 pr-12 text-sm outline-none transition",
  "placeholder:text-[var(--cupboard-text-muted)]",
  formError === "El peso debe ser un número igual o mayor que 0."
    ? "border-[var(--cupboard-danger)] focus:border-[var(--cupboard-danger)] focus:ring-2 focus:ring-[var(--cupboard-danger)]/20"
    : "border-[var(--cupboard-border)] focus:border-[var(--cupboard-primary)] focus:ring-2 focus:ring-[var(--cupboard-primary)]/20",
].join(" ")}
            />

            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-medium text-[var(--cupboard-text-muted)]">
              g
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="product-portions"
            className="mb-2 block text-sm font-semibold"
          >
            Porciones
          </label>

          <input
            id="product-portions"
            ref={portionsInputRef}
            aria-invalid={
  formError === "Las porciones deben ser un número igual o mayor que 0."
}
aria-describedby={
  formError === "Las porciones deben ser un número igual o mayor que 0."
    ? "product-form-error"
    : undefined
}
            name="portions"
            type="number"
            min="0"
            placeholder="0"
            value={form.portions}
            onChange={handleChange}
            className={[
  "w-full rounded-xl border bg-[var(--cupboard-surface-muted)] px-4 py-3 text-sm outline-none transition",
  "placeholder:text-[var(--cupboard-text-muted)]",
  formError === "Las porciones deben ser un número igual o mayor que 0."
    ? "border-[var(--cupboard-danger)] focus:border-[var(--cupboard-danger)] focus:ring-2 focus:ring-[var(--cupboard-danger)]/20"
    : "border-[var(--cupboard-border)] focus:border-[var(--cupboard-primary)] focus:ring-2 focus:ring-[var(--cupboard-primary)]/20",
].join(" ")}
          />
        </div>
      </div>

      {/* Image */}
      <div>
        <label
          htmlFor="product-image"
          className="mb-2 block text-sm font-semibold"
        >
          Imagen
          <span className="ml-2 text-xs font-normal text-[var(--cupboard-text-muted)]">
            Opcional
          </span>
        </label>

        <input
          id="product-image"
          name="imageUrl"
          type="url"
          placeholder="https://..."
          value={form.imageUrl}
          onChange={handleChange}
          className="w-full rounded-xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--cupboard-text-muted)] focus:border-[var(--cupboard-primary)] focus:ring-2 focus:ring-[var(--cupboard-primary)]/20"
        />
        {form.imageUrl && (
  <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] p-3">
    <p className="mb-2 text-xs font-semibold text-[var(--cupboard-text-muted)]">
      Vista previa
    </p>

    <div className="flex min-h-40 items-center justify-center rounded-xl bg-[var(--cupboard-surface)] p-4">
      <img
        src={form.imageUrl}
        alt="Vista previa del producto"
        onError={(event) => {
          event.currentTarget.style.display = "none";
          event.currentTarget.nextElementSibling?.classList.remove("hidden");
        }}
        className="max-h-40 max-w-full rounded-xl object-contain"
      />

      <div
        className="hidden flex-col items-center justify-center text-center"
        aria-hidden="true"
      >
        <span className="text-4xl">📦</span>
        <span className="mt-2 text-xs text-[var(--cupboard-text-muted)]">
          Imagen no disponible
        </span>
      </div>
    </div>
  </div>
)}
      </div>
    </div>

                {formError && (
  <div
    id="product-form-error"
    role="alert"
    aria-live="assertive"
    className="mt-6 rounded-xl border border-[var(--cupboard-danger)]/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-[var(--cupboard-danger)]"
  >
    {formError}
  </div>
)}

    {/* Form actions */}
    <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[var(--cupboard-border)] pt-6 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={() => {
      if (isManualEntry) {
        setBarcode("");
        setStatus("");
        setFormError("");
        setIsEditing(false);
        setIsManualEntry(false);
        setScanKey((previous) => previous + 1);
        return;
      }

      setIsEditing(false);
    }}
        className="rounded-xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] px-5 py-3 text-sm font-semibold text-[var(--cupboard-text-muted)] transition hover:bg-[var(--cupboard-surface-muted)] hover:text-[var(--cupboard-text)]"
      >
        Cancelar
      </button>

      <button
        type="button"
        onClick={handleSave}
        disabled={!barcode || isSaving}
        className="rounded-xl bg-[var(--cupboard-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--cupboard-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSaving ? "Guardando..." : "Guardar producto"}
      </button>
    </div>
  </section>
)}

              {!isEditing && (
  <div className="grid gap-3 sm:grid-cols-2">
    <button
  type="button"
  onClick={handleSave}
  disabled={!barcode || isSaving}
  className="rounded-2xl bg-[var(--cupboard-primary)] px-5 py-4 font-semibold text-white shadow-[var(--cupboard-shadow-md)] transition hover:bg-[var(--cupboard-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40"
>
  {isSaving ? "Guardando..." : "Guardar producto"}
</button>

    <button
      type="button"
      onClick={() => {
  setBarcode("");
  setStatus("");
  setFormError("");
  setIsEditing(false);
  setIsManualEntry(false);
  setScanKey((previous) => previous + 1);
}}
      className="rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] px-5 py-4 font-semibold transition hover:bg-[var(--cupboard-surface-muted)]"
    >
      Escanear otro
    </button>
  </div>
)}
            </section>
          )}

          {/* SETTINGS */}
          {view === "settings" && (
            <section className="max-w-3xl space-y-6">
              <div className="rounded-3xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-6 shadow-[var(--cupboard-shadow-sm)]">
                <p className="text-sm font-semibold text-[var(--cupboard-primary)]">
                  Apariencia
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Tema de Cupboard
                </h2>

                <p className="mt-2 text-sm text-[var(--cupboard-text-muted)]">
                  Elige cómo quieres que se vea la aplicación.
                </p>

                <div className="mt-5 flex w-fit flex-wrap gap-2 rounded-xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] p-1">
                  <ThemeButton
                    value="light"
                    current={theme}
                    onClick={setTheme}
                  >
                    ☀️ Light
                  </ThemeButton>

                  <ThemeButton
                    value="dark"
                    current={theme}
                    onClick={setTheme}
                  >
                    🌙 Dark
                  </ThemeButton>

                  <ThemeButton
                    value="system"
                    current={theme}
                    onClick={setTheme}
                  >
                    ⚙️ System
                  </ThemeButton>
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-6 shadow-[var(--cupboard-shadow-sm)]">
                <p className="text-sm font-semibold text-[var(--cupboard-primary)]">
                  Cupboard
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Inventory Control
                </h2>

                <p className="mt-2 text-sm leading-6 text-[var(--cupboard-text-muted)]">
                  Aplicación de gestión de inventario diseñada para
                  organizar productos, controlar cantidades y facilitar
                  el seguimiento del stock.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--cupboard-primary-soft)] px-3 py-1.5 text-xs font-medium text-[var(--cupboard-primary)]">
                    React
                  </span>

                  <span className="rounded-full bg-[var(--cupboard-primary-soft)] px-3 py-1.5 text-xs font-medium text-[var(--cupboard-primary)]">
                    Vite
                  </span>

                  <span className="rounded-full bg-[var(--cupboard-primary-soft)] px-3 py-1.5 text-xs font-medium text-[var(--cupboard-primary)]">
                    Firebase
                  </span>

                  <span className="rounded-full bg-[var(--cupboard-primary-soft)] px-3 py-1.5 text-xs font-medium text-[var(--cupboard-primary)]">
                    PWA
                  </span>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Navegación móvil"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--cupboard-border)] bg-[var(--cupboard-surface)]/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-center gap-1">
          <MobileNavigationButton
            icon="📦"
            label="Inventario"
            active={view === "inventory"}
            onClick={() => setView("inventory")}
          />

          <MobileNavigationButton
            icon="📷"
            label="Scanner"
            active={view === "scanner"}
            onClick={() => setView("scanner")}
          />

          <MobileNavigationButton
            icon="⚙️"
            label="Ajustes"
            active={view === "settings"}
            onClick={() => setView("settings")}
          />
        </div>
      </nav>
    </div>
  );
}