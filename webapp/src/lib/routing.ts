import type { LatLng, RouteResult } from "@/types/routing";

type OsrmResponse = {
    code: string;
    routes: Array<{
        distance: number;
        duration: number;
        geometry: { coordinates: [number, number][] };
    }>;
};

export async function getRouteOSRM(from: LatLng, to: LatLng): Promise<RouteResult | null> {
    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    const data = (await res.json()) as OsrmResponse;
    if (data.code !== "Ok" || !data.routes?.length) return null;

    const best = data.routes[0];

    return {
        distanceMeters: best.distance,
        durationSeconds: best.duration,
        geometry: best.geometry.coordinates.map(([lon, lat]) => ({ lat, lng: lon })),
    };
}