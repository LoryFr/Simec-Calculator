import { createSignal, createMemo, For } from "solid-js";
import type { EngravingKey, ScreenUnitKey, VolumeUnitKey } from "../libraries/anilox";
import { K, SCREEN_UNITS, ENGRAVINGS, RATIOS, VOLUME_UNITS } from "../libraries/anilox";

function computeOptimumCm3m2(screenLcm: number, cellFactor: number) {
  if (screenLcm <= 0) return 0;
  return (K / Math.pow(screenLcm, 2)) * cellFactor;
}

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

  const gaugeMax = createMemo(() => Math.max(15, thresholds().max * 1.3));

  const cx = 300;
  const cy = 260;
  const r = 220;

  const valueToAngleDeg = (value: number) => {
    const clamped = Math.min(Math.max(value, 0), gaugeMax());
    return 180 - (clamped / gaugeMax()) * 180; // 180° a sinistra (0), 0° a destra (max)
  };

  const polarPoint = (angleDeg: number, radius: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  };

  const needleAngle = createMemo(() => valueToAngleDeg(thresholds().optimum));
  const needleTip = createMemo(() => polarPoint(needleAngle(), r - 40));

  const ticks = createMemo(() => {
    const gMax = gaugeMax();
    const step = gMax / 15;
    return Array.from({ length: 16 }, (_, i) => i * step);
  });

  return (
    <div>
      <div>
        <label>
          Engraving{" "}
          <select
            value={engraving()}
            onChange={(e) => setEngraving(e.currentTarget.value as EngravingKey)}
          >
            <For each={Object.entries(ENGRAVINGS) as [EngravingKey, { label: string; cellFactor: number }][]}>
              {([key, { label }]) => <option value={key}>{label}</option>}
            </For>
          </select>
        </label>

        <label>
          Screen Type{" "}
          <select
            value={screenUnit()}
            onChange={(e) => setScreenUnit(e.currentTarget.value as ScreenUnitKey)}
          >
            <For each={Object.keys(SCREEN_UNITS) as ScreenUnitKey[]}>
              {(key) => <option value={key}>{SCREEN_UNITS[key].label}</option>}
            </For>
          </select>
        </label>

        <label>
          Transfer Volume{" "}
          <select
            value={volumeUnit()}
            onChange={(e) => setVolumeUnit(e.currentTarget.value as VolumeUnitKey)}
          >
            <For each={Object.keys(VOLUME_UNITS) as VolumeUnitKey[]}>
              {(key) => <option value={key}>{VOLUME_UNITS[key].label}</option>}
            </For>
          </select>
        </label>
      </div>

      <svg viewBox="0 0 600 300" width="600" height="300">

        <For each={ticks()}>
          {(t) => {
            const p1 = polarPoint(valueToAngleDeg(t), r - 45);
            const p2 = polarPoint(valueToAngleDeg(t), r - 55);
            return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="black" stroke-width="2" />;
          }}
        </For>

        <line x1={cx} y1={cy} x2={needleTip().x} y2={needleTip().y} stroke="#888" stroke-width="6" />
        <circle cx={cx} cy={cy} r="10" fill="white" stroke="#333" stroke-width="3" />
      </svg>

      <div>
        {thresholds().optimum.toFixed(1)} {VOLUME_UNITS[volumeUnit()].label}
      </div>

      <table>
        <thead>
          <tr>
            <th>Recommended Minimum</th>
            <th>Optimum</th>
            <th>Recommended Maximum SSS</th>
            <th>Recommended Maximum</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{thresholds().min.toFixed(1)}</td>
            <td>{thresholds().optimum.toFixed(1)}</td>
            <td>{thresholds().maxSSS.toFixed(1)}</td>
            <td>{thresholds().max.toFixed(1)}</td>
          </tr>
        </tbody>
      </table>

      <div>
        <label>Anilox Screen ({SCREEN_UNITS[screenUnit()].label})</label>
        <input
          type="range"
          min="0"
          max={screenUnit() === "L/cm" ? 540 : 1400}
          step="1"
          value={screenValue()}
          onInput={(e) => setScreenValue(Number(e.currentTarget.value))}
        />
        <input
          type="number"
          value={screenValue()}
          onInput={(e) => setScreenValue(Number(e.currentTarget.value))}
        />
      </div>
    </div>
  );
}