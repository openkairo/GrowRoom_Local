[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/integration)
[![github_release](https://img.shields.io/github/v/release/openkairo/GrowRoom_Local?style=for-the-badge)](https://github.com/openkairo/GrowRoom_Local/releases)
[![github_license](https://img.shields.io/github/license/openkairo/GrowRoom_Local?style=for-the-badge)](https://github.com/openkairo/GrowRoom_Local/blob/main/LICENSE)

# Local Grow Box Integration 🌿 (v2.1.7)

<img width="1024" height="1536" alt="localgrow" src="https://github.com/user-attachments/assets/87bc7e9b-7643-4085-a9df-32111ebdaa5b" />

**[🇩🇪 Deutsch](#-deutsch) | [🇬🇧 English](#-english)**

---

# 🇩🇪 Deutsch

Die **Local Grow Box** Integration verwandelt dein Home Assistant in eine vollautomatische Grow-Room-Steuerung. Sie verwaltet Lichtzyklen, Klima (VPD), Bewässerung und verfolgt die Wachstumsphasen über ein schickes, modernes Dashboard.

## ✨ Hauptfunktionen (v2.1.7)

### 1. **Modernes Dashboard (Neu!)** 🖥️
Ein komplett überarbeitetes, dunkles Dashboard im Tech-Design.
-   **Interaktive Tabs:** Übersicht, Statistiken, Geräte-Konfiguration, Phasen, Protokoll und Hilfe.
-   **Live-Karten:** Dynamische Visualisierung von Temperatur, Luftfeuchte (RLF), VPD und Bodenfeuchte.
-   **Status-Badges:** Sofortige Rückmeldung, ob das System online ist oder die Automatik pausiert wurde.
-   **Master Kill Switch (Neu in v2.1.7):** Der Master-Schalter deaktiviert nicht nur die Automatik, sondern schaltet alle Geräte aktiv aus, solange er auf AUS steht.

### 2. **Phasen-Management & Timeline** 🌱
Verfolge den Lebenszyklus deiner Pflanze präzise.
-   **Phasen-Profile:** Vorkonfigurierte Lichtstunden (Keimling, Wachstum, Blüte, Trocknen, Veredeln).
-   **Automatischer Tageszähler:** Berechnet seit dem Startdatum exakt den aktuellen Tag des Grows.
-   **Manueller Phasenwechsel:** Phase direkt im Dashboard ändern, die Automatik passt sich sofort an.

-   **Smarte Abluft:** Steuert den Lüfter basierend auf Schwellenwerten für Temperatur und Feuchtigkeit.
-   **Intelligenter Befeuchter-Impuls (Neu in v2.1.5):** Konfigurierbare Laufzeit mit automatischer **10 Minuten Pause** zur optimalen Feuchtigkeitsverteilung (verhindert Sensor-Lag-Probleme).
-   **Visuelle Zielzonen:** Das Dashboard zeigt nun grafisch den optimalen Feuchtigkeitsbereich (+/- 5%) direkt im Balken an.

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
-   **Ereignis-Protokoll:** Ein flackerfreies Log-Design mit manuellem Refresh-Button und Smart-Icons.

### 9. **Dashboard-Stabilität & Performance (Neu in v2.1.6/2.1.7)** 🛡️
-   **Optimiertes Rendering:** Das Dashboard rechnet nun deutlich effizienter. Statische Tabs (wie Hilfe oder Einstellungen) werden nicht mehr bei jedem Sensor-Update im Hintergrund neu aufgebaut.
-   **Fix für Panel-Abstürze:** Behebt das Problem, bei dem das Dashboard nach längerer Laufzeit im Browser "verschwinden" konnte.

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
3.  Konfiguriere deine Entitäten (Licht, Sensoren, Pumpe, Luftbefeuchter).
4.  Der Menüpunkt **"Grow Room"** erscheint in deiner Seitenleiste.

---

# 🇬🇧 English

The **Local Grow Box** integration turns your Home Assistant instance into a fully automated Grow Room controller. It manages light cycles, climate (VPD), watering, and tracks growth phases through a sleek, modern dashboard panel.

## ✨ Key Features (v2.1.7)

### 1. **Modern Dashboard (Improved!)** 🖥️
A completely redesigned, dark-themed tech dashboard.
-   **Interactive Tabs:** Overview, Statistics, Device Config, Phases, Logs, and Help.
-   **Live Data:** Real-time visualization of Temperature, Humidity, VPD, and Soil Moisture.
-   **Visual Feedback:** High-contrast status badges for system and automation status.
-   **Master Kill Switch (New in v2.1.7):** The Master Switch now actively turns off all devices and keeps them off while deactivated.

### 2. **Phase Management & Timeline** 🌱
Precision-track your plant's lifecycle.
-   **Phase Profiles:** Pre-configured schedules (Seedling, Veg, Flower, Drying, Curing).
-   **Automated Day Counter:** Shows exact day of grow since the start date.
-   **Instant Phase Switch:** Change phases directly from the UI, automation updates immediately.

-   **Intelligent Ventilation:** Controls your exhaust fan based on temperature and humidity thresholds.
-   **Smart Humidifier Pulse (New in v2.1.5):** Set a specific run duration followed by a **10-minute soak period** for perfect moisture distribution and sensor stability.
-   **Target Visualization:** The UI now highlights the optimal humidity range (+/- 5%) directly on the status bar.

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
-   **Action Log:** A flicker-free, redesigned log tab with manual refresh and distinct activity icons.

### 9. **Stability & Performance (New in 2.1.6/2.1.7)** 🛡️
-   **Smart Rendering:** Improved efficiency by preventing background re-renders of static tabs (Settings, Info, etc.).
-   **Persistence Fix:** Resolves the UI "disappearing" bug caused by excessive DOM updates over long periods.

---

## 🚀 Installation

### Option 1: HACS (Recommended)
1.  Open **HACS** -> **Custom repositories**.
2.  Add: `https://github.com/openkairo/GrowRoom_Local` (Category: **Integration**).
3.  Install **"Local Grow Box"**.
4.  **Restart** Home Assistant.

## ⚙️ Setup
1.  Go to **Settings -> Devices & Services -> Add Integration**.
2.  Search for **"Local Grow Box"**.
3.  Map your entities (Switch, Sensors, Camera, Humidifier).
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
