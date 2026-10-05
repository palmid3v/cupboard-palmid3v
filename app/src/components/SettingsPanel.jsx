import { useMemo, useState } from "react";
import { auth, logout } from "../services/auth";

const APP_VERSION = "0.0.0";

function SettingRow({ label, description, children }) {
  return (
    <div className="cupboard-retro-setting-row">
      <div className="min-w-0">
        <p className="text-sm font-bold">{label}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--cupboard-text-muted)]">
          {description}
        </p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function RetroSelect({ value, onChange, children, label }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-w-40 border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-3 py-2.5 text-xs font-bold text-[var(--cupboard-text)] outline-none focus:border-[var(--cupboard-primary)] focus:ring-2 focus:ring-[var(--cupboard-primary)]/20"
    >
      {children}
    </select>
  );
}

export default function SettingsPanel({ settings, updateSetting }) {
  const [logoutBusy, setLogoutBusy] = useState(false);

  const user = auth.currentUser;
  const displayName = user?.displayName || "Cuenta actual";
  const email = user?.email || "Sin correo disponible";
  const verificationLabel = user?.emailVerified
    ? "Correo verificado"
    : "Correo pendiente de verificación";

  const pwaState = useMemo(() => {
    if (typeof window === "undefined") return "Navegador";

    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true;

    return standalone ? "Instalada como PWA" : "Navegador web";
  }, []);

  const handleLogout = async () => {
    if (logoutBusy) return;

    setLogoutBusy(true);
    try {
      await logout();
    } finally {
      setLogoutBusy(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="cupboard-retro-panel p-5 sm:p-7">
          <p className="cupboard-retro-kicker">Cuenta</p>
          <h2 className="mt-2 text-2xl font-black">Tu identidad.</h2>

          <div className="mt-6 cupboard-retro-inset p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--cupboard-primary)] bg-[var(--cupboard-primary-soft)] font-mono text-lg font-black">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{displayName}</p>
                <p className="mt-1 truncate text-xs text-[var(--cupboard-text-muted)]">{email}</p>
                <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--cupboard-primary)]">
                  {verificationLabel}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutBusy}
            className="mt-5 cupboard-retro-button-secondary"
          >
            {logoutBusy ? "CERRANDO..." : "CERRAR SESIÓN"}
          </button>
        </section>

        <section className="cupboard-retro-panel p-5 sm:p-7">
          <p className="cupboard-retro-kicker">Apariencia</p>
          <h2 className="mt-2 text-2xl font-black">Cupboard Dark.</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--cupboard-text-muted)]">
            El lenguaje visual Retro-Digital es fijo. No hay selector de tema falso.
          </p>

          <div className="mt-6 cupboard-retro-status">
            <span className="h-3 w-3 bg-[var(--cupboard-primary)]" aria-hidden="true" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em]">Tema activo</p>
              <p className="mt-1 text-[10px] text-[var(--cupboard-text-muted)]">DARK / RETRO-DIGITAL</p>
            </div>
          </div>
        </section>
      </div>

      <section className="cupboard-retro-panel p-5 sm:p-7">
        <p className="cupboard-retro-kicker">Inventario</p>
        <h2 className="mt-2 text-2xl font-black">Comportamiento por defecto.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--cupboard-text-muted)]">
          Estas preferencias solo afectan tu dispositivo. Los umbrales guardados en productos existentes no se modifican.
        </p>

        <div className="mt-6 divide-y divide-[var(--cupboard-border)] border-y border-[var(--cupboard-border)]">
          <SettingRow
            label="Stock mínimo por defecto"
            description="Las nuevas altas usarán este valor. Los productos existentes conservan su minStock."
          >
            <input
              aria-label="Stock mínimo por defecto"
              type="number"
              min="0"
              step="1"
              value={settings.minStockDefault}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value) && value >= 0) {
                  updateSetting("minStockDefault", Math.floor(value));
                }
              }}
              className="w-28 border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-3 py-2.5 text-center font-mono text-sm font-black outline-none focus:border-[var(--cupboard-primary)] focus:ring-2 focus:ring-[var(--cupboard-primary)]/20"
            />
          </SettingRow>

          <SettingRow
            label="Orden inicial"
            description="Se aplica cada vez que abres el inventario."
          >
            <RetroSelect
              label="Orden inicial"
              value={settings.inventorySort}
              onChange={(value) => updateSetting("inventorySort", value)}
            >
              <option value="name">Nombre A-Z</option>
              <option value="recent">Más recientes</option>
              <option value="low-stock">Menor stock</option>
              <option value="high-stock">Mayor stock</option>
            </RetroSelect>
          </SettingRow>

          <SettingRow
            label="Filtro inicial"
            description="Define qué productos aparecen al entrar al inventario."
          >
            <RetroSelect
              label="Filtro inicial"
              value={settings.inventoryFilter}
              onChange={(value) => updateSetting("inventoryFilter", value)}
            >
              <option value="all">Todos</option>
              <option value="low">Stock bajo</option>
              <option value="available">Disponibles</option>
            </RetroSelect>
          </SettingRow>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <section className="cupboard-retro-panel p-5 sm:p-7">
          <p className="cupboard-retro-kicker">Aplicación</p>
          <h2 className="mt-2 text-2xl font-black">Sistema.</h2>
          <div className="mt-6 space-y-3">
            <div className="cupboard-retro-inset flex items-center justify-between gap-4 p-4">
              <span className="text-xs font-bold text-[var(--cupboard-text-muted)]">Versión</span>
              <span className="font-mono text-xs font-black">v{APP_VERSION}</span>
            </div>
            <div className="cupboard-retro-inset flex items-center justify-between gap-4 p-4">
              <span className="text-xs font-bold text-[var(--cupboard-text-muted)]">PWA</span>
              <span className="font-mono text-xs font-black text-[var(--cupboard-primary)]">{pwaState}</span>
            </div>
          </div>
        </section>

        <section className="cupboard-retro-panel p-5 sm:p-7">
          <p className="cupboard-retro-kicker">Persistencia</p>
          <h2 className="mt-2 text-2xl font-black">Preferencias locales.</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--cupboard-text-muted)]">
            Tus ajustes se guardan en este dispositivo bajo <code className="font-mono text-[var(--cupboard-primary)]">cupboard.settings</code>. No se sincronizan entre dispositivos en esta versión.
          </p>
          <div className="mt-5 border border-[var(--cupboard-primary)]/30 bg-[var(--cupboard-primary-soft)] p-4 font-mono text-[10px] leading-5 text-[var(--cupboard-text-muted)]">
            minStockDefault={settings.minStockDefault}
            <br />
            inventorySort={settings.inventorySort}
            <br />
            inventoryFilter={settings.inventoryFilter}
          </div>
        </section>
      </section>
    </section>
  );
}
