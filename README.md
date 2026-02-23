[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/integration)
[![github_release](https://img.shields.io/github/v/release/openkairo/GrowRoom_Local?style=for-the-badge)](https://github.com/openkairo/GrowRoom_Local/releases)
[![github_license](https://img.shields.io/github/license/openkairo/GrowRoom_Local?style=for-the-badge)](https://github.com/openkairo/GrowRoom_Local/blob/main/LICENSE)

# Local Grow Box Integration 🌿 (v2.1.3)

<img width="1024" height="1536" alt="localgrow" src="https://github.com/user-attachments/assets/87bc7e9b-7643-4085-a9df-32111ebdaa5b" />


**[🇩🇪 Deutsch](#-deutsch) | [🇬🇧 English](#-english)**

---

# 🇩🇪 Deutsch

Die **Local Grow Box** Integration verwandelt dein Home Assistant in eine vollautomatische Grow-Room-Steuerung. Sie verwaltet Lichtzyklen, Klima (VPD), Bewässerung und verfolgt die Wachstumsphasen über ein schickes, modernes Dashboard.

## ✨ Hauptfunktionen (v2.1.2)

### 1. **Modernes Dashboard (Neu!)** 🖥️
Ein komplett überarbeitetes, dunkles Dashboard im Tech-Design.
-   **Interaktive Tabs:** Übersicht, Statistiken, Geräte-Konfiguration, Phasen, Protokoll und Hilfe.
-   **Live-Karten:** Dynamische Visualisierung von Temperatur, Luftfeuchte (RLF), VPD und Bodenfeuchte.
-   **Status-Badges:** Sofortige Rückmeldung, ob das System online ist oder die Automatik pausiert wurde.

### 2. **Phasen-Management & Timeline** 🌱
Verfolge den Lebenszyklus deiner Pflanze präzise.
-   **Phasen-Profile:** Vorkonfigurierte Lichtstunden (Keimling, Wachstum, Blüte, Trocknen, Veredeln).
-   **Automatischer Tageszähler:** Berechnet seit dem Startdatum exakt den aktuellen Tag des Grows.
-   **Manueller Phasenwechsel:** Phase direkt im Dashboard ändern, die Automatik passt sich sofort an.

### 3. **Intelligente Klimasteuerung (VPD)** 🌪️
-   **Echtzeit-VPD:** Automatische Berechnung des Sättigungsdefizits (VPD) aus Temperatur und Luftfeuchte.
-   **Zielwert-Überwachung:** Das System erkennt, ob dein VPD im optimalen Bereich für die aktuelle Phase liegt.
-   **Smarte Abluft:** Steuert den Lüfter basierend auf Schwellenwerten für Temperatur und Feuchtigkeit.

### 4. **Smarte Bewässerung & Bodenfeuchte** 💧
-   **Bodenfeuchte-Logik:** Die Pumpe startet automatisch, wenn der eingestellte Mindestwert unterschritten wird.
-   **Präzise Dosierung:** Einstellbare Laufzeit für die Pumpe in Sekunden.
-   **Staunässe-Schutz:** Erzwungene **15 Minuten Pause** nach jeder Bewässerung, damit der Sensor korrekte Werte liefert.

### 5. **Kamera & Bild-Archiv** 📷
-   **Livestream:** Einbindung deiner Home Assistant Kamera direkt ins Dashboard.
-   **Manueller Upload:** Lade Fotos via Dashboard hoch, um den Fortschritt auch ohne Live-Kamera zu dokumentieren.
-   **Cache-Busting:** Das Dashboard zeigt immer das aktuellste Bild ohne Browser-Refresh.

### 6. **Multi-Box Support** 📦
Verwalte mehrere Zelte oder Boxen gleichzeitig.
-   Füge einfach mehrere Instanzen der Integration hinzu.
-   Jede Box bekommt ihr eigenes Dashboard und eigene Einstellungen.

### 7. **Plug & Play ESPHome Display** 📺
-   **Status am Zelt:** Zeigt alle wichtigen Werte auf einem ESPHome-basierten Display an.
-   **Auto-Rotation:** Wechselt bei mehreren Boxen automatisch alle 10 Sekunden durch die Ansichten.
-   **Keine Konfiguration:** Die Integration findet kompatible Displays im Netzwerk automatisch.

### 8. **Detaillierte Statistiken & Logs** 📊
-   **24h-Graphen:** Verfolge Temperatur, Feuchtigkeit und VPD im zeitlichen Verlauf direkt im Dashboard.
-   **Ereignis-Protokoll:** Eine saubere Liste aller Automatik-Aktionen (Licht an/aus, Pumpe gestartet etc.).

---

## 🚀 Installation

### Option 1: HACS (Empfohlen)
1.  Öffne **HACS** in Home Assistant.
2.  Klicke oben rechts auf die 3 Punkte -> **Benutzerdefinierte Repositories**.
3.  URL: `https://github.com/openkairo/GrowRoom_Local` | Kategorie: **Integration**.
4.  Suche nach **"Local Grow Box"** und installiere die neueste Version.
5.  Home Assistant **neustarten**.

### Option 2: Manuell
1.  Lade den Ordner `custom_components/local_grow_box` herunter.
2.  Kopiere ihn in dein `/config/custom_components/` Verzeichnis.
3.  Starte Home Assistant neu.

## ⚙️ Einrichtung
1.  **Einstellungen -> Geräte & Dienste -> Integration hinzufügen**.
2.  Suche nach **"Local Grow Box"**.
3.  Konfiguriere deine Entitäten (Licht, Sensoren, Pumpe).
4.  Der Menüpunkt **"Grow Room"** erscheint in deiner Seitenleiste.

---

# 🇬🇧 English

The **Local Grow Box** integration turns your Home Assistant instance into a fully automated Grow Room controller. It manages light cycles, climate (VPD), watering, and tracks growth phases through a sleek, modern dashboard panel.

## ✨ Key Features (v2.1.2)

### 1. **Modern Dashboard (Improved!)** 🖥️
A completely redesigned, dark-themed tech dashboard.
-   **Interactive Tabs:** Overview, Statistics, Device Config, Phases, Logs, and Help.
-   **Live Data:** Real-time visualization of Temperature, Humidity, VPD, and Soil Moisture.
-   **Visual Feedback:** High-contrast status badges for system and automation status.

### 2. **Phase Management & Timeline** 🌱
Precision-track your plant's lifecycle.
-   **Phase Profiles:** Pre-configured schedules (Seedling, Veg, Flower, Drying, Curing).
-   **Automated Day Counter:** Shows exact day of grow since the start date.
-   **Instant Phase Switch:** Change phases directly from the UI, automation updates immediately.

### 3. **Smart Climate & VPD** 🌪️
-   **Real-time VPD:** Calculated from Temp and Rh to ensure optimal transpiration.
-   **Target Range Monitoring:** Visual indicators show if your VPD is optimal for the current phase.
-   **Intelligent Ventilation:** Controls your exhaust fan based on temperature and humidity thresholds.

### 4. **Smart Irrigation** 💧
-   **Moisture Trigger:** Pump starts automatically when soil moisture drops below your target.
-   **Precision Pulse:** Set exact pump run duration in seconds.
-   **Soak Logic:** A mandatory **15-minute wait** after each pulse ensures even water distribution.

### 5. **Camera & Archive** 📷
-   **Live Stream:** Integrated HA camera feed directly on the dashboard.
-   **Snapshots:** Manually upload images from the UI to track progress without a permanent camera.

### 6. **Multi-Box & Multi-Instance** 📦
Manage multiple grow tents in one place.
-   Add multiple instances of the integration.
-   Each instance has its own isolated dashboard and sensors.

### 7. **Plug & Play ESPHome Display** 📺
-   **Tent-side Monitoring:** View status on an external ESPHome display.
-   **Auto-Rotate:** Automatically cycles through up to 5 grow boxes every 10 seconds.
-   **Auto-Discovery:** No manual setup required for the display communication.

### 8. **Statistics & Event Log** 📊
-   **History Charts:** 24-hour graphs for all critical telemetry.
-   **Action Log:** A detailed log of all automated actions (lights, irrigation, ventilation).

---

## 🚀 Installation

### Option 1: HACS (Recommended)
1.  Open **HACS** -> **Custom repositories**.
2.  Add: `https://github.com/lopenkairo/GrowRoom_Local` (Category: **Integration**).
3.  Install **"Local Grow Box"**.
4.  **Restart** Home Assistant.

## ⚙️ Setup
1.  Go to **Settings -> Devices & Services -> Add Integration**.
2.  Search for **"Local Grow Box"**.
3.  Map your entities (Switch, Sensors, Camera).
4.  Look for **"Grow Room"** in your sidebar.

---

## 🗺️ Roadmap 🚀
- **Energy Tracking:** Monthly cost estimation based on light/fan usage.
- **Nutrient Diary:** Keep track of your feeding schedule.
- **AI Plant Health (WIP):** Basic leaf color analysis from snapshots.

---

## 💛 Support
If you like this project, feel free to support its development! ☕
PayPal: info@low-streaming.de

*Made with ❤️ for happy plants.*
