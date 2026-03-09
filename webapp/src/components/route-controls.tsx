"use client";

import type { RoutingProfile } from "@/types/routing";

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
    return (
        <div className="absolute left-4 top-4 z-[1000] w-[340px] rounded-xl bg-white/95 p-3 shadow-lg text-black">
            <p className="mb-2 text-sm font-semibold text-black">Plan route</p>

            <div className="flex gap-2">
                <input
                    id="route-start-input"
                    placeholder="Enter location"
                    className="w-full rounded-md border px-3 py-2 text-sm text-black placeholder:text-zinc-500"
                    onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                            const v = (e.currentTarget as HTMLInputElement).value;
                            await onSetStart(v);
                        }
                    }}
                />
                <button
                    onClick={async () => {
                        const input = document.getElementById("route-start-input") as HTMLInputElement | null;
                        await onSetStart(input?.value ?? "");
                    }}
                    disabled={loading}
                    className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                >
                    {loading ? "..." : "Go"}
                </button>
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