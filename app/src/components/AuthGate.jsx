import { useEffect, useState } from "react";
import {
  joinHouseholdByCode,
  ensureHouseholdForUser,
  getUserProfile,
} from "../services/households";
import {
  logout,
  resetPassword,
  signIn,
  signUp,
  watchAuthState,
} from "../services/auth";

function AuthField({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[var(--cupboard-text-subtle)]">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-bg)] px-4 py-3.5 text-sm outline-none transition duration-300 placeholder:text-[var(--cupboard-text-subtle)] focus:border-[var(--cupboard-primary)] focus:ring-4 focus:ring-[var(--cupboard-primary)]/10"
      />
    </label>
  );
}

function AuthScreen({ mode, setMode, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setResetSent(false);
    setBusy(true);

    try {
      if (mode === "signup") {
        if (password.length < 6) {
          throw new Error("PASSWORD_SHORT");
        }

        const credential = await signUp(email, password, displayName);

        if (inviteCode.trim()) {
          const household = await joinHouseholdByCode(credential.user, inviteCode);
          onSuccess(household);
        }

        return;
      }

      await signIn(email, password);
      return;
    } catch (err) {
      console.error(err);

      const messages = {
        "auth/invalid-credential": "Correo o contraseña incorrectos.",
        "auth/email-already-in-use": "Ese correo ya está registrado.",
        "auth/invalid-email": "Revisa el correo electrónico.",
        PASSWORD_SHORT: "La contraseña debe tener al menos 6 caracteres.",
        INVITE_NOT_FOUND: "El código de invitación no existe.",
        INVITE_EXPIRED: "El código de invitación ya expiró.",
        HOUSEHOLD_NOT_FOUND: "La alacena compartida ya no está disponible.",
      };

      setError(messages[err.code] || messages[err.message] || "No pudimos abrir Cupboard. Inténtalo nuevamente.");
    } finally {
      setBusy(false);
    }
  };

  const recover = async () => {
    if (!email.trim()) {
      setError("Escribe tu correo para recuperar la contraseña.");
      return;
    }

    setError("");
    setBusy(true);

    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError("No pudimos enviar el correo de recuperación.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--cupboard-bg)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="cupboard-orb cupboard-orb-one" />
        <div className="cupboard-orb cupboard-orb-two" />
      </div>

      <section className="relative w-full max-w-md animate-cupboard-enter">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[var(--cupboard-primary-soft)] text-3xl shadow-[0_18px_50px_rgb(0_0_0_/_0.35)]">
            📦
          </div>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--cupboard-primary)]">
            {mode === "signup" ? "Nueva alacena" : "Abrir Cupboard"}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            {mode === "signup" ? "Crea tu espacio." : "Enciende las luces."}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--cupboard-text-muted)]">
            {mode === "signup"
              ? "Crea la cuenta del administrador para comenzar."
              : "Inicia sesión para conectar tu alacena y ver el inventario compartido."}
          </p>
        </div>

        <form onSubmit={submit} className="rounded-[2rem] border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-6 shadow-[var(--cupboard-shadow-md)] sm:p-8">
          <div className="space-y-4">
            {mode === "signup" && (
              <AuthField
                label="Nombre"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Administrador"
                autoComplete="name"
              />
            )}

            <AuthField
              label="Correo"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />

            <AuthField
              label="Contraseña"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
            />

            {mode === "signup" && (
              <AuthField
                label="Código de invitación · opcional"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder="ABC123"
                autoComplete="off"
              />
            )}
          </div>

          {error && (
            <div role="alert" className="mt-5 rounded-2xl border border-[var(--cupboard-danger)]/25 bg-[var(--cupboard-danger)]/10 px-4 py-3 text-sm text-[var(--cupboard-danger)]">
              {error}
            </div>
          )}

          {resetSent && (
            <div role="status" className="mt-5 rounded-2xl border border-[var(--cupboard-success)]/25 bg-[var(--cupboard-primary-soft)] px-4 py-3 text-sm text-[var(--cupboard-success)]">
              Correo de recuperación enviado.
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-2xl bg-[var(--cupboard-primary)] px-5 py-3.5 text-sm font-extrabold text-[#10140d] shadow-[0_12px_30px_rgb(120_168_91_/_0.15)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--cupboard-primary-hover)] disabled:opacity-50"
          >
            {busy ? "Abriendo..." : mode === "signup" ? "Crear alacena" : "Abrir Cupboard"}
          </button>

          {mode === "signin" && (
            <button
              type="button"
              onClick={recover}
              disabled={busy}
              className="mt-3 w-full py-2 text-xs font-semibold text-[var(--cupboard-text-muted)] transition hover:text-[var(--cupboard-text)]"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <div className="mt-6 border-t border-[var(--cupboard-border)] pt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setError("");
                setMode(mode === "signin" ? "signup" : "signin");
              }}
              className="text-xs font-bold text-[var(--cupboard-primary)] transition hover:text-[var(--cupboard-primary-hover)]"
            >
              {mode === "signin"
                ? "Crear una cuenta de administrador"
                : "Ya tengo una cuenta"}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-[10px] uppercase tracking-[0.16em] text-[var(--cupboard-text-subtle)]">
          🔐 Acceso protegido · Inventario compartido
        </p>
      </section>
    </main>
  );
}

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined);
  const [authMode, setAuthMode] = useState("signin");
  const [household, setHousehold] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return watchAuthState(async (nextUser) => {
      setUser(nextUser);
      setError("");

      if (!nextUser) {
        setHousehold(null);
        return;
      }

      try {
        const nextHousehold = await ensureHouseholdForUser(nextUser);
        setHousehold(nextHousehold);
      } catch (err) {
        console.error(err);
        setError("Tu cuenta existe, pero no pudimos abrir la alacena compartida.");
      }
    });
  }, []);

  if (user === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--cupboard-bg)] text-[var(--cupboard-text)]">
        <div className="animate-cupboard-pulse text-sm font-semibold text-[var(--cupboard-text-muted)]">
          Encendiendo Cupboard…
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        onSuccess={setHousehold}
      />
    );
  }

  if (error || !household) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--cupboard-bg)] px-4 text-[var(--cupboard-text)]">
        <div className="w-full max-w-md rounded-[2rem] border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-8 text-center">
          <p className="text-3xl">🔴</p>
          <h1 className="mt-4 text-xl font-extrabold">No pudimos abrir la alacena</h1>
          <p className="mt-2 text-sm text-[var(--cupboard-text-muted)]">{error || "Comprobando tu acceso…"}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-6 rounded-2xl bg-[var(--cupboard-primary)] px-5 py-3 text-sm font-bold text-[#10140d]"
          >
            Cerrar sesión
          </button>
        </div>
      </main>
    );
  }

  return children;
}
