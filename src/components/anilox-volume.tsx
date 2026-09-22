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

  // Lineatura di riferimento usata SOLO per posizionare le fasce colorate del
  // gauge — deve coincidere con la costante di calibrazione della libreria
  // (CALIBRATION_LCM in anilox.ts). Le fasce restano fisse quando muovi lo
  // slider "Anilox Screen" (comportamento del competitor Apex): non derivano
  // più da screenLcm(), ma da questo valore costante. Reagiscono comunque a
  // Engraving (roller diverso) e Transfer Volume (unità diversa), perché sono
  // scelte diverse, non un aggiustamento continuo dello stesso roller.
  const REFERENCE_SCREEN_LCM_FOR_SCALE = 230;

  const fixedZoneThresholdsCm3m2 = createMemo(() => {
    const optimum = computeOptimumCm3m2(REFERENCE_SCREEN_LCM_FOR_SCALE, ENGRAVINGS[engraving()].cellFactor);
    return {
      min: optimum * RATIOS.min,
      optimum,
      maxSSS: optimum * RATIOS.maxSSS,
      max: optimum * RATIOS.max,
    };
  });

  const fixedZoneThresholds = createMemo(() => {
    const t = fixedZoneThresholdsCm3m2();
    const conv = VOLUME_UNITS[volumeUnit()].fromCm3m2;
    return {
      min: conv(t.min),
      optimum: conv(t.optimum),
      maxSSS: conv(t.maxSSS),
      max: conv(t.max),
    };
  });

  const cx = 300;
  const cy = 260;
  const r = 220;

  const valueToAngleDeg = (value: number) => {
    const clamped = Math.min(Math.max(value, 0), gaugeMax());
    return 180 - (clamped / gaugeMax()) * 180;
  };

  const polarPoint = (angleDeg: number, radius: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  };

  // Path SVG di un arco tra due valori (non due angoli): converte prima in
  // angolo con valueToAngleDeg, poi in coordinate con polarPoint.
  const arcPath = (fromValue: number, toValue: number, radius: number) => {
    const a1 = valueToAngleDeg(fromValue);
    const a2 = valueToAngleDeg(toValue);
    const p1 = polarPoint(a1, radius);
    const p2 = polarPoint(a2, radius);
    const largeArc = Math.abs(a1 - a2) > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${largeArc} 1 ${p2.x} ${p2.y}`;
  };

  // Larghezza (in valore, non in percentuale) del margine verde attorno a optimum,
  // come frazione della distanza più stretta tra optimum e min/maxSSS — così il
  // margine resta sempre dentro [min, maxSSS], qualunque sia la lineatura scelta.
  // Puramente una scelta di visualizzazione: i 4 threshold reali in tabella non
  // cambiano, cambia solo dove taglio i colori sull'arco.
  const GREEN_ZONE_HALF_WIDTH_RATIO = 0.35;

  // Ora 6 fasce invece di 5: optimum è al centro della fascia verde (non più
  // sul suo bordo), con una fascia gialla simmetrica di "avvicinamento"
  // sia sotto che sopra il verde, prima di orange/red come già avevamo.
  // Nota: usa fixedZoneThresholds(), non thresholds() — è questo che rende
  // le fasce indipendenti dallo slider "Anilox Screen".
  const zones = createMemo(() => {
    const t = fixedZoneThresholds();
    const gMax = gaugeMax();
    const halfWidth = Math.max(0, Math.min(t.optimum - t.min, t.maxSSS - t.optimum) * GREEN_ZONE_HALF_WIDTH_RATIO);
    const greenStart = t.optimum - halfWidth;
    const greenEnd = t.optimum + halfWidth;
    return [
      { from: 0, to: t.min, colorClass: "text-red-600" },
      { from: t.min, to: greenStart, colorClass: "text-amber-400" },
      { from: greenStart, to: greenEnd, colorClass: "text-green-600" },
      { from: greenEnd, to: t.maxSSS, colorClass: "text-amber-400" },
      { from: t.maxSSS, to: t.max, colorClass: "text-orange-500" },
      { from: t.max, to: gMax, colorClass: "text-red-600" },
    ];
  });

  const needleAngle = createMemo(() => valueToAngleDeg(thresholds().optimum));
  const needleTip = createMemo(() => polarPoint(needleAngle(), r - 40));

  const ticks = createMemo(() => {
    const gMax = gaugeMax();
    const step = gMax / 15;
    return Array.from({ length: 16 }, (_, i) => i * step);
  });

  return (
    <div class="w-full space-y-8 rounded-xl border border-neutral-900 bg-neutral-950 p-6 font-sans text-neutral-800 shadow-sm">
      <div class="flex flex-wrap gap-6 border-b border-blue-500 pb-6">
        <label class="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-neutral-100">
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

      <div class="flex justify-center">
        <svg viewBox="0 0 600 300" class="w-full max-w-xl">
          <For each={zones()}>
            {(zone) => (
              <path
                d={arcPath(zone.from, zone.to, r)}
                class={zone.colorClass}
                stroke="currentColor"
                stroke-width="40"
                fill="none"
              />
            )}
          </For>

          <For each={ticks()}>
            {(t) => {
              const p1 = polarPoint(valueToAngleDeg(t), r - 45);
              const p2 = polarPoint(valueToAngleDeg(t), r - 55);
              return (
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="white" stroke-width="2" />
              );
            }}
          </For>

          <line
            x1={cx}
            y1={cy}
            x2={needleTip().x}
            y2={needleTip().y}
            stroke="#404040"
            stroke-width="6"
            stroke-linecap="round"
          />
          <circle cx={cx} cy={cy} r="10" class="fill-white stroke-neutral-700" stroke-width="3" />
        </svg>
      </div>

      <div class="text-center">
        <span class="text-3xl font-semibold tabular-nums text-neutral-900">
          {thresholds().optimum.toFixed(1)}
        </span>
        <span class="ml-1 text-lg text-neutral-500">{VOLUME_UNITS[volumeUnit()].label}</span>
      </div>

      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-blue-500">
            <th class="py-2 text-left font-medium text-neutral-100">Recommended Minimum</th>
            <th class="py-2 text-left font-medium text-neutral-100">Optimum</th>
            <th class="py-2 text-left font-medium text-neutral-100">Recommended Maximum SSS</th>
            <th class="py-2 text-left font-medium text-neutral-100">Recommended Maximum</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="py-2 font-semibold tabular-nums text-neutral-300">{thresholds().min.toFixed(1)}</td>
            <td class="py-2 font-semibold tabular-nums text-neutral-300">{thresholds().optimum.toFixed(1)}</td>
            <td class="py-2 font-semibold tabular-nums text-neutral-300">{thresholds().maxSSS.toFixed(1)}</td>
            <td class="py-2 font-semibold tabular-nums text-neutral-300">{thresholds().max.toFixed(1)}</td>
          </tr>
        </tbody>
      </table>

      <div class="space-y-2 border-t border-blue-500 pt-6">
        <label class='flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-neutral-100'>Anilox Screen ({SCREEN_UNITS[screenUnit()].label})</label>
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