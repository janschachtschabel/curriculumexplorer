import React from 'react';
import { ExternalLink, Info, Search } from 'lucide-react';
import { Competency, ESCOMapping } from '../lib/curriculumTypes';

interface MappingPanelProps {
  competency: Competency | null;
  onSearchESCOSkill?: (skillName: string) => void;
}

export function MappingPanel({ competency, onSearchESCOSkill }: MappingPanelProps) {
  if (!competency) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-gray-500">
        <Info className="w-12 h-12 mb-2 text-gray-400" />
        <p>Keine Kompetenz ausgewählt</p>
        <p className="text-sm">Wähle eine Kompetenz aus dem Lehrplan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {competency.competencyAnalysis && (
        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
          <h3 className="font-medium text-green-800 mb-3">Kompetenzanalyse</h3>
          
          <div className="space-y-2">
            {competency.competencyAnalysis.skillType && (
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Kompetenzdimension:</span>
                <span className="text-sm font-medium">{competency.competencyAnalysis.skillType}</span>
              </div>
            )}
            
            {competency.competencyAnalysis.lernzielbereich && (
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Lernzielbereich:</span>
                <span className="text-sm font-medium">{competency.competencyAnalysis.lernzielbereich}</span>
              </div>
            )}
            
            {competency.competencyAnalysis.bloomLevel && (
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Taxonomiestufe:</span>
                <span className="text-sm font-medium">{competency.competencyAnalysis.bloomLevel}</span>
              </div>
            )}
            
            {typeof competency.competencyAnalysis.difficulty === 'number' && competency.competencyAnalysis.difficulty > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Schwierigkeit:</span>
                <span className="text-sm font-medium">Stufe {competency.competencyAnalysis.difficulty}</span>
              </div>
            )}
            
            {typeof competency.competencyAnalysis.relevance === 'number' && competency.competencyAnalysis.relevance > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Relevanz:</span>
                <div className="flex items-center">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-600 rounded-full"
                      style={{ width: `${competency.competencyAnalysis.relevance * 10}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-xs">{competency.competencyAnalysis.relevance}</span>
                </div>
              </div>
            )}
            
            {typeof competency.competencyAnalysis.digitalLevel === 'number' && competency.competencyAnalysis.digitalLevel > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Digitalisierungsgrad:</span>
                <div className="flex items-center">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: `${competency.competencyAnalysis.digitalLevel * 20}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-xs">{competency.competencyAnalysis.digitalLevel}/5</span>
                </div>
              </div>
            )}
            
            {competency.competencyAnalysis.keywords && competency.competencyAnalysis.keywords.length > 0 && (
              <div className="mt-3">
                <span className="text-sm text-green-700 block mb-1">Schlagwörter:</span>
                <div className="flex flex-wrap gap-1">
                  {competency.competencyAnalysis.keywords.map((keyword, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {competency.escoMappings && competency.escoMappings.length > 0 ? (
        <div className="space-y-4">
          {competency.escoMappings.map((mapping) => (
            <div key={mapping.id} className="border border-blue-200 rounded-lg p-3 bg-blue-50">
              <div 
                className={`font-medium text-blue-800 mb-1 ${onSearchESCOSkill ? 'cursor-pointer hover:text-blue-600 flex items-center' : ''}`}
                onClick={() => onSearchESCOSkill && onSearchESCOSkill(mapping.preferredLabel)}
              >
                {mapping.preferredLabel}
                {onSearchESCOSkill && (
                  <Search className="w-4 h-4 ml-1 text-blue-600" />
                )}
              </div>
              
              {mapping.description && (
                <div className="text-sm text-gray-700 mb-2">
                  {mapping.description}
                </div>
              )}
              
              {mapping.altLabels && mapping.altLabels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {mapping.altLabels.map((label, index) => (
                    <span 
                      key={index}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 ${onSearchESCOSkill ? 'cursor-pointer hover:bg-blue-200' : ''}`}
                      onClick={() => onSearchESCOSkill && onSearchESCOSkill(label)}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between items-center text-sm">
                {mapping.confidence && (
                  <span className="text-blue-700">
                    Relevanz: {(mapping.confidence * 100).toFixed(0)}%
                  </span>
                )}
                
                {mapping.uri && (
                  <a 
                    href={mapping.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:underline"
                  >
                    ESCO
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 border border-gray-200 rounded-lg">
          <Info className="w-12 h-12 mb-2 text-gray-400" />
          <p>Keine ESCO Mappings vorhanden</p>
          <p className="text-sm">Für diese Kompetenz gibt es keine ESCO-Zuordnungen</p>
        </div>
      )}
    </div>
  );
}