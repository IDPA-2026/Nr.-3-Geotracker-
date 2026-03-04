#define TINY_GSM_MODEM_SIM7670
#include <TinyGsmClient.h>
#include <ArduinoHttpClient.h>

// --- DEINE DATEN ---
const char apn[] = "internet"; 
const char firebase_url[] = "idpa-gps-tracker-default-rtdb.europe-west1.firebasedatabase.app";
const int port = 443; 

// --- PIN-KONFIGURATION ---
#define MODEM_RX 18
#define MODEM_TX 17
#define MODEM_PWR 12

HardwareSerial SerialAT(1);
TinyGsm modem(SerialAT);
TinyGsmClientSecure client(modem);
HttpClient http(client, firebase_url, port);

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(MODEM_PWR, OUTPUT);
  digitalWrite(MODEM_PWR, LOW);
  delay(100);
  digitalWrite(MODEM_PWR, HIGH);
  delay(1000);
  digitalWrite(MODEM_PWR, LOW);

  Serial.println("Initialisiere Modem...");
  SerialAT.begin(115200, SERIAL_8N1, MODEM_RX, MODEM_TX);
  delay(3000);

  if (!modem.restart()) {
    Serial.println("Modem-Restart fehlgeschlagen!");
    return;
  }

  Serial.println("Verbinde mit Netzwerk...");
  if (!modem.gprsConnect(apn)) {
    Serial.println("GPRS-Verbindung fehlgeschlagen!");
    return;
  }
  Serial.println("Netzwerk verbunden!");
}

void loop() {
  Serial.println("Sende Daten an Firebase...");
  String contentType = "application/json";
  String postData = "{\"lat\": 47.37, \"lon\": 8.54, \"status\": \"online\", \"msg\": \"Hallo Kanti!\"}";

  http.patch("/locations/test_tracker.json", contentType, postData);

  int statusCode = http.responseStatusCode();
  String response = http.responseBody();

  Serial.print("Status: ");
  Serial.println(statusCode);
  delay(30000);
}