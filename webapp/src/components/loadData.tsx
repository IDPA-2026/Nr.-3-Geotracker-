import type { GpsPoint, TrackerLocationRaw } from "@/types/gps";
import MapClient from "@/components/map-client";

function getMockTrackerData(): TrackerLocationRaw {
    return {
        alt: 487.8,
        course: 0,
        date: "040326",
        lat: 47.498318,
        lon: 8.7197,
        speed_kmh: 0,
        status: "online",
        time: "103156.000",
    };
}

export default async function LoadData() {
    const raw = getMockTrackerData();

    const point: GpsPoint = {
        lat: raw.lat,
        lng: raw.lon,
    };

    return <MapClient point={point} />;
}