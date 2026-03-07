"use client"

import {MapContainer, Marker, TileLayer} from "react-leaflet";
import L from "leaflet"
import "leaflet/dist/leaflet.css";

export default function map(){

    const location = L.icon({
        iconUrl: "/location.svg",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    })

    return(
        <MapContainer
            center={[47.3769, 8.5417]}
            zoom={13}
            style={{ height: "100vh", width: "100%" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={[47.3769, 8.5417]} icon={location}/>

        </MapContainer>
    )
}