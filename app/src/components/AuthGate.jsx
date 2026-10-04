import { useEffect, useState } from "react";
import {
  joinHouseholdByCode,
  ensureHouseholdForUser,
} from "../services/households";
import {
  logout,
  resetPassword,
  signIn,
  signUp,
  watchAuthState,
  resendVerificationEmail,
  refreshCurrentUser,
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

function AuthScreen({ mode, setMode }) {
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

        if (!inviteCode.trim()) {
          throw new Error("INVITE_REQUIRED");
        }

        window.localStorage.setItem("cupboard.pendingInvite", inviteCode.trim().toUpperCase());

        await signUp(email, password, displayName);
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
        INVITE_REQUIRED: "Necesitas un código de invitación para crear una cuenta.",
        HOUSEHOLD_INVITE_REQUIRED: "Esta cuenta todavía no está conectada a una alacena. Usa una invitación para unirte.",
        INVITE_NOT_FOUND: "El código de invitación no existe.",
        INVITE_EXPIRED: "El código de invitación ya expiró.",
        HOUSEHOLD_NOT_FOUND: "La alacena compartida ya no está disponible.",
        "permission-denied": "Firebase rechazó el acceso a esta alacena. Verifica el código de invitación y las reglas publicadas.",
        "auth/network-request-failed": "No pudimos comunicarnos con Firebase. Revisa tu conexión e inténtalo nuevamente.",
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
              ? "Únete a una alacena usando el código que te compartió su administrador."
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
                label="Código de invitación · obligatorio"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder="ABC123"
                autoComplete="off"
                required
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
            {busy ? "Conectando..." : mode === "signup" ? "Unirme a Cupboard" : "Abrir Cupboard"}
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
                ? "Tengo un código de invitación"
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

function VerificationScreen({ user, onVerified }) {
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(true);
  const [error, setError] = useState("");

  const resend = async () => {
    setBusy(true);
    setError("");
    setSent(false);

    try {
      await resendVerificationEmail(user);
      setSent(true);
    } catch (err) {
      console.error(err);
      setError(
        err.code === "auth/too-many-requests"
          ? "Espera un momento antes de solicitar otro correo."
          : "No pudimos reenviar el correo de verificación.",
      );
    } finally {
      setBusy(false);
    }
  };

  const checkVerification = async () => {
    setChecking(true);
    setError("");

    try {
      const refreshed = await refreshCurrentUser();

      if (!refreshed?.emailVerified) {
        setError("Tu correo todavía aparece como no verificado. Abre el enlace del correo y vuelve a comprobarlo.");
        return;
      }

      await onVerified(refreshed);
    } catch (err) {
      console.error(err);
      setError("No pudimos comprobar el estado de tu correo. Inténtalo nuevamente.");
    } finally {
      setChecking(false);
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
            📬
          </div>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--cupboard-primary)]">
            Verificación necesaria
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            Confirma tu correo.
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--cupboard-text-muted)]">
            Enviamos un enlace de verificación a{" "}
            <strong className="text-[var(--cupboard-text)]">{user.email}</strong>.
            Confirma que tienes acceso a este correo antes de entrar a la alacena.
          </p>
        </div>

        <section className="rounded-[2rem] border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-6 shadow-[var(--cupboard-shadow-md)] sm:p-8">
          <div className="rounded-2xl border border-[var(--cupboard-primary)]/20 bg-[var(--cupboard-primary-soft)] p-4">
            <p className="text-sm font-bold text-[var(--cupboard-success)]">
              📧 Revisa tu bandeja de entrada
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--cupboard-text-muted)]">
              Si no lo encuentras, revisa spam o promociones. El código de invitación quedará guardado mientras completas la verificación.
            </p>
          </div>

          {sent && (
            <div role="status" className="mt-4 rounded-2xl border border-[var(--cupboard-success)]/20 bg-[var(--cupboard-surface-muted)] px-4 py-3 text-xs text-[var(--cupboard-text-muted)]">
              Correo de verificación enviado.
            </div>
          )}

          {error && (
            <div role="alert" className="mt-4 rounded-2xl border border-[var(--cupboard-danger)]/25 bg-[var(--cupboard-danger)]/10 px-4 py-3 text-sm text-[var(--cupboard-danger)]">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={checkVerification}
            disabled={busy || checking}
            className="mt-5 w-full rounded-2xl bg-[var(--cupboard-primary)] px-5 py-3.5 text-sm font-extrabold text-[#10140d] shadow-[0_12px_30px_rgb(120_168_91_/_0.15)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--cupboard-primary-hover)] disabled:opacity-50"
          >
            {checking ? "Comprobando..." : "Ya verifiqué mi correo"}
          </button>

          <button
            type="button"
            onClick={resend}
            disabled={busy || checking}
            className="mt-3 w-full rounded-2xl border border-[var(--cupboard-border)] bg-[var(--cupboard-surface-muted)] px-5 py-3.5 text-xs font-bold text-[var(--cupboard-text)] transition duration-300 hover:border-[var(--cupboard-primary)]/40 disabled:opacity-50"
          >
            {busy ? "Enviando..." : "Reenviar correo de verificación"}
          </button>
        </section>

        <p className="mt-5 text-center text-[10px] uppercase tracking-[0.16em] text-[var(--cupboard-text-subtle)]">
          🔐 Tu correo ayuda a proteger el inventario compartido
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

  const connectVerifiedUser = async (nextUser) => {
    const pendingInvite = window.localStorage.getItem("cupboard.pendingInvite");

    const nextHousehold = pendingInvite
      ? await joinHouseholdByCode(nextUser, pendingInvite)
      : await ensureHouseholdForUser(nextUser);

    if (pendingInvite) {
      window.localStorage.removeItem("cupboard.pendingInvite");
    }

    setHousehold(nextHousehold);
    setError("");
  };

  useEffect(() => {
    return watchAuthState(async (nextUser) => {
      setUser(nextUser);
      setError("");
      setHousehold(null);

      if (!nextUser) {
        return;
      }

      if (!nextUser.emailVerified) {
        return;
      }

      try {
        await connectVerifiedUser(nextUser);
      } catch (err) {
        console.error(err);
        const householdMessages = {
          HOUSEHOLD_INVITE_REQUIRED: "Esta cuenta no tiene una alacena asignada. Necesitas un código de invitación.",
          HOUSEHOLD_NOT_FOUND: "La alacena compartida ya no está disponible.",
          INVITE_NOT_FOUND: "El código de invitación no existe.",
          INVITE_EXPIRED: "El código de invitación ya expiró.",
          "permission-denied": "Firebase rechazó el acceso. Verifica tu correo, el código de invitación y las reglas publicadas.",
        };
        setError(householdMessages[err.message] || householdMessages[err.code] || "No pudimos conectar tu cuenta con la alacena. Inténtalo nuevamente.");
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
      />
    );
  }

  if (!user.emailVerified) {
    return (
      <VerificationScreen
        user={user}
        onVerified={async (verifiedUser) => {
          setUser(verifiedUser);
          await connectVerifiedUser(verifiedUser);
        }}
      />
    );
  }

  if (error || !household) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--cupboard-bg)] px-4 text-[var(--cupboard-text)]">
        <div className="w-full max-w-md rounded-[2rem] border border-[var(--cupboard-border)] bg-[var(--cupboard-surface)] p-8 text-center">
          <p className="text-3xl">🔴</p>
          <h1 className="mt-4 text-xl font-extrabold">{error ? "No pudimos abrir la alacena" : "Conectando con Cupboard…"}</h1>
          <p className="mt-2 text-sm text-[var(--cupboard-text-muted)]">{error || "Comprobando tu cuenta y conexión con la base de datos…"}</p>
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
