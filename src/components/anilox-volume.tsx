import { on } from "remix/component";
import type { Handle } from "remix/component";
import type { EngravingKey, ScreenUnitKey, VolumeUnitKey } from "../libraries/anilox";
import { SCREEN_UNITS, ENGRAVINGS, RATIOS, VOLUME_UNITS, computeOptimumCm3m2, GAUGE_MAX_CM3M2 } from "../libraries/anilox";

// Costanti e helper puri: non dipendono dallo stato, stanno fuori dal componente.

// Lineatura di riferimento usata SOLO per posizionare le fasce colorate del
// gauge — deve coincidere con CALIBRATION_LCM in anilox.ts. Le fasce restano
// fisse quando muovi lo slider "Anilox Screen", ma reagiscono a Engraving e
// Transfer Volume.
const REFERENCE_SCREEN_LCM_FOR_SCALE = 230;

// Mezza larghezza del verde attorno a optimum, come frazione della distanza più
// stretta tra optimum e min/maxSSS: il verde resta sempre dentro [min, maxSSS].
const GREEN_ZONE_HALF_WIDTH_RATIO = 0.35;

const cx = 300;
const cy = 260;
const r = 220;

const computeThresholds = (screenLcm: number, engraving: EngravingKey, volumeUnit: VolumeUnitKey) => {
  const optimum = computeOptimumCm3m2(screenLcm, ENGRAVINGS[engraving].cellFactor);
  const conv = VOLUME_UNITS[volumeUnit].fromCm3m2;
  return {
    min: conv(optimum * RATIOS.min),
    optimum: conv(optimum),
    maxSSS: conv(optimum * RATIOS.maxSSS),
    max: conv(optimum * RATIOS.max),
  };
};

const polarPoint = (angleDeg: number, radius: number) => {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
};

const selectClass =
  "rounded-md border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-400";
const labelClass = "flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-neutral-100";

