import type { GpsPoint } from "@/types/gps";

type Props = {
    point: GpsPoint;
};

export default function InfoPanel({ point }: Props) {
    return (
        <div>
            <p>{point.speed_kmh ?? "-"} km/h</p>
            <button>Re-center</button>
        </div>
    );
}
