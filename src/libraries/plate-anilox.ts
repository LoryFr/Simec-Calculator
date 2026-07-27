export const PLATE_SCREEN_STEPS_LPI = [
    55, 65, 70, 85, 100, 110, 120, 133, 140, 150, 175, 200, 223,
] as const;

export type DotPercent = "1%" | "3%" | "5%";
export const DOT_PERCENTAGES: DotPercent[] = ["1%", "3%", "5%"];

export interface AniloxRecommendation {
    profile: string;
    lpi: number;
    lcm: number;
}

export type PlateToAniloxRow = Record<DotPercent, AniloxRecommendation>;

export function lcmFromLpi(lpi: number) {
    return lpi / 2.54;
}

export const PLATE_TO_ANILOX_TABLE: Partial<Record<number, PlateToAniloxRow>> = {
    85: {
        "1%": { profile: "GTT M", lpi: 700, lcm: 275 },
        "3%": { profile: "GTT L-M", lpi: 425, lcm: 170 },
        "5%": { profile: "GTT L", lpi: 350, lcm: 140 },
    },
    // 55: { "1%": {...}, "3%": {...}, "5%": {...} },
    // 65: { ... },
    // 70: { ... },
    // 100: { ... },
    // 110: { ... },
    // 120: { ... },
    // 133: { ... },
    // 140: { ... },
    // 150: { ... },
    // 175: { ... },
    // 200: { ... },
    // 223: { ... },
};