#include <Wire.h> 
#include <SparkFun_MAX1704x_Fuel_Gauge_Arduino_Library.h> 

// --- PINS ---
#define MODEM_RX 17
#define MODEM_TX 18
#define MODEM_PWR 12
#define BUZZER_PIN 14 

// --- OBJEKTE ---
HardwareSerial SerialAT(1);
SFE_MAX1704X lipo; // Batterie-Objekt

// --- KONFIGURATION ---
const char apn[] = "internet";
const char server[] = "idpa-gps-tracker-default-rtdb.europe-west1.firebasedatabase.app";

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("STARTE SYSTEM...");

  // Buzzer initialisieren
  pinMode(BUZZER_PIN, OUTPUT);
  noTone(BUZZER_PIN);

  // I2C für den Waveshare Batterie-Chip (V2 Board -> Pins 15 und 16)
  Wire.begin(15, 16); 
  if (!lipo.begin()) {
    Serial.println("WARNUNG: Batterie-Chip nicht gefunden!");
  } else {
    Serial.println("Batterie-Chip erfolgreich initialisiert.");
  }

  // Modem Startsequenz
  pinMode(MODEM_PWR, OUTPUT);
  digitalWrite(MODEM_PWR, HIGH);
  delay(1000);
  digitalWrite(MODEM_PWR, LOW);
  delay(3000);

  SerialAT.begin(115200, SERIAL_8N1, MODEM_RX, MODEM_TX);

  Serial.println("Initialisiere Modem...");
  sendATCommand("AT", "OK", 3000);
  sendATCommand("ATE0", "OK", 3000);

  Serial.println("Schalte GPS ein...");
  sendATCommand("AT+CGNSSPWR=1", "OK", 3000);

  Serial.println("Setze APN...");
  String apnCmd = String("AT+CGDCONT=1,\"IP\",\"") + apn + "\"";
  sendATCommand(apnCmd.c_str(), "OK", 3000);

  Serial.println("Warte auf Netzwerkregistrierung...");
  while (!sendATCommand("AT+CEREG?", "+CEREG: 0,1", 2000) && 
         !sendATCommand("AT+CEREG?", "+CEREG: 0,5", 2000)) {
    Serial.println("Noch nicht registriert, warte...");
    delay(2000);
  }

  Serial.println("Aktiviere PDP-Kontext...");
  sendATCommand("AT+CGACT=1,1", "OK", 10000); 
}

void loop() {
  Serial.println("\n========================================");
  Serial.println("---- Lese Batterie & GPS Daten ----");
  
  // 1. Batteriestand auslesen
  float batPercent = lipo.getSOC(); 
  if (batPercent > 100.0) batPercent = 100.0; // Wertebereich abfangen
  Serial.print("Akkustand: "); Serial.print(batPercent); Serial.println("%");

  // 2. GPS auslesen
  String rawGPS = getGPSData();
  String payload;
  
  float latitude = 0.0, longitude = 0.0, altitude = 0.0, speedKmh = 0.0, course = 0.0;
  String gpsDate = "", gpsTime = "";

  if (rawGPS != "" && parseFullGPS(rawGPS, latitude, longitude, altitude, speedKmh, course, gpsDate, gpsTime)) {
    Serial.println("GPS Fix gefunden & geparst!");
    
    // Komplettes JSON zusammenbauen (mit Batterie)
    payload = "{\"status\":\"online\"";
    payload += ",\"lat\":" + String(latitude, 6);
    payload += ",\"lon\":" + String(longitude, 6);
    payload += ",\"alt\":" + String(altitude, 1);
    payload += ",\"speed_kmh\":" + String(speedKmh, 1);
    payload += ",\"course\":" + String(course, 1);
    payload += ",\"date\":\"" + gpsDate + "\"";
    payload += ",\"time\":\"" + gpsTime + "\"";
    payload += ",\"battery\":" + String(batPercent, 1) + "}"; 
  } else {
    Serial.println("Kein GPS Fix. Suche Satelliten...");
    // JSON für fehlenden Fix (Batterie senden wir trotzdem!)
    payload = "{\"status\":\"suche_satelliten_1\"";
    payload += ",\"battery\":" + String(batPercent, 1) + "}";
  }

  Serial.println("---- Starte HTTP Upload (Standort) ----");

  if (!sendATCommand("AT+HTTPINIT", "OK", 3000)) {
    Serial.println("Fehler bei HTTPINIT. Versuche HTTPTERM...");
    sendATCommand("AT+HTTPTERM", "OK", 2000);
    delay(5000);
    return;
  }

  String url = "https://" + String(server) + "/locations/test_tracker.json?x-http-method-override=PATCH";
  sendATCommand((String("AT+HTTPPARA=\"URL\",\"") + url + "\"").c_str(), "OK", 3000);
  sendATCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", "OK", 3000);

  String dataCmd = "AT+HTTPDATA=" + String(payload.length()) + ",10000";
  if (sendATCommand(dataCmd.c_str(), "DOWNLOAD", 5000)) {
    SerialAT.print(payload);
    readResponse("OK", 5000);

    Serial.println("Sende Request an Firebase...");
    sendATCommand("AT+HTTPACTION=1", "+HTTPACTION: 1,200", 15000);
  }

  sendATCommand("AT+HTTPTERM", "OK", 3000); // Upload beenden

  // 3. Auf eingehende Alarme prüfen (Buzzer)
  checkAlarm();

  Serial.println("Zyklus beendet. Warte 5 Sekunden...");
  delay(5000);
}

