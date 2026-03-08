import { db } from "@/lib/firebase-server";
import { onValue, ref, type Unsubscribe } from "firebase/database";
import type { GpsPoint, TrackerLocationRaw } from "@/types/gps";

type Client = {
    id: string;
    send: (event: string, data: unknown) => void;
    close: () => void;
};

class LocationStreamHub {
    private clients = new Map<string, Client>();
    private started = false;
    private unsubscribe: Unsubscribe | null = null;
    private lastPoint: GpsPoint | null = null;

    start() {
        if (this.started) return;
        this.started = true;

        const locationRef = ref(db, "");

        this.unsubscribe = onValue(locationRef, (snapshot) => {
            const raw = snapshot.val() as TrackerLocationRaw | null;
            if (!raw) return;

            const point: GpsPoint = {
                lat: raw.lat,
                lng: raw.lon,
                alt: raw.alt,
                speed_kmh: raw.speed_kmh,
                status: raw.status,
                date: raw.date,
                time: raw.time,
                course: raw.course,
            };

            this.lastPoint = point;
            this.broadcast("location", point);
        });
    }

    addClient(client: Client) {
        this.clients.set(client.id, client);

        if (this.lastPoint) {
            client.send("location", this.lastPoint);
        }
    }

    removeClient(id: string) {
        const client = this.clients.get(id);
        if (client) {
            client.close();
            this.clients.delete(id);
        }

        if (this.clients.size === 0 && this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
            this.started = false;
        }
    }

    private broadcast(event: string, data: unknown) {
        for (const client of this.clients.values()) {
            client.send(event, data);
        }
    }
}

declare global {
    var __locationHub: LocationStreamHub | undefined;
}

export const locationHub = global.__locationHub ?? new LocationStreamHub();
if (!global.__locationHub) global.__locationHub = locationHub;