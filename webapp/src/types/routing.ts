export type LatLng = { lat: number; lng: number };

export type RoutingProfile = "driving" | "cycling" | "walking";

export type RouteResult = {
    distanceMeters: number;
    durationSeconds: number;
    geometry: LatLng[];
};