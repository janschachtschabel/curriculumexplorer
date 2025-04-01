import React, { useState } from 'react';
import { Terminal, FileText, Info, CheckCircle, AlertCircle } from 'lucide-react';

// JsonDebugger component for analyzing and debugging JSON files
export default function JsonDebugger({ jsonData }: { jsonData: any }) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'metadata': true,
    'structure': false,
    'validation': true,
    'learning-fields': false
  });
  
  if (!jsonData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center text-red-700 mb-2">
          <AlertCircle className="w-5 h-5 mr-2" />
          <h3 className="font-medium">Keine Daten zum Debuggen verfügbar</h3>
        </div>
        <p className="text-sm text-red-600">
          Es wurden keine JSON-Daten zum Analysieren übergeben.
        </p>
      </div>
    );
  }
  
  // Helper function to analyze the structure of the JSON
  const analyzeJsonStructure = () => {
    const topLevelKeys = Object.keys(jsonData);
    const possibleStructures = [
      { 
        name: "Standard-Format", 
        keys: ["learningFields", "lernfelder"], 
        found: topLevelKeys.some(key => ["learningFields", "lernfelder"].includes(key))
      },
      { 
        name: "Anlagenmechaniker-Format", 
        keys: ["lernfeld_ausbildungsteil", "document_data"], 
        found: topLevelKeys.includes("lernfeld_ausbildungsteil") || 
               (topLevelKeys.includes("document_data") && jsonData.document_data?.lernfeld_ausbildungsteil)
      },
      { 
        name: "Verschachtelt-Format", 
        keys: ["curriculum", "rahmenlehrplan"], 
        found: (topLevelKeys.includes("curriculum") && 
                (jsonData.curriculum?.learningFields || jsonData.curriculum?.lernfelder)) ||
               (topLevelKeys.includes("rahmenlehrplan") && 
                (jsonData.rahmenlehrplan?.lernfelder || jsonData.rahmenlehrplan?.inhalte))
      }
    ];
    
    const detectedStructures = possibleStructures.filter(s => s.found);
    
    return {
      topLevelKeys,
      possibleStructures,
      detectedStructures,
      isProbablyValid: detectedStructures.length > 0
    };
  };
  
  // Analyze the learning fields structure
  const analyzeLearningFields = () => {
    // Find learning fields in different possible locations
    let learningFields = null;
    
    if (Array.isArray(jsonData.learningFields)) {
      learningFields = {
        location: "learningFields",
        fields: jsonData.learningFields
      };
    } else if (Array.isArray(jsonData.lernfelder)) {
      learningFields = {
        location: "lernfelder",
        fields: jsonData.lernfelder
      };
    } else if (Array.isArray(jsonData.lernfeld_ausbildungsteil)) {
      learningFields = {
        location: "lernfeld_ausbildungsteil",
        fields: jsonData.lernfeld_ausbildungsteil
      };
    } else if (jsonData.document_data?.lernfeld_ausbildungsteil) {
      learningFields = {
        location: "document_data.lernfeld_ausbildungsteil",
        fields: jsonData.document_data.lernfeld_ausbildungsteil
      };
    } else if (jsonData.curriculum?.learningFields) {
      learningFields = {
        location: "curriculum.learningFields",
        fields: jsonData.curriculum.learningFields
      };
    } else if (jsonData.curriculum?.lernfelder) {
      learningFields = {
        location: "curriculum.lernfelder",
        fields: jsonData.curriculum.lernfelder
      };
    } else if (jsonData.rahmenlehrplan?.lernfelder) {
      learningFields = {
        location: "rahmenlehrplan.lernfelder",
        fields: jsonData.rahmenlehrplan.lernfelder
      };
    } else if (jsonData.rahmenlehrplan?.inhalte) {
      // Special case for inhalte containing lernfelder
      const fields = [];
      for (const key in jsonData.rahmenlehrplan.inhalte) {
        if (/^lernfeld\s*\d+$/i.test(key)) {
          fields.push({
            ...jsonData.rahmenlehrplan.inhalte[key],
            _key: key
          });
        }
      }
      
      if (fields.length > 0) {
        learningFields = {
          location: "rahmenlehrplan.inhalte",
          fields
        };
      }
    }
    
    return learningFields;
  };
  
  // Analyze the profession data
  const analyzeProfessionData = () => {
    const professionData = {
      title: null,
      code: null,
      description: null,
      foundAt: []
    };
    
    // Check possible locations for profession title
    if (jsonData.beruf) {
      professionData.title = jsonData.beruf;
      professionData.foundAt.push("beruf");
    } else if (jsonData.profession?.title) {
      professionData.title = jsonData.profession.title;
      professionData.foundAt.push("profession.title");
    } else if (jsonData.profession?.name) {
      professionData.title = jsonData.profession.name;
      professionData.foundAt.push("profession.name");
    } else if (jsonData.beruf?.bezeichnung) {
      professionData.title = jsonData.beruf.bezeichnung;
      professionData.foundAt.push("beruf.bezeichnung");
    } else if (jsonData.ausbildungsberuf?.bezeichnung) {
      professionData.title = jsonData.ausbildungsberuf.bezeichnung;
      professionData.foundAt.push("ausbildungsberuf.bezeichnung");
    } else if (jsonData.rahmenlehrplan?.beruf?.bezeichnung) {
      professionData.title = jsonData.rahmenlehrplan.beruf.bezeichnung;
      professionData.foundAt.push("rahmenlehrplan.beruf.bezeichnung");
    } else if (jsonData.document_data?.beruf) {
      professionData.title = jsonData.document_data.beruf;
      professionData.foundAt.push("document_data.beruf");
    }
    
    // Check possible locations for profession code
    if (jsonData.beruf_code) {
      professionData.code = jsonData.beruf_code;
      professionData.foundAt.push("beruf_code");
    } else if (jsonData.profession?.code) {
      professionData.code = jsonData.profession.code;
      professionData.foundAt.push("profession.code");
    } else if (jsonData.beruf?.kennziffer) {
      professionData.code = jsonData.beruf.kennziffer;
      professionData.foundAt.push("beruf.kennziffer");
    } else if (jsonData.ausbildungsberuf?.kennung) {
      professionData.code = jsonData.ausbildungsberuf.kennung;
      professionData.foundAt.push("ausbildungsberuf.kennung");
    }
    
    // Check possible locations for profession description
    if (jsonData.berufsbeschreibung) {
      professionData.description = jsonData.berufsbeschreibung;
      professionData.foundAt.push("berufsbeschreibung");
    } else if (jsonData.profession?.description) {
      professionData.description = jsonData.profession.description;
      professionData.foundAt.push("profession.description");
    } else if (jsonData.beruf?.beschreibung) {
      professionData.description = jsonData.beruf.beschreibung;
      professionData.foundAt.push("beruf.beschreibung");
    }
    
    return professionData;
  };
  
  // Run analysis
  const structureAnalysis = analyzeJsonStructure();
  const learningFieldsAnalysis = analyzeLearningFields();
  const professionAnalysis = analyzeProfessionData();
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-4">
      <div className="flex items-center mb-4">
        <Terminal className="w-5 h-5 mr-2 text-gray-700" />
        <h2 className="text-lg font-semibold">JSON Diagnostik</h2>
      </div>
      
      {/* Validation Section */}
      <div className="mb-4">
        <div 
          className="flex items-center justify-between bg-gray-100 p-2 rounded cursor-pointer hover:bg-gray-200"
          onClick={() => toggleSection('validation')}
        >
          <div className="flex items-center">
            <Info className="w-4 h-4 mr-2 text-blue-600" />
            <h3 className="font-medium">Validierung</h3>
          </div>
          <span>{expandedSections['validation'] ? '▼' : '►'}</span>
        </div>
        
        {expandedSections['validation'] && (
          <div className="mt-2 p-3 bg-white rounded border border-gray-200">
            <div className="flex items-center">
              {structureAnalysis.isProbablyValid ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-green-700">Die JSON-Struktur scheint ein gültiges Lehrplan-Format zu haben.</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                  <span className="text-yellow-700">Die JSON-Struktur ist ungewöhnlich und entspricht keinem bekannten Lehrplan-Format.</span>
                </>
              )}
            </div>
            
            <div className="mt-3">
              <p className="font-medium mb-1">Erkanntes Format:</p>
              {structureAnalysis.detectedStructures.length > 0 ? (
                <ul className="list-disc pl-5 text-sm">
                  {structureAnalysis.detectedStructures.map(structure => (
                    <li key={structure.name} className="text-green-700">
                      {structure.name} (Gefunden über: {structure.keys.filter(key => 
                        jsonData[key] || 
                        (key.includes('.') && key.split('.').reduce((obj, k) => obj && obj[k], jsonData))
                      ).join(', ')})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-yellow-700 ml-2">Kein bekanntes Format erkannt!</p>
              )}
            </div>

            <div className="mt-3">
              <p className="font-medium mb-1">Berufsdaten:</p>
              {professionAnalysis.title ? (
                <div className="text-sm ml-2">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-700">Berufstitel gefunden: "{professionAnalysis.title}"</span>
                  </div>
                  {professionAnalysis.code && (
                    <div className="flex items-center mt-1">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-700">Berufscode gefunden: "{professionAnalysis.code}"</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center text-sm ml-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-yellow-700">Kein Berufstitel gefunden!</span>
                </div>
              )}
            </div>
            
            <div className="mt-3">
              <p className="font-medium mb-1">Lernfelder:</p>
              {learningFieldsAnalysis ? (
                <div className="text-sm ml-2">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-700">
                      {learningFieldsAnalysis.fields.length} Lernfelder gefunden unter "{learningFieldsAnalysis.location}"
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center text-sm ml-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-700">Keine Lernfelder gefunden!</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Structure Section */}
      <div className="mb-4">
        <div 
          className="flex items-center justify-between bg-gray-100 p-2 rounded cursor-pointer hover:bg-gray-200"
          onClick={() => toggleSection('structure')}
        >
          <div className="flex items-center">
            <FileText className="w-4 h-4 mr-2 text-blue-600" />
            <h3 className="font-medium">Dokumentstruktur</h3>
          </div>
          <span>{expandedSections['structure'] ? '▼' : '►'}</span>
        </div>
        
        {expandedSections['structure'] && (
          <div className="mt-2 p-3 bg-white rounded border border-gray-200">
            <p className="font-medium mb-2">Top-Level Eigenschaften:</p>
            <div className="bg-gray-50 p-2 rounded overflow-auto max-h-24">
              <code className="text-xs font-mono">
                {structureAnalysis.topLevelKeys.join(', ')}
              </code>
            </div>
            
            <p className="font-medium mt-3 mb-2">JSON-Größe:</p>
            <div className="text-sm ml-2">
              {JSON.stringify(jsonData).length.toLocaleString()} Zeichen
            </div>
            
            <p className="font-medium mt-3 mb-2">Struktur-Map:</p>
            <div className="bg-gray-50 p-2 rounded overflow-auto text-xs font-mono">
              <pre>
                {JSON.stringify(mapObjectStructure(jsonData), null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
      
      {/* Learning Fields Section */}
      {learningFieldsAnalysis && (
        <div className="mb-4">
          <div 
            className="flex items-center justify-between bg-gray-100 p-2 rounded cursor-pointer hover:bg-gray-200"
            onClick={() => toggleSection('learning-fields')}
          >
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2 text-green-600" />
              <h3 className="font-medium">Lernfelder</h3>
            </div>
            <span>{expandedSections['learning-fields'] ? '▼' : '►'}</span>
          </div>
          
          {expandedSections['learning-fields'] && (
            <div className="mt-2 p-3 bg-white rounded border border-gray-200">
              <p className="font-medium mb-2">Gefunden {learningFieldsAnalysis.fields.length} Lernfelder:</p>
              
              <div className="grid grid-cols-1 gap-2 mt-3">
                {learningFieldsAnalysis.fields.slice(0, 5).map((field, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                    <div className="font-medium">
                      {field.code || field.nummer || field._key || `Lernfeld ${index + 1}`}: 
                      {field.title || field.titel || field.name || field.bezeichnung || 'Ohne Titel'}
                    </div>
                    <div className="text-gray-600 text-xs mt-1">
                      Eigenschaften: {Object.keys(field).filter(k => !k.startsWith('_')).join(', ')}
                    </div>
                    
                    {/* Competency Check */}
                    <div className="mt-1 text-xs">
                      {field.competencies || field.kompetenzen ? (
                        <div className="flex items-center">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                          <span className="text-green-700">
                            {(field.competencies?.length || field.kompetenzen?.length || 0)} Kompetenzen gefunden
                          </span>
                        </div>
                      ) : field.skills ? (
                        <div className="flex items-center">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                          <span className="text-green-700">{field.skills.length} Skills gefunden</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <AlertCircle className="w-3 h-3 text-yellow-500 mr-1" />
                          <span className="text-yellow-700">Keine Kompetenzen gefunden</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {learningFieldsAnalysis.fields.length > 5 && (
                  <div className="text-center text-sm text-gray-500">
                    + {learningFieldsAnalysis.fields.length - 5} weitere Lernfelder
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Actions Section */}
      <div className="flex justify-end mt-4">
        <button 
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded text-sm transition-colors"
          onClick={() => console.log('Full JSON structure:', jsonData)}
        >
          Log Structure
        </button>
      </div>
    </div>
  );
}

// Create a structure map of an object (for debugging)
function mapObjectStructure(obj: any, maxDepth = 2, currentDepth = 0): any {
  if (currentDepth >= maxDepth) {
    if (Array.isArray(obj)) {
      return `Array(${obj.length})`;
    }
    if (typeof obj === 'object' && obj !== null) {
      return `Object{${Object.keys(obj).join(', ')}}`;
    }
    return typeof obj;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    return [mapObjectStructure(obj[0], maxDepth, currentDepth + 1), `... (${obj.length} items)`];
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, any> = {};
    Object.keys(obj).slice(0, 10).forEach(key => {
      result[key] = mapObjectStructure(obj[key], maxDepth, currentDepth + 1);
    });
    
    const remainingKeys = Object.keys(obj).length - 10;
    if (remainingKeys > 0) {
      result[`... (${remainingKeys} more)`] = "...";
    }
    
    return result;
  }
  
  return typeof obj;
}