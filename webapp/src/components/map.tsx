// DONT use server actions because it's bad with real-time data.
"use client";

import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GpsPoint } from "@/types/gps";
import "@/styles/map-marker.css";
import {useEffect, useMemo, useState} from "react";

type Props = {
    point: GpsPoint;
};

const DEVICE_NAME = "GPS Tracker";


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

function isOffline(point: GpsPoint, nowMs: number, staleAfterMs = 30_000): boolean {
    const ts = trackerTimestampToMs(point.date, point.time);
    if (!ts) return true;
    return nowMs - ts > staleAfterMs;
}

function buildPulseIcon(mode: "online" | "offline") {
    const online = mode === "online";

    const ring = online ? "rgba(59,130,246,0.38)" : "rgba(239,68,68,0.38)";
    const core = online ? "#2563eb" : "#dc2626";
    const glow = online ? "rgba(59,130,246,0.5)" : "rgba(239,68,68,0.5)";
    const border = online ? "#dbeafe" : "#fee2e2";

    return L.divIcon({
        className: "gps-div-icon",
        html: `
      <div class="gps-pin-wrap">
        <div class="gps-pulse" style="--pulse-color:${ring}"></div>
        <div class="gps-pin" style="--pin-core:${core}; --pin-glow:${glow}; --pin-border:${border}">
          <div class="gps-pin-inner"></div>
        </div>
      </div>
    `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
    });
}

export default function Map({ point }: Props) {
    const [nowMs, setNowMs] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNowMs(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const offline = isOffline(point, nowMs, 30_000);
    const mode: "online" | "offline" = point.status === "online" && !offline ? "online" : "offline";

    const markerIcon = useMemo(() => buildPulseIcon(mode), [mode]);

    return (
        <div className="h-full w-full">
            <MapContainer center={[point.lat, point.lng]} zoom={13} className="h-full w-full">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[point.lat, point.lng]} icon={markerIcon} />
            </MapContainer>
        </div>
    );
}