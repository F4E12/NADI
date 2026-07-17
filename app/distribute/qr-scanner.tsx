"use client";

import { useEffect, useRef, useState } from "react";

type DetectedBarcode = { rawValue: string };
type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
};
type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => BarcodeDetectorLike;

type ScannerState =
  | "off"
  | "starting"
  | "scanning"
  | "unsupported"
  | "insecure"
  | "blocked";

function detectorCtor(): BarcodeDetectorCtor | null {
  if (typeof window === "undefined" || !("BarcodeDetector" in window)) return null;
  return (window as unknown as { BarcodeDetector: BarcodeDetectorCtor }).BarcodeDetector;
}

export function QrScanner({ onDetect }: { onDetect: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number | undefined>(undefined);
  const [state, setState] = useState<ScannerState>("off");

  const stop = () => {
    if (loopRef.current !== undefined) window.clearInterval(loopRef.current);
    loopRef.current = undefined;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => stop, []);

  function start() {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setState("insecure");
      return;
    }
    const Ctor = detectorCtor();
    if (!Ctor) {
      setState("unsupported");
      return;
    }
    const detector = new Ctor({ formats: ["qr_code"] });
    setState("starting");

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setState("scanning");
        loopRef.current = window.setInterval(async () => {
          const video = videoRef.current;
          if (!video || video.readyState < 2) return;
          try {
            const codes = await detector.detect(video);
            const value = codes[0]?.rawValue;
            if (value) {
              stop();
              setState("off");
              onDetect(value);
            }
          } catch {
          }
        }, 350);
      })
      .catch(() => setState("blocked"));
  }

  function toggle() {
    if (state === "scanning" || state === "starting") {
      stop();
      setState("off");
    } else {
      start();
    }
  }

  const live = state === "scanning" || state === "starting";

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={toggle}
        className="self-start rounded-lg border border-fog px-3 py-2 text-sm hover:border-ash"
      >
        {live ? "Tutup kamera" : "Pindai QR dengan kamera"}
      </button>

      {live && (
        <div className="relative aspect-video max-w-sm overflow-hidden rounded-xl border border-fog bg-carbon">
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          <span className="absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-green-400/70" />
        </div>
      )}

      {state === "unsupported" && (
        <p className="text-xs text-ash">
          Peramban ini tidak mendukung pemindai QR bawaan. Ketik kode Dompet Gizi
          di bawah.
        </p>
      )}
      {state === "insecure" && (
        <p className="text-xs text-ash">
          Kamera hanya aktif di stasiun laptop pada <span className="font-mono">localhost</span>{" "}
          (ADR-0003). Ketik kode di bawah.
        </p>
      )}
      {state === "blocked" && (
        <p className="text-xs text-ash">Akses kamera ditolak. Ketik kode di bawah.</p>
      )}
    </div>
  );
}
