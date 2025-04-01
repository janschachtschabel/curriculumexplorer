import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Users } from 'lucide-react';
import { CurriculumData, LearningField, Competency } from '../lib/curriculumTypes';

interface CurriculumTreeProps {
  curriculum: CurriculumData;
  selectedCompetency: Competency | null;
  onSelectCompetency: (competency: Competency) => void;
  onSelectProfession?: () => void;
}

export function CurriculumTree({ 
  curriculum, 
  selectedCompetency, 
  onSelectCompetency,
  onSelectProfession
}: CurriculumTreeProps) {
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});

  // Auto-expand the first learning field when the curriculum is loaded
  useEffect(() => {
    if (curriculum && curriculum.learningFields.length > 0) {
      const firstField = curriculum.learningFields[0];
      setExpandedFields(prev => ({
        ...prev,
        [firstField.id]: true
      }));
    }
  }, [curriculum]);

  const toggleField = (fieldId: string) => {
    setExpandedFields(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

  return (
    <div className="curriculum-tree">
      <div 
        className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
        onClick={onSelectProfession}
      >
        <div className="flex items-center">
          <Users className="w-5 h-5 text-green-700 mr-2" />
          <h3 className="text-lg font-semibold text-green-800">{curriculum.profession.title}</h3>
        </div>
        
        {curriculum.profession.code && (
          <div className="text-sm text-green-700 mb-1">
            <span className="font-medium">Kennziffer:</span> {curriculum.profession.code}
          </div>
        )}
        {curriculum.profession.duration && (
          <div className="text-sm text-green-700 mb-1">
            <span className="font-medium">Ausbildungsdauer:</span> {curriculum.profession.duration}
          </div>
        )}
        {curriculum.profession.description && (
          <div className="text-sm text-green-700 mb-1 line-clamp-2">
            <span className="font-medium">Beschreibung:</span> {curriculum.profession.description}
          </div>
        )}
        {curriculum.profession.field && (
          <div className="text-sm text-green-700 mb-1">
            <span className="font-medium">Berufsfeld:</span> {curriculum.profession.field}
          </div>
        )}
        {curriculum.issueDate && (
          <div className="text-sm text-green-700">
            <span className="font-medium">Ausgabedatum:</span> {curriculum.issueDate}
          </div>
        )}
        {curriculum.publisher && (
          <div className="text-sm text-green-700">
            <span className="font-medium">Herausgeber:</span> {curriculum.publisher}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {curriculum.learningFields.length > 0 ? (
          curriculum.learningFields.map((field) => (
            <div key={field.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="flex items-center bg-green-100 p-3 cursor-pointer hover:bg-green-200 transition-colors"
                onClick={() => toggleField(field.id)}
              >
                {expandedFields[field.id] ? (
                  <ChevronDown className="w-5 h-5 text-green-700 mr-2 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-green-700 mr-2 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{field.code && `${field.code}: `}{field.title}</div>
                  <div className="text-sm text-green-800 flex flex-wrap gap-x-3">
                    {field.hours > 0 && (
                      <span>{field.hours} Stunden</span>
                    )}
                    {field.zeitraum && (
                      <span>Zeitraum: {field.zeitraum}</span>
                    )}
                    {field.schwerpunkt && (
                      <span>Schwerpunkt: {field.schwerpunkt}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {expandedFields[field.id] && (
                <div className="p-3 bg-white border-t border-gray-200">
                  {field.description && (
                    <div className="mb-3 p-2 bg-gray-50 text-sm rounded">
                      {field.description}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {field.competencies.length > 0 ? (
                      field.competencies.map((competency) => (
                        <div 
                          key={competency.id}
                          className={`p-2 rounded-md cursor-pointer transition-colors ${
                            selectedCompetency?.id === competency.id
                              ? 'bg-blue-100 border-l-4 border-blue-500'
                              : 'hover:bg-green-50 border-l-4 border-transparent'
                          }`}
                          onClick={() => onSelectCompetency(competency)}
                        >
                          <div className="font-medium mb-1">{competency.title}</div>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {competency.competencyType && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                {competency.competencyType}
                              </span>
                            )}
                            {competency.competencyAnalysis?.lernzielbereich && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                {competency.competencyAnalysis.lernzielbereich}
                              </span>
                            )}
                            {competency.competencyAnalysis?.bloomLevel && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                {competency.competencyAnalysis.bloomLevel}
                              </span>
                            )}
                            {competency.escoMappings && competency.escoMappings.length > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {competency.escoMappings.length} ESCO
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500 italic">
                        Keine Kompetenzen definiert
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-lg">
            Keine Lernfelder gefunden
          </div>
        )}
      </div>
    </div>
  );
}