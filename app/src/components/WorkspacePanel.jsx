import { useEffect, useMemo, useState } from "react";
import {
  createFeatureItem,
  deleteFeatureItem,
  lookupProductByBarcode,
  subscribeFeature,
  updateFeatureItem,
} from "../services/features";
import { createInvite, getActiveHouseholdId, getHousehold, getHouseholdMembers, getUserProfile, setMemberWorkspaces } from "../services/households";
import { getAllProducts, saveProduct } from "../services/products";
import { getAllCatalogProducts, seedCatalogFromProducts } from "../services/catalog";
import { auth, logout } from "../services/auth";
import { connectFirestore, disconnectFirestore } from "../firebase";

function parseDateOnly(value, endOfDay = false) {
  if (!value) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  if (![year, month, day].every(Number.isFinite)) return null;
  return endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day);
}

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

function getInitialConnectionStatus() {
  if (typeof window === "undefined") return "connecting";

  const preferredNetwork = window.localStorage.getItem("cupboard.firestoreNetwork");
  if (preferredNetwork === "offline") return "offline";

  const storedStatus = window.localStorage.getItem("cupboard.connectionStatus");
  if (["connected", "offline", "syncing", "error"].includes(storedStatus)) {
    return storedStatus;
  }

  return navigator.onLine ? "connecting" : "offline";
}

