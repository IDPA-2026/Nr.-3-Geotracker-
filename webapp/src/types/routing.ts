export type LatLng = { lat: number; lng: number };

export type RouteResult = {
    distanceMeters: number;
    durationSeconds: number;
    geometry: LatLng[];
};