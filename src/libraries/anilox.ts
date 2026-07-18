export type EngravingKey = "H60" | "H45" | "H30";

export const ENGRAVINGS: Record<EngravingKey, { label: string; cellFactor: number }> = {
  H60: { label: "H60 — Hex 60°", cellFactor: 1.0 },
  H45: { label: "H45 — Hex 45°", cellFactor: 0.87 },
  H30: { label: "H30 — Hex 30°", cellFactor: 1.0 },
};

export type ScreenUnitKey = "L/cm" | "LPI";
export const SCREEN_UNITS: Record<ScreenUnitKey, { label: string; toLcm: (v: number) => number }> = {
  "L/cm": { label: "L/cm", toLcm: (v) => v },
  LPI: { label: "LPI", toLcm: (v) => v / 2.54 },
};

export type VolumeUnitKey = "cm3/m2" | "BCM";
export const VOLUME_UNITS: Record<VolumeUnitKey, { label: string; fromCm3m2: (v: number) => number }> = {
  "cm3/m2": { label: "cm³/m²", fromCm3m2: (v) => v },
  BCM: { label: "BCM", fromCm3m2: (v) => v / 1.55 },
};

export const RATIOS = { min: 0.6, maxSSS: 1.42, max: 1.7 };

const CALIBRATION_LCM = 230;
const CALIBRATION_OPTIMUM = 5.0;
export const K = CALIBRATION_OPTIMUM * Math.pow(CALIBRATION_LCM, 2);

export function computeOptimumCm3m2(screenLcm: number, cellFactor: number) {
  if (screenLcm <= 0) return 0;
  return (K / Math.pow(screenLcm, 2)) * cellFactor;
}

export const GAUGE_MAX_CM3M2 = 15;