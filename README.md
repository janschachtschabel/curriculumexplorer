# Curriculum Explorer

Ein webbasiertes Tool zur Erkundung und Analyse von Berufsbildungslehrplänen mit ESCO-Kompetenzzuordnungen und Lernressourcen-Integration.

## Funktionen

### Lehrplanstruktur und Navigation
- **Hierarchische Ansicht**: Navigieren Sie durch Berufe, Lernfelder und Kompetenzen in einer übersichtlichen Baumstruktur
- **Kompetenzdetails**: Zeigt Beschreibungen, Taxonomiestufen und Kompetenztypen für jede Kompetenz an
- **ESCO-Mappings**: Visualisierung der Zuordnungen zwischen beruflichen Kompetenzen und ESCO-Fertigkeiten
- **WLO-Integration**: Automatische Suche nach passenden Lernressourcen zu ausgewählten Kompetenzen

### Visualisierungen
- **Klassische Baumansicht**: Hierarchische Darstellung des Lehrplans mit allen Details
- **Kompetenz-ESCO Mapping**: Visualisierung der Beziehungen zwischen Kompetenzen und ESCO-Fertigkeiten mit interaktiven Verbindungen
- **Detailinformationen**: Detailansicht zu jedem ausgewählten Element im Lehrplan

### Statistiken
- **Lehrplanübersicht**: Zusammenfassung der wichtigsten Lehrplandaten (Anzahl der Lernfelder, Kompetenzen, etc.)
- **Kompetenzverteilung**: Visualisierung der Verteilung von Kompetenztypen über Lernfelder
- **Taxonomiestufen**: Analyse der kognitiven Anforderungsniveaus nach Bloom'scher Taxonomie
- **Stundenverteilung**: Grafische Darstellung der Stundenzuordnung über die Ausbildungsjahre

### ESCO-Integration
- **Fertigkeitenzuordnung**: Anzeige der ESCO-Fertigkeiten, die zu den Kompetenzen im Lehrplan passen
- **Berufsklassifikation**: Anzeige der relevanten ESCO-Berufe und deren Übereinstimmung mit dem Lehrplan
- **Relevanzanzeige**: Visualisierung der Übereinstimmungsgrade zwischen Lehrplan und ESCO-Fertigkeiten

### Lernressourcen-Suche
- **Automatische Suche**: Findet passende Lernmaterialien aus dem WLO (Wir Lernen Online) basierend auf ausgewählten Kompetenzen
- **Ressourcenvorschau**: Anzeige von Metadaten und Vorschaubildern für gefundene Ressourcen
- **Direktlinks**: Direkte Verknüpfung zu den Lernressourcen im WLO

## Technische Details

### Verwendete Technologien
- **React 18**: Für die Benutzeroberfläche und Komponentenlogik
- **TypeScript**: Für typsichere Entwicklung
- **Tailwind CSS**: Für das responsive Design und UI-Komponenten
- **Vite**: Als Build-Tool und Entwicklungsserver
- **Chart.js**: Für die Erstellung interaktiver Diagramme und Visualisierungen
- **Express**: Für den Backend-Server zur JSON-Dateiverarbeitung
- **Axios**: Für API-Anfragen an den WLO-Dienst

### Datenmodell
- **Lehrpläne**: JSON-Struktur mit Metadaten zum Beruf, Lernfeldern und Kompetenzen
- **ESCO-Mappings**: Zuordnungen zwischen beruflichen Kompetenzen und standardisierten ESCO-Fertigkeiten
- **Kompetenzanalyse**: Metadaten zur Taxonomiestufe, Kompetenzart und Relevanz jeder Kompetenz

## Installation und Start

### Voraussetzungen
- Node.js (Version 18 oder höher)
- npm oder yarn

### Installation

1. Repository klonen:
```bash
git clone <repository-url>
```

2. Abhängigkeiten installieren:
```bash
npm install
```

3. Entwicklungsserver starten:
```bash
npm run start
```

Dies startet sowohl den Vite-Entwicklungsserver für das Frontend als auch den Express-Server für die JSON-Dateiverarbeitung.

### Lehrplan-Dateien
- Lehrpläne werden als JSON-Dateien im `json/`-Verzeichnis gespeichert
- Die Anwendung erkennt automatisch alle vorhandenen JSON-Dateien
- Eigene Lehrpläne können über die Upload-Funktion hochgeladen werden

## JSON-Datenformat

Die JSON-Struktur für Lehrpläne sollte folgendem Schema entsprechen:

```json
{
  "id": "einzigartige-id",
  "title": "Titel des Lehrplans",
  "description": "Beschreibung des Lehrplans",
  "profession": {
    "title": "Berufsbezeichnung",
    "code": "Berufskennziffer",
    "description": "Beschreibung des Berufs",
    "duration": "Ausbildungsdauer",
    "field": "Berufsfeld"
  },
  "learningFields": [
    {
      "id": "lf1",
      "code": "LF1",
      "title": "Titel des Lernfelds",
      "description": "Beschreibung des Lernfelds",
      "hours": 80,
      "year": 1,
      "competencies": [
        {
          "id": "lf1-k1",
          "title": "Kompetenztitel",
          "description": "Kompetenzbeschreibung",
          "competencyType": "Kompetenztyp",
          "escoMappings": [
            {
              "id": "esco-1",
              "uri": "http://data.europa.eu/esco/skill/...",
              "preferredLabel": "Bevorzugte Bezeichnung",
              "altLabels": ["Alternative Bezeichnung"],
              "description": "ESCO Beschreibung",
              "confidence": 0.85
            }
          ],
          "competencyAnalysis": {
            "skillType": "Skilltyp",
            "keywords": ["Schlagwort1", "Schlagwort2"],
            "bloomLevel": "Anwenden",
            "relevance": 8,
            "difficulty": 4,
            "digitalLevel": 3
          }
        }
      ]
    }
  ]
}
```

## Wie es funktioniert

1. **Lehrplan auswählen**: Wählen Sie einen vorhandenen Lehrplan aus dem Dropdown-Menü oder laden Sie einen eigenen hoch
2. **Lehrplanstruktur erkunden**: Navigieren Sie durch die Lernfelder und Kompetenzen in der Baumansicht
3. **Kompetenzen anzeigen**: Wählen Sie eine Kompetenz aus, um Details und ESCO-Mappings zu sehen
4. **WLO-Inhalte finden**: Passende Lernressourcen werden automatisch zu jeder ausgewählten Kompetenz gesucht
5. **Statistiken und Visualisierungen**: Wechseln Sie zu den Tabs "Statistik" und "Visuals" für erweiterte Analysen

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz veröffentlicht.