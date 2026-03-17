import type { GpsPoint } from "@/types/gps";

type Props = {
    point: GpsPoint;
    // Optionaler Prop. Logik bleibt komplett in map.tsx
    onRecenter?: () => void;
};

export default function InfoPanel({ point, onRecenter }: Props) {
    const speedDisplay =
        point.speed_kmh === null || point.speed_kmh === undefined
            ? "-"
            : Math.round(point.speed_kmh);

    return (
        <div className="absolute bottom-20 left-1/2 z-[1000] w-[90vw] max-w-[360px] -translate-x-1/2 rounded-xl bg-white/95 p-3 shadow-lg text-black">
            <div className="flex flex-row items-center justify-between gap-3">
                <p className="whitespace-nowrap leading-tight">
                    <span className="block text-center">{speedDisplay}</span>
                    <span className="block text-center">km/h</span>
                </p>
                <button
                    type="button"
                    className="rounded-md w-1/2 bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-600"
                    onClick={onRecenter}
                >
                    Re-center
                </button>
                <p>100%</p>
            </div>
        </div>
    );
}