export default function WorkspacePanel() {
  const [tab, setTab] = useState("expiry");
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [shopping, setShopping] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [household, setHousehold] = useState(null);
  const [householdMembers, setHouseholdMembers] = useState([]);
  const [savingMemberAccess, setSavingMemberAccess] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [shoppingText, setShoppingText] = useState("");
  const [recipeName, setRecipeName] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [catalogBarcode, setCatalogBarcode] = useState("");
  const [catalogResult, setCatalogResult] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(getInitialConnectionStatus);
  const [connectionBusy, setConnectionBusy] = useState(false);
  const [catalogSyncBusy, setCatalogSyncBusy] = useState(false);
  const [catalogSyncResult, setCatalogSyncResult] = useState(null);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const householdId = getActiveHouseholdId();
  const isOwner = household?.ownerUid === auth.currentUser?.uid;

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getAllProducts(),
      auth.currentUser ? getUserProfile(auth.currentUser.uid) : null,
      householdId ? getHousehold(householdId) : null,
      householdId ? getHouseholdMembers(householdId) : [],
    ]).then(([nextProducts, nextProfile, nextHousehold, nextMembers]) => {
      if (cancelled) return;
      setProducts(nextProducts);
      setProfile(nextProfile);
      setHousehold(nextHousehold);
      setHouseholdMembers(nextMembers);
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

  useEffect(() => {
    const handleConnectionStatus = (event) => {
      setConnectionStatus(event.detail);
    };

    window.addEventListener("cupboard:connection-status", handleConnectionStatus);
    return () => window.removeEventListener("cupboard:connection-status", handleConnectionStatus);
  }, []);
  useEffect(() => {
    if (tab !== "catalog") return undefined;

    let cancelled = false;
    setCatalogLoading(true);

    getAllCatalogProducts()
      .then((nextCatalog) => {
        if (!cancelled) {
          setCatalogProducts(nextCatalog);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setError("No pudimos cargar el catálogo compartido.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tab]);


  const openDatabaseConnection = async () => {
    setConnectionBusy(true);
    setConnectionStatus("connecting");

    try {
      await connectFirestore();
    } catch (err) {
      console.error(err);
      setConnectionStatus("error");
    } finally {
      setConnectionBusy(false);
    }
  };

  const closeDatabaseConnection = async () => {
    setConnectionBusy(true);

    try {
      await disconnectFirestore();
    } catch (err) {
      console.error(err);
      setConnectionStatus("error");
    } finally {
      setConnectionBusy(false);
    }
  };

  const expiryBuckets = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999);

    return {
      expired: products.filter((item) => {
        const expiry = parseDateOnly(item.expiryDate, true);
        return expiry && expiry < today;
      }),
      soon: products.filter((item) => {
        const expiry = parseDateOnly(item.expiryDate, true);
        return expiry && expiry >= today && expiry <= week;
      }),
      tracked: products.filter((item) => Boolean(parseDateOnly(item.expiryDate))),
    };
  }, [products]);

  const analytics = useMemo(() => {
    const consumed = movements
      .filter((item) => item.type === "consume" || item.type === "consumption")
      .reduce((total, item) => total + (Number(item.quantity) || 0), 0);
    const added = movements
      .filter((item) =>
        item.type === "add" ||
        item.type === "purchase" ||
        item.type === "reversal" ||
        (item.type === "adjustment" && Number(item.quantityDelta) > 0)
      )
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
    } catch {
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

  const syncCurrentInventoryToCatalog = async () => {
    if (!isOwner || catalogSyncBusy) return;

    setCatalogSyncBusy(true);
    setCatalogSyncResult(null);
    setError("");

    try {
      const seeded = await seedCatalogFromProducts(products);
      const nextCatalog = await getAllCatalogProducts();

      setCatalogProducts(nextCatalog);
      setCatalogSyncResult({
        count: seeded.length,
        total: nextCatalog.length,
        message: "Los productos actuales quedaron registrados en el catálogo compartido.",
      });
    } catch (err) {
      console.error(err);
      setError(
        "No pudimos preparar el catálogo con los productos actuales. Revisa la conexión e inténtalo nuevamente.",
      );
    } finally {
      setCatalogSyncBusy(false);
    }
  };

  const updateMemberAccess = async (member, workspaceId, enabled) => {
    if (!isOwner || member.id === auth.currentUser?.uid) return;
    const current = Array.isArray(member.workspaces) ? member.workspaces : [];
    if (workspaceId !== "home") return;
    const next = enabled ? ["home"] : current.filter((item) => item !== "home");
    setSavingMemberAccess(member.id);
    setError("");
    try {
      await setMemberWorkspaces(householdId, member.id, next);
      setHouseholdMembers((members) => members.map((item) =>
        item.id === member.id ? { ...item, workspaces: next } : item
      ));
    } catch (err) {
      console.error("No se pudieron guardar los permisos del miembro:", err);
      setError("No pudimos guardar los permisos. Comprueba que las reglas nuevas estén publicadas.");
    } finally {
      setSavingMemberAccess(null);
    }
  };

  const createHouseholdInvite = async () => {
    if (!householdId || !isOwner) return;
    setBusy(true);

    try {
      setInviteCode(await createInvite(householdId));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2">
          {tabs.filter(([id]) => id !== "team" || isOwner).map(([id, icon, label]) => (
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
                <span className="text-xs font-bold text-[var(--cupboard-warning)]">{item.portions} {item.unit || "porciones"}</span>
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
                  <p className="text-sm font-bold">{item.type === "consume" || item.type === "consumption" ? "Consumo" : item.type === "reversal" ? "Reversión" : item.type === "purchase" ? "Compra" : item.type === "adjustment" ? "Ajuste" : "Entrada"}</p>
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
          <h2 className="mt-2 text-2xl font-extrabold">Una ficha para cada producto.</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--cupboard-text-muted)]">
            Cupboard separa la identidad del producto de la cantidad que tiene cada hogar. El barcode es la llave para reconocerlo y reutilizar sus datos.
          </p>

          {isOwner && (
            <div className="mt-5 rounded-2xl border border-[var(--cupboard-primary)]/20 bg-[var(--cupboard-primary-soft)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-extrabold">Preparar catálogo con tu inventario actual</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--cupboard-text-muted)]">
                    Registra como fichas globales los {products.length} productos que ya tienes. No cambia ni elimina tu inventario.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={syncCurrentInventoryToCatalog}
                  disabled={catalogSyncBusy || products.length === 0}
                  className="shrink-0 rounded-xl bg-[var(--cupboard-primary)] px-4 py-2.5 text-xs font-extrabold text-[#10140d] disabled:opacity-50"
                >
                  {catalogSyncBusy ? "Preparando..." : "Preparar catálogo"}
                </button>
              </div>

              {catalogSyncResult && (
                <p className="mt-3 text-xs font-semibold text-[var(--cupboard-success)]">
                  ✓ {catalogSyncResult.message} ({catalogSyncResult.count} productos revisados · {catalogSyncResult.total} fichas en catálogo).
                </p>
              )}
            </div>
          )}

          <div className="mt-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--cupboard-info)]">Catálogo compartido</p>
                <p className="mt-1 text-sm text-[var(--cupboard-text-muted)]">
                  Aquí viven las fichas globales creadas a partir de los productos del inventario. El catálogo no reemplaza ni elimina las existencias de la alacena.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[var(--cupboard-primary-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--cupboard-primary)]">
                {catalogProducts.length} fichas
              </span>
            </div>

            {catalogLoading && (
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-4 py-8 text-center text-sm text-[var(--cupboard-text-muted)]">
                Cargando catálogo compartido...
              </div>
            )}

            {!catalogLoading && catalogProducts.length === 0 && (
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-4 py-8 text-center">
                <p className="text-sm font-bold">Todavía no hay fichas en el catálogo.</p>
                {isOwner && <p className="mt-1 text-xs text-[var(--cupboard-text-muted)]">Usa “Preparar catálogo” para registrar tu inventario actual sin modificarlo.</p>}
              </div>
            )}

            {!catalogLoading && catalogProducts.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {catalogProducts.map((item) => (
                  <article key={item.id} className="overflow-hidden rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)]">
                    <div className="flex h-28 items-center justify-center bg-[var(--cupboard-surface-muted)] p-4">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-3xl" aria-hidden="true">📦</span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold">{item.name || "Producto sin nombre"}</p>
                          <p className="mt-1 text-xs text-[var(--cupboard-text-muted)]">{item.brand || "Marca no disponible"}</p>
                        </div>
                        <span className="shrink-0 rounded-lg bg-[var(--cupboard-surface-muted)] px-2 py-1 font-mono text-[9px] text-[var(--cupboard-text-subtle)]">
                          {item.id}
                        </span>
                      </div>
                      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--cupboard-text-subtle)]">
                        {item.category || "Sin categoría"} · {item.weight || 0} g
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>


          <div className="mt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--cupboard-text-subtle)]">Catálogo externo</p>
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
                    <button
                      type="button"
                      onClick={saveCatalogProduct}
                      className="mt-4 rounded-xl bg-[var(--cupboard-primary)] px-4 py-2.5 text-xs font-extrabold text-[#10140d]"
                    >
                      Agregar a mi alacena
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          </div>
        </PanelCard>
      )}

      {tab === "team" && isOwner && (
        <div className="grid gap-5 lg:grid-cols-2">
          <PanelCard>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-primary)]">Administración general</p>
            <h2 className="mt-2 text-2xl font-extrabold">Tú controlas la alacena.</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--cupboard-text-muted)]">
              Eres el propietario y administrador general de esta instancia. Los invitados entran como miembros y no pueden generar nuevos accesos.
            </p>

            <div className="mt-6 rounded-2xl bg-[var(--cupboard-surface-muted)] p-5">
              <p className="text-xs text-[var(--cupboard-text-muted)]">Rol actual</p>
              <p className="mt-1 text-xl font-extrabold">Administrador general · Propietario</p>
              <p className="mt-2 text-xs text-[var(--cupboard-text-subtle)]">{profile?.email || auth.currentUser?.email || "Cuenta actual"}</p>
            </div>

            <div className="mt-5">
              <button type="button" onClick={createHouseholdInvite} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[var(--cupboard-primary)] px-4 py-2.5 text-xs font-extrabold text-[#10140d] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--cupboard-primary-hover)] disabled:cursor-wait disabled:opacity-60">
                {busy && <span aria-hidden="true" className="h-3 w-3 animate-spin rounded-full border-2 border-[#10140d]/30 border-t-[#10140d]" />}
                {busy ? "Generando..." : inviteCode ? "Generar otro código" : "Generar código de acceso"}
              </button>
              {inviteCode && (
                <div
                  key={inviteCode}
                  role="status"
                  aria-live="polite"
                  className="cupboard-invite-reveal mt-4 rounded-2xl border border-[var(--cupboard-primary)]/20 bg-[var(--cupboard-primary-soft)] p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--cupboard-primary)]">Código de acceso</p>
                    <span className="rounded-full bg-[var(--cupboard-primary)]/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--cupboard-primary)]">Nuevo</span>
                  </div>
                  <p className="mt-2 font-mono text-3xl font-black tracking-[0.2em]">{inviteCode}</p>
                  <p className="mt-2 text-xs leading-5 text-[var(--cupboard-text-muted)]">Compártelo con una persona de confianza. El registro con este código la conectará como miembro, nunca como administrador.</p>
                </div>
              )}
            </div>
          </PanelCard>

          <PanelCard className="lg:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-primary)]">Permisos por espacio</p>
            <h2 className="mt-2 text-2xl font-extrabold">Accesos del equipo</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--cupboard-text-muted)]">
              Los miembros solo pueden recibir acceso a Hogar. El inventario de Negocio · Sandwichies es privado del administrador. El catálogo de productos es compartido.
            </p>
            <div className="mt-5 space-y-3">
              {householdMembers.filter((member) => member.id !== auth.currentUser?.uid && member.role !== "admin").map((member) => {
                const assigned = Array.isArray(member.workspaces) ? member.workspaces : [];
                return (
                  <div key={member.id} className="grid gap-3 rounded-2xl border border-[var(--cupboard-border)] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{member.displayName || member.email || member.id}</p>
                      <p className="truncate text-xs text-[var(--cupboard-text-muted)]">{member.email || "Miembro"}</p>
                    </div>
                    {[
                      ["home", "🏠 Hogar"],
                    ].map(([workspaceId, label]) => (
                      <label key={workspaceId} className="flex items-center gap-2 text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={assigned.includes(workspaceId)}
                          disabled={savingMemberAccess === member.id}
                          onChange={(event) => updateMemberAccess(member, workspaceId, event.target.checked)}
                          className="h-4 w-4 accent-[var(--cupboard-primary)]"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                );
              })}
              {householdMembers.filter((member) => member.id !== auth.currentUser?.uid && member.role !== "admin").length === 0 && (
                <p className="rounded-xl bg-[var(--cupboard-surface-muted)] p-4 text-sm text-[var(--cupboard-text-muted)]">Aún no hay miembros invitados para asignar.</p>
              )}
            </div>
          </PanelCard>

          <PanelCard>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-info)]">Conexión</p>
            <h2 className="mt-2 text-2xl font-extrabold">Abrir Cupboard.</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--cupboard-text-muted)]">
              Controla la conexión de este dispositivo con Firestore y comprueba si Cupboard está trabajando contra el servidor o con los datos locales.
            </p>

            <div className="mt-6 rounded-2xl bg-[var(--cupboard-surface-muted)] p-5 transition-all duration-500">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={[
                    "h-3 w-3 shrink-0 rounded-full shadow-[0_0_0_4px_rgb(0_0_0_/_0.08)]",
                    connectionStatus === "connected" && "bg-[var(--cupboard-success)]",
                    connectionStatus === "connecting" && "bg-[var(--cupboard-warning)] animate-pulse",
                    connectionStatus === "syncing" && "bg-[var(--cupboard-info)] animate-pulse",
                    connectionStatus === "offline" && "bg-[var(--cupboard-warning)]",
                    connectionStatus === "error" && "bg-[var(--cupboard-danger)]",
                  ].filter(Boolean).join(" ")}
                />
                <div>
                  <p className="text-xs text-[var(--cupboard-text-muted)]">Estado actual</p>
                  <p className="mt-0.5 text-xl font-extrabold">
                    {connectionStatus === "connected" && "Conectada"}
                    {connectionStatus === "connecting" && "Conectando..."}
                    {connectionStatus === "syncing" && "Sincronizando..."}
                    {connectionStatus === "offline" && "Desconectada"}
                    {connectionStatus === "error" && "Error de conexión"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-[var(--cupboard-text-subtle)]">
                {connectionStatus === "connected"
                  ? "Firestore está disponible desde este dispositivo."
                  : connectionStatus === "syncing"
                    ? "Hay cambios locales pendientes de sincronización."
                  : connectionStatus === "offline"
                    ? "Cupboard está usando los datos locales disponibles."
                    : "Comprobando la conexión con Firestore…"}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={openDatabaseConnection} disabled={connectionBusy || connectionStatus === "connected"} className="flex-1 rounded-xl bg-[var(--cupboard-primary)] px-4 py-2.5 text-xs font-extrabold text-[#10140d] disabled:opacity-50">
                {connectionBusy ? "Conectando..." : "Conectar base de datos"}
              </button>
              <button type="button" onClick={closeDatabaseConnection} disabled={connectionBusy || connectionStatus === "offline"} className="flex-1 rounded-xl border border-[var(--cupboard-border)] px-4 py-2.5 text-xs font-bold text-[var(--cupboard-text-muted)] disabled:opacity-50">
                Desconectar
              </button>
            </div>

            <p className="mt-4 text-[10px] leading-5 text-[var(--cupboard-text-subtle)]">
              Este control afecta la conexión Firestore de este dispositivo, no apaga Firebase para los demás usuarios.
            </p>
          </PanelCard>

          <PanelCard className="lg:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cupboard-accent)]">Sesión</p>
            <h2 className="mt-2 text-2xl font-extrabold">Cerrar sesión.</h2>
            <button type="button" onClick={logout} className="mt-5 rounded-xl border border-[var(--cupboard-border)] px-4 py-2.5 text-xs font-bold text-[var(--cupboard-text-muted)]">
              Cerrar sesión
            </button>
          </PanelCard>
        </div>
      )}
    </section>
  );
}
