import { useEffect, useState } from "react";
import { auth } from "../services/auth";
import { getUserProfile } from "../services/households";
import { subscribeToProducts } from "../services/products";
import { disconnectFirestore } from "../firebase";
import { canWriteInventory as canWriteInventoryRole } from "../services/regressionContracts";

export default function useInventorySubscription(enabled = true, activeWorkspaceId = "home") {
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!auth.currentUser) {
      return undefined;
    }

    getUserProfile(auth.currentUser.uid)
      .then((profile) => {
        if (!cancelled) setUserRole(profile?.role || null);
      })
      .catch((error) => {
        console.error("No se pudo resolver el rol del usuario:", error);
        if (!cancelled) setUserRole(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let unsubscribers = [];
    let active = true;

    if (!enabled) return undefined;

    const stopListeners = () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      unsubscribers = [];
    };

    const updateStatus = (metadata) => {
      const preferredNetwork = window.localStorage.getItem("cupboard.firestoreNetwork");
      if (preferredNetwork === "offline" || !navigator.onLine) {
        setConnectionStatus("offline");
      } else if (metadata.hasPendingWrites || metadata.fromCache) {
        setConnectionStatus("syncing");
      } else {
        setConnectionStatus("connected");
      }
    };

    const startListener = () => {
      stopListeners();
      setIsLoadingProducts(true);

      // The top-level workspace selector is the single source of truth.
      // Never subscribe to both inventories in the same view.
      const workspaces = [
        activeWorkspaceId === "sandwichies" ? "sandwichies" : "home",
      ];

      const workspaceProducts = new Map();
      const workspaceMetadata = new Map();

      unsubscribers = workspaces.map((workspaceId) => subscribeToProducts(
        (data, metadata) => {
          if (!active) return;
          workspaceProducts.set(workspaceId, data);
          workspaceMetadata.set(workspaceId, metadata);
          setProducts([...workspaceProducts.values()].flat());
          setIsLoadingProducts(workspaceProducts.size < workspaces.length);
          const states = [...workspaceMetadata.values()];
          updateStatus({
            fromCache: states.some((state) => state.fromCache),
            hasPendingWrites: states.some((state) => state.hasPendingWrites),
          });
        },
        (error) => {
          console.error("Error escuchando inventario de " + workspaceId + ":", error);
          if (!active) return;
          setIsLoadingProducts(false);
          setConnectionStatus(navigator.onLine ? "error" : "offline");
        },
        workspaceId,
      ));
    };

    const handleOffline = () => setConnectionStatus("offline");
    const handleOnline = () => {
      if (window.localStorage.getItem("cupboard.firestoreNetwork") === "offline") {
        setConnectionStatus("offline");
        return;
      }
      setConnectionStatus("connecting");
      startListener();
    };

    if (window.localStorage.getItem("cupboard.firestoreNetwork") === "offline") {
      disconnectFirestore().catch((error) =>
        console.error("No se pudo mantener Firestore desconectado:", error),
      );
    }

    startListener();

    const handleFirestoreNetwork = (event) => {
      if (event.detail === "offline") {
        setConnectionStatus("offline");
      } else if (event.detail === "online") {
        setConnectionStatus("connecting");
        startListener();
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("cupboard:firestore-network", handleFirestoreNetwork);

    return () => {
      active = false;
      stopListeners();
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("cupboard:firestore-network", handleFirestoreNetwork);
    };
  }, [enabled, userRole, activeWorkspaceId]);

  const canWriteInventory = canWriteInventoryRole(userRole);
  const roleKnown = Boolean(userRole);

  const updateProductLocally = (productId, portions, workspaceId) => {
    setProducts((current) =>
      current.map((product) =>
        product.id === productId && (!workspaceId || product.workspaceId === workspaceId)
          ? { ...product, portions }
          : product,
      ),
    );
  };

  useEffect(() => {
    window.localStorage.setItem("cupboard.connectionStatus", connectionStatus);
    window.dispatchEvent(
      new CustomEvent("cupboard:connection-status", { detail: connectionStatus }),
    );
  }, [connectionStatus]);

  return {
    products: enabled ? products : [],
    isLoadingProducts: enabled && isLoadingProducts,
    connectionStatus: enabled ? connectionStatus : "connecting",
    userRole,
    canWriteInventory,
    roleKnown,
    updateProductLocally,
  };
}
