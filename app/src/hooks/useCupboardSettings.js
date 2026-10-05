import { useCallback, useState } from "react";

const SETTINGS_KEY = "cupboard.settings";

const DEFAULT_SETTINGS = {
  minStockDefault: 5,
  inventorySort: "name",
  inventoryFilter: "all",
};

function readSettings() {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const stored = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}");
    const minStockDefault = Number(stored.minStockDefault);

    return {
      minStockDefault:
        Number.isFinite(minStockDefault) && minStockDefault >= 0
          ? Math.floor(minStockDefault)
          : DEFAULT_SETTINGS.minStockDefault,
      inventorySort: ["name", "recent", "low-stock", "high-stock"].includes(
        stored.inventorySort,
      )
        ? stored.inventorySort
        : DEFAULT_SETTINGS.inventorySort,
      inventoryFilter: ["all", "low", "available"].includes(
        stored.inventoryFilter,
      )
        ? stored.inventoryFilter
        : DEFAULT_SETTINGS.inventoryFilter,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(nextSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
}

export default function useCupboardSettings() {
  const [settings, setSettings] = useState(readSettings);

  const updateSetting = useCallback((key, value) => {
    setSettings((current) => {
      const nextSettings = {
        ...current,
        [key]: value,
      };

      writeSettings(nextSettings);
      return nextSettings;
    });
  }, []);

  return {
    settings,
    updateSetting,
    defaults: DEFAULT_SETTINGS,
  };
}
