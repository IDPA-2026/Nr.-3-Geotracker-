"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@/styles/map-marker.css";
import type { GpsPoint } from "@/types/gps";

type Props = {
    point: GpsPoint;
};

const DEVICE_NAME = "Gps Tracker";

function trackerTimestampToMs(date?: string, time?: string): number | null {
    if (!date || !time || date.length !== 6 || time.length < 6) return null;

    const dd = Number(date.slice(0, 2));
    const mm = Number(date.slice(2, 4));
    const yy = Number(date.slice(4, 6));
    const hh = Number(time.slice(0, 2));
    const mi = Number(time.slice(2, 4));
    const ss = Number(time.slice(4, 6));

    if ([dd, mm, yy, hh, mi, ss].some(Number.isNaN)) return null;
    return Date.UTC(2000 + yy, mm - 1, dd, hh, mi, ss);
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

function formatLastUpdate(point: GpsPoint): string {
    const ts = trackerTimestampToMs(point.date, point.time);
    if (!ts) return "Unknown";

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "medium",
    }).format(new Date(ts));
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

    const statusLabel = mode === "online" ? "Online" : "Offline";
    const lastUpdate = formatLastUpdate(point);

    return (
        <div className="h-full w-full">
            <MapContainer center={[point.lat, point.lng]} zoom={13} className="h-full w-full">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[point.lat, point.lng]} icon={markerIcon}>
                    <Popup autoPan closeButton>
                        <div className="gps-popup">
                            <h4 className="gps-popup__title">{DEVICE_NAME}</h4>
                            <p className="gps-popup__row">
                                <span className="gps-popup__label">Status:</span>{" "}
                                <span className={mode === "online" ? "gps-status-online" : "gps-status-offline"}>
                  {statusLabel}
                </span>
                            </p>
                            <p className="gps-popup__row">
                                <span className="gps-popup__label">Last update:</span> {lastUpdate}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}