import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_BASE =
    "https://idpa-gps-tracker-default-rtdb.europe-west1.firebasedatabase.app";
const TRACKER_ID = "test_tracker";

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as { enabled?: boolean };
        const enabled = body?.enabled ?? true;

        const patch = {
            trigger_alarm: enabled,
            trigger_alarm_updated_at: Date.now(),
        };

        const r = await fetch(`${DB_BASE}/commands/${TRACKER_ID}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
            cache: "no-store",
        });

        if (!r.ok) {
            return NextResponse.json({ ok: false, error: "Failed to write command" }, { status: 500 });
        }

        return NextResponse.json({ ok: true, written: patch });
    } catch {
        return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
    }
}