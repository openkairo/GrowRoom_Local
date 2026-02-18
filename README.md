[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/integration)
[![github_release](https://img.shields.io/github/v/release/low-streaming/local_growbox?style=for-the-badge)](https://github.com/low-streaming/local_growbox/releases)
[![github_license](https://img.shields.io/github/license/low-streaming/local_growbox?style=for-the-badge)](https://github.com/low-streaming/local_growbox/blob/main/LICENSE)

# Local Grow Box Integration 🌿

**[🇩🇪 Deutsch](#-deutsch) | [🇬🇧 English](#-english)**

---

# 🇩🇪 Deutsch

Die **Local Grow Box** Integration verwandelt dein Home Assistant in eine vollautomatische Grow-Room-Steuerung. Sie verwaltet Lichtzyklen, Klima (VPD), Bewässerung und verfolgt die Wachstumsphasen über ein schickes, modernes Dashboard.

## ✨ Hauptfunktionen

### 1. **Phasen-Management** 🌱
Verfolge den Lebenszyklus deiner Pflanze vom Keimling bis zur Veredelung (Curing).
-   **Automatischer Tageszähler:** Berechnet den aktuellen Tag basierend auf dem Startdatum.
-   **Phasen-Profile:** Vorkonfigurierte Lichtstunden für jede Phase (z.B. 18/6 für Wachstum, 12/12 für Blüte).
-   **Visuelle Timeline:** Sehe auf einen Blick, wo sich deine Pflanze befindet.

### 2. **Smarter Lichtzyklus** 💡
-   **Automatische Steuerung:** Schaltet dein Licht basierend auf der aktuellen Phase AN/AUS.
-   **Flexible Startzeit:** Lege fest, wann der "Tag" beginnt (z.B. 18:00 Uhr), um Stromkosten zu sparen oder Hitze zu vermeiden.
-   **Timer-Anzeige:** Zeigt im Dashboard exakt an, wie lange das Licht noch an bleibt.

### 3. **Klima-Kontrolle & VPD** 🌪️
-   **VPD-Berechnung:** Berechnet das Vapor Pressure Deficit in Echtzeit aus Temperatur und Luftfeuchtigkeit.
-   **Smarte Abluft:** Steuert deinen Lüfter automatisch, um optimale Bedingungen zu schaffen.
-   **Info-Tab:** Erklärungen zu idealen VPD-Werten für jede Phase.

### 4. **Intelligentes Bewässerungssystem** 💧
-   **Bodenfeuchte-Trigger:** Aktiviert die Pumpe nur, wenn die Erde zu trocken ist.
-   **Präzise Dosierung:** Die Pumpe läuft für exakt die eingestellte Zeit (z.B. 5 Sekunden).
-   **Anti-Staunässe (Einwirkzeit):** Nach dem Gießen macht das System zwingend **15 Minuten Pause**, damit sich das Wasser verteilen kann.

### 5. **Kamera & Bild-Upload** 📷
-   **Live-Kamera:** Binde eine Home Assistant Kamera-Entität ein.
-   **Bild-Upload:** Kein Live-Stream? Lade einfach ein Foto direkt über das Dashboard hoch. Das Bild wird gespeichert und angezeigt.

### 6. **Master-Steuerung** ⚡
-   **Master-Switch:** Ein zentraler Schalter, um die gesamte Automatik (Licht, Wasser, Klima) zu aktivieren oder zu pausieren.

---

## 🚀 Installation

### Option 1: HACS (Empfohlen)
1.  Öffne **HACS** in Home Assistant.
2.  Klicke oben rechts auf das Menü (3 Punkte) -> **Benutzerdefinierte Repositories**.
3.  Füge diese URL hinzu: `https://github.com/low-streaming/local_growbox`
4.  Wähle als Kategorie: **Integration**.
5.  Klicke auf **Hinzufügen** und suche dann nach **"Local Grow Box"**.
6.  Installieren und Home Assistant **neustarten**.

### Option 2: Manuell
1.  Lade den Ordner `custom_components/local_grow_box` aus diesem Repository herunter.
2.  Kopiere ihn in dein Home Assistant Verzeichnis: `/config/custom_components/`.
3.  Starte Home Assistant neu.

## ⚙️ Einrichtung
1.  Gehe zu **Einstellungen -> Geräte & Dienste**.
2.  Klicke auf **Integration hinzufügen**.
3.  Suche nach **"Local Grow Box"** und wähle es aus.
4.  Gib deiner Box einen Namen.
5.  Ein neuer Menüpunkt **"Grow Room"** erscheint in deiner Seitenleiste.

---

## 🖥️ Das Dashboard

### **Übersicht (Overview)**
Deine Kommandozentrale.
-   **Live Status:** Alle Werte (Temp, RLF, VPD, Boden) auf einen Blick.
-   **Steuerung:** Master-Switch, manuelle Pumpe, Bild-Upload.
-   **Navigation:** Einfache Tabs (Mobil-optimiert).

### **Geräte & Config**
Hier verknüpfst du deine Home Assistant Geräte.
-   **Sensoren & Aktoren:** Wähle deine Entitäten (Licht, Lüfter, Sensoren).
-   **Parameter:** Setze Zielwerte für Temperatur, Feuchtigkeit und Bewässerung.
-   **Zeitplan:** Stelle die Startstunde für das Licht ein.

### **Phasen**
Die Timeline deiner Pflanze.
-   Passe das Startdatum an, um den Tageszähler zu korrigieren.
-   Wechsle die Phase (z.B. von Wachstum zu Blüte), um den Lichtzyklus automatisch anzupassen.

### **Info / Hilfe**
Nützliche Informationen.
-   VPD-Tabelle für alle Phasen.
-   Erklärungen zu den Buttons und Funktionen.

---

## 🗺️ Roadmap & Vision 🚀

Wir haben Großes vor! Hier ist ein Ausblick auf kommende Features:

### Phase 1: Deep Data 📊
-   **Stromkosten-Rechner:** Erfasse den exakten Verbrauch (kWh) und die Kosten pro Grow-Zyklus.
-   **Ernte-Logbuch:** Dokumentiere Trockengewicht, Qualität und Curing-Verlauf.
-   **Dünge-Planer:** Integrierter Kalender für Nährstoffgaben.

### Phase 2: AI & Vision 🤖
-   **Zeitraffer-Generator:** Erstellt automatisch ein Video aus den täglichen Snapshots deiner Pflanze.
-   **KI-Pflanzendoktor:** Analyse von Blattproblemen oder Mängeln direkt über das Kamerabild.
-   **Smart Notifications:** Push-Nachrichten via Telegram/Discord (z.B. "Tank leer", "VPD kritisch").

### Phase 3: Pro Hardware ⚡
-   **CO2-Steuerung:** Integration von CO2-Sensoren und Magnetventilen.
-   **Sonnenaufgangs-Simulation:** Sanftes Dimmen von LED-Panels (PWM/0-10V).
-   **Hydroponik-Support:** pH- und EC-Wert Überwachung für rezirkulierende Systeme.

### 💛 Support & Spenden

Gefällt dir dieses Projekt? Ich entwickle es in meiner Freizeit.  
Wenn du mich unterstützen möchtest, freue ich mich über einen Kaffee! ☕

<a href="https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=info@low-streaming.de&currency_code=EUR" target="_blank">
  <img src="https://img.shields.io/badge/Donate-PayPal-blue.svg?style=for-the-badge&logo=paypal" alt="Donate with PayPal" />
</a>

**PayPal:** info@low-streaming.de


---
---

# 🇬🇧 English

The **Local Grow Box** integration turns your Home Assistant instance into a fully automated Grow Room controller. It manages light cycles, climate (VPD), watering, and tracks growth phases through a sleek, modern dashboard panel.

## ✨ Key Features

### 1. **Phase Management** 🌱
Track your plant's lifecycle from Seedling to Curing.
-   **Automated Day Counter:** Calculates the current day based on the start date.
-   **Phase Profiles:** Pre-configured light schedules (e.g., 18/6 for Veg, 12/12 for Flower).
-   **Visual Timeline:** See exactly where your plant is in its lifecycle.

### 2. **Smart Light Cycle** 💡
-   **Automated Control:** Turns your light ON/OFF based on the current phase.
-   **Flexible Start Time:** Set a "Start Hour" (e.g., 18:00) to shift the "day" to off-peak hours or cooler times.
-   **Timer Display:** Shows exactly how long the light will remain ON.

### 3. **Climate Control & VPD** 🌪️
-   **VPD Calculation:** Real-time Vapor Pressure Deficit calculation based on Temp/Humidity.
-   **Smart Ventilation:** Controls your exhaust fan to maintain optimal ranges.
-   **Info Tab:** Reference chart for ideal VPD values.

### 4. **Intelligent Watering System** 💧
-   **Soil Moisture Trigger:** Activates the pump only when soil is too dry.
-   **Precision Dosing:** Run the pump for exact seconds (e.g., 5s).
-   **Soak Time:** Enforces a **15-minute pause** after watering to allow moisture to disperse before re-measuring.

### 5. **Camera & Image Upload** 📷
-   **Live Feed:** Integrate a Home Assistant camera entity.
-   **Image Upload:** No camera? Upload a photo directly via the dashboard. It stays saved and displayed.

### 6. **Master Control** ⚡
-   **Master Switch:** A central switch to toggle the entire automation logic (Light, Water, Climate) ON or OFF.

---

## 🚀 Installation

### Option 1: HACS (Recommended)
1.  Open **HACS** in Home Assistant.
2.  Click the menu (3 dots) top right -> **Custom repositories**.
3.  Add this URL: `https://github.com/low-streaming/local_growbox`
4.  Category: **Integration**.
5.  Click **Add** and search for **"Local Grow Box"**.
6.  Install and **Restart** Home Assistant.

### Option 2: Manual
1.  Download the `custom_components/local_grow_box` folder from this repository.
2.  Copy it to your Home Assistant directory: `/config/custom_components/`.
3.  Restart Home Assistant.

## ⚙️ Setup
1.  Go to **Settings -> Devices & Services**.
2.  Click **Add Integration**.
3.  Search for **"Local Grow Box"** and select it.
4.  Name your box.
5.  A new item **"Grow Room"** will appear in your sidebar.

---

## 🖥️ The Dashboard

### **Overview**
Your command center.
-   **Live Status:** Monitor Temp, Humidity, VPD, Soil Moisture.
-   **Controls:** Master Switch, Manual Pump, Image Upload.
-   **Navigation:** Simple, mobile-optimized tabs.

### **devices & Config**
Map your hardware.
-   **Sensors & Actuators:** Select your entities (Light, Fan, Sensors).
-   **Parameters:** Set target values for climate and watering.
-   **Schedule:** Define the Light Start Hour.

### **Phases**
The timeline.
-   Adjust the Start Date to correct the day counter.
-   Switch phases (e.g., from Veg to Flower) to automatically update the light schedule.

### **Info / Help**
Useful resources.
-   VPD Chart for all phases.
-   Explanations of buttons and logic.

---

## 🗺️ Roadmap & Vision 🚀

We have big plans! Here is a sneak peek at what's coming:

### Phase 1: Deep Data 📊
-   **Energy Calculator:** Track exact power usage (kWh) and cost per grow cycle.
-   **Harvest Log:** Document dry weight, quality, and curing progress.
-   **Nutrient Planner:** Integrated calendar for fertilizer schedules.

### Phase 2: AI & Vision 🤖
-   **Auto-Timelapse:** Generate a video from your plant's daily snapshots.
-   **AI Plant Doctor:** Analyze leaf issues or deficiencies directly via camera images.
-   **Smart Notifications:** Push alerts via Telegram/Discord (e.g., "Tank empty", "VPD critical").

### Phase 3: Pro Hardware ⚡
-   **CO2 Control:** Integration of CO2 sensors and solenoids.
-   **Sunrise Simulation:** Smooth dimming for LED panels (PWM/0-10V).
-   **Hydroponics Support:** pH and EC monitoring for recirculating systems.

### 💛 Support & Donation

Do you like this project? I develop it in my free time.  
If you want to support me, I'd be happy about a coffee! ☕

<a href="https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=info@low-streaming.de&currency_code=EUR" target="_blank">
  <img src="https://img.shields.io/badge/Donate-PayPal-blue.svg?style=for-the-badge&logo=paypal" alt="Donate with PayPal" />
</a>

**PayPal:** info@low-streaming.de


---

*Made with ❤️ for happy plants.*
