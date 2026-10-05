import { useEffect, useState } from "react";
import { auth } from "../services/auth";
import { getUserProfile } from "../services/households";
import { subscribeToProducts } from "../services/products";
import { disconnectFirestore } from "../firebase";
import { canWriteInventory as canWriteInventoryRole } from "../services/regressionContracts";

export default function useInventorySubscription() {
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
    let unsubscribe = () => {};

    const startListener = () => {
      unsubscribe();

      unsubscribe = subscribeToProducts(
        (data, metadata) => {
          setProducts(data);
          setIsLoadingProducts(false);

          const preferredNetwork = window.localStorage.getItem("cupboard.firestoreNetwork");

          if (preferredNetwork === "offline" || !navigator.onLine) {
            setConnectionStatus("offline");
            return;
          }

          if (metadata.hasPendingWrites || metadata.fromCache) {
            setConnectionStatus("syncing");
            return;
          }

          setConnectionStatus("connected");
        },
        (error) => {
          console.error("Error escuchando el inventario:", error);
          setIsLoadingProducts(false);
          setConnectionStatus(navigator.onLine ? "error" : "offline");
        },
      );
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
      unsubscribe();
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("cupboard:firestore-network", handleFirestoreNetwork);
    };
  }, []);

  const canWriteInventory = canWriteInventoryRole(userRole);
  const roleKnown = Boolean(userRole);

  const updateProductLocally = (productId, portions) => {
    setProducts((current) =>
      current.map((product) =>
        product.id === productId
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
    products,
    isLoadingProducts,
    connectionStatus,
    userRole,
    canWriteInventory,
    roleKnown,
    updateProductLocally,
  };
}
