import { NextResponse } from "next/server";
import { locationHub } from "@/lib/location-stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    locationHub.start();

    const encoder = new TextEncoder();
    const clientId = crypto.randomUUID();

    let closed = false;
    let keepAlive: NodeJS.Timeout | null = null;

    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            const send = (event: string, data: unknown) => {
                if (closed) return;
                controller.enqueue(
                    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
                );
            };

            const close = () => {
                if (closed) return;
                closed = true;
                if (keepAlive) clearInterval(keepAlive);
                try {
                    controller.close();
                } catch {}
            };

            locationHub.addClient({ id: clientId, send, close });

            keepAlive = setInterval(() => {
                if (closed) return;
                controller.enqueue(encoder.encode(`: keepalive\n\n`));
            }, 15000);
        },
        cancel() {
            if (closed) return;
            closed = true;
            if (keepAlive) clearInterval(keepAlive);
            locationHub.removeClient(clientId);
        },
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}