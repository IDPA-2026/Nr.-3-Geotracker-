export type TrackerLocationRaw = {
    alt: number;
    course: number;
    date: string;
    lat: number;
    lon: number;
    speed_kmh: number;
    status: string;
    time: string;
};

export type GpsPoint = {
    lat: number;
    lng: number;
};