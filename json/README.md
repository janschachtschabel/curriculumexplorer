# Lehrplan JSON Struktur

Die Lehrplan-Dateien im JSON-Format sollten mindestens folgende Struktur haben:

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

Die wichtigsten Elemente sind:
1. **id**: Eine eindeutige ID für den Lehrplan
2. **title**: Der Titel des Lehrplans
3. **profession**: Informationen zum Beruf
4. **learningFields**: Array der Lernfelder, die jeweils eigene Kompetenzen enthalten

Es ist wichtig, dass die Struktur korrekt formatiert ist, damit der Parser die Daten korrekt verarbeiten kann.