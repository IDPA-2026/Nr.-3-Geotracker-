# 📍 4G Geotracker & Live-Webapp (IDPA)

Dieses Repository enthält den vollständigen Quellcode (Firmware & Frontend) für unsere Interdisziplinäre Projektarbeit (IDPA) an der KBW in den Fächern Informatik und Geografie.

Entwickelt wurde ein autarker 4G-Geotracker auf Basis des ESP32-S3, der seine GPS-Telemetriedaten in Echtzeit an eine Next.js-Webapplikation überträgt.

## 🚀 Key Features

* **Robuste 4G-Verbindung:** Kommunikation über native AT-Befehle mit dem SIM7670G-Modem (ohne fehleranfällige Drittanbieter-Bibliotheken).
* **Asynchrones Polling:** Non-blocking C++ Architektur (`millis()` statt `delay()`) für höchste Systemstabilität und Vermeidung von Brownouts.
* **Call-to-Open (Alarm):** Der Tracker lauscht permanent auf eingehende Anrufe. Wird die SIM-Karte angerufen, legt der ESP32 sofort auf (kostenlos) und löst einen lokalen Hardware-Buzzer aus.
* **Batterie-Monitoring:** Auslesen des 18650-Akkus über I2C (MAX17048) zur Echtzeit-Überwachung.
* **Live-Webapp:** Next.js Frontend mit Server-Sent Events (SSE) für eine verzögerungsfreie Darstellung auf einer OpenStreetMap (Leaflet).
* **Routing:** Integrierte OSRM-API zur Berechnung der Route zum Tracker.

---

## 🛠️ Tech Stack & Hardware

**Hardware:**
* Mikrocontroller: Waveshare ESP32-S3
* Mobilfunk/GNSS: SIM7670G (4G LTE-CAT1 & Multi-GNSS)
* Peripherie: Aktiver Buzzer, 18650 Li-Ion Zelle

**Software / Firmware:**
* C++ (PlatformIO)
* Native AT-Command Kommunikation
* I2C-Protokoll für Batterie-Telemetrie

**Cloud & Frontend:**
* Firebase Realtime Database (JSON-Store)
* Next.js (React Framework)
* Leaflet (OpenStreetMap)
* TailwindCSS

---

## 📂 Projektstruktur

Das Repository ist in zwei Hauptbereiche unterteilt:

```text
├── /firmware          # PlatformIO Projekt für den ESP32-S3 (C++)
│   ├── src/main.cpp   # Hauptlogik, AT-Command-Parser, Asynchroner Loop
│   └── platformio.ini # Konfiguration & Abhängigkeiten
├── /frontend          # Next.js Webapplikation
│   ├── src/           # React Components, Pages, API-Routes
│   └── package.json   # Node.js Dependencies
└── README.md
