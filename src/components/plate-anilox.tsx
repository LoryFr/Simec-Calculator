import { createSignal, createMemo, For } from "solid-js";
import {
    PLATE_SCREEN_STEPS_LPI,
    PLATE_TO_ANILOX_TABLE,
    DOT_PERCENTAGES,
    lcmFromLpi,
} from "../libraries/plate-anilox";

export default function PlateToAniloxCalculator() {
    const initialIndex = Math.max(PLATE_SCREEN_STEPS_LPI.indexOf(85), 0);
    const [stepIndex, setStepIndex] = createSignal(initialIndex);

    const plateLpi = createMemo(() => PLATE_SCREEN_STEPS_LPI[stepIndex()]);
    const plateLcm = createMemo(() => Math.round(lcmFromLpi(plateLpi())));
    const row = createMemo(() => PLATE_TO_ANILOX_TABLE[plateLpi()]);

    const labelClass = "text-xs font-medium uppercase tracking-wide text-neutral-500";

    return (
        <div class="space-y-8 rounded-xl border border-neutral-200 bg-white p-6 font-sans text-neutral-800 shadow-sm">
            <div class="rounded-md bg-orange-700 px-4 py-3 text-lg font-semibold text-white">Plate Screen</div>

            {/* Valori correnti */}
            <div class="flex justify-center gap-8">
                <div class="text-center">
                    <div class={labelClass}>LPI</div>
                    <div class="mt-1 rounded-md bg-neutral-100 px-6 py-3 text-2xl font-semibold tabular-nums">
                        {plateLpi()}
                    </div>
                </div>
                <div class="text-center">
                    <div class={labelClass}>L/cm</div>
                    <div class="mt-1 rounded-md bg-neutral-100 px-6 py-3 text-2xl font-semibold tabular-nums">
                        {plateLcm()}
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
                    value={stepIndex()}
                    onInput={(e) => setStepIndex(Number(e.currentTarget.value))}
                    class="h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-200 accent-neutral-700"
                />
                <div class="flex justify-between text-xs text-neutral-500">
                    <For each={PLATE_SCREEN_STEPS_LPI}>{(v) => <span>{v}</span>}</For>
                </div>
            </div>

            {/* Le tre raccomandazioni anilox per dot% */}
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                <For each={DOT_PERCENTAGES}>
                    {(dot) => {
                        const rec = () => row()?.[dot];
                        return (
                            <div class="overflow-hidden rounded-md border border-neutral-200">
                                <div class="flex items-center justify-between bg-orange-700 px-4 py-2 text-sm font-semibold text-white">
                                    <span>Anilox screen required to print {dot} dot</span>
                                    <span class="rounded bg-neutral-800 px-2 py-0.5 text-xs">{dot}</span>
                                </div>
                                <div class="p-4">
                                    {rec() ? (
                                        <div class="grid grid-cols-3 gap-2 text-center">
                                            <div>
                                                <div class={labelClass}>GTT Profile</div>
                                                <div class="mt-1 rounded bg-neutral-100 px-2 py-2 text-sm font-semibold">
                                                    {rec()!.profile}
                                                </div>
                                            </div>
                                            <div>
                                                <div class={labelClass}>LPI</div>
                                                <div class="mt-1 rounded bg-neutral-100 px-2 py-2 text-sm font-semibold tabular-nums">
                                                    {rec()!.lpi}
                                                </div>
                                            </div>
                                            <div>
                                                <div class={labelClass}>L/cm</div>
                                                <div class="mt-1 rounded bg-neutral-100 px-2 py-2 text-sm font-semibold tabular-nums">
                                                    {rec()!.lcm}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div class="text-center text-sm text-neutral-400">
                                            Dato non ancora in tabella per {plateLpi()} LPI
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }}
                </For>
            </div>
        </div>
    );
}