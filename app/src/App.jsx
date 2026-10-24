import { useEffect, useRef, useState } from "react";
import WorkspacePanel from "./components/WorkspacePanel";
import InventoryView from "./components/InventoryView";
import ScannerView from "./components/ScannerView";
import useInventorySubscription from "./hooks/useInventorySubscription";
import useCupboardSettings from "./hooks/useCupboardSettings";
import SettingsPanel from "./components/SettingsPanel";
import ProductDetail from "./components/ProductDetail";
import {
  getProduct,
  findProductByBarcode,
  saveProduct,
  updatePortions,
} from "./services/products";
import { auth } from "./services/auth";
import { getActiveWorkspaceId, setActiveWorkspaceId } from "./services/workspaces";
import { getActiveHouseholdId, getHousehold, getHouseholdMembers, getUserProfile } from "./services/households";
import {
  getSaveErrorMessage,
  getSaveErrorState,
} from "./services/regressionContracts";

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


function ConnectionStatus({ status, compact = false }) {
  const config = {
    connected: {
      icon: "🟢",
      title: "Inventario conectado",
      description: "Firestore disponible",
      badge: "ACTIVO",
      color: "var(--cupboard-success)",
      soft: "var(--cupboard-primary-soft)",
    },
    offline: {
      icon: "🟡",
      title: "Sin conexión",
      description: "Mostrando datos disponibles",
      badge: "SIN CONEXIÓN",
      color: "var(--cupboard-warning)",
      soft: "rgb(213 162 77 / 0.10)",
    },
    syncing: {
      icon: "🔵",
      title: "Sincronizando",
      description: "Guardando cambios pendientes",
      badge: "SINCRONIZANDO",
      color: "var(--cupboard-info)",
      soft: "rgb(118 152 184 / 0.10)",
    },
    error: {
      icon: "🔴",
      title: "No se pudo conectar",
      description: "Revisa tu conexión",
      badge: "ERROR",
      color: "var(--cupboard-danger)",
      soft: "rgb(213 107 94 / 0.10)",
    },
    connecting: {
      icon: "🟡",
      title: "Conectando con Firestore",
      description: "Comprobando disponibilidad",
      badge: "CONECTANDO",
      color: "var(--cupboard-warning)",
      soft: "rgb(213 162 77 / 0.10)",
    },
  };

  const current = config[status] || config.connecting;

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] px-3 py-2.5"
        title={current.description}
      >
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: current.color }}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-[var(--cupboard-text-muted)]">
            {current.title}
          </p>
          <p className="truncate text-[10px] text-[var(--cupboard-text-subtle)]">
            {current.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[var(--cupboard-border)] bg-[linear-gradient(145deg,var(--cupboard-surface-muted),var(--cupboard-surface))] p-4 shadow-[var(--cupboard-shadow-sm)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--cupboard-text-subtle)]">
            Estado
          </p>
          <p className="mt-1 text-sm font-semibold">{current.title}</p>
        </div>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl text-base"
          style={{ backgroundColor: current.soft }}
          aria-hidden="true"
        >
          {current.icon}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--cupboard-border)] pt-3">
        <span className="text-[10px] font-medium text-[var(--cupboard-text-subtle)]">
          {current.description}
        </span>
        <span
          className="text-[10px] font-bold"
          style={{ color: current.color }}
        >
          {current.badge}
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("inventory");
  const [workspaceId, setWorkspaceId] = useState(getActiveWorkspaceId);
  const [allowedWorkspaces, setAllowedWorkspaces] = useState([]);
  const [workspaceAccessReady, setWorkspaceAccessReady] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const user = auth.currentUser;
    const householdId = getActiveHouseholdId();
    if (!user || !householdId) {
      setAllowedWorkspaces([]);
      setWorkspaceAccessReady(true);
      return undefined;
    }

    Promise.all([
      getUserProfile(user.uid),
      getHousehold(householdId),
      getHouseholdMembers(householdId),
    ]).then(([profile, household, members]) => {
      if (cancelled) return;
      const owner = household?.ownerUid === user.uid;
      const membership = members.find((member) => member.id === user.uid);
      const assigned = Array.isArray(membership?.workspaces) ? membership.workspaces : [];
      const nextAllowed = owner ? ["home", "sandwichies"] : assigned.filter((item) => ["home", "sandwichies"].includes(item));
      setAllowedWorkspaces(nextAllowed);
      if (nextAllowed.length && !nextAllowed.includes(getActiveWorkspaceId())) {
        setActiveWorkspaceId(nextAllowed[0]);
        window.location.reload();
      }
      setWorkspaceAccessReady(true);
    }).catch((error) => {
      console.error("No se pudieron cargar los permisos de espacios:", error);
      if (!cancelled) {
        setAllowedWorkspaces([]);
        setWorkspaceAccessReady(true);
      }
    });

    return () => { cancelled = true; };
  }, []);

  const { settings, updateSetting } = useCupboardSettings();

  const [barcode, setBarcode] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    weight: "",
    portions: "",
    unit: "porciones",
    imageUrl: "",
    category: "",
    expiryDate: "",
    minStock: settings.minStockDefault,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [status, setStatus] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [inventoryActionError, setInventoryActionError] = useState(null);
  const [inventoryActionSuccess, setInventoryActionSuccess] = useState(null);
  const [scannerRestart, setScannerRestart] = useState(0);
  const [isManualEntry, setIsManualEntry] = useState(false);

  const {
    products,
    isLoadingProducts,
    connectionStatus,
    userRole,
    canWriteInventory,
    roleKnown,
    updateProductLocally,
  } = useInventorySubscription();


  const openProduct = (item) => {
  setInventoryActionError(null);
  setInventoryActionSuccess(null);
  setSelectedProduct(item);
};


  const updateProductPortionsOptimistically = async (item, newPortions) => {
    if (updatingProductId === item.id) return;

    const previousPortions = Number(item.portions) || 0;

    setUpdatingProductId(item.id);
    setInventoryActionError(null);
    setInventoryActionSuccess(null);

    updateProductLocally(item.id, newPortions);

    setSelectedProduct((current) =>
      current?.id === item.id
        ? { ...current, portions: newPortions }
        : current,
    );

    try {
      await updatePortions(item.id, newPortions, {
type: newPortions < previousPortions ? "consume" : "add",
quantity: Math.abs(newPortions - previousPortions),
reason: newPortions < previousPortions ? "Consumo desde inventario" : "Entrada desde inventario",
userId: auth.currentUser?.uid || null,
});

      setInventoryActionSuccess({
        productId: item.id,
        message: `Porciones actualizadas: ${newPortions}`,
      });
    } catch (error) {
      console.error("Error actualizando porciones:", error);

      updateProductLocally(item.id, previousPortions);

      setSelectedProduct((current) =>
        current?.id === item.id
          ? { ...current, portions: previousPortions }
          : current,
      );

      setInventoryActionError({
        productId: item.id,
        message: "No pudimos actualizar las porciones. Inténtalo nuevamente.",
      });
    } finally {
      setUpdatingProductId(null);
    }
  };

  const handleConsume = async (item) => {
    const portions = Number(item.portions) || 0;
    if (portions <= 0) return;

    await updateProductPortionsOptimistically(item, portions - 1);
  };

  const handleAdd = async (item) => {
    const portions = Number(item.portions) || 0;
    await updateProductPortionsOptimistically(item, portions + 1);
  };

  const handleScan = async (code) => {
  setBarcode(code);
  setIsEditing(false);
  setFormError("");
  setIsLookingUp(true);

  try {
    const result = await findProductByBarcode(code);

    if (result.source === "inventory") {
      const product = result.product;
      setStatus("found");

      setForm({
        name: product.name || "",
        description: product.description || "",
        weight: product.weight || "",
        portions: product.portions || "",
        unit: product.unit || "porciones",
        imageUrl: product.imageUrl || "",
        category: product.category || "",
        expiryDate: product.expiryDate || "",
        minStock: product.minStock ?? 5,
      });
    } else if (result.source === "catalog") {
      const product = result.product;
      setStatus("catalog");

      setForm({
        name: product.name || "",
        description: product.description || "",
        weight: product.weight || "",
        portions: 0,
        unit: "porciones",
        imageUrl: product.imageUrl || "",
        category: product.category || "",
        expiryDate: "",
        minStock: settings.minStockDefault,
      });
    } else {
      setStatus("new");

      setForm({
        name: "",
        description: "",
        weight: "",
        portions: "",
        unit: "porciones",
        imageUrl: "",
        category: "",
        expiryDate: "",
        minStock: settings.minStockDefault,
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

  const handleCancelEdit = () => {
    if (isManualEntry) {
      setBarcode("");
      setStatus("");
      setFormError("");
      setIsEditing(false);
      setIsManualEntry(false);
      setScannerRestart((previous) => previous + 1);
      return;
    }

    setIsEditing(false);
  };

  const handleSave = async () => {
  setFormError("");
  setStatus("");

  if (!canWriteInventory) {
    setSaveState("permission");
    setStatus("permission");
    setFormError("Tu rol actual es de solo lectura. Un editor o propietario debe agregar o editar productos.");
    return;
  }

  setSaveState("validating");

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
  setSaveState("saving");

  try {
    await saveProduct(
      productCode,
      {
        ...form,
        name,
        weight: weightValue ?? 0,
        portions: portionsValue,
        category: form.category,
        expiryDate: form.expiryDate,
        minStock: form.minStock,
      },
      (status === "new" || status === "catalog") && portionsValue > 0
        ? {
            type: "add",
            quantity: portionsValue,
            reason:
              status === "catalog"
                ? "Agregado desde catálogo"
                : "Registro de producto",
            userId: auth.currentUser?.uid || null,
          }
        : null,
    );
  } catch (error) {
    console.error("Error guardando producto:", error);
    const nextSaveState = getSaveErrorState(error?.code);
    const saveErrorMessage = getSaveErrorMessage(error?.code);

    setSaveState(nextSaveState);
    setStatus(nextSaveState === "permission" ? "permission" : "error");
    setFormError(
      saveErrorMessage,
    );
    return;
  } finally {
    setIsSaving(false);
  }

  setSaveState("saved");
  setStatus("saved");
  setFormError("");
  setBarcode("");

  setForm({
    name: "",
    description: "",
    weight: "",
    portions: "",
    unit: "porciones",
    imageUrl: "",
    category: "",
    expiryDate: "",
    minStock: settings.minStockDefault,
  });

  setSaveState("idle");
  setIsEditing(false);
  setIsManualEntry(false);
  setScannerRestart((previous) => previous + 1);

  // La suscripción del inventario actualiza la lista cuando Firestore confirma el cambio.
  // Evitamos una segunda lectura que podía competir con el guardado en dispositivos lentos.
  setView("inventory");
};
  const pageTitle = {
    inventory: "Tu inventario",
    scanner: "Scanner",
    workspace: "Centro",
    settings: "Ajustes",
  };

  const pageDescription = {
    inventory:
      "Controla tus productos, cantidades y existencias desde un solo lugar.",
    scanner:
      "Escanea un producto conocido o registra uno nuevo para tu alacena.",
    workspace:
      "Caducidad, historial, compras, recetas, analítica, catálogo y equipo.",
    settings:
      "Personaliza Cupboard según tus preferencias.",
  };

  return (
    <div className="cupboard-retro min-h-screen bg-[var(--cupboard-bg)] text-[var(--cupboard-text)]">
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
              <NavigationButton icon="✨" label="Centro" badge="Funciones" active={view === "workspace"} onClick={() => setView("workspace")} />
              <NavigationButton icon="⚙️" label="Ajustes" badge="Preferencias" active={view === "settings"} onClick={() => setView("settings")} />
            </nav>
          </div>

          <div className="mt-auto">
            <ConnectionStatus status={connectionStatus} />
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

              <div className="flex shrink-0 items-center gap-2">
                <label className="sr-only" htmlFor="cupboard-workspace">Espacio de inventario</label>
                {workspaceAccessReady && allowedWorkspaces.length > 0 && (
                  <select id="cupboard-workspace" value={workspaceId}
                    onChange={(event) => {
                      const nextWorkspace = event.target.value;
                      setActiveWorkspaceId(nextWorkspace);
                      setWorkspaceId(nextWorkspace);
                      window.location.reload();
                    }}
                    className="max-w-[155px] rounded-xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] px-2 py-2.5 text-xs font-bold text-[var(--cupboard-text)] sm:max-w-none sm:px-3">
                    {allowedWorkspaces.includes("home") && <option value="home">🏠 Hogar</option>}
                    {allowedWorkspaces.includes("sandwichies") && <option value="sandwichies">🥪 Negocio · Sandwichies</option>}
                  </select>
                )}
                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <ConnectionStatus status={connectionStatus} compact />
                <button type="button" onClick={() => setView("scanner")} className="rounded-2xl bg-[var(--cupboard-primary)] px-4 py-2.5 text-xs font-bold text-[#10140d] shadow-[0_8px_20px_rgb(120_168_91_/_0.14)] transition hover:-translate-y-0.5 hover:bg-[var(--cupboard-primary-hover)]">
                  + Escanear
                </button>
                </div>
              </div>
            </header>

            <div className="mb-5 sm:hidden">
              <ConnectionStatus status={connectionStatus} />
            </div>

            {view === "workspace" && !selectedProduct && <WorkspacePanel />}

            {selectedProduct && (
              <ProductDetail
                product={selectedProduct}
                canWriteInventory={canWriteInventory}
                updatingProductId={updatingProductId}
                onConsume={handleConsume}
                onAdd={handleAdd}
                onBack={() => setSelectedProduct(null)}
                onEdit={(product) => {
                  setBarcode(product.id || "");
                  setForm({
                    name: product.name || "",
                    description: product.description || "",
                    weight: product.weight || "",
                    portions: product.portions ?? "",
                    unit: product.unit || "porciones",
                    imageUrl: product.imageUrl || "",
                    category: product.category || "",
                    expiryDate: product.expiryDate || "",
                    minStock: product.minStock ?? 5,
                  });
                  setIsEditing(true);
                  setIsManualEntry(false);
                  setView("scanner");
                  setSelectedProduct(null);
                }}
              />
            )}

            {view === "inventory" && !selectedProduct && (
              <InventoryView
                products={products}
                isLoadingProducts={isLoadingProducts}
                onOpenProduct={openProduct}
                onConsume={handleConsume}
                onAdd={handleAdd}
                canWriteInventory={canWriteInventory}
                updatingProductId={updatingProductId}
                inventoryActionError={inventoryActionError}
                inventoryActionSuccess={inventoryActionSuccess}
                onAddProduct={() => setView("scanner")}
                initialSort={settings.inventorySort}
                initialFilter={settings.inventoryFilter}
              />
            )}

            {view === "scanner" && (
              <ScannerView
                onScan={handleScan}
                scannerRestart={scannerRestart}
                barcode={barcode}
                isLookingUp={isLookingUp}
                onStartManualEntry={() => {
                  setIsManualEntry(true);
                  setBarcode("");
                  setStatus("");
                  setFormError("");
                  setIsEditing(true);
                }}
                onRestartScanner={() => setScannerRestart((previous) => previous + 1)}
                roleKnown={roleKnown}
                userRole={userRole}
                status={status}
                form={form}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                isManualEntry={isManualEntry}
                setBarcode={setBarcode}
                formError={formError}
                isSaving={isSaving}
                saveState={saveState}
                canWriteInventory={canWriteInventory}
                handleChange={handleChange}
                handleSave={handleSave}
                handleCancelEdit={handleCancelEdit}
                nameInputRef={nameInputRef}
                weightInputRef={weightInputRef}
                portionsInputRef={portionsInputRef}
              />
            )}

            {view === "settings" && (
              <SettingsPanel
                settings={settings}
                updateSetting={updateSetting}
              />
            )}
          </div>
        </main>
      </div>

      <nav aria-label="Navegación móvil" className="fixed inset-x-3 bottom-3 z-50 rounded-3xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)]/95 p-1.5 shadow-[0_20px_50px_rgb(0_0_0_/_0.42)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-1">
          <MobileNavigationButton icon="📦" label="Inventario" active={view === "inventory"} onClick={() => setView("inventory")} />
          <MobileNavigationButton icon="📷" label="Scanner" active={view === "scanner"} onClick={() => setView("scanner")} />
          <MobileNavigationButton icon="✨" label="Centro" active={view === "workspace"} onClick={() => setView("workspace")} />
          <MobileNavigationButton icon="⚙️" label="Ajustes" active={view === "settings"} onClick={() => setView("settings")} />
        </div>
      </nav>
    </div>
  );
}