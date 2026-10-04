import { useEffect, useMemo, useState } from "react";
import {
  createFeatureItem,
  deleteFeatureItem,
  lookupProductByBarcode,
  subscribeFeature,
  updateFeatureItem,
} from "../services/features";
import { createInvite, getActiveHouseholdId, getHousehold, getUserProfile } from "../services/households";
import { getAllProducts, saveProduct } from "../services/products";
import { auth, logout } from "../services/auth";

const tabs = [
  ["expiry", "⏳", "Caducidad"],
  ["history", "↔", "Movimientos"],
  ["shopping", "🛒", "Compras"],
  ["recipes", "🍳", "Recetas"],
  ["analytics", "📊", "Analítica"],
  ["catalog", "🔎", "Catálogo"],
  ["team", "👥", "Equipo"],
];

function PanelCard({ children, className = "" }) {
  return (
    <section className={["rounded-[2rem] border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-5 shadow-[var(--cupboard-shadow-sm)] animate-cupboard-enter", className].join(" ")}>
      {children}
    </section>
  );
}

function SmallInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-3 py-2.5 text-sm outline-none transition duration-300 focus:border-[var(--cupboard-primary)] focus:ring-4 focus:ring-[var(--cupboard-primary)]/10"
    />
  );
}

export default function WorkspacePanel() {
  const [tab, setTab] = useState("expiry");
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [shopping, setShopping] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [household, setHousehold] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [shoppingText, setShoppingText] = useState("");
  const [recipeName, setRecipeName] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [catalogBarcode, setCatalogBarcode] = useState("");
  const [catalogResult, setCatalogResult] = useState(null);

  const householdId = getActiveHouseholdId();

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getAllProducts(),
      auth.currentUser ? getUserProfile(auth.currentUser.uid) : null,
      householdId ? getHousehold(householdId) : null,
    ]).then(([nextProducts, nextProfile, nextHousehold]) => {
      if (cancelled) return;
      setProducts(nextProducts);
      setProfile(nextProfile);
      setHousehold(nextHousehold);
    }).catch((err) => {
      console.error(err);
      setError("No pudimos cargar el centro de operaciones.");
    });

    const cleanups = [
      subscribeFeature("movements", setMovements, (err) => console.error(err), "createdAt"),
      subscribeFeature("shoppingItems", setShopping, (err) => console.error(err), "updatedAt"),
      subscribeFeature("recipes", setRecipes, (err) => console.error(err), "updatedAt"),
    ];

    return () => {
      cancelled = true;
      cleanups.forEach((cleanup) => cleanup?.());
    };
  }, [householdId]);

  const expiryBuckets = useMemo(() => {
    const today = new Date();
    const week = new Date();
    week.setDate(today.getDate() + 7);

    return {
      expired: products.filter((item) => item.expiryDate && new Date(item.expiryDate) < today),
      soon: products.filter((item) => item.expiryDate && new Date(item.expiryDate) >= today && new Date(item.expiryDate) <= week),
      tracked: products.filter((item) => item.expiryDate),
    };
  }, [products]);

  const analytics = useMemo(() => {
    const consumed = movements
      .filter((item) => item.type === "consume")
      .reduce((total, item) => total + (Number(item.quantity) || 0), 0);
    const added = movements
      .filter((item) => item.type === "add")
      .reduce((total, item) => total + (Number(item.quantity) || 0), 0);

    return {
      consumed,
      added,
      activeProducts: products.length,
      lowStock: products.filter((item) => (Number(item.portions) || 0) <= (Number(item.minStock) || 5)).length,
      shoppingOpen: shopping.filter((item) => !item.completed).length,
    };
  }, [movements, products, shopping]);

  const addShoppingItem = async (event) => {
    event.preventDefault();
    if (!shoppingText.trim()) return;

    await createFeatureItem("shoppingItems", {
      name: shoppingText.trim(),
      completed: false,
      priority: "normal",
    });

    setShoppingText("");
  };

  const toggleShopping = async (item) => {
    await updateFeatureItem("shoppingItems", item.id, {
      completed: !item.completed,
    });
  };

  const addRecipe = async (event) => {
    event.preventDefault();
    if (!recipeName.trim()) return;

    await createFeatureItem("recipes", {
      name: recipeName.trim(),
      description: recipeDescription.trim(),
      ingredients: [],
      steps: [],
    });

    setRecipeName("");
    setRecipeDescription("");
  };

  const lookupCatalog = async (event) => {
    event.preventDefault();
    setBusy(true);
    setCatalogResult(null);
    setError("");

    try {
      const result = await lookupProductByBarcode(catalogBarcode);
      setCatalogResult(result || { notFound: true });
    } catch (err) {
      setError("El catálogo externo no respondió.");
    } finally {
      setBusy(false);
    }
  };

  const saveCatalogProduct = async () => {
    if (!catalogResult || catalogResult.notFound || !catalogBarcode) return;

    await saveProduct(catalogBarcode, {
      name: catalogResult.name,
      description: catalogResult.description,
      imageUrl: catalogResult.imageUrl,
      category: catalogResult.category,
      portions: 0,
      weight: 0,
    });

    setProducts(await getAllProducts());
    setCatalogResult(null);
  };

  const createHouseholdInvite = async () => {
    if (!householdId) return;
    setBusy(true);

    try {
      setInviteCode(await createInvite(householdId, "editor"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2">
          {tabs.map(([id, icon, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={[
                "rounded-2xl border px-4 py-3 text-xs font-bold transition duration-300",
                tab === id
                  ? "border-[var(--cupboard-primary)]/30 bg-[var(--cupboard-primary-soft)] text-[var(--cupboard-primary)] shadow-[0_8px_24px_rgb(120_168_91_/_0.08)]"
                  : "border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] text-[var(--cupboard-text-muted)] hover:-translate-y-0.5 hover:text-[var(--cupboard-text)]",
              ].join(" ")}
            >
              <span className="mr-1.5">{icon}</span>{label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-[var(--cupboard-danger)]/25 bg-[var(--cupboard-danger)]/10 px-4 py-3 text-sm text-[var(--cupboard-danger)]">
          {error}
        </div>
      )}

      {tab === "expiry" && (
        <PanelCard>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-warning)]">Caducidad</p>
          <h2 className="mt-2 text-2xl font-extrabold">Que nada se quede atrás.</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Vencidos", expiryBuckets.expired.length, "text-[var(--cupboard-danger)]"],
              ["Próximos 7 días", expiryBuckets.soon.length, "text-[var(--cupboard-warning)]"],
              ["Con fecha", expiryBuckets.tracked.length, "text-[var(--cupboard-success)]"],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-2xl bg-[var(--cupboard-surface-muted)] p-5">
                <p className="text-xs text-[var(--cupboard-text-muted)]">{label}</p>
                <p className={["mt-2 text-4xl font-extrabold", color].join(" ")}>{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2">
            {[...expiryBuckets.expired, ...expiryBuckets.soon].slice(0, 8).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl bg-[var(--cupboard-bg)] px-4 py-3">
                <div>
                  <p className="text-sm font-bold">{item.name}</p>
                  <p className="text-xs text-[var(--cupboard-text-muted)]">{item.expiryDate}</p>
                </div>
                <span className="text-xs font-bold text-[var(--cupboard-warning)]">{item.portions} porciones</span>
              </div>
            ))}
          </div>
        </PanelCard>
      )}

      {tab === "history" && (
        <PanelCard>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-info)]">Historial</p>
          <h2 className="mt-2 text-2xl font-extrabold">Todo movimiento deja rastro.</h2>
          <div className="mt-6 space-y-2">
            {movements.length === 0 && <p className="text-sm text-[var(--cupboard-text-muted)]">Todavía no hay movimientos registrados.</p>}
            {movements.slice(0, 30).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl bg-[var(--cupboard-bg)] px-4 py-3">
                <div>
                  <p className="text-sm font-bold">{item.type === "consume" ? "Consumo" : "Entrada"}</p>
                  <p className="text-xs text-[var(--cupboard-text-muted)]">{item.reason || item.productId}</p>
                </div>
                <span className="font-mono text-sm font-bold">{item.quantity}</span>
              </div>
            ))}
          </div>
        </PanelCard>
      )}

      {tab === "shopping" && (
        <PanelCard>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-primary)]">Compras</p>
          <h2 className="mt-2 text-2xl font-extrabold">La próxima compra, lista.</h2>
          <form onSubmit={addShoppingItem} className="mt-6 flex gap-2">
            <SmallInput value={shoppingText} onChange={(event) => setShoppingText(event.target.value)} placeholder="Ej. Leche" />
            <button className="rounded-xl bg-[var(--cupboard-primary)] px-4 text-xs font-extrabold text-[#10140d]">Añadir</button>
          </form>
          <div className="mt-5 space-y-2">
            {shopping.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-[var(--cupboard-bg)] px-4 py-3">
                <button type="button" onClick={() => toggleShopping(item)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--cupboard-border)]">
                  {item.completed ? "✓" : ""}
                </button>
                <span className={["text-sm font-semibold", item.completed ? "text-[var(--cupboard-text-subtle)] line-through" : ""].join(" ")}>{item.name}</span>
                <button type="button" onClick={() => deleteFeatureItem("shoppingItems", item.id)} className="ml-auto text-xs text-[var(--cupboard-text-subtle)]">Eliminar</button>
              </div>
            ))}
          </div>
        </PanelCard>
      )}

      {tab === "recipes" && (
        <PanelCard>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-accent)]">Recetas</p>
          <h2 className="mt-2 text-2xl font-extrabold">Cocina con lo que ya tienes.</h2>
          <form onSubmit={addRecipe} className="mt-6 space-y-2">
            <SmallInput value={recipeName} onChange={(event) => setRecipeName(event.target.value)} placeholder="Nombre de la receta" />
            <SmallInput value={recipeDescription} onChange={(event) => setRecipeDescription(event.target.value)} placeholder="Descripción breve" />
            <button className="rounded-xl bg-[var(--cupboard-accent)] px-4 py-2.5 text-xs font-extrabold text-[#17110d]">Guardar receta</button>
          </form>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="rounded-2xl bg-[var(--cupboard-bg)] p-4">
                <p className="font-bold">{recipe.name}</p>
                <p className="mt-1 text-xs text-[var(--cupboard-text-muted)]">{recipe.description || "Sin descripción"}</p>
                <button type="button" onClick={() => deleteFeatureItem("recipes", recipe.id)} className="mt-3 text-xs text-[var(--cupboard-danger)]">Eliminar</button>
              </div>
            ))}
          </div>
        </PanelCard>
      )}

      {tab === "analytics" && (
        <PanelCard>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-info)]">Analítica</p>
          <h2 className="mt-2 text-2xl font-extrabold">Tu alacena, convertida en señales.</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Productos", analytics.activeProducts],
              ["Consumidas", analytics.consumed],
              ["Entradas", analytics.added],
              ["Stock bajo", analytics.lowStock],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[var(--cupboard-surface-muted)] p-5">
                <p className="text-xs text-[var(--cupboard-text-muted)]">{label}</p>
                <p className="mt-2 text-4xl font-extrabold">{value}</p>
              </div>
            ))}
          </div>
        </PanelCard>
      )}

      {tab === "catalog" && (
        <PanelCard>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-primary)]">Catálogo</p>
          <h2 className="mt-2 text-2xl font-extrabold">Escanea una vez. Completa datos automáticamente.</h2>
          <p className="mt-2 text-sm text-[var(--cupboard-text-muted)]">Busca por código de barras en el catálogo externo y reutiliza nombre, marca, categoría e imagen cuando estén disponibles.</p>
          <form onSubmit={lookupCatalog} className="mt-6 flex gap-2">
            <SmallInput value={catalogBarcode} onChange={(event) => setCatalogBarcode(event.target.value)} placeholder="Código de barras" inputMode="numeric" />
            <button disabled={busy} className="rounded-xl bg-[var(--cupboard-primary)] px-4 text-xs font-extrabold text-[#10140d] disabled:opacity-50">{busy ? "Buscando" : "Buscar"}</button>
          </form>
          {catalogResult && (
            <div className="mt-5 rounded-3xl bg-[var(--cupboard-bg)] p-5">
              {catalogResult.notFound ? (
                <p className="text-sm text-[var(--cupboard-text-muted)]">No encontramos ese producto.</p>
              ) : (
                <div className="flex flex-col gap-5 sm:flex-row">
                  <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl bg-white p-3">
                    {catalogResult.imageUrl ? <img src={catalogResult.imageUrl} alt="" className="max-h-full max-w-full object-contain mix-blend-multiply" /> : "📦"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-extrabold">{catalogResult.name || "Producto sin nombre"}</p>
                    <p className="mt-1 text-sm text-[var(--cupboard-text-muted)]">{catalogResult.brand || "Marca no disponible"}</p>
                    <p className="mt-3 text-xs text-[var(--cupboard-text-subtle)]">{catalogResult.category || "Categoría no disponible"}</p>
                    <button type="button" onClick={saveCatalogProduct} className="mt-4 rounded-xl bg-[var(--cupboard-primary)] px-4 py-2.5 text-xs font-extrabold text-[#10140d]">Agregar a mi alacena</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </PanelCard>
      )}

      {tab === "team" && (
        <PanelCard>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-primary)]">Equipo</p>
          <h2 className="mt-2 text-2xl font-extrabold">Abre la alacena a personas de confianza.</h2>
          <p className="mt-2 text-sm text-[var(--cupboard-text-muted)]">Sesiones separadas, una misma alacena y permisos por rol.</p>
          <div className="mt-6 rounded-2xl bg-[var(--cupboard-surface-muted)] p-5">
            <p className="text-xs text-[var(--cupboard-text-muted)]">Tu rol</p>
            <p className="mt-1 text-xl font-extrabold">{profile?.role || "miembro"}</p>
          </div>
          {(profile?.role === "admin") && (
            <div className="mt-5">
              <button type="button" onClick={createHouseholdInvite} disabled={busy} className="rounded-xl bg-[var(--cupboard-primary)] px-4 py-2.5 text-xs font-extrabold text-[#10140d]">
                Generar invitación de editor
              </button>
              {inviteCode && (
                <div className="mt-4 rounded-2xl border border-[var(--cupboard-primary)]/20 bg-[var(--cupboard-primary-soft)] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--cupboard-primary)]">Código</p>
                  <p className="mt-2 font-mono text-3xl font-black tracking-[0.2em]">{inviteCode}</p>
                  <p className="mt-2 text-xs text-[var(--cupboard-text-muted)]">Comparte este código con la persona que quieras conectar a esta alacena.</p>
                </div>
              )}
            </div>
          )}
          <button type="button" onClick={logout} className="mt-6 rounded-xl border border-[var(--cupboard-border)] px-4 py-2.5 text-xs font-bold text-[var(--cupboard-text-muted)]">
            Cerrar sesión
          </button>
        </PanelCard>
      )}
    </section>
  );
}
