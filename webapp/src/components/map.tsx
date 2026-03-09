"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, Polyline, TileLayer, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@/styles/map-marker.css";
import type { GpsPoint } from "@/types/gps";
import type { LatLng, RoutingProfile } from "@/types/routing";
import RouteControls from "@/components/route-controls";
import { geocodePlace } from "@/lib/geocoding";
import { getRouteOSRM } from "@/lib/routing";

type Props = { point: GpsPoint };
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

function formatDuration(totalSeconds: number | null): string {
    if (totalSeconds == null) return "—";
    const mins = Math.round(totalSeconds / 60);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export default function Map({ point }: Props) {
    const [nowMs, setNowMs] = useState(() => Date.now());
    const [start, setStart] = useState<LatLng | null>(null);
    const [route, setRoute] = useState<LatLng[]>([]);
    const [loadingRoute, setLoadingRoute] = useState(false);
    const [profile, setProfile] = useState<RoutingProfile>("driving");
    const [routeDurationSec, setRouteDurationSec] = useState<number | null>(null);

    useEffect(() => {
        const id = setInterval(() => setNowMs(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const tracker = useMemo(() => ({ lat: point.lat, lng: point.lng }), [point.lat, point.lng]);

    const offline = isOffline(point, nowMs, 30_000);
    const mode: "online" | "offline" =
        point.status === "online" && !offline ? "online" : "offline";
    const markerIcon = useMemo(() => buildPulseIcon(mode), [mode]);
    const statusLabel = mode === "online" ? "Online" : "Offline";
    const lastUpdate = formatLastUpdate(point);

    async function calculateRoute(from: LatLng, to: LatLng, selectedProfile: RoutingProfile) {
        setLoadingRoute(true);
        try {
            const r = await getRouteOSRM(from, to, selectedProfile);
            setRoute(r?.geometry ?? []);
            setRouteDurationSec(r?.durationSeconds ?? null);
        } finally {
            setLoadingRoute(false);
        }
    }

    async function handleSetStart(place: string) {
        const geo = await geocodePlace(place);
        if (!geo) return;
        setStart(geo);
        await calculateRoute(geo, tracker, profile);
    }

    useEffect(() => {
        if (!start) return;
        const id = setTimeout(() => calculateRoute(start, tracker, profile), 1000);
        return () => clearTimeout(id);
    }, [start, tracker.lat, tracker.lng, profile]);

    const startIcon = useMemo(
        () =>
            L.divIcon({
                className: "start-div-icon",
                html: `<div class="start-pin"></div>`,
                iconSize: [18, 18],
                iconAnchor: [9, 9],
            }),
        []
    );

    return (
        <div className="relative h-full w-full">
            <RouteControls
                onSetStart={handleSetStart}
                loading={loadingRoute}
                profile={profile}
                onProfileChange={setProfile}
                etaLabel={formatDuration(routeDurationSec)}
            />

            <MapContainer
                center={[point.lat, point.lng]}
                zoom={13}
                className="h-full w-full"
                zoomControl={false}
            >
                <ZoomControl position="topright" />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {route.length > 1 && (
                    <Polyline
                        positions={route.map((p) => [p.lat, p.lng] as [number, number])}
                        pathOptions={{ color: "#0ea5e9", weight: 5, opacity: 0.85 }}
                    />
                )}

                {start && <Marker position={[start.lat, start.lng]} icon={startIcon} zIndexOffset={900} />}

                <Marker position={[point.lat, point.lng]} icon={markerIcon} zIndexOffset={1000}>
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