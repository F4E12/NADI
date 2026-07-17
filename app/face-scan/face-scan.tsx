"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { simulateMatch, type SimulatedMatch } from "./actions";

type CameraState = "starting" | "live" | "blocked" | "insecure";

export function FaceScan() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [camera, setCamera] = useState<CameraState>("starting");
  const [match, setMatch] = useState<SimulatedMatch | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const setSafe = (state: CameraState) => {
      if (!cancelled) setCamera(state);
    };

    const media = navigator.mediaDevices;
    if (!window.isSecureContext || !media?.getUserMedia) {
      void Promise.resolve().then(() => setSafe("insecure"));
      return () => {
        cancelled = true;
      };
    }

    media
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setSafe("live");
      })
      .catch(() => setSafe("blocked"));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function freezeFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 360;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
  }

  async function runSimulation() {
    setPending(true);
    freezeFrame();
    try {
      const result = await simulateMatch();
      setMatch(result);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-fog bg-carbon">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <span className="absolute left-2 top-2 rounded bg-amber-500/90 px-2 py-0.5 text-xs font-bold text-black">
            SIMULASI
          </span>

          {camera !== "live" && (
            <div className="absolute inset-0 flex items-center justify-center bg-carbon/90 p-6 text-center text-sm text-fog">
              {camera === "starting" && "Meminta akses kamera…"}
              {camera === "blocked" &&
                "Akses kamera ditolak. Izinkan kamera di stasiun laptop untuk melihat pratinjau."}
              {camera === "insecure" && (
                <span>
                  Kamera hanya aktif di stasiun laptop pada{" "}
                  <span className="font-mono">localhost</span>. Alamat LAN bukan
                  konteks aman, jadi peramban menolak kamera di sini (ADR-0003).
                  Simulasi kecocokan tetap bisa dijalankan.
                </span>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={runSimulation}
          disabled={pending}
          className="rounded-lg bg-lavender px-4 py-2.5 text-sm font-medium text-white hover:bg-iris disabled:opacity-50"
        >
          {pending ? "Menyimulasikan…" : "Simulasikan kecocokan"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ash">
          Hasil (disimulasikan)
        </h2>
        {match ? (
          <div className="rounded-xl border border-fog bg-white p-5">
            <p className="text-lg font-semibold">{match.residentName}</p>
            <p className="text-sm text-ash">
              {match.age} th · Keluarga {match.householdName} · {match.tentName}
            </p>
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Ini bukan identifikasi. Resident dipilih acak dari data seed untuk
              memperagakan antarmuka. Verifikasi identitas sebenarnya lewat Dompet
              Gizi.
            </p>
            <Link
              href={`/households/${match.householdId}`}
              className="mt-3 inline-flex text-sm font-medium text-carbon underline underline-offset-4"
            >
              Buka Household →
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-fog p-5 text-sm text-ash">
            Belum ada. Tekan &ldquo;Simulasikan kecocokan&rdquo; untuk melihat
            perilaku antarmuka.
          </div>
        )}
      </div>
    </div>
  );
}
