import type { LatLng } from "@/types/routing";

export type NominatimSuggestion = {
    displayName: string;
    lat: number;
    lng: number;
};

type NominatimSearchItem = {
    display_name: string;
    lat: string;
    lon: string;
};

export async function geocodePlace(query: string): Promise<LatLng | null> {
    const suggestions = await searchPlaceSuggestions(query, 1);
    if (!suggestions.length) return null;
    const first = suggestions[0];
    return { lat: first.lat, lng: first.lng };
}

export async function searchPlaceSuggestions(
    query: string,
    limit = 5
): Promise<NominatimSuggestion[]> {
    if (!query.trim()) return [];

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url.toString(), {
        cache: "no-store",
        headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as NominatimSearchItem[];
    return data.map((item) => ({
        displayName: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
    }));
}