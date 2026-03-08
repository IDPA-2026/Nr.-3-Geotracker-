"use client";

import dynamic from "next/dynamic";
import type { GpsPoint } from "@/types/gps";

// DONT CHANGE THIS: react-leaflet/leaflet need browser APIs (window/document).
// If SSR is enabled, Next.js starts tweaking.
const Map = dynamic(() => import("@/components/map"), {
    ssr: false,
    loading: () => <div className="h-screen w-screen animate-pulse bg-zinc-100" />,
});

type Props = {
    point: GpsPoint;
};

export default function MapClient({ point }: Props) {
    return <Map point={point} />;
}