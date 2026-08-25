// src/components/BarcodeScanner.jsx

import { BrowserMultiFormatReader } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";

export default function BarcodeScanner({ onScan }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const hasScanned = useRef(false);

  const [status, setStatus] = useState("starting");
  const [errorMessage, setErrorMessage] = useState("");

  const startScanner = async () => {
    setStatus("starting");
    setErrorMessage("");
    hasScanned.current = false;

    try {
      const codeReader = new BrowserMultiFormatReader();

controlsRef.current?.stop();

const controls = await codeReader.decodeFromVideoDevice(
  null,
  videoRef.current,
  (result, error) => {
    if (result && !hasScanned.current) {
      hasScanned.current = true;

      const code = result.getText();

      console.log("SCANNED:", code);

      setStatus("scanned");

      onScan(code);
    }

    if (error && !hasScanned.current) {
      // ZXing emits many non-fatal scan errors while
      // searching for a barcode. They are intentionally ignored.
    }
  },
);

const videoTrack =
  videoRef.current?.srcObject?.getVideoTracks?.()[0];

if (videoTrack) {
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

      controlsRef.current = controls;

      setStatus("scanning");
    } catch (error) {
      console.error("SCANNER ERROR:", error);

      setStatus("error");

      setErrorMessage(
        "No pudimos acceder a la cámara. Revisa los permisos del navegador e inténtalo nuevamente.",
      );
    }
  };

  useEffect(() => {
    startScanner();

    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  if (status === "error") {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center bg-[var(--cupboard-surface-muted)] px-6 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-3xl">
          📷
        </div>

        <h3 className="mt-4 text-base font-bold">
          No pudimos acceder a la cámara
        </h3>

        <p className="mt-2 max-w-sm text-xs leading-5 text-[var(--cupboard-text-muted)]">
          {errorMessage}
        </p>

        <button
          type="button"
          onClick={startScanner}
          className="mt-5 rounded-xl bg-[var(--cupboard-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--cupboard-primary-hover)]"
        >
          ↻ Reintentar
        </button>
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
        className="block h-[220px] w-full object-cover"
      />

      {status === "starting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 px-6 text-center text-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
            ◌
          </div>

          <p className="mt-4 text-sm font-semibold">
            Iniciando cámara...
          </p>

          <p className="mt-1 text-xs text-white/70">
            Preparando el scanner.
          </p>
        </div>
      )}

      {status === "scanning" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-5 pb-4 pt-10">
          <div className="flex items-center justify-center gap-2 text-center text-white">
            <span className="h-2 w-2 rounded-full bg-[var(--cupboard-primary)]" />

            <span className="text-xs font-medium">
              Apunta la cámara al código de barras
            </span>
          </div>
        </div>
      )}

      {status === "scanned" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="rounded-2xl bg-[var(--cupboard-primary)] px-5 py-3 text-sm font-bold text-white shadow-lg">
            ✓ Código detectado
          </div>
        </div>
      )}
    </div>
  );
}