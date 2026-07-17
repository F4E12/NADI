"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { TONE_BADGE, formatDateTime, priorityLabel, priorityTone } from "@/lib/format";
import type { OpenComplaint } from "@/lib/data/complaints";
import type { PriorityLevel } from "@/lib/rules/heat";
import { confirmComplaintAction, resolveComplaintAction } from "./actions";

const PRIORITIES: PriorityLevel[] = ["MERAH", "KUNING", "HIJAU"];

export function ComplaintRow({
  complaint,
  canConfirm,
}: {
  complaint: OpenComplaint;
  canConfirm: boolean;
}) {
  const router = useRouter();
  const [priority, setPriority] = useState<PriorityLevel>(
    complaint.confirmedPriority ?? complaint.suggestedPriority,
  );
  const [actor, setActor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const confirmed = complaint.confirmedPriority !== null;

  function confirm() {
    setError(null);
    startTransition(async () => {
      const r = await confirmComplaintAction({
        complaintId: complaint.id,
        priority,
        actor,
      });
      if (r.ok) router.refresh();
      else setError(r.error ?? "Gagal");
    });
  }

  function resolve() {
    startTransition(async () => {
      await resolveComplaintAction(complaint.id);
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">
            {complaint.residentName}{" "}
            <span className="text-sm font-normal text-ash">
              · Keluarga {complaint.householdName} · {complaint.tentName}
            </span>
          </p>
          <p className="mt-0.5 text-sm text-graphite">
            {complaint.symptoms.join(", ") || "—"}
          </p>
          <p className="mt-0.5 text-xs text-ash">
            {formatDateTime(complaint.createdAt)}
            {complaint.source === "SELF" && " · dilaporkan sendiri"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${TONE_BADGE[priorityTone(complaint.effectivePriority)]}`}
        >
          {priorityLabel(complaint.effectivePriority)}
          {!confirmed && " (saran)"}
        </span>
      </div>

      {!canConfirm ? (
        <span className="text-xs text-ash">
          {confirmed
            ? `Dikonfirmasi oleh ${complaint.confirmedBy}`
            : "Menunggu konfirmasi Volunteer"}
        </span>
      ) : confirmed ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-ash">
            Dikonfirmasi oleh {complaint.confirmedBy}
          </span>
          <button
            type="button"
            onClick={resolve}
            disabled={pending}
            className="rounded-lg border border-fog px-3 py-1.5 text-sm hover:border-ash disabled:opacity-50"
          >
            Selesaikan
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-ash">
            Priority (konfirmasi / ubah)
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as PriorityLevel)}
              className="rounded-lg border border-fog bg-white px-3 py-1.5 text-sm outline-none focus:border-lavender"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {priorityLabel(p)}
                </option>
              ))}
            </select>
          </label>
          <input
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            placeholder="Dikonfirmasi oleh"
            className="rounded-lg border border-fog bg-white px-3 py-1.5 text-sm outline-none focus:border-lavender"
          />
          <button
            type="button"
            onClick={confirm}
            disabled={pending}
            className="rounded-lg bg-lavender px-3 py-1.5 text-sm font-medium text-white hover:bg-iris disabled:opacity-50"
          >
            Konfirmasi
          </button>
          <button
            type="button"
            onClick={resolve}
            disabled={pending}
            className="rounded-lg border border-fog px-3 py-1.5 text-sm hover:border-ash disabled:opacity-50"
          >
            Selesaikan
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </li>
  );
}
