import type { LatLng } from "@/types/routing";

export async function geocodePlace(query: string): Promise<LatLng | null> {
    if (!query.trim()) return null;

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
        headers: {
            Accept: "application/json",
        },
        cache: "no-store",
    });

    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;

    return {
        lat: Number(data[0].lat),
        lng: Number(data[0].lon),
    };
}