// ==========================================
// --- HILFSFUNKTIONEN (GPS & MODEM) ---
// ==========================================

String getGPSData() {
  SerialAT.println("AT+CGPSINFO");
  unsigned long start_time = millis();
  String response = "";
  
  while (millis() - start_time < 3000) {
    if (SerialAT.available()) {
      char c = SerialAT.read();
      response += c;
      if (response.indexOf("\r\nOK\r\n") != -1) {
        break;
      }
    }
  }
  
  if (response.indexOf("+CGPSINFO: ,,,,,,,,") != -1) return ""; 
  
  int start = response.indexOf("+CGPSINFO: ");
  if (start != -1) {
    int end = response.indexOf("\r\n", start);
    return response.substring(start + 11, end);
  }
  return "";
}

bool parseFullGPS(String nmea, float &lat, float &lon, float &alt, float &speed, float &course, String &date, String &time) {
  int p[9];
  p[0] = nmea.indexOf(',');
  for (int i = 1; i < 9; i++) {
    p[i] = nmea.indexOf(',', p[i-1] + 1);
    if (p[i] == -1 && i < 8) return false; 
  }

  String latStr = nmea.substring(0, p[0]);
  String latDir = nmea.substring(p[0] + 1, p[1]);
  String lonStr = nmea.substring(p[1] + 1, p[2]);
  String lonDir = nmea.substring(p[2] + 1, p[3]);
  date = nmea.substring(p[3] + 1, p[4]);
  time = nmea.substring(p[4] + 1, p[5]);
  String altStr = nmea.substring(p[5] + 1, p[6]);
  String speedStr = nmea.substring(p[6] + 1, p[7]);
  
  String courseStr;
  if (p[8] != -1) {
    courseStr = nmea.substring(p[7] + 1, p[8]);
  } else {
    courseStr = nmea.substring(p[7] + 1);
  }

  if (latStr.length() < 4 || lonStr.length() < 5) return false;

  float latDeg = latStr.substring(0, 2).toFloat();
  float latMin = latStr.substring(2).toFloat();
  lat = latDeg + (latMin / 60.0);
  if (latDir == "S") lat *= -1.0;

  float lonDeg = lonStr.substring(0, 3).toFloat();
  float lonMin = lonStr.substring(3).toFloat();
  lon = lonDeg + (lonMin / 60.0);
  if (lonDir == "W") lon *= -1.0;

  alt = altStr.toFloat();
  speed = speedStr.toFloat() * 1.852; 
  course = courseStr.toFloat();

  return true;
}

