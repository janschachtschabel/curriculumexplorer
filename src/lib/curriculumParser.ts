import { CurriculumData, LearningField, Competency } from './curriculumTypes';

export function parseCurriculum(jsonData: any): CurriculumData {
  try {
    console.log("Parsen der Lehrplandaten gestartet:", JSON.stringify(jsonData).substring(0, 200) + "...");
    
    // Capture metadata, esco, and mappings for reference
    const documentMetadata = jsonData.metadata || {};
    const escoData = jsonData.esco || {};
    const kldbMapping = jsonData.document_data?.kldb_mapping || '';
    const iscoMapping = jsonData.document_data?.isco_mapping || {};
    
    // Handle Anlagenmechaniker format which has document_data structure
    const data = jsonData.document_data || jsonData;
    
    // Parse basic curriculum information
    const curriculum: CurriculumData = {
      id: jsonData.id || jsonData.kennung || generateId(),
      title: jsonData.title || jsonData.titel || jsonData.name || 'Unbenannter Lehrplan',
      description: jsonData.description || jsonData.beschreibung || '',
      profession: {
        title: data.beruf || data.profession?.title || data.profession?.name || 
               data.beruf?.bezeichnung || data.beruf?.title || 
               data.ausbildungsberuf?.bezeichnung || data.rahmenlehrplan?.beruf?.bezeichnung || 
               'Unbekannter Beruf',
        code: data.beruf_code || data.profession?.code || data.beruf?.kennziffer || 
              data.beruf?.code || data.ausbildungsberuf?.kennung || 
              data.rahmenlehrplan?.beruf?.kennziffer || '',
        description: data.berufsbeschreibung || data.profession?.description || data.beruf?.beschreibung || 
                    data.ausbildungsberuf?.beschreibung || data.rahmenlehrplan?.beruf?.beschreibung || '',
        duration: data.ausbildungsdauer || data.profession?.duration || data.beruf?.ausbildungsdauer || 
                 data.ausbildungsberuf?.dauer || data.rahmenlehrplan?.beruf?.ausbildungsdauer || '',
        field: data.berufsfeld || data.profession?.field || data.beruf?.berufsfeld || 
               data.ausbildungsberuf?.berufsfeld || data.rahmenlehrplan?.beruf?.berufsfeld || '',
      },
      trainingYears: data.ausbildungsjahre || jsonData.trainingYears || jsonData.ausbildungsjahre || 
                    jsonData.dauer || parseFloat(jsonData.profession?.duration) || 
                    jsonData.rahmenlehrplan?.ausbildungsdauer || 3,
      totalHours: data.gesamtstunden || jsonData.totalHours || jsonData.gesamtstunden || 
                 jsonData.rahmenlehrplan?.gesamtstunden || 0,
      issueDate: data.ausgabedatum || jsonData.issueDate || jsonData.ausgabedatum || jsonData.datum || 
                jsonData.rahmenlehrplan?.datum || '',
      validFrom: data.gueltigAb || jsonData.validFrom || jsonData.gültigAb || jsonData.gueltigAb || 
                jsonData.rahmenlehrplan?.gueltigAb || '',
      validUntil: data.gueltigBis || jsonData.validUntil || jsonData.gültigBis || jsonData.gueltigBis || 
                 jsonData.rahmenlehrplan?.gueltigBis || '',
      publisher: data.herausgeber || jsonData.publisher || jsonData.herausgeber || 
                jsonData.rahmenlehrplan?.herausgeber || '',
      learningFields: [],
      competencies: [],
      documentMetadata,
      escoData,
      kldbMapping,
      iscoMapping
    };

    // Special case for Anlagenmechaniker format with lernfeld_ausbildungsteil
    if (Array.isArray(data.lernfeld_ausbildungsteil)) {
      const learningFields = data.lernfeld_ausbildungsteil.map((field: any, index: number) => {
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
          field.kompetenzen.forEach((comp: any, cIndex: number) => {
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
            
            parsedField.competencies.push(competency);
          });
        }
        
        return parsedField;
      });
      
      curriculum.learningFields = learningFields;
      
      // Create flat list of all competencies
      curriculum.competencies = learningFields.reduce((acc, field) => {
        return [...acc, ...field.competencies];
      }, []);
      
      // Check if there's competence_analysis at the top level
      if (jsonData.competence_analysis && typeof jsonData.competence_analysis === 'object') {
        // Map global competence analysis to competencies if they match by title
        Object.entries(jsonData.competence_analysis).forEach(([title, analysis]) => {
          const matchingCompetencies = curriculum.competencies.filter(comp => 
            comp.title === title || comp.description.startsWith(title)
          );
          
          matchingCompetencies.forEach(comp => {
            if (typeof analysis === 'object') {
              comp.competencyAnalysis = {
                skillType: (analysis as any).kompetenzdimension || (analysis as any).lernzielbereich || comp.competencyAnalysis?.skillType || '',
                lernzielbereich: (analysis as any).lernzielbereich || comp.competencyAnalysis?.lernzielbereich || '',
                bloomLevel: (analysis as any).taxonomiestufe_bezeichnung || comp.competencyAnalysis?.bloomLevel || '',
                difficulty: (analysis as any).taxonomiestufe || comp.competencyAnalysis?.difficulty || 0,
                relevance: comp.competencyAnalysis?.relevance || 0,
                digitalLevel: comp.competencyAnalysis?.digitalLevel || 0
              };
            }
          });
        });
      }
      
      // Generate metadata
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
      
      console.log("Anlagenmechaniker Lehrplanparsen abgeschlossen, gefunden:", {
        lernfelder: curriculum.learningFields.length,
        kompetenzen: competencyCount,
        escoMappings: escoMappingCount
      });
      
      return curriculum;
    }

    // Try to find learning fields in different possible locations and formats
    let learningFields: any[] = [];
    
    // Check different possible property names for learning fields
    const possibleFieldKeys = [
      'learningFields', 'lernfelder', 'fields', 'felder', 'lf',
      'curriculum.learningFields', 'curriculum.lernfelder', 
      'rahmenlehrplan.lernfelder', 'rahmenlehrplan.inhalte'
    ];
    
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
    
    // If standard methods failed, try more specific patterns for the Anlagenmechaniker format
    if (learningFields.length === 0 && jsonData.rahmenlehrplan && jsonData.rahmenlehrplan.inhalte) {
      const anlagenMechanikerLernfelder = [];
      
      // Process Anlagenmechaniker format with lernfelder in "inhalte"
      for (const key in jsonData.rahmenlehrplan.inhalte) {
        if (/^lernfeld\s*\d+$/i.test(key)) {
          const fieldData = jsonData.rahmenlehrplan.inhalte[key];
          const fieldNumber = key.match(/\d+/)?.[0] || '';
          
          const field = {
            id: `lf${fieldNumber}`,
            code: `LF${fieldNumber}`,
            title: fieldData.titel || fieldData.bezeichnung || fieldData.name || '',
            description: fieldData.beschreibung || fieldData.inhalt || '',
            hours: fieldData.zeitrichtwert || fieldData.stunden || 0,
            year: fieldData.ausbildungsjahr || fieldData.jahr || 1,
            schwerpunkt: fieldData.schwerpunkt || fieldData.fokus || '',
            competencies: []
          };
          
          // Try to find competencies - they might be in 'zielformulierungen'
          if (fieldData.zielformulierungen && typeof fieldData.zielformulierungen === 'object') {
            for (const compKey in fieldData.zielformulierungen) {
              const compData = fieldData.zielformulierungen[compKey];
              if (typeof compData === 'object') {
                field.competencies.push({
                  id: `${field.id}-${compKey}`,
                  title: compData.titel || compData.bezeichnung || 'Kompetenz',
                  description: compData.text || compData.beschreibung || compData.inhalt || '',
                  competencyType: compData.typ || compData.art || ''
                });
              } else if (typeof compData === 'string') {
                // If it's a direct string, use it as description
                field.competencies.push({
                  id: `${field.id}-${compKey}`,
                  title: `Kompetenz ${compKey}`,
                  description: compData,
                  competencyType: ''
                });
              }
            }
          }
          
          // If inhalte field has direct content information
          if (fieldData.inhalte && typeof fieldData.inhalte === 'object') {
            for (const contentKey in fieldData.inhalte) {
              const contentItem = fieldData.inhalte[contentKey];
              field.competencies.push({
                id: `${field.id}-inhalt-${contentKey}`,
                title: contentItem.titel || contentItem.thema || `Inhalt ${contentKey}`,
                description: contentItem.text || contentItem.beschreibung || (typeof contentItem === 'string' ? contentItem : ''),
                competencyType: 'Fachkompetenz'
              });
            }
          }
          
          // Check direct fertigkeiten/kenntnisse keys
          if (fieldData.fertigkeiten && Array.isArray(fieldData.fertigkeiten)) {
            fieldData.fertigkeiten.forEach((fertigkeit, index) => {
              field.competencies.push({
                id: `${field.id}-fertigkeit-${index}`,
                title: typeof fertigkeit === 'string' ? `Fertigkeit ${index+1}` : fertigkeit.titel || fertigkeit.bezeichnung,
                description: typeof fertigkeit === 'string' ? fertigkeit : fertigkeit.text || fertigkeit.beschreibung,
                competencyType: 'Fertigkeit'
              });
            });
          }
          
          if (fieldData.kenntnisse && Array.isArray(fieldData.kenntnisse)) {
            fieldData.kenntnisse.forEach((kenntnis, index) => {
              field.competencies.push({
                id: `${field.id}-kenntnis-${index}`,
                title: typeof kenntnis === 'string' ? `Kenntnis ${index+1}` : kenntnis.titel || kenntnis.bezeichnung,
                description: typeof kenntnis === 'string' ? kenntnis : kenntnis.text || kenntnis.beschreibung,
                competencyType: 'Kenntnis'
              });
            });
          }
          
          anlagenMechanikerLernfelder.push(field);
        }
      }
      
      if (anlagenMechanikerLernfelder.length > 0) {
        learningFields = anlagenMechanikerLernfelder;
        console.log(`Gefunden: ${learningFields.length} Lernfelder im Anlagenmechaniker-Format`);
      }
    }
    
    if (learningFields.length === 0) {
      console.warn("Keine Lernfelder in den erwarteten Eigenschaften gefunden");
      console.log("Verfügbare Top-Level-Eigenschaften:", Object.keys(jsonData));
      
      // Last resort: Try to find objects that might be learning fields based on properties
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

    // Parse learning fields
    let allCompetencies: Competency[] = [];
    
    curriculum.learningFields = learningFields.map((field, index) => {
      console.log(`Verarbeite Lernfeld ${index + 1}:`, field.title || field.name || field.bezeichnung || field.titel || "Unbenannt");
      
      // Try to find competencies in different possible properties
      const competencyKeys = [
        'competencies', 'kompetenzen', 'skills', 'fertigkeiten', 'faehigkeiten', 
        'fähigkeiten', 'zielformulierungen', 'lernziele'
      ];
      let competencies: any[] = [];
      
      for (const key of competencyKeys) {
        if (Array.isArray(field[key])) {
          competencies = field[key];
          console.log(`  Gefunden: ${competencies.length} Kompetenzen in field.${key}`);
          break;
        } else if (field[key] && typeof field[key] === 'object') {
          // Handle object form of competencies
          const compArray = [];
          for (const compKey in field[key]) {
            const comp = field[key][compKey];
            if (typeof comp === 'object') {
              comp.id = comp.id || `${field.id}-${compKey}`;
              comp.title = comp.title || comp.titel || comp.bezeichnung || `Kompetenz ${compKey}`;
              comp.description = comp.description || comp.beschreibung || comp.text || comp.inhalt || '';
              compArray.push(comp);
            } else if (typeof comp === 'string') {
              // For string values, create a minimal competency object
              compArray.push({
                id: `${field.id}-${compKey}`,
                title: `Kompetenz ${compKey}`,
                description: comp,
                competencyType: ''
              });
            }
          }
          
          if (compArray.length > 0) {
            competencies = compArray;
            console.log(`  Gefunden: ${competencies.length} Kompetenzen in field.${key} (objekt)`);
            break;
          }
        }
      }
      
      // Special case: check if competencies are in a numbered object (k1, k2, etc.)
      if (competencies.length === 0) {
        const compPatterns = [/^k\d+$/i, /^kompetenz\d+$/i, /^ziel\d+$/i, /^lernziel\d+$/i];
        
        for (const pattern of compPatterns) {
          const compArray = [];
          let found = false;
          
          for (const key in field) {
            if (pattern.test(key)) {
              found = true;
              const comp = field[key];
              if (typeof comp === 'object') {
                comp.id = comp.id || `${field.id}-${key}`;
                comp.title = comp.title || comp.titel || comp.bezeichnung || `Kompetenz ${key}`;
                comp.description = comp.description || comp.beschreibung || comp.text || comp.inhalt || '';
                compArray.push(comp);
              } else if (typeof comp === 'string') {
                compArray.push({
                  id: `${field.id}-${key}`,
                  title: `Kompetenz ${key.replace(/[^\d]/g, '')}`,
                  description: comp,
                  competencyType: ''
                });
              }
            }
          }
          
          if (found && compArray.length > 0) {
            competencies = compArray;
            console.log(`  Gefunden: ${competencies.length} Kompetenzen als nummerierte Eigenschaften (${pattern})`);
            break;
          }
        }
      }
      
      // Handle special case for Anlagenmechaniker format
      if (competencies.length === 0 && field.inhalte) {
        const compArray = [];
        
        if (typeof field.inhalte === 'object') {
          for (const key in field.inhalte) {
            const item = field.inhalte[key];
            if (typeof item === 'object') {
              compArray.push({
                id: `${field.id}-inhalt-${key}`,
                title: item.titel || item.thema || item.bezeichnung || `Inhalt ${key}`,
                description: item.text || item.beschreibung || item.inhalt || '',
                competencyType: 'Fachkompetenz'
              });
            } else if (typeof item === 'string') {
              compArray.push({
                id: `${field.id}-inhalt-${key}`,
                title: `Inhalt ${key}`,
                description: item,
                competencyType: 'Fachkompetenz'
              });
            }
          }
        } else if (Array.isArray(field.inhalte)) {
          field.inhalte.forEach((item, idx) => {
            if (typeof item === 'object') {
              compArray.push({
                id: `${field.id}-inhalt-${idx}`,
                title: item.titel || item.thema || item.bezeichnung || `Inhalt ${idx+1}`,
                description: item.text || item.beschreibung || item.inhalt || '',
                competencyType: 'Fachkompetenz'
              });
            } else if (typeof item === 'string') {
              compArray.push({
                id: `${field.id}-inhalt-${idx}`,
                title: `Inhalt ${idx+1}`,
                description: item,
                competencyType: 'Fachkompetenz'
              });
            }
          });
        }
        
        if (compArray.length > 0) {
          competencies = compArray;
          console.log(`  Gefunden: ${competencies.length} Kompetenzen aus Inhalte`);
        }
      }
      
      // Process zeitwert for Anlagenmechaniker format
      let hoursValue = field.hours || field.stunden || 0;
      if (field.zeitwert && field.zeitwert.wert) {
        hoursValue = parseInt(field.zeitwert.wert, 10) || 0;
      } else if (field.zeitrichtwert) {
        hoursValue = parseInt(field.zeitrichtwert, 10) || 0;
      }
      
      // Process zeitraum for year
      let yearValue = field.year || field.jahr || field.ausbildungsjahr || 1;
      if (field.zeitraum && typeof field.zeitraum === 'string') {
        const match = field.zeitraum.match(/(\d+)/);
        if (match && match[1]) {
          yearValue = parseInt(match[1], 10);
        }
      }
      
      const parsedField: LearningField = {
        id: field.id || field.lernfeld_id || field.lernfeldnummer || `lf${index + 1}`,
        code: field.code || field.nummer || field.lernfeldnummer || `LF${index + 1}`,
        title: field.title || field.name || field.titel || field.bezeichnung || 'Unbenanntes Lernfeld',
        description: field.description || field.beschreibung || field.text || field.inhalt || '',
        hours: hoursValue,
        year: yearValue,
        schwerpunkt: field.schwerpunkt || field.fokus || field.thema || '',
        zeitraum: field.zeitraum || field.dauer || '',
        competencies: [],
      };
      
      // Parse competencies
      parsedField.competencies = competencies.map((comp, cIndex) => {
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
        
        allCompetencies.push(competency);
        return competency;
      });
      
      return parsedField;
    });
    
    curriculum.competencies = allCompetencies;
    
    // Generate metadata
    const competencyCount = allCompetencies.length;
    const escoMappingCount = allCompetencies.reduce((count, comp) => 
      count + (comp.escoMappings?.length || 0), 0);
      
    const digitalCompetencyCount = allCompetencies.filter(comp => 
      (comp.competencyAnalysis?.digitalLevel || 0) > 2).length;
      
    const competencyTypeDistribution: Record<string, number> = {};
    allCompetencies.forEach(comp => {
      if (comp.competencyType) {
        competencyTypeDistribution[comp.competencyType] = 
          (competencyTypeDistribution[comp.competencyType] || 0) + 1;
      }
    });
    
    const bloomLevelDistribution: Record<string, number> = {};
    allCompetencies.forEach(comp => {
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
    
    console.log("Lehrplanparsen abgeschlossen, gefunden:", {
      lernfelder: curriculum.learningFields.length,
      kompetenzen: competencyCount,
      escoMappings: escoMappingCount
    });
    
    return curriculum;
  } catch (error) {
    console.error('Error parsing curriculum data:', error);
    throw new Error(`Fehler beim Parsen der Lehrplandaten: ${error instanceof Error ? error.message : String(error)}`);
  }
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

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}