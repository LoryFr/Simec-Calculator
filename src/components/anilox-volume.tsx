import { createSignal, createMemo, For } from "solid-js";
import type { EngravingKey, ScreenUnitKey, VolumeUnitKey } from "../libraries/anilox";
import { K, SCREEN_UNITS, ENGRAVINGS, RATIOS, VOLUME_UNITS, computeOptimumCm3m2, GAUGE_MAX_CM3M2 } from "../libraries/anilox";

export default function AniloxCalculator() {
  const [engraving, setEngraving] = createSignal<EngravingKey>("H60");
  const [screenUnit, setScreenUnit] = createSignal<ScreenUnitKey>("L/cm");
  const [volumeUnit, setVolumeUnit] = createSignal<VolumeUnitKey>("cm3/m2");
  const [screenValue, setScreenValue] = createSignal(230);

  const screenLcm = createMemo(() => SCREEN_UNITS[screenUnit()].toLcm(screenValue()));

  const thresholdsCm3m2 = createMemo(() => {
    const optimum = computeOptimumCm3m2(screenLcm(), ENGRAVINGS[engraving()].cellFactor);
    return {
      min: optimum * RATIOS.min,
      optimum,
      maxSSS: optimum * RATIOS.maxSSS,
      max: optimum * RATIOS.max,
    };
  });

  const thresholds = createMemo(() => {
    const t = thresholdsCm3m2();
    const conv = VOLUME_UNITS[volumeUnit()].fromCm3m2;
    return {
      min: conv(t.min),
      optimum: conv(t.optimum),
      maxSSS: conv(t.maxSSS),
      max: conv(t.max),
    };
  });

  const gaugeMax = createMemo(() => VOLUME_UNITS[volumeUnit()].fromCm3m2(GAUGE_MAX_CM3M2));

  // Percentuale [0-100] di un valore lungo la barra, rispetto alla scala fissa gaugeMax.
  // Sostituisce valueToAngleDeg/polarPoint del vecchio gauge: qui basta una posizione
  // lineare, non serve trigonometria.
  const pct = (value: number) => {
    const gMax = gaugeMax();
    const clamped = Math.min(Math.max(value, 0), gMax);
    return (clamped / gMax) * 100;
  };

  // Percentuali delle 4 soglie, usate sia per larghezza/posizione delle zone
  // colorate sia per posizionare le etichette sopra la barra.
  const zonePct = createMemo(() => {
    const t = thresholds();
    return {
      min: pct(t.min),
      optimum: pct(t.optimum),
      maxSSS: pct(t.maxSSS),
      max: pct(t.max),
    };
  });

  return (
    <div class="w-full space-y-8 rounded-xl border border-neutral-200 bg-white p-6 font-sans text-neutral-800 shadow-sm">
      <div class="flex flex-wrap gap-6 border-b border-neutral-200 pb-6">
        <label class="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Engraving{" "}
          <select
            class="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            value={engraving()}
            onChange={(e) => setEngraving(e.currentTarget.value as EngravingKey)}
          >
            <For each={Object.entries(ENGRAVINGS) as [EngravingKey, { label: string; cellFactor: number }][]}>
              {([key, { label }]) => <option value={key}>{label}</option>}
            </For>
          </select>
        </label>

        <label class="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Screen Type{" "}
          <select
            class="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            value={screenUnit()}
            onChange={(e) => setScreenUnit(e.currentTarget.value as ScreenUnitKey)}
          >
            <For each={Object.keys(SCREEN_UNITS) as ScreenUnitKey[]}>
              {(key) => <option value={key}>{SCREEN_UNITS[key].label}</option>}
            </For>
          </select>
        </label>

        <label class="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Transfer Volume{" "}
          <select
            class="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            value={volumeUnit()}
            onChange={(e) => setVolumeUnit(e.currentTarget.value as VolumeUnitKey)}
          >
            <For each={Object.keys(VOLUME_UNITS) as VolumeUnitKey[]}>
              {(key) => <option value={key}>{VOLUME_UNITS[key].label}</option>}
            </For>
          </select>
        </label>
      </div>

      {/* Meter orizzontale al posto del gauge semicircolare — stessa scala fissa
          (gaugeMax), stessi 4 threshold, ma posizione lineare invece di angolo */}
      <div class="pt-2">
        <div class="relative h-7 overflow-hidden rounded-md">
          <div
            class="absolute inset-y-0 bg-red-600"
            style={{ left: "0%", width: `${zonePct().min}%` }}
          />
          <div
            class="absolute inset-y-0 bg-green-600"
            style={{ left: `${zonePct().min}%`, width: `${zonePct().optimum - zonePct().min}%` }}
          />
          <div
            class="absolute inset-y-0 bg-amber-400"
            style={{ left: `${zonePct().optimum}%`, width: `${zonePct().maxSSS - zonePct().optimum}%` }}
          />
          <div
            class="absolute inset-y-0 bg-orange-500"
            style={{ left: `${zonePct().maxSSS}%`, width: `${zonePct().max - zonePct().maxSSS}%` }}
          />
          <div
            class="absolute inset-y-0 bg-red-600"
            style={{ left: `${zonePct().max}%`, width: `${100 - zonePct().max}%` }}
          />
          {/* Marcatore del valore optimum calcolato */}
          <div
            class="absolute top-[-6px] h-9 w-0.5 -translate-x-1/2 bg-neutral-900"
            style={{ left: `${zonePct().optimum}%` }}
          />
        </div>

        {/* Etichette delle 4 soglie, posizionate con la stessa percentuale delle zone */}
        <div class="relative mt-1 h-5">
          <span
            class="absolute -translate-x-1/2 text-xs text-neutral-500 tabular-nums"
            style={{ left: `${zonePct().min}%` }}
          >
            {thresholds().min.toFixed(1)}
          </span>
          <span
            class="absolute -translate-x-1/2 text-xs font-semibold text-neutral-900 tabular-nums"
            style={{ left: `${zonePct().optimum}%` }}
          >
            {thresholds().optimum.toFixed(1)}
          </span>
          <span
            class="absolute -translate-x-1/2 text-xs text-neutral-500 tabular-nums"
            style={{ left: `${zonePct().maxSSS}%` }}
          >
            {thresholds().maxSSS.toFixed(1)}
          </span>
          <span
            class="absolute -translate-x-1/2 text-xs text-neutral-500 tabular-nums"
            style={{ left: `${zonePct().max}%` }}
          >
            {thresholds().max.toFixed(1)}
          </span>
        </div>

        {/* Estremi della scala fissa */}
        <div class="mt-1 flex justify-between text-xs text-neutral-400">
          <span>0</span>
          <span>{VOLUME_UNITS[volumeUnit()].label}</span>
          <span class="tabular-nums">{gaugeMax().toFixed(1)}</span>
        </div>
      </div>

      <div class="text-center">
        <span class="text-3xl font-semibold tabular-nums text-neutral-900">
          {thresholds().optimum.toFixed(1)}
        </span>
        <span class="ml-1 text-lg text-neutral-500">{VOLUME_UNITS[volumeUnit()].label}</span>
      </div>

      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-neutral-200">
            <th class="py-2 text-left font-medium text-neutral-500">Recommended Minimum</th>
            <th class="py-2 text-left font-medium text-neutral-500">Optimum</th>
            <th class="py-2 text-left font-medium text-neutral-500">Recommended Maximum SSS</th>
            <th class="py-2 text-left font-medium text-neutral-500">Recommended Maximum</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="py-2 font-semibold tabular-nums text-neutral-800">{thresholds().min.toFixed(1)}</td>
            <td class="py-2 font-semibold tabular-nums text-neutral-800">{thresholds().optimum.toFixed(1)}</td>
            <td class="py-2 font-semibold tabular-nums text-neutral-800">{thresholds().maxSSS.toFixed(1)}</td>
            <td class="py-2 font-semibold tabular-nums text-neutral-800">{thresholds().max.toFixed(1)}</td>
          </tr>
        </tbody>
      </table>

      <div class="space-y-2 border-t border-neutral-200 pt-6">
        <label class='flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-neutral-500'>Anilox Screen ({SCREEN_UNITS[screenUnit()].label})</label>
        <div class="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max={screenUnit() === "L/cm" ? 540 : 1400}
            step="1"
            value={screenValue()}
            onInput={(e) => setScreenValue(Number(e.currentTarget.value))}
            class="h-2 w-full flex-1 cursor-pointer appearance-none rounded-full bg-neutral-200 accent-neutral-700"
          />
          <input
            type="number"
            value={screenValue()}
            onInput={(e) => setScreenValue(Number(e.currentTarget.value))}
            class="w-24 rounded-md border border-neutral-300 px-2 py-1.5 text-sm tabular-nums shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
      </div>
    </div>
  );
}