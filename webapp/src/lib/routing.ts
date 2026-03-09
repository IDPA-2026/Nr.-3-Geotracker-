import type { LatLng, RouteResult, RoutingProfile } from "@/types/routing";

type OsrmResponse = {
    code: string;
    routes: Array<{
        distance: number;
        duration: number;
        geometry: { coordinates: [number, number][] };
    }>;
};

const OSRM_BASE: Record<RoutingProfile, string> = {
    driving: "https://routing.openstreetmap.de/routed-car",
    cycling: "https://routing.openstreetmap.de/routed-bike",
    walking: "https://routing.openstreetmap.de/routed-foot",
};

const OSRM_PROFILE_SEGMENT: Record<RoutingProfile, string> = {
    driving: "driving",
    cycling: "bike",
    walking: "foot",
};

export async function getRouteOSRM(
    from: LatLng,
    to: LatLng,
    profile: RoutingProfile
): Promise<RouteResult | null> {
    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const base = OSRM_BASE[profile];
    const profileSegment = OSRM_PROFILE_SEGMENT[profile];

    const url =
        `${base}/route/v1/${profileSegment}/${coords}` +
        `?overview=full&geometries=geojson&alternatives=false&steps=false`;

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