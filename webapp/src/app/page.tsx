import Map from "@/components/map";
import type { GpsPoint } from "@/types/gps";

export default function Home() {
    const point: GpsPoint = { lat: 47.498318, lng: 8.7197 };

    return (
        <main className="h-screen w-screen">
            <Map point={point} />
        </main>
    );
}