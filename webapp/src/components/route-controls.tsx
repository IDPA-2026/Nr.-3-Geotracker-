"use client";

import { useState } from "react";

type Props = {
    onSetStart: (place: string) => Promise<void>;
    loading: boolean;
};

export default function RouteControls({ onSetStart, loading }: Props) {
    const [place, setPlace] = useState("");

    return (
        <div className="absolute top-4 left-4 z-[1000] w-[320px] rounded-xl bg-white/95 p-3 shadow-lg">
            <p className="mb-2 text-sm font-semibold">plan route</p>
            <div className="flex gap-2">
                <input
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="Enter location"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                />
                <button
                    onClick={() => onSetStart(place)}
                    disabled={loading}
                    className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                >
                    {loading ? "..." : "Go"}
                </button>
            </div>
        </div>
    );
}