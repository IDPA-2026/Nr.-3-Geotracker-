// DONT use server actions because it's bad with real-time data.
"use client";

import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GpsPoint } from "@/types/gps";

type Props = {
    point: GpsPoint;
};

function trackerTimestampToMs(date?: string, time?: string): number | null {
    if (!date || !time) return null;
    if (date.length !== 6) return null;

    const dd = Number(date.slice(0, 2));
    const mm = Number(date.slice(2, 4));
    const yy = Number(date.slice(4, 6));

    const hh = Number(time.slice(0, 2));
    const mi = Number(time.slice(2, 4));
    const ss = Number(time.slice(4, 6));

    if ([dd, mm, yy, hh, mi, ss].some((n) => Number.isNaN(n))) return null;

    const fullYear = 2000 + yy;
    return Date.UTC(fullYear, mm - 1, dd, hh, mi, ss);
}
const locationIcon = L.icon({
    iconUrl: "/location.svg",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

export default function Map({ point }: Props) {
    return (
        <div className="h-full w-full">
            <MapContainer
                center={[point.lat, point.lng]}
                zoom={13}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[point.lat, point.lng]} icon={locationIcon} />
            </MapContainer>
        </div>
    );
}