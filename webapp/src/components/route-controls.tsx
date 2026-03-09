"use client";

import { useEffect, useRef, useState } from "react";
import type { RoutingProfile } from "@/types/routing";
import { searchPlaceSuggestions, type NominatimSuggestion } from "@/lib/geocoding";

type Props = {
    onSetStart: (place: string) => Promise<void>;
    loading: boolean;
    profile: RoutingProfile;
    onProfileChange: (profile: RoutingProfile) => void;
};

export default function RouteControls({
                                          onSetStart,
                                          loading,
                                          profile,
                                          onProfileChange,
                                      }: Props) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);
    const [open, setOpen] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const debounceRef = useRef<number | null>(null);

    useEffect(() => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);

        if (!query.trim()) {
            setSuggestions([]);
            setOpen(false);
            return;
        }

        debounceRef.current = window.setTimeout(async () => {
            setLoadingSuggestions(true);
            try {
                const items = await searchPlaceSuggestions(query, 5);
                setSuggestions(items);
                setOpen(items.length > 0);
            } finally {
                setLoadingSuggestions(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [query]);

    async function submit(value: string) {
        if (!value.trim()) return;
        await onSetStart(value);
        setOpen(false);
    }

    return (
        <div className="absolute left-4 top-4 z-[1000] w-[360px] rounded-xl bg-white/95 p-3 shadow-lg text-black">
            <p className="mb-2 text-sm font-semibold text-black">Plan route</p>

            <div className="relative">
                <div className="flex gap-2">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter location"
                        className="w-full rounded-md border px-3 py-2 text-sm text-black placeholder:text-zinc-500"
                        onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                await submit(query);
                            }
                        }}
                        onFocus={() => setOpen(suggestions.length > 0)}
                    />
                    <button
                        onClick={async () => submit(query)}
                        disabled={loading}
                        className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                        {loading ? "..." : "Go"}
                    </button>
                </div>

                {open && (
                    <div className="absolute mt-1 max-h-64 w-full overflow-auto rounded-md border bg-white shadow-lg">
                        {loadingSuggestions && (
                            <div className="px-3 py-2 text-xs text-zinc-500">Searching...</div>
                        )}

                        {!loadingSuggestions &&
                            suggestions.map((s, idx) => (
                                <button
                                    key={`${s.displayName}-${idx}`}
                                    className="block w-full border-b px-3 py-2 text-left text-sm text-black hover:bg-zinc-100"
                                    onClick={async () => {
                                        setQuery(s.displayName);
                                        await submit(s.displayName);
                                    }}
                                >
                                    {s.displayName}
                                </button>
                            ))}

                        {!loadingSuggestions && suggestions.length === 0 && (
                            <div className="px-3 py-2 text-xs text-zinc-500">No results</div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-2">
                <label htmlFor="route-profile" className="mb-1 block text-xs font-medium text-zinc-700">
                    Profile
                </label>
                <select
                    id="route-profile"
                    value={profile}
                    onChange={(e) => onProfileChange(e.target.value as RoutingProfile)}
                    className="w-full rounded-md border px-3 py-2 text-sm text-black"
                >
                    <option value="driving">Driving</option>
                    <option value="cycling">Cycling</option>
                    <option value="walking">Walking</option>
                </select>
            </div>
        </div>
    );
}