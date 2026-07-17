"use client";

import { useState } from "react";
import Link from "next/link";
import type { TentHeat } from "@/lib/data/heat";
import type { PriorityLevel } from "@/lib/rules/heat";
import { tentHeatCells, type HeatCellKey } from "@/lib/heat-cells";
import { priorityLabel } from "@/lib/format";

const COLUMNS: Array<{ key: HeatCellKey; label: string }> = [
  { key: "chronic", label: "Kronis" },
  { key: "sick", label: "Sakit" },
  { key: "complaints", label: "Keluhan" },
  { key: "occupancy", label: "Okupansi" },
  { key: "cover", label: "Cover (hari)" },
];

const LEVEL_BG = [
  "var(--color-mist)",
  "color-mix(in oklab, var(--color-ember) 45%, white)",
  "var(--color-ember)",
  "var(--color-ember-deep)",
] as const;
const LEVEL_LABELS = [
  "Tenang",
  "Alasan Hijau",
  "Alasan Kuning",
  "Alasan Merah",
] as const;

const STATUS_DOT: Record<PriorityLevel, string> = {
  MERAH: "bg-ember",
  KUNING: "bg-amber",
  HIJAU: "bg-mint",
};

type Tooltip = { x: number; y: number; title: string; detail: string };

export function HeatGrid({ tents }: { tents: TentHeat[] }) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const showTooltip = (
    el: HTMLElement,
    title: string,
    detail: string,
  ) => {
    const rect = el.getBoundingClientRect();
    setTooltip({ x: rect.left + rect.width / 2, y: rect.top - 8, title, detail });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-xl border border-fog bg-white p-4">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[minmax(150px,1.6fr)_repeat(5,minmax(64px,1fr))] gap-0.5">
            <div />
            {COLUMNS.map((col) => (
              <div
                key={col.key}
                className="px-1 pb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-ash"
              >
                {col.label}
              </div>
            ))}

            {tents.map((tent) => {
              const cells = tentHeatCells(tent);
              return (
                <div key={tent.id} className="col-span-6 grid grid-cols-subgrid">
                  <Link
                    href={`/heat/${tent.id}`}
                    className="group flex items-center gap-2 rounded-md py-1 pr-3 text-sm font-medium hover:text-sky"
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[tent.heat.colour]}`}
                      title={priorityLabel(tent.heat.colour)}
                    />
                    <span className="truncate group-hover:underline">
                      {tent.name}
                    </span>
                  </Link>
                  {cells.map((cell, i) => (
                    <div
                      key={cell.key}
                      tabIndex={0}
                      aria-label={`${tent.name}, ${COLUMNS[i].label}: ${cell.detail}`}
                      className="flex h-10 cursor-default items-center justify-center rounded-md text-xs font-semibold outline-offset-2 transition-transform hover:scale-[1.06] focus-visible:scale-[1.06]"
                      style={{
                        background: LEVEL_BG[cell.level],
                        color:
                          cell.level === 3
                            ? "var(--color-paper-white)"
                            : "var(--color-carbon)",
                      }}
                      onMouseEnter={(e) =>
                        showTooltip(e.currentTarget, tent.name, cell.detail)
                      }
                      onMouseLeave={() => setTooltip(null)}
                      onFocus={(e) =>
                        showTooltip(e.currentTarget, tent.name, cell.detail)
                      }
                      onBlur={() => setTooltip(null)}
                    >
                      {cell.value}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-graphite">
        {LEVEL_LABELS.map((label, level) => (
          <span key={label} className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ background: LEVEL_BG[level] }}
            />
            {label}
          </span>
        ))}
      </div>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg bg-carbon px-3 py-2 text-xs text-white shadow-subtle-3"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="font-semibold">{tooltip.title}</p>
          <p className="mt-0.5 text-white/75">{tooltip.detail}</p>
        </div>
      )}
    </div>
  );
}
