import MapClient from "@/components/map-client";
import type { GpsPoint, TrackerLocationRaw } from "@/types/gps";

const FIREBASE_URL =
    "https://idpa-gps-tracker-default-rtdb.europe-west1.firebasedatabase.app/locations/test_tracker.json";

async function getInitialData(): Promise<GpsPoint> {
    const res = await fetch(FIREBASE_URL, { cache: "no-store" });
    if (!res.ok) return { lat: 47.498318, lng: 8.7197 };

    const raw = (await res.json()) as TrackerLocationRaw;

    return {
        lat: raw.lat,
        lng: raw.lon,
        alt: raw.alt,
        speed_kmh: raw.speed_kmh,
        status: raw.status,
        date: raw.date,
        time: raw.time,
        course: raw.course,
    };
}

export default async function LoadData() {
    const initialPoint = await getInitialData();
    return <MapClient initialPoint={initialPoint} />;
}