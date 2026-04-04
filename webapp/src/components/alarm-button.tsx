"use client";

import { useState } from "react";

export default function AlarmButton() {
    const [loading, setLoading] = useState(false);

    async function triggerAlarm() {
        setLoading(true);
        try {
            await fetch("/api/command/alarm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: true }),
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={triggerAlarm}
            disabled={loading}
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
            {loading ? "Sending..." : "Trigger Alarm"}
        </button>
    );
}