export default function AniloxCalculator(handle: Handle) {
  // Setup: gira una volta sola. Lo stato è fatto di variabili normali.
  let engraving: EngravingKey = "H60";
  let screenUnit: ScreenUnitKey = "L/cm";
  let volumeUnit: VolumeUnitKey = "cm3/m2";
  let screenValue = 230;

  // Render: gira a ogni handle.update(). I createMemo di Solid diventano
  // semplici calcoli qui dentro.
  return () => {
    const screenLcm = SCREEN_UNITS[screenUnit].toLcm(screenValue);
    const thresholds = computeThresholds(screenLcm, engraving, volumeUnit);
    const fixed = computeThresholds(REFERENCE_SCREEN_LCM_FOR_SCALE, engraving, volumeUnit);
    const gaugeMax = VOLUME_UNITS[volumeUnit].fromCm3m2(GAUGE_MAX_CM3M2);

    const valueToAngleDeg = (value: number) => {
      const clamped = Math.min(Math.max(value, 0), gaugeMax);
      return 180 - (clamped / gaugeMax) * 180;
    };

    const arcPath = (fromValue: number, toValue: number, radius: number) => {
      const a1 = valueToAngleDeg(fromValue);
      const a2 = valueToAngleDeg(toValue);
      const p1 = polarPoint(a1, radius);
      const p2 = polarPoint(a2, radius);
      const largeArc = Math.abs(a1 - a2) > 180 ? 1 : 0;
      return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${largeArc} 1 ${p2.x} ${p2.y}`;
    };

    const halfWidth = Math.max(
      0,
      Math.min(fixed.optimum - fixed.min, fixed.maxSSS - fixed.optimum) * GREEN_ZONE_HALF_WIDTH_RATIO,
    );
    const greenStart = fixed.optimum - halfWidth;
    const greenEnd = fixed.optimum + halfWidth;
    const zones = [
      { from: 0, to: fixed.min, colorClass: "text-red-600" },
      { from: fixed.min, to: greenStart, colorClass: "text-amber-400" },
      { from: greenStart, to: greenEnd, colorClass: "text-green-600" },
      { from: greenEnd, to: fixed.maxSSS, colorClass: "text-amber-400" },
      { from: fixed.maxSSS, to: fixed.max, colorClass: "text-orange-500" },
      { from: fixed.max, to: gaugeMax, colorClass: "text-red-600" },
    ];

    const needleTip = polarPoint(valueToAngleDeg(thresholds.optimum), r - 40);
    const ticks = Array.from({ length: 16 }, (_, i) => (i * gaugeMax) / 15);

    const setScreen = (value: string) => {
      screenValue = Number(value);
      handle.update();
    };

    return (
      <div class="w-full space-y-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6 font-sans text-neutral-800 shadow-sm">
        <div class="flex flex-wrap gap-6 border-b border-blue-500 pb-6">
          <label class={labelClass}>
            Engraving{" "}
            <select
              class={selectClass}
              value={engraving}
              mix={on("change", (e) => {
                engraving = e.currentTarget.value as EngravingKey;
                handle.update();
              })}
            >
              {(Object.entries(ENGRAVINGS) as [EngravingKey, { label: string }][]).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </label>

          <label class={labelClass}>
            Screen Type{" "}
            <select
              class={selectClass}
              value={screenUnit}
              mix={on("change", (e) => {
                screenUnit = e.currentTarget.value as ScreenUnitKey;
                handle.update();
              })}
            >
              {(Object.keys(SCREEN_UNITS) as ScreenUnitKey[]).map((key) => (
                <option key={key} value={key}>{SCREEN_UNITS[key].label}</option>
              ))}
            </select>
          </label>

          <label class={labelClass}>
            Transfer Volume{" "}
            <select
              class={selectClass}
              value={volumeUnit}
              mix={on("change", (e) => {
                volumeUnit = e.currentTarget.value as VolumeUnitKey;
                handle.update();
              })}
            >
              {(Object.keys(VOLUME_UNITS) as VolumeUnitKey[]).map((key) => (
                <option key={key} value={key}>{VOLUME_UNITS[key].label}</option>
              ))}
            </select>
          </label>
        </div>

        <div class="flex justify-center">
          <svg viewBox="0 0 600 300" class="w-full max-w-xl">
            {zones.map((zone, i) => (
              <path
                key={i}
                d={arcPath(zone.from, zone.to, r)}
                class={zone.colorClass}
                stroke="currentColor"
                stroke-width="40"
                fill="none"
              />
            ))}

            {ticks.map((t, i) => {
              const p1 = polarPoint(valueToAngleDeg(t), r - 45);
              const p2 = polarPoint(valueToAngleDeg(t), r - 55);
              return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="white" stroke-width="2" />;
            })}

            <line
              x1={cx}
              y1={cy}
              x2={needleTip.x}
              y2={needleTip.y}
              stroke="#404040"
              stroke-width="6"
              stroke-linecap="round"
            />
            <circle cx={cx} cy={cy} r="10" class="fill-white stroke-neutral-700" stroke-width="3" />
          </svg>
        </div>

        <div class="text-center">
          <span class="text-3xl font-semibold tabular-nums text-neutral-50">{thresholds.optimum.toFixed(1)}</span>
          <span class="ml-1 text-lg text-neutral-300">{VOLUME_UNITS[volumeUnit].label}</span>
        </div>

        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Recommended Minimum", value: thresholds.min },
            { label: "Optimum", value: thresholds.optimum },
            { label: "Recommended Maximum SSS", value: thresholds.maxSSS },
            { label: "Recommended Maximum", value: thresholds.max },
          ].map(({ label, value }) => (
            <div key={label} class="rounded-md border border-neutral-700 bg-neutral-800 p-3">
              <div class="text-[11px] font-medium uppercase leading-tight tracking-wide text-neutral-400">
                {label}
              </div>
              <div class="mt-1 text-lg font-semibold tabular-nums text-neutral-50">
                {value.toFixed(1)}
              </div>
            </div>
          ))}
        </div>

        <div class="space-y-2 border-t border-blue-500 pt-6">
          <label class={labelClass}>Anilox Screen ({SCREEN_UNITS[screenUnit].label})</label>
          <div class="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max={screenUnit === "L/cm" ? 540 : 1400}
              step="1"
              value={String(screenValue)}
              mix={on("input", (e) => setScreen(e.currentTarget.value))}
              class="h-2 w-full flex-1 cursor-pointer appearance-none rounded-full bg-neutral-800 border border-neutral-600 accent-blue-500"
            />
            <input
              type="number"
              value={String(screenValue)}
              mix={on("input", (e) => setScreen(e.currentTarget.value))}
              class="w-24 rounded-md border border-neutral-600 bg-neutral-800 px-2 py-1.5 text-sm tabular-nums text-neutral-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
          </div>
        </div>
      </div>
    );
  };
}
