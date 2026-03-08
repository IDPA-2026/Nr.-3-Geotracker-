"use client";

import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GpsPoint } from "@/types/gps";

type Props = {
    point: GpsPoint;
};

const locationIcon = L.icon({
    iconUrl: "/location.svg",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

export default function Map({ point }: Props) {
    return (
        <div className="h-[70vh] w-full overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
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