bool sendATCommand(const char* command, const char* expected_response, unsigned long timeout) {
  SerialAT.println(command);
  return readResponse(expected_response, timeout);
}

bool readResponse(const char* expected_response, unsigned long timeout) {
  unsigned long start_time = millis();
  String response = "";

  while (millis() - start_time < timeout) {
    if (SerialAT.available()) {
      char c = SerialAT.read();
      response += c;
      if (response.indexOf(expected_response) != -1) {
        Serial.print("SUCCESS: ");
        Serial.println(response);
        return true;
      }
    }
  }
  Serial.print("TIMEOUT/ERROR. Antwort war: ");
  Serial.println(response);
  return false;
}

// ==========================================
// --- BUZZER & ALARM FUNKTIONEN ---
// ==========================================

void playMelody() {
  Serial.println("ALARM! Spiele Retro-Klingelton...");
  
  // Die Frequenzen für den klassischen Handy-Klingelton
  int melody[] = {1319, 1175, 740, 831, 1109, 988, 587, 659, 988, 880, 554, 659, 880};
  
  // Die Dauer der einzelnen Töne
  int durations[] = {125, 125, 250, 250, 125, 125, 250, 250, 125, 125, 250, 250, 500};

  for (int i = 0; i < 13; i++) {
    tone(BUZZER_PIN, melody[i]);
    // Ein bisschen länger warten als der Ton spielt, für die Pausen dazwischen
    delay(durations[i] * 1.3); 
    noTone(BUZZER_PIN);
  }
}

void checkAlarm() {
  Serial.println("---- Prüfe auf Alarm-Signal (Buzzer) ----");

  if (!sendATCommand("AT+HTTPINIT", "OK", 3000)) {
    sendATCommand("AT+HTTPTERM", "OK", 2000);
    return;
  }

  // 1. Alarm-Status abrufen (HTTP GET)
  String url = "https://" + String(server) + "/commands/test_tracker.json";
  sendATCommand((String("AT+HTTPPARA=\"URL\",\"") + url + "\"").c_str(), "OK", 3000);
  sendATCommand("AT+HTTPACTION=0", "+HTTPACTION: 0,200", 15000); // 0 = GET

  SerialAT.println("AT+HTTPREAD=0,500");
  unsigned long start_time = millis();
  String response = "";
  while (millis() - start_time < 3000) {
    if (SerialAT.available()) {
      response += (char)SerialAT.read();
    }
  }
  sendATCommand("AT+HTTPTERM", "OK", 3000); // GET beenden

  // Prüfen, ob "true" im empfangenen JSON steht
  if (response.indexOf("\"trigger_alarm\":true") != -1 || response.indexOf("\"trigger_alarm\": true") != -1) {
    
    // Melodie abspielen!
    playMelody();

    // 2. Alarm wieder auf false setzen (HTTP PATCH)
    Serial.println("Setze Alarm in Firebase zurück auf false...");
    if (sendATCommand("AT+HTTPINIT", "OK", 3000)) {
      url = "https://" + String(server) + "/commands/test_tracker.json?x-http-method-override=PATCH";
      sendATCommand((String("AT+HTTPPARA=\"URL\",\"") + url + "\"").c_str(), "OK", 3000);
      sendATCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", "OK", 3000);
      
      String resetPayload = "{\"trigger_alarm\":false}";
      String dataCmd = "AT+HTTPDATA=" + String(resetPayload.length()) + ",10000";
      
      if (sendATCommand(dataCmd.c_str(), "DOWNLOAD", 5000)) {
        SerialAT.print(resetPayload);
        readResponse("OK", 5000);
        sendATCommand("AT+HTTPACTION=1", "+HTTPACTION: 1,200", 15000);
      }
      sendATCommand("AT+HTTPTERM", "OK", 3000);
    }
  } else {
    Serial.println("Kein Alarm angefordert.");
  }
}