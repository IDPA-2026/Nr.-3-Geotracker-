"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { GpsPoint } from "@/types/gps";

// DONT CHANGE THIS: react-leaflet/leaflet need browser APIs.
// If SSR is enabled, Next.js starts tweaking.
const Map = dynamic(() => import("@/components/map"), {
    ssr: false,
    loading: () => <div className="h-screen w-screen animate-pulse bg-zinc-100" />,
});

type Props = {
    initialPoint: GpsPoint;
};

export default function MapClient({ initialPoint }: Props) {
    const [point, setPoint] = useState<GpsPoint>(initialPoint);

    useEffect(() => {
        const es = new EventSource("/api/location/stream");

        es.addEventListener("location", (event) => {
            const next = JSON.parse((event as MessageEvent).data) as GpsPoint;
            setPoint(next);
        });

        es.onerror = () => {
        };

        return () => es.close();
    }, []);

    return <Map point={point} />;
}