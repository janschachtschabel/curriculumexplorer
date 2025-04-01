import { CurriculumData, LearningField, Competency } from './curriculumTypes';

export function parseCurriculum(jsonData: any): CurriculumData {
  try {
    console.log("Parsen der Lehrplandaten gestartet - Schema-Erkennung:", 
      Object.keys(jsonData).join(', ').substring(0, 100) + "...");
    
    // Determine the schema type to use appropriate parsing logic
    const schemaType = detectSchemaType(jsonData);
    console.log(`Erkanntes Schema: ${schemaType}`);
    
    // Capture metadata, esco, and mappings for reference
    const documentMetadata = jsonData.metadata || jsonData.document_metadata || {};
    const escoData = jsonData.esco || {};
    const kldbMapping = extractKldbMapping(jsonData);
    const iscoMapping = extractIscoMapping(jsonData);
    
    // Create the base curriculum object with common properties
    const curriculum: CurriculumData = {
      id: extractId(jsonData),
      title: extractTitle(jsonData),
      description: extractDescription(jsonData),
      profession: {
        title: extractProfessionTitle(jsonData),
        code: extractProfessionCode(jsonData),
        description: extractProfessionDescription(jsonData),
        duration: extractProfessionDuration(jsonData),
        field: extractProfessionField(jsonData),
      },
      trainingYears: extractTrainingYears(jsonData),
      totalHours: extractTotalHours(jsonData),
      issueDate: extractIssueDate(jsonData),
      validFrom: extractValidFrom(jsonData),
      validUntil: extractValidUntil(jsonData),
      publisher: extractPublisher(jsonData),
      learningFields: [],
      competencies: [],
      documentMetadata,
      escoData,
      kldbMapping,
      iscoMapping
    };

    // Parse learning fields based on the detected schema
    let learningFields: LearningField[] = [];
    
    if (schemaType === 'ANLAGENMECHANIKER') {
      learningFields = parseAnlagenmechanikerFormat(jsonData);
    } else if (schemaType === 'STANDARD') {
      learningFields = parseStandardFormat(jsonData);
    } else if (schemaType === 'NESTED') {
      learningFields = parseNestedFormat(jsonData);
    } else {
      // Fallback to trying all possible formats
      learningFields = findLearningFieldsAnyFormat(jsonData);
    }
    
    // Store the learning fields
    curriculum.learningFields = learningFields;
    
    // Create flat list of all competencies
    const allCompetencies: Competency[] = [];
    learningFields.forEach(field => {
      field.competencies.forEach(comp => {
        // Ensure parent ID is set
        comp.parentId = field.id;
        allCompetencies.push(comp);
      });
    });
    
    curriculum.competencies = allCompetencies;
    
    // Generate metadata about the curriculum
    generateCurriculumMetadata(curriculum);
    
    console.log(`Lehrplanparsen abgeschlossen: ${curriculum.learningFields.length} Lernfelder, ${curriculum.competencies.length} Kompetenzen gefunden`);
    
    return curriculum;
  } catch (error) {
    console.error('Error parsing curriculum data:', error);
    throw new Error(`Fehler beim Parsen der Lehrplandaten: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Detect the schema type to use appropriate parsing logic
function detectSchemaType(jsonData: any): 'ANLAGENMECHANIKER' | 'STANDARD' | 'NESTED' | 'UNKNOWN' {
  // Check for Anlagenmechaniker format (with lernfeld_ausbildungsteil or document_data)
  if (Array.isArray(jsonData.lernfeld_ausbildungsteil) || 
      (jsonData.document_data && jsonData.document_data.lernfeld_ausbildungsteil)) {
    return 'ANLAGENMECHANIKER';
  }
  
  // Check for standard format with top-level learningFields or lernfelder
  if (Array.isArray(jsonData.learningFields) || Array.isArray(jsonData.lernfelder)) {
    return 'STANDARD';
  }
  
  // Check for nested format with curriculum or rahmenlehrplan containing fields
  if ((jsonData.curriculum && (jsonData.curriculum.learningFields || jsonData.curriculum.lernfelder)) ||
      (jsonData.rahmenlehrplan && (jsonData.rahmenlehrplan.lernfelder || jsonData.rahmenlehrplan.inhalte))) {
    return 'NESTED';
  }
  
  // If we can't determine the schema, return UNKNOWN
  return 'UNKNOWN';
}

// Extract KLDB mapping from various possible locations
function extractKldbMapping(jsonData: any): string {
  return jsonData.document_data?.kldb_mapping || 
         jsonData.kldb_mapping || 
         jsonData.beruf_code || 
         jsonData.profession?.code || 
         '';
}

// Extract ISCO mapping from various possible locations
function extractIscoMapping(jsonData: any): any {
  return jsonData.document_data?.isco_mapping || 
         jsonData.isco_mapping || 
         {};
}

// Extract ID from various possible locations
function extractId(jsonData: any): string {
  return jsonData.id || 
         jsonData.kennung || 
         jsonData.curriculum?.id || 
         jsonData.document_data?.id || 
         generateId();
}

// Extract title from various possible locations
function extractTitle(jsonData: any): string {
  return jsonData.title || 
         jsonData.titel || 
         jsonData.name || 
         jsonData.curriculum?.title || 
         jsonData.document_data?.title || 
         'Unbenannter Lehrplan';
}

// Extract description from various possible locations
function extractDescription(jsonData: any): string {
  return jsonData.description || 
         jsonData.beschreibung || 
         jsonData.curriculum?.description || 
         jsonData.document_data?.description || 
         '';
}

// Extract profession title from various possible locations
function extractProfessionTitle(jsonData: any): string {
  return jsonData.beruf || 
         jsonData.profession?.title || 
         jsonData.profession?.name || 
         jsonData.beruf?.bezeichnung || 
         jsonData.beruf?.title || 
         jsonData.ausbildungsberuf?.bezeichnung || 
         jsonData.rahmenlehrplan?.beruf?.bezeichnung || 
         jsonData.document_data?.beruf || 
         'Unbekannter Beruf';
}

// Extract profession code from various possible locations
function extractProfessionCode(jsonData: any): string {
  return jsonData.beruf_code || 
         jsonData.profession?.code || 
         jsonData.beruf?.kennziffer || 
         jsonData.beruf?.code || 
         jsonData.ausbildungsberuf?.kennung || 
         jsonData.rahmenlehrplan?.beruf?.kennziffer || 
         jsonData.document_data?.beruf_code || 
         '';
}

// Extract profession description from various possible locations
function extractProfessionDescription(jsonData: any): string {
  return jsonData.berufsbeschreibung || 
         jsonData.profession?.description || 
         jsonData.beruf?.beschreibung || 
         jsonData.ausbildungsberuf?.beschreibung || 
         jsonData.rahmenlehrplan?.beruf?.beschreibung || 
         jsonData.document_data?.berufsbeschreibung || 
         '';
}

// Extract profession duration from various possible locations
function extractProfessionDuration(jsonData: any): string {
  return jsonData.ausbildungsdauer || 
         jsonData.profession?.duration || 
         jsonData.beruf?.ausbildungsdauer || 
         jsonData.ausbildungsberuf?.dauer || 
         jsonData.rahmenlehrplan?.beruf?.ausbildungsdauer || 
         jsonData.document_data?.ausbildungsdauer || 
         '';
}

// Extract profession field from various possible locations
function extractProfessionField(jsonData: any): string {
  return jsonData.berufsfeld || 
         jsonData.profession?.field || 
         jsonData.beruf?.berufsfeld || 
         jsonData.ausbildungsberuf?.berufsfeld || 
         jsonData.rahmenlehrplan?.beruf?.berufsfeld || 
         jsonData.document_data?.berufsfeld || 
         '';
}

// Extract training years from various possible locations
function extractTrainingYears(jsonData: any): number {
  const years = jsonData.ausbildungsjahre || 
                jsonData.trainingYears || 
                jsonData.ausbildungsjahre || 
                jsonData.dauer || 
                parseFloat(jsonData.profession?.duration) || 
                jsonData.rahmenlehrplan?.ausbildungsdauer || 
                jsonData.document_data?.ausbildungsjahre || 
                3;
                
  // If it's a string like "3 Jahre", extract just the number
  if (typeof years === 'string') {
    const match = years.match(/(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  
  return Number(years) || 3;
}

// Extract total hours from various possible locations
function extractTotalHours(jsonData: any): number {
  return jsonData.gesamtstunden || 
         jsonData.totalHours || 
         jsonData.gesamtstunden || 
         jsonData.rahmenlehrplan?.gesamtstunden || 
         jsonData.document_data?.gesamtstunden || 
         0;
}

// Extract issue date from various possible locations
function extractIssueDate(jsonData: any): string {
  return jsonData.ausgabedatum || 
         jsonData.issueDate || 
         jsonData.ausgabedatum || 
         jsonData.datum || 
         jsonData.rahmenlehrplan?.datum || 
         jsonData.document_data?.ausgabedatum || 
         '';
}

// Extract valid from date from various possible locations
function extractValidFrom(jsonData: any): string {
  return jsonData.gueltigAb || 
         jsonData.validFrom || 
         jsonData.gültigAb || 
         jsonData.gueltigAb || 
         jsonData.rahmenlehrplan?.gueltigAb || 
         jsonData.document_data?.gueltigAb || 
         '';
}

// Extract valid until date from various possible locations
function extractValidUntil(jsonData: any): string {
  return jsonData.gueltigBis || 
         jsonData.validUntil || 
         jsonData.gültigBis || 
         jsonData.gueltigBis || 
         jsonData.rahmenlehrplan?.gueltigBis || 
         jsonData.document_data?.gueltigBis || 
         '';
}

// Extract publisher from various possible locations
function extractPublisher(jsonData: any): string {
  return jsonData.herausgeber || 
         jsonData.publisher || 
         jsonData.herausgeber || 
         jsonData.rahmenlehrplan?.herausgeber || 
         jsonData.document_data?.herausgeber || 
         '';
}

// Parse the Anlagenmechaniker format
function parseAnlagenmechanikerFormat(jsonData: any): LearningField[] {
  console.log("Parsing Anlagenmechaniker format...");
  
  // Get the learning fields array from the right location
  const lernfelder = jsonData.lernfeld_ausbildungsteil || 
                   jsonData.document_data?.lernfeld_ausbildungsteil || 
                   [];
  
  if (!Array.isArray(lernfelder) || lernfelder.length === 0) {
    console.warn("Keine Lernfelder im Anlagenmechaniker-Format gefunden");
    return [];
  }
  
  return lernfelder.map((field: any, index: number) => {
    console.log(`Verarbeite Lernfeld ${index + 1} (Anlagenmechaniker Format):`, field.name || "Unbenannt");
    
    // Process time value which might be in zeitwert object or directly as string
    let hoursValue = 0;
    if (field.zeitwert && field.zeitwert.wert) {
      hoursValue = parseInt(field.zeitwert.wert, 10) || 0;
    } else if (field.stunden) {
      hoursValue = parseInt(field.stunden, 10) || 0;
    } else if (field.zeitrichtwert) {
      hoursValue = parseInt(field.zeitrichtwert, 10) || 0;
    }
    
    // Process year from zeitraum if available
    let yearValue = 1;
    if (field.zeitraum && typeof field.zeitraum === 'string') {
      const match = field.zeitraum.match(/(\d+)/);
      if (match && match[1]) {
        yearValue = parseInt(match[1], 10);
      }
    } else if (field.ausbildungsjahr) {
      yearValue = parseInt(field.ausbildungsjahr, 10) || 1;
    }
    
    const parsedField: LearningField = {
      id: field.id || `lf${field.nummer || (index + 1)}`,
      code: `LF${field.nummer || (index + 1)}`,
      title: field.name || field.titel || field.bezeichnung || `Lernfeld ${field.nummer || (index + 1)}`,
      description: field.beschreibung || field.text || field.inhalt || '',
      hours: hoursValue,
      year: yearValue,
      schwerpunkt: field.schwerpunkt || field.fokus || '',
      zeitraum: field.zeitraum || '',
      competencies: []
    };
    
    // Process competencies
    if (Array.isArray(field.kompetenzen)) {
      parsedField.competencies = field.kompetenzen.map((comp: any, cIndex: number) => {
        const competency: Competency = {
          id: comp.id || `${parsedField.id}-k${comp.nummer || (cIndex + 1)}`,
          code: comp.nummer || `K${cIndex + 1}`,
          title: comp.text || comp.titel || comp.name || `Kompetenz ${cIndex + 1}`,
          description: comp.text || comp.beschreibung || comp.inhalt || '',
          competencyType: comp.typ || comp.art || 'Fachkompetenz',
          parentId: parsedField.id,
          escoMappings: [],
          competencyAnalysis: {
            skillType: ''
          }
        };
        
        // For title, if we're using the text field which might be long, trim it
        if (competency.title === comp.text && comp.text && comp.text.length > 50) {
          competency.title = comp.text.substring(0, 50) + '...';
        }
        
        // Process ESCO mappings from skills array
        if (Array.isArray(comp.skills)) {
          competency.escoMappings = comp.skills.map((skill: any, sIndex: number) => ({
            id: skill.id || `esco-${sIndex}`,
            uri: skill.uri || '',
            preferredLabel: skill.name || '',
            description: skill.description?.literal || skill.description || '',
            confidence: skill.relevance ? skill.relevance / 5 : 0.8, // Convert 1-5 scale to 0-1
            altLabels: []
          }));
          
          // Extract competence analysis from skills
          if (comp.competence_analysis) {
            competency.competencyAnalysis = {
              skillType: comp.competence_analysis.kompetenzdimension || comp.competence_analysis.lernzielbereich || '',
              lernzielbereich: comp.competence_analysis.lernzielbereich || '',
              bloomLevel: comp.competence_analysis.taxonomiestufe_bezeichnung || '',
              difficulty: comp.competence_analysis.taxonomiestufe || 0,
              relevance: 0,
              digitalLevel: 0
            };
          }
          
          // If no competence_analysis, try to fill from skill info
          if (!competency.competencyAnalysis.skillType && comp.skills.length > 0) {
            const firstSkill = comp.skills[0];
            competency.competencyAnalysis = {
              skillType: firstSkill.skillType || 'Fachkompetenz',
              bloomLevel: '',
              relevance: firstSkill.relevance || 0,
              difficulty: 0,
              digitalLevel: 0
            };
          }
        }
        
        return competency;
      });
    }
    
    return parsedField;
  });
}

// Parse the standard format
function parseStandardFormat(jsonData: any): LearningField[] {
  console.log("Parsing standard format...");
  
  // Get the learning fields array from the right location
  const lernfelder = jsonData.learningFields || jsonData.lernfelder || [];
  
  if (!Array.isArray(lernfelder) || lernfelder.length === 0) {
    console.warn("Keine Lernfelder im Standard-Format gefunden");
    return [];
  }
  
  return lernfelder.map((field: any, index: number) => {
    console.log(`Verarbeite Lernfeld ${index + 1} (Standard Format):`, field.title || field.name || "Unbenannt");
    
    const parsedField: LearningField = {
      id: field.id || `lf${index + 1}`,
      code: field.code || field.nummer || `LF${index + 1}`,
      title: field.title || field.name || field.titel || field.bezeichnung || `Lernfeld ${index + 1}`,
      description: field.description || field.beschreibung || field.text || field.inhalt || '',
      hours: parseInt(field.hours || field.stunden || 0, 10),
      year: parseInt(field.year || field.jahr || field.ausbildungsjahr || 1, 10),
      schwerpunkt: field.schwerpunkt || field.fokus || field.thema || '',
      zeitraum: field.zeitraum || field.dauer || '',
      competencies: []
    };
    
    // Process competencies
    const competencies = field.competencies || field.kompetenzen || [];
    
    if (Array.isArray(competencies)) {
      parsedField.competencies = competencies.map((comp: any, cIndex: number) => {
        const competency: Competency = {
          id: comp.id || `${parsedField.id}-k${cIndex + 1}`,
          code: comp.code || comp.nummer || `K${cIndex + 1}`,
          title: comp.title || comp.titel || comp.name || comp.bezeichnung || `Kompetenz ${cIndex + 1}`,
          description: comp.description || comp.beschreibung || comp.text || comp.inhalt || comp.definition || '',
          competencyType: comp.competencyType || comp.typ || comp.art || comp.kompetenzart || '',
          level: comp.level || comp.niveau || comp.stufe || comp.schwierigkeitsgrad || 0,
          parentId: parsedField.id,
          escoMappings: [],
          competencyAnalysis: {
            skillType: comp.competencyAnalysis?.skillType || comp.analyse?.kompetenztyp || 
                       comp.analysis?.skillType || comp.analysis?.kompetenztyp || '',
            lernzielbereich: comp.competencyAnalysis?.lernzielbereich || comp.analyse?.lernzielbereich || 
                           comp.analysis?.lernzielbereich || '',
            keywords: comp.competencyAnalysis?.keywords || comp.analyse?.schlagworte || 
                      comp.analysis?.keywords || comp.analysis?.schlagworte || [],
            bloomLevel: comp.competencyAnalysis?.bloomLevel || comp.analyse?.bloomStufe || 
                       comp.analysis?.bloomLevel || comp.analysis?.bloomStufe || '',
            relevance: comp.competencyAnalysis?.relevance || comp.analyse?.relevanz || 
                      comp.analysis?.relevance || comp.analysis?.relevanz || 0,
            difficulty: comp.competencyAnalysis?.difficulty || comp.analyse?.schwierigkeit || 
                       comp.analysis?.difficulty || comp.analysis?.schwierigkeit || 0,
            digitalLevel: comp.competencyAnalysis?.digitalLevel || comp.analyse?.digitalisierungsgrad || 
                         comp.analysis?.digitalLevel || comp.analysis?.digitalisierungsgrad || 0,
          }
        };
        
        // Process competence analysis special case
        if (comp.competence_analysis) {
          competency.competencyAnalysis = {
            skillType: comp.competence_analysis.kompetenzdimension || comp.competence_analysis.lernzielbereich || '',
            lernzielbereich: comp.competence_analysis.lernzielbereich || '',
            bloomLevel: comp.competence_analysis.taxonomiestufe_bezeichnung || '',
            difficulty: comp.competence_analysis.taxonomiestufe || 0,
            relevance: 0,
            digitalLevel: 0
          };
        }
        
        // Parse ESCO mappings in different possible formats
        const mappingKeys = ['escoMappings', 'esco', 'escoMapping', 'mappings', 'skills'];
        for (const key of mappingKeys) {
          if (Array.isArray(comp[key])) {
            // Process standard ESCO mappings
            if (key !== 'skills') {
              competency.escoMappings = comp[key].map((mapping: any) => ({
                id: mapping.id || generateId(),
                uri: mapping.uri || mapping.url || mapping.link || '',
                preferredLabel: mapping.preferredLabel || mapping.label || mapping.bezeichnung || 
                              mapping.name || mapping.title || '',
                altLabels: mapping.altLabels || mapping.alternativeLabels || mapping.alternatives || [],
                description: mapping.description || mapping.beschreibung || mapping.definition || '',
                confidence: mapping.confidence || mapping.konfidenz || mapping.relevanz || 0,
              }));
            } 
            // Special case for Anlagenmechaniker skills array
            else if (key === 'skills' && comp[key][0]?.uri) {
              competency.escoMappings = comp[key].map((skill: any, sIndex: number) => ({
                id: skill.id || `esco-${sIndex}`,
                uri: skill.uri || '',
                preferredLabel: skill.name || '',
                description: skill.description?.literal || skill.description || '',
                confidence: skill.relevance ? skill.relevance / 5 : 0.8, // Convert 1-5 scale to 0-1
                altLabels: []
              }));
            }
            break;
          }
        }
        
        return competency;
      });
    }
    
    return parsedField;
  });
}

// Parse the nested format
function parseNestedFormat(jsonData: any): LearningField[] {
  console.log("Parsing nested format...");
  
  // Determine the correct path to learning fields
  let lernfelder: any[] = [];
  
  if (jsonData.curriculum?.learningFields) {
    lernfelder = jsonData.curriculum.learningFields;
  } else if (jsonData.curriculum?.lernfelder) {
    lernfelder = jsonData.curriculum.lernfelder;
  } else if (jsonData.rahmenlehrplan?.lernfelder) {
    lernfelder = jsonData.rahmenlehrplan.lernfelder;
  } else if (jsonData.rahmenlehrplan?.inhalte) {
    // Handle special case for "inhalte" containing lernfelder
    const inhalte = jsonData.rahmenlehrplan.inhalte;
    lernfelder = [];
    
    for (const key in inhalte) {
      if (/^lernfeld\s*\d+$/i.test(key)) {
        const fieldData = inhalte[key];
        const fieldNumber = key.match(/\d+/)?.[0] || '';
        
        lernfelder.push({
          id: `lf${fieldNumber}`,
          code: `LF${fieldNumber}`,
          titel: fieldData.titel || fieldData.bezeichnung || fieldData.name || '',
          beschreibung: fieldData.beschreibung || fieldData.inhalt || '',
          stunden: fieldData.zeitrichtwert || fieldData.stunden || 0,
          jahr: fieldData.ausbildungsjahr || fieldData.jahr || 1,
          schwerpunkt: fieldData.schwerpunkt || fieldData.fokus || '',
          
          // Extract competencies from different possible properties
          kompetenzen: extractCompetenciesFromNestedField(fieldData, `lf${fieldNumber}`)
        });
      }
    }
  }
  
  if (!Array.isArray(lernfelder) || lernfelder.length === 0) {
    console.warn("Keine Lernfelder im verschachtelten Format gefunden");
    return [];
  }
  
  return parseStandardFormat({ learningFields: lernfelder });
}

// Extract competencies from a nested field
function extractCompetenciesFromNestedField(fieldData: any, fieldId: string): any[] {
  // Check various possible locations for competencies
  if (Array.isArray(fieldData.kompetenzen)) {
    return fieldData.kompetenzen;
  }
  
  if (Array.isArray(fieldData.competencies)) {
    return fieldData.competencies;
  }
  
  if (fieldData.zielformulierungen && typeof fieldData.zielformulierungen === 'object') {
    const competencies = [];
    
    for (const compKey in fieldData.zielformulierungen) {
      const compData = fieldData.zielformulierungen[compKey];
      if (typeof compData === 'object') {
        competencies.push({
          id: `${fieldId}-${compKey}`,
          title: compData.titel || compData.bezeichnung || 'Kompetenz',
          description: compData.text || compData.beschreibung || compData.inhalt || '',
          competencyType: compData.typ || compData.art || ''
        });
      } else if (typeof compData === 'string') {
        // If it's a direct string, use it as description
        competencies.push({
          id: `${fieldId}-${compKey}`,
          title: `Kompetenz ${compKey}`,
          description: compData,
          competencyType: ''
        });
      }
    }
    
    return competencies;
  }
  
  // Check for more specific competency types
  const competencies = [];
  
  // Check fertigkeiten
  if (fieldData.fertigkeiten) {
    if (Array.isArray(fieldData.fertigkeiten)) {
      fieldData.fertigkeiten.forEach((fertigkeit: any, index: number) => {
        competencies.push({
          id: `${fieldId}-fertigkeit-${index}`,
          title: typeof fertigkeit === 'string' ? `Fertigkeit ${index+1}` : fertigkeit.titel || fertigkeit.bezeichnung,
          description: typeof fertigkeit === 'string' ? fertigkeit : fertigkeit.text || fertigkeit.beschreibung,
          competencyType: 'Fertigkeit'
        });
      });
    }
  }
  
  // Check kenntnisse
  if (fieldData.kenntnisse) {
    if (Array.isArray(fieldData.kenntnisse)) {
      fieldData.kenntnisse.forEach((kenntnis: any, index: number) => {
        competencies.push({
          id: `${fieldId}-kenntnis-${index}`,
          title: typeof kenntnis === 'string' ? `Kenntnis ${index+1}` : kenntnis.titel || kenntnis.bezeichnung,
          description: typeof kenntnis === 'string' ? kenntnis : kenntnis.text || kenntnis.beschreibung,
          competencyType: 'Kenntnis'
        });
      });
    }
  }
  
  // Check inhalte
  if (fieldData.inhalte && typeof fieldData.inhalte === 'object') {
    for (const contentKey in fieldData.inhalte) {
      const contentItem = fieldData.inhalte[contentKey];
      competencies.push({
        id: `${fieldId}-inhalt-${contentKey}`,
        title: contentItem.titel || contentItem.thema || `Inhalt ${contentKey}`,
        description: contentItem.text || contentItem.beschreibung || (typeof contentItem === 'string' ? contentItem : ''),
        competencyType: 'Fachkompetenz'
      });
    }
  }
  
  return competencies;
}

// Try all possible approaches to find learning fields
function findLearningFieldsAnyFormat(jsonData: any): LearningField[] {
  console.log("Attempting to find learning fields using all possible approaches...");
  
  // Check different possible property names for learning fields
  const possibleFieldKeys = [
    'learningFields', 'lernfelder', 'fields', 'felder', 'lf',
    'curriculum.learningFields', 'curriculum.lernfelder', 
    'rahmenlehrplan.lernfelder', 'rahmenlehrplan.inhalte'
  ];
  
  let learningFields: any[] = [];
  
  for (const key of possibleFieldKeys) {
    let data = jsonData;
    
    // Handle nested properties like 'curriculum.learningFields'
    if (key.includes('.')) {
      const parts = key.split('.');
      let currentObj = jsonData;
      let valid = true;
      
      for (const part of parts) {
        if (currentObj && currentObj[part]) {
          currentObj = currentObj[part];
        } else {
          valid = false;
          break;
        }
      }
      
      if (valid) {
        data = currentObj;
      } else {
        continue;
      }
    } else if (jsonData[key]) {
      data = jsonData[key];
    } else {
      continue;
    }
    
    // Check if we found an array of learning fields
    if (Array.isArray(data)) {
      learningFields = data;
      console.log(`Gefunden: ${learningFields.length} Lernfelder in ${key}`);
      break;
    }
    
    // Special case: check if it's an object with numbered keys (1, 2, 3, etc.) or keys like lf1, lf2
    if (typeof data === 'object' && !Array.isArray(data)) {
      const fieldArray = [];
      let isNumberedObject = false;
      
      for (const fieldKey in data) {
        // Check if keys are numbers or "lf1", "lf2" format
        if (/^\d+$/.test(fieldKey) || /^lf\d+$/i.test(fieldKey)) {
          isNumberedObject = true;
          const field = data[fieldKey];
          
          // Add the key as id or code if not present
          if (typeof field === 'object') {
            field.id = field.id || fieldKey;
            field.code = field.code || fieldKey.replace(/^lf/i, 'LF');
            if (/^\d+$/.test(fieldKey)) {
              field.code = field.code || `LF${fieldKey}`;
            }
            fieldArray.push(field);
          }
        }
      }
      
      if (isNumberedObject && fieldArray.length > 0) {
        learningFields = fieldArray;
        console.log(`Gefunden: ${learningFields.length} Lernfelder in ${key} (nummeriertes Objekt)`);
        break;
      }
    }
  }
  
  // Try to find objects that might be learning fields based on properties
  if (learningFields.length === 0) {
    console.log("Suche nach Objekten die Lernfelder sein könnten basierend auf Eigenschaften...");
    
    const allObjects = findAllObjects(jsonData);
    const possibleFields = allObjects.filter(obj => 
      (obj.titel || obj.title || obj.name || obj.bezeichnung) && 
      (obj.id || obj.code || obj.nummer || obj.lernfeldnummer) &&
      (obj.competencies || obj.kompetenzen || obj.skills || obj.zielformulierungen || obj.inhalte)
    );
    
    if (possibleFields.length > 0) {
      learningFields = possibleFields;
      console.log(`Als letzten Ausweg gefunden: ${learningFields.length} mögliche Lernfelder durch Eigenschaftsanalyse`);
    }
  }
  
  if (learningFields.length === 0) {
    console.warn("Keine Lernfelder in den erwarteten Eigenschaften gefunden");
    return [];
  }
  
  // Now parse the found learning fields using the standard format parser
  return parseStandardFormat({ learningFields });
}

// Helper function to find all objects in a JSON structure
function findAllObjects(obj: any, result: any[] = []): any[] {
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      obj.forEach(item => findAllObjects(item, result));
    } else {
      result.push(obj);
      Object.values(obj).forEach(value => findAllObjects(value, result));
    }
  }
  return result;
}

// Generate metadata about the curriculum
function generateCurriculumMetadata(curriculum: CurriculumData): void {
  // Calculate various statistics
  const competencyCount = curriculum.competencies.length;
  const escoMappingCount = curriculum.competencies.reduce((count, comp) => 
    count + (comp.escoMappings?.length || 0), 0);
    
  const digitalCompetencyCount = curriculum.competencies.filter(comp => 
    (comp.competencyAnalysis?.digitalLevel || 0) > 2).length;
    
  const competencyTypeDistribution: Record<string, number> = {};
  curriculum.competencies.forEach(comp => {
    if (comp.competencyType) {
      competencyTypeDistribution[comp.competencyType] = 
        (competencyTypeDistribution[comp.competencyType] || 0) + 1;
    }
  });
  
  const bloomLevelDistribution: Record<string, number> = {};
  curriculum.competencies.forEach(comp => {
    if (comp.competencyAnalysis?.bloomLevel) {
      bloomLevelDistribution[comp.competencyAnalysis.bloomLevel] = 
        (bloomLevelDistribution[comp.competencyAnalysis.bloomLevel] || 0) + 1;
    }
  });
  
  curriculum.metadata = {
    competencyCount,
    escoMappingCount,
    digitalCompetencyCount,
    averageCompetenciesPerField: curriculum.learningFields.length > 0 
      ? competencyCount / curriculum.learningFields.length 
      : 0,
    competencyTypeDistribution,
    bloomLevelDistribution,
  };
}

// Generate a random ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}