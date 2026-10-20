import type { PointerEvent as ReactPointerEvent } from "react";
import type { StageItem, StageKind } from "@/lib/domain";
import { STAGE_H, STAGE_W } from "@/lib/stageplot";

const AUDIENCE_H = 70;
export const VIEW_H = STAGE_H + AUDIENCE_H;

/** Mid-tone colours that read on both the dark and light themes. */
const COLOR: Record<StageKind, string> = {
  drums: "#a78bfa",
  bass_amp: "#f59e0b",
  guitar_amp: "#fb923c",
  keys: "#60a5fa",
  vocal: "#f472b6",
  acoustic: "#facc15",
  wedge: "#34d399",
  di: "#94a3b8",
  playback: "#22d3ee",
  person: "#e2e8f0",
  power: "#ef4444",
  other: "#94a3b8",
};

/** Compress channel numbers: [1,2,3,5] → "1–3, 5". */
export function channelRanges(nums: number[]): string {
  const sorted = [...nums].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i];
    while (sorted[i + 1] === sorted[i] + 1) i++;
    parts.push(start === sorted[i] ? `${start}` : `${start}–${sorted[i]}`);
  }
  return parts.join(", ");
}

function Shape({ kind, color }: { kind: StageKind; color: string }) {
  const common = { fill: color, fillOpacity: 0.22, stroke: color, strokeWidth: 3 };
  switch (kind) {
    case "drums":
      return (
        <g>
          <circle r={62} {...common} />
          <circle cx={-34} cy={-22} r={16} {...common} />
          <circle cx={34} cy={-22} r={16} {...common} />
          <circle cx={0} cy={18} r={24} {...common} />
        </g>
      );
    case "bass_amp":
    case "guitar_amp":
      return <rect x={-55} y={-30} width={110} height={60} rx={6} {...common} />;
    case "keys":
      return <rect x={-80} y={-22} width={160} height={44} rx={4} {...common} />;
    case "vocal":
      return (
        <g>
          <line x1={0} y1={0} x2={22} y2={-22} stroke={color} strokeWidth={4} />
          <circle r={15} {...common} />
        </g>
      );
    case "acoustic":
      return <ellipse rx={28} ry={40} {...common} />;
    case "wedge":
      return <path d="M -42 18 L 42 18 L 30 -18 L -30 -18 Z" {...common} />;
    case "di":
      return <rect x={-16} y={-16} width={32} height={32} rx={4} {...common} />;
    case "playback":
      return <rect x={-36} y={-24} width={72} height={48} rx={4} {...common} />;
    case "person":
      return <circle r={24} {...common} />;
    case "power":
      return (
        <g>
          <rect x={-18} y={-14} width={36} height={28} rx={4} {...common} />
          <text textAnchor="middle" dy={7} fontSize={20} fill={color}>
            ⚡
          </text>
        </g>
      );
    default:
      return <rect x={-30} y={-20} width={60} height={40} rx={10} {...common} />;
  }
}

/** Half-height of each shape, so labels sit just below it. */
const LABEL_OFFSET: Partial<Record<StageKind, number>> = {
  drums: 82,
  bass_amp: 50,
  guitar_amp: 50,
  keys: 42,
  vocal: 36,
  acoustic: 60,
  wedge: 38,
  playback: 44,
  person: 44,
};

export function StagePlot({
  items,
  channels,
  labels,
  selectedId,
  onItemPointerDown,
  svgRef,
  className = "",
}: {
  items: StageItem[];
  /** input id → channel number */
  channels: Map<string, number>;
  labels: { audience: string; back: string };
  selectedId?: string | null;
  onItemPointerDown?: (e: ReactPointerEvent<SVGGElement>, item: StageItem) => void;
  svgRef?: React.Ref<SVGSVGElement>;
  className?: string;
}) {
  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${STAGE_W} ${VIEW_H}`}
      className={`block h-auto w-full touch-none select-none ${className}`}
      role="img"
    >
      <rect x={0} y={0} width={STAGE_W} height={STAGE_H} fill="var(--stage)" stroke="var(--stage-line)" strokeWidth={4} rx={8} />
      <text x={STAGE_W / 2} y={26} textAnchor="middle" fontSize={16} letterSpacing={3} fill="var(--muted)">
        {labels.back}
      </text>
      <rect x={0} y={STAGE_H + 12} width={STAGE_W} height={AUDIENCE_H - 12} fill="var(--surface-2)" rx={8} />
      <text x={STAGE_W / 2} y={STAGE_H + 50} textAnchor="middle" fontSize={20} letterSpacing={6} fill="var(--muted)">
        {labels.audience}
      </text>

      {items.map((item) => {
        const color = COLOR[item.kind];
        const chs = item.inputIds.map((id) => channels.get(id)).filter((n): n is number => n !== undefined);
        const selected = item.id === selectedId;
        const off = LABEL_OFFSET[item.kind] ?? 36;
        return (
          <g
            key={item.id}
            data-stage-item=""
            transform={`translate(${item.x * STAGE_W} ${item.y * STAGE_H})`}
            onPointerDown={onItemPointerDown ? (e) => onItemPointerDown(e, item) : undefined}
            style={onItemPointerDown ? { cursor: "grab" } : undefined}
          >
            {selected && <circle r={off + 6} fill="none" stroke="var(--accent)" strokeWidth={3} strokeDasharray="8 6" />}
            <Shape kind={item.kind} color={color} />
            <text y={off} textAnchor="middle" fontSize={20} fontWeight={600} fill="var(--text)">
              {item.label}
            </text>
            {chs.length > 0 && (
              <text y={off + 22} textAnchor="middle" fontSize={16} fill={color} fontFamily="var(--font-mono)">
                CH {channelRanges(chs)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
