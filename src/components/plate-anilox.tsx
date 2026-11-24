import { on } from "remix/component";
import type { Handle } from "remix/component";
import {
    PLATE_SCREEN_STEPS_LPI,
    PLATE_TO_ANILOX_TABLE,
    DOT_PERCENTAGES,
    lcmFromLpi,
} from "../libraries/plate-anilox";

const labelClass = "text-xs font-medium uppercase tracking-wide text-neutral-500";

export default function PlateToAniloxCalculator(handle: Handle) {
    // Setup: gira una volta sola.
    let stepIndex = Math.max(PLATE_SCREEN_STEPS_LPI.indexOf(85), 0);

    // Render: gira a ogni handle.update().
    return () => {
        const plateLpi = PLATE_SCREEN_STEPS_LPI[stepIndex];
        const plateLcm = Math.round(lcmFromLpi(plateLpi));
        const row = PLATE_TO_ANILOX_TABLE[plateLpi];

        return (
            <div class="w-full space-y-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6 font-sans text-neutral-800 shadow-sm">
                {/* Valori correnti */}
                <div class="flex justify-center gap-8">
                    <div class="text-center">
                        <div class={labelClass}>LPI</div>
                        <div class="mt-1 rounded-md bg-neutral-800 text-neutral-50 border border-neutral-600 px-6 py-3 text-2xl font-semibold tabular-nums">
                            {plateLpi}
                        </div>
                    </div>
                    <div class="text-center">
                        <div class={labelClass}>L/cm</div>
                        <div class="mt-1 rounded-md bg-neutral-800 text-neutral-50 border border-neutral-600 px-6 py-3 text-2xl font-semibold tabular-nums">
                            {plateLcm}
                        </div>
                    </div>
                </div>

                {/* Slider a indice, con tacche sui valori reali (non equidistanti) */}
                <div class="space-y-2">
                    <input
                        type="range"
                        min={0}
                        max={PLATE_SCREEN_STEPS_LPI.length - 1}
                        step={1}
                        value={String(stepIndex)}
                        mix={on("input", (e) => {
                            stepIndex = Number(e.currentTarget.value);
                            handle.update();
                        })}
                        class="h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-800 border border-neutral-600 accent-blue-500"
                    />
                    <div class="flex justify-between text-xs text-neutral-500">
                        {PLATE_SCREEN_STEPS_LPI.map((v) => (
                            <span key={v}>{v}</span>
                        ))}
                    </div>
                </div>

                {/* Le tre raccomandazioni anilox per dot% */}
                <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {DOT_PERCENTAGES.map((dot) => {
                        const rec = row?.[dot];
                        return (
                            <div key={dot} class="overflow-hidden rounded-md border border-neutral-600">
                                <div class="flex items-center justify-between bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
                                    <span>Anilox screen required to print {dot} dot</span>
                                    <span class="rounded bg-neutral-800 px-2 py-0.5 text-xs">{dot}</span>
                                </div>
                                <div class="p-4">
                                    {rec ? (
                                        <div class="grid grid-cols-3 gap-2 text-center">
                                            <div>
                                                <div class={labelClass}>GTT Profile</div>
                                                <div class="mt-1 rounded bg-neutral-800 text-neutral-50 px-2 py-2 text-sm font-semibold">
                                                    {rec.profile}
                                                </div>
                                            </div>
                                            <div>
                                                <div class={labelClass}>LPI</div>
                                                <div class="mt-1 rounded bg-neutral-800 text-neutral-50 px-2 py-2 text-sm font-semibold tabular-nums">
                                                    {rec.lpi}
                                                </div>
                                            </div>
                                            <div>
                                                <div class={labelClass}>L/cm</div>
                                                <div class="mt-1 rounded bg-neutral-800 text-neutral-50 px-2 py-2 text-sm font-semibold tabular-nums">
                                                    {rec.lcm}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div class="text-center text-sm text-neutral-400">
                                            Dato non ancora in tabella per {plateLpi} LPI
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };
}
