import { BrowserMultiFormatReader } from "@zxing/browser";
import { getScannerErrorState } from "../services/regressionContracts";
import { useCallback, useEffect, useRef, useState } from "react";

function getCameraError(error) {
  const state = getScannerErrorState(error);

  const messages = {
    "Permiso de cámara":
      "Cupboard necesita acceso a tu cámara para escanear códigos de barras.",
    "No encontramos una cámara":
      "Conecta o habilita una cámara y vuelve a intentarlo.",
    "La cámara está ocupada":
      "Otra aplicación o pestaña puede estar usando la cámara. Ciérrala y vuelve a intentarlo.",
    "La cámara se interrumpió":
      "La cámara fue reiniciada mientras se estaba iniciando. Vuelve a intentarlo.",
    "No pudimos iniciar la cámara":
      "Revisa los permisos del navegador e inténtalo nuevamente.",
  };

  return {
    ...state,
    message: messages[state.title] || messages["No pudimos iniciar la cámara"],
  };
export default function BarcodeScanner({ onScan, restartToken = 0 }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const requestIdRef = useRef(0);
  const startupPromiseRef = useRef(null);
  const onScanRef = useRef(onScan);
  const hasScanned = useRef(false);

  const [status, setStatus] = useState("starting");
  const [errorState, setErrorState] = useState(null);

  onScanRef.current = onScan;

  const stopScanner = useCallback(() => {
    requestIdRef.current += 1;

    try {
      controlsRef.current?.stop();
    } catch (error) {
      console.warn("No se pudo detener el scanner:", error);
    }

    controlsRef.current = null;

    const video = videoRef.current;

    if (video?.srcObject) {
      try {
        video.srcObject.getTracks?.().forEach((track) => track.stop());
      } catch (error) {
        console.warn("No se pudo detener el stream de cámara:", error);
      }

      video.srcObject = null;
    }
  }, []);

  const startScanner = useCallback(async () => {
    // Never let two asynchronous camera startups compete for the same
    // <video>. React StrictMode and retry/restart actions can otherwise
    // overlap while getUserMedia() is still resolving.
    if (startupPromiseRef.current) {
      try {
        await startupPromiseRef.current;
      } catch {
        // The previous startup reports its own error.
      }
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    hasScanned.current = false;
    setStatus("starting");
    setErrorState(null);

    const startupPromise = (async () => {
      try {
        controlsRef.current?.stop();
      } catch {
        // Previous controls may already be stopped.
      }

      controlsRef.current = null;

      const video = videoRef.current;

      if (!video) return;

      if (video.srcObject) {
        try {
          video.srcObject.getTracks?.().forEach((track) => track.stop());
        } catch {
          // Ignore cleanup failures before requesting a new stream.
        }

        video.srcObject = null;
      }

      const codeReader = new BrowserMultiFormatReader();

      const controls = await codeReader.decodeFromVideoDevice(
        undefined,
        video,
        (result) => {
          if (requestId !== requestIdRef.current) return;

          if (result && !hasScanned.current) {
            hasScanned.current = true;

            const code = result.getText();

            console.log("SCANNED:", code);
            setStatus("scanned");
            onScanRef.current?.(code);
          }

          // ZXing emits repeated scan errors while looking for a barcode.
          // They are expected and intentionally ignored here.
        },
      );

      if (requestId !== requestIdRef.current) {
        controls?.stop();
        return;
      }

      controlsRef.current = controls;

      const videoTrack = video.srcObject?.getVideoTracks?.()[0];

      if (videoTrack) {
        console.log("[Scanner] Cámara:", videoTrack.label);
        console.log("[Scanner] Configuración:", videoTrack.getSettings?.());

        const capabilities = videoTrack.getCapabilities?.();

        if (capabilities?.focusMode?.includes("continuous")) {
          try {
            await videoTrack.applyConstraints({
              advanced: [{ focusMode: "continuous" }],
            });
          } catch (focusError) {
            console.warn(
              "No se pudo activar el enfoque continuo:",
              focusError,
            );
          }
        }
      }

      if (requestId === requestIdRef.current) {
        setStatus("scanning");
      }
    })();

    startupPromiseRef.current = startupPromise;

    try {
      await startupPromise;
    } finally {
      if (startupPromiseRef.current === startupPromise) {
        startupPromiseRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        await startScanner();
      } catch (error) {
        if (cancelled) return;

        console.error("SCANNER ERROR:", error);
        setErrorState(getCameraError(error));
        setStatus("error");
      }
    };

    void run();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [restartToken, startScanner, stopScanner]);

  const handleRetry = () => {
    stopScanner();

    window.setTimeout(() => {
      void startScanner().catch((error) => {
        // A failed restart should be visible instead of leaving the scanner
        // permanently stuck in the "Preparando cámara..." state.

        console.error("SCANNER ERROR:", error);
        setErrorState(getCameraError(error));
        setStatus("error");
      });
    }, 80);
  };

  if (status === "error") {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center bg-[var(--cupboard-surface-muted)] px-6 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--cupboard-danger)]/10 text-3xl">
          🔒
        </div>

        <h3 className="mt-5 text-lg font-extrabold">
          {errorState?.title || "No pudimos iniciar la cámara"}
        </h3>

        <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--cupboard-text-muted)]">
          {errorState?.message ||
            "Revisa los permisos de tu navegador e inténtalo nuevamente."}
        </p>

        <button
          type="button"
          onClick={handleRetry}
          className="mt-6 rounded-2xl bg-[var(--cupboard-primary)] px-5 py-3 text-sm font-bold text-[#10140d] shadow-[0_8px_20px_rgb(120_168_91_/_0.12)] transition hover:-translate-y-0.5 hover:bg-[var(--cupboard-primary-hover)]"
        >
          ↻ {errorState?.action || "Intentar nuevamente"}
        </button>

        <p className="mt-4 max-w-sm text-[11px] leading-5 text-[var(--cupboard-text-subtle)]">
          Si el navegador bloqueó la cámara, habilita el permiso desde el
          icono de cámara o candado junto a la dirección de la página.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-black">
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        className="block h-[300px] w-full object-cover sm:h-[360px]"
      />

      {status === "starting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 px-6 text-center text-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
            ◌
          </div>

          <p className="mt-4 text-sm font-semibold">Preparando cámara...</p>

          <p className="mt-1 text-xs text-white/70">
            Solicitando acceso de forma segura.
          </p>
        </div>
      )}

      {(status === "scanning" || status === "scanned") && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-40 w-[min(78%,420px)]">
            <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-2 border-t-2 border-[var(--cupboard-primary)]" />
            <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-2xl border-r-2 border-t-2 border-[var(--cupboard-primary)]" />
            <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-2 border-l-2 border-[var(--cupboard-primary)]" />
            <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-2 border-r-2 border-[var(--cupboard-primary)]" />

            {status === "scanning" && (
              <span className="absolute inset-x-4 top-1/2 h-px bg-[var(--cupboard-primary)] shadow-[0_0_14px_rgb(120_168_91_/_0.9)]" />
            )}
          </div>
        </div>
      )}

      {status === "scanning" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-5 pb-5 pt-14">
          <div className="flex items-center justify-center gap-2 text-center text-white">
            <span className="h-2 w-2 rounded-full bg-[var(--cupboard-primary)] shadow-[0_0_0_5px_rgb(120_168_91_/_0.12)]" />
            <span className="text-xs font-semibold">
              Apunta al código de barras
            </span>
          </div>
        </div>
      )}

      {status === "scanned" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="rounded-2xl bg-[var(--cupboard-primary)] px-5 py-3 text-sm font-bold text-[#10140d] shadow-lg">
            ✓ Código detectado
          </div>
        </div>
      )}
    </div>
  );
}
