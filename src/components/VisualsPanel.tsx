import React, { useState, useRef } from 'react';
import { List, GitPullRequest, BookOpen, Info, Users, HelpCircle, Zap, Briefcase, Book, Code, ExternalLink, Target } from 'lucide-react';
import { CurriculumData, Competency, LearningField, ESCOMapping } from '../lib/curriculumTypes';

// Helper function to generate a unique ID for SVG elements
const uniqueId = (): string => `id-${Math.random().toString(36).substr(2, 9)}`;

// Component to show competency type icons
interface CompetencyTypeIconProps {
  type?: string;
  size?: number;
  className?: string;
}

const CompetencyTypeIcon: React.FC<CompetencyTypeIconProps> = ({ type, size = 20, className = "" }) => {
  if (!type) return <HelpCircle size={size} className={`text-gray-400 ${className}`} />;
  
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('fach')) {
    return <Book size={size} className={`text-blue-500 ${className}`} />;
  } else if (lowerType.includes('methoden')) {
    return <Code size={size} className={`text-green-500 ${className}`} />;
  } else if (lowerType.includes('sozial')) {
    return <Users size={size} className={`text-orange-500 ${className}`} />;
  } else if (lowerType.includes('personal')) {
    return <Briefcase size={size} className={`text-purple-500 ${className}`} />;
  } else if (lowerType.includes('fertig')) {
    return <Zap size={size} className={`text-amber-500 ${className}`} />;
  } else {
    return <Target size={size} className={`text-gray-500 ${className}`} />;
  }
};

// Classic hierarchical tree view component
const ClassicTreeView: React.FC<{
  curriculum: CurriculumData;
  onSelectCompetency: (comp: Competency) => void;
  onSelectLearningField?: (field: LearningField) => void;
  selectedCompetencyId?: string;
}> = ({ curriculum, onSelectCompetency, onSelectLearningField, selectedCompetencyId }) => {
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});
  
  // Initially expand the first learning field
  React.useEffect(() => {
    if (curriculum && curriculum.learningFields.length > 0) {
      setExpandedFields(prev => ({
        ...prev,
        [curriculum.learningFields[0].id]: true
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
    <div className="classic-tree overflow-auto" style={{ maxHeight: "500px" }}>
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
        <div className="flex items-center">
          <Briefcase className="text-blue-600 mr-2 flex-shrink-0" size={20} />
          <h3 className="font-medium text-blue-800 text-lg">{curriculum.profession.title}</h3>
        </div>
        <p className="text-sm text-blue-700 mt-1">{curriculum.profession.code}</p>
      </div>
      
      <div className="space-y-2">
        {curriculum.learningFields.map(field => (
          <div key={field.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div 
              className="flex items-center bg-green-50 p-3 cursor-pointer hover:bg-green-100 transition-colors"
              onClick={() => {
                toggleField(field.id);
                if (onSelectLearningField) onSelectLearningField(field);
              }}
            >
              <div className="p-1.5 bg-green-100 rounded-lg mr-2">
                <Book size={18} className="text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{field.code}: {field.title}</div>
                <div className="text-sm text-green-800 mt-0.5">
                  {field.hours > 0 && (
                    <span className="inline-flex items-center mr-3">
                      <BookOpen size={14} className="mr-1" /> {field.hours} Std.
                    </span>
                  )}
                  {field.year && (
                    <span className="inline-flex items-center">
                      <BookOpen size={14} className="mr-1" /> Jahr {field.year}
                    </span>
                  )}
                </div>
              </div>
              {expandedFields[field.id] ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              )}
            </div>
            
            {expandedFields[field.id] && (
              <div className="p-2 border-t border-gray-200 bg-white">
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
                          selectedCompetencyId === competency.id
                            ? 'bg-blue-100 border-l-4 border-blue-500'
                            : 'hover:bg-green-50 border-l-4 border-transparent'
                        }`}
                        onClick={() => onSelectCompetency(competency)}
                      >
                        <CompetencyTypeIcon 
                          type={competency.competencyType} 
                          size={16} 
                          className="mt-0.5 mr-2 float-left" 
                        />
                        <div className="ml-6">
                          <div className="font-medium mb-1">{competency.title}</div>
                          
                          <div className="flex flex-wrap gap-1 mb-1">
                            {competency.competencyType && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                {competency.competencyType}
                              </span>
                            )}
                            {competency.competencyAnalysis?.bloomLevel && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                {competency.competencyAnalysis.bloomLevel}
                              </span>
                            )}
                            {competency.escoMappings && competency.escoMappings.length > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                {competency.escoMappings.length} ESCO
                              </span>
                            )}
                          </div>
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
        ))}
      </div>
    </div>
  );
};

// Mapping view with side-by-side layout and connecting lines
const MappingView: React.FC<{
  curriculum: CurriculumData;
  onSelectCompetency: (comp: Competency) => void;
  onSelectESCO?: (escoMapping: ESCOMapping) => void;
  selectedCompetencyId?: string;
}> = ({ curriculum, onSelectCompetency, onSelectESCO, selectedCompetencyId }) => {
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});
  const [matchedEscoMappings, setMatchedEscoMappings] = useState<ESCOMapping[]>([]);
  const [connections, setConnections] = useState<{startId: string, endId: string, startY: number, endY: number}[]>([]);
  const [selectedCompetency, setSelectedCompetency] = useState<Competency | null>(null);
  
  const competencyRefs = useRef<Record<string, HTMLElement | null>>({});
  const escoRefs = useRef<Record<string, HTMLElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Set up refs for all competencies and ESCO mappings for line drawing
  const registerRef = (id: string, element: HTMLElement | null, isEsco = false) => {
    if (isEsco) {
      escoRefs.current[id] = element;
    } else {
      competencyRefs.current[id] = element;
    }
  };
  
  // Initialize with first field expanded
  React.useEffect(() => {
    if (curriculum && curriculum.learningFields.length > 0) {
      setExpandedFields(prev => ({
        ...prev,
        [curriculum.learningFields[0].id]: true
      }));
    }
  }, [curriculum]);
  
  const toggleField = (fieldId: string) => {
    setExpandedFields(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };
  
  // Handle competency selection and update ESCO mappings
  const handleCompetencySelect = (comp: Competency) => {
    setSelectedCompetency(comp);
    
    // Collect all ESCO mappings for this competency
    if (comp.escoMappings && comp.escoMappings.length > 0) {
      setMatchedEscoMappings(comp.escoMappings);
    } else {
      setMatchedEscoMappings([]);
    }
    
    onSelectCompetency(comp);
  };
  
  // Calculate connection lines after render and when selections change
  React.useEffect(() => {
    if (!selectedCompetency || !selectedCompetency.escoMappings || selectedCompetency.escoMappings.length === 0) {
      setConnections([]);
      return;
    }
    
    // Delay to ensure DOM is updated
    const timer = setTimeout(() => {
      const newConnections: {startId: string, endId: string, startY: number, endY: number}[] = [];
      
      if (selectedCompetency.escoMappings) {
        selectedCompetency.escoMappings.forEach(mapping => {
          const compElement = competencyRefs.current[selectedCompetency.id];
          const escoElement = escoRefs.current[mapping.id];
          
          if (compElement && escoElement && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const compRect = compElement.getBoundingClientRect();
            const escoRect = escoElement.getBoundingClientRect();
            
            // Calculate relative positions
            const startY = compRect.top + compRect.height/2 - containerRect.top;
            const endY = escoRect.top + escoRect.height/2 - containerRect.top;
            
            newConnections.push({
              startId: selectedCompetency.id,
              endId: mapping.id,
              startY,
              endY
            });
          }
        });
      }
      
      setConnections(newConnections);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [selectedCompetency, expandedFields, matchedEscoMappings]);
  
  // Get all ESCO mappings from the curriculum
  const allEscoMappings = React.useMemo(() => {
    const mappings: ESCOMapping[] = [];
    const seen = new Set<string>();
    
    curriculum.competencies?.forEach(comp => {
      if (comp.escoMappings) {
        comp.escoMappings.forEach(mapping => {
          if (!seen.has(mapping.id)) {
            mappings.push(mapping);
            seen.add(mapping.id);
          }
        });
      }
    });
    
    return mappings;
  }, [curriculum]);
  
  // Determine which competencies are displayed
  const visibleCompetencies = React.useMemo(() => {
    const competencies: Competency[] = [];
    
    curriculum.learningFields.forEach(field => {
      if (expandedFields[field.id]) {
        competencies.push(...field.competencies);
      }
    });
    
    return competencies;
  }, [curriculum, expandedFields]);
  
  // SVG ID for the gradient
  const gradientId = useRef(uniqueId()).current;
  
  return (
    <div ref={containerRef} className="mapping-view relative overflow-hidden" style={{ height: '500px' }}>
      {/* SVG layer for connection lines */}
      <svg 
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#9333EA" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        
        {connections.map((conn, i) => (
          <path
            key={`conn-${i}`}
            d={`M 250 ${conn.startY} C 350 ${conn.startY}, 400 ${conn.endY}, 500 ${conn.endY}`}
            stroke={`url(#${gradientId})`}
            strokeWidth="2"
            fill="none"
            strokeDasharray="5,2"
          />
        ))}
      </svg>
      
      <div className="grid grid-cols-2 gap-0 h-full">
        {/* Left side: Competencies */}
        <div className="overflow-auto h-full border-r border-gray-300 pr-2">
          <div className="mb-3 bg-blue-50 rounded-lg p-2 sticky top-0 z-20 border border-blue-200">
            <h3 className="font-medium text-blue-800 flex items-center">
              <BookOpen className="mr-2" size={18} />
              Lernfelder & Kompetenzen
            </h3>
            <p className="text-xs text-blue-700 mt-1">
              Klicken Sie auf eine Kompetenz, um ESCO-Zuordnungen zu sehen
            </p>
          </div>
          
          {curriculum.learningFields.map(field => (
            <div key={field.id} className="mb-3 bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div 
                className="p-2 flex items-center bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
                onClick={() => toggleField(field.id)}
              >
                {expandedFields[field.id] ? (
                  <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                )}
                <div>
                  <div className="font-medium text-sm">{field.code}: {field.title}</div>
                  <div className="text-xs text-green-800">{field.competencies.length} Kompetenzen</div>
                </div>
              </div>
              
              {expandedFields[field.id] && (
                <div className="p-2 border-t border-gray-200">
                  {field.competencies.map(comp => (
                    <div
                      key={comp.id}
                      ref={(el) => registerRef(comp.id, el)}
                      className={`p-2 rounded-md mb-1 cursor-pointer transition-colors flex items-start ${
                        selectedCompetencyId === comp.id
                          ? 'bg-blue-100 border-l-2 border-blue-500'
                          : 'hover:bg-gray-50 border-l-2 border-transparent'
                      }`}
                      onClick={() => handleCompetencySelect(comp)}
                    >
                      <CompetencyTypeIcon 
                        type={comp.competencyType} 
                        size={16} 
                        className="mt-0.5 mr-2 flex-shrink-0" 
                      />
                      <div>
                        <div className="text-sm font-medium">{comp.title}</div>
                        {comp.escoMappings && comp.escoMappings.length > 0 && (
                          <div className="text-xs text-purple-600 flex items-center mt-1">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            {comp.escoMappings.length} ESCO-Fertigkeiten
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Right side: ESCO mappings */}
        <div className="overflow-auto h-full pl-2">
          <div className="mb-3 bg-purple-50 rounded-lg p-2 sticky top-0 z-20 border border-purple-200">
            <h3 className="font-medium text-purple-800 flex items-center">
              <svg className="w-4.5 h-4.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
              ESCO-Fertigkeiten
            </h3>
            {selectedCompetency ? (
              <p className="text-xs text-purple-700 mt-1">
                {matchedEscoMappings.length} Zuordnungen für '{selectedCompetency.title}'
              </p>
            ) : (
              <p className="text-xs text-purple-700 mt-1">
                Wählen Sie eine Kompetenz, um zugeordnete ESCO-Fertigkeiten zu sehen
              </p>
            )}
          </div>
          
          {matchedEscoMappings.length > 0 ? (
            <div className="space-y-2">
              {matchedEscoMappings.map((mapping) => (
                <div
                  key={mapping.id}
                  ref={(el) => registerRef(mapping.id, el, true)}
                  className="bg-white p-3 rounded-lg border border-purple-200 hover:border-purple-300 transition-colors"
                  onClick={() => onSelectESCO && onSelectESCO(mapping)}
                >
                  <div className="flex items-start">
                    <div className="p-1 bg-purple-100 rounded-lg mr-2 flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{mapping.preferredLabel}</h4>
                      {mapping.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{mapping.description}</p>
                      )}
                      {mapping.uri && (
                        <a 
                          href={mapping.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-600 mt-1 flex items-center hover:underline"
                        >
                          ESCO Link <ExternalLink size={10} className="ml-1" />
                        </a>
                      )}
                      {mapping.confidence !== undefined && (
                        <div className="mt-1.5 flex items-center">
                          <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${mapping.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-xs text-gray-600">
                            {Math.round(mapping.confidence * 100)}% Relevanz
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : selectedCompetency ? (
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <svg className="w-6 h-6 text-yellow-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <p className="text-gray-600">Keine ESCO-Zuordnungen für diese Kompetenz</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {allEscoMappings.slice(0, 8).map((mapping) => (
                <div
                  key={mapping.id}
                  ref={(el) => registerRef(mapping.id, el, true)}
                  className="bg-white p-3 rounded-lg border border-gray-200"
                >
                  <h4 className="font-medium text-sm text-gray-500">{mapping.preferredLabel}</h4>
                  {mapping.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{mapping.description}</p>
                  )}
                </div>
              ))}
              {allEscoMappings.length > 8 && (
                <div className="text-center text-sm text-gray-500 mt-2">
                  + {allEscoMappings.length - 8} weitere
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Detail Display Component
interface DetailPanelProps {
  curriculum: CurriculumData;
  selectedNode: any;
  selectedCompetency: Competency | null;
  selectedESCO: ESCOMapping | null;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ 
  curriculum, 
  selectedNode, 
  selectedCompetency,
  selectedESCO 
}) => {
  // Prioritize specifically selected competency/ESCO over node selection
  const displayContent = selectedESCO ? { type: 'esco', data: selectedESCO } : 
                         selectedCompetency ? { type: 'competency', data: selectedCompetency } :
                         selectedNode ? { type: selectedNode.type, data: selectedNode } :
                         null;
  
  if (!displayContent) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <Info className="w-12 h-12 mb-3 text-gray-300" />
        <p>Wählen Sie ein Element im Lehrplan</p>
        <p className="text-sm">für detaillierte Informationen.</p>
      </div>
    );
  }

  // Find related data
  let relatedLearningField: LearningField | null = null;
  
  if (displayContent.type === 'competency') {
    const comp = displayContent.data as Competency;
    // Find the learning field this competency belongs to
    relatedLearningField = curriculum.learningFields.find(
      field => field.competencies.some(c => c.id === comp.id)
    ) || null;
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 bg-gray-50 rounded-lg mb-4">
        <div className="flex items-center mb-2">
          {displayContent.type === 'curriculum' && <Briefcase className="w-5 h-5 mr-2 text-blue-600" />}
          {displayContent.type === 'learningField' && <Book className="w-5 h-5 mr-2 text-green-600" />}
          {displayContent.type === 'competency' && (
            <CompetencyTypeIcon 
              type={(displayContent.data as Competency).competencyType} 
              size={20} 
              className="mr-2" 
            />
          )}
          {displayContent.type === 'esco' && (
            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          )}
          <h3 className="font-semibold text-lg">
            {displayContent.type === 'competency' ? (displayContent.data as Competency).title :
             displayContent.type === 'esco' ? (displayContent.data as ESCOMapping).preferredLabel :
             displayContent.type === 'learningField' ? `${(displayContent.data as any).code}: ${(displayContent.data as any).title}` :
             displayContent.type === 'curriculum' ? curriculum.profession.title :
             'Details'}
          </h3>
        </div>
        
        {displayContent.type === 'curriculum' && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-blue-50 p-2 rounded">
              <span className="text-sm font-medium text-blue-800">Beruf:</span>
              <p className="text-sm">{curriculum.profession.title}</p>
            </div>
            <div className="bg-blue-50 p-2 rounded">
              <span className="text-sm font-medium text-blue-800">Kennziffer:</span>
              <p className="text-sm">{curriculum.profession.code || 'N/A'}</p>
            </div>
            <div className="bg-blue-50 p-2 rounded">
              <span className="text-sm font-medium text-blue-800">Lernfelder:</span>
              <p className="text-sm">{curriculum.learningFields.length}</p>
            </div>
            <div className="bg-blue-50 p-2 rounded">
              <span className="text-sm font-medium text-blue-800">Kompetenzen:</span>
              <p className="text-sm">{curriculum.competencies?.length || 0}</p>
            </div>
          </div>
        )}
        
        {displayContent.type === 'learningField' && (
          <div>
            <div className="flex justify-between text-sm text-gray-700 mb-1">
              <span className="font-medium">Kodierung:</span>
              <span>{(displayContent.data as any).code}</span>
            </div>
            {(displayContent.data as any).hours && (
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span className="font-medium">Stunden:</span>
                <span>{(displayContent.data as any).hours}</span>
              </div>
            )}
            {(displayContent.data as any).year && (
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span className="font-medium">Jahr:</span>
                <span>{(displayContent.data as any).year}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-700 mb-1">
              <span className="font-medium">Kompetenzen:</span>
              <span>{(displayContent.data as any).competencies?.length || 0}</span>
            </div>
          </div>
        )}
        
        {displayContent.type === 'competency' && (
          <div>
            {(displayContent.data as Competency).competencyType && (
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span className="font-medium">Kompetenztyp:</span>
                <span>{(displayContent.data as Competency).competencyType}</span>
              </div>
            )}
            {(displayContent.data as Competency).competencyAnalysis?.skillType && (
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span className="font-medium">Skill-Typ:</span>
                <span>{(displayContent.data as Competency).competencyAnalysis?.skillType}</span>
              </div>
            )}
            {(displayContent.data as Competency).competencyAnalysis?.bloomLevel && (
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span className="font-medium">Bloom-Level:</span>
                <span>{(displayContent.data as Competency).competencyAnalysis?.bloomLevel}</span>
              </div>
            )}
            {relatedLearningField && (
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span className="font-medium">Lernfeld:</span>
                <span>{relatedLearningField.code}: {relatedLearningField.title}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-700 mb-1">
              <span className="font-medium">ESCO Mappings:</span>
              <span>{(displayContent.data as Competency).escoMappings?.length || 0}</span>
            </div>
          </div>
        )}
        
        {displayContent.type === 'esco' && (
          <div className="text-sm text-gray-700 mb-1">
            {(displayContent.data as ESCOMapping).confidence !== undefined && (
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Relevanz:</span>
                  <span>{Math.round(((displayContent.data as ESCOMapping).confidence || 0) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${((displayContent.data as ESCOMapping).confidence || 0) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {(displayContent.data as ESCOMapping).uri && (
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span className="font-medium">ESCO Link:</span>
                <a 
                  href={(displayContent.data as ESCOMapping).uri} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline flex items-center"
                >
                  Öffnen <ExternalLink size={12} className="ml-1" />
                </a>
              </div>
            )}
            
            {(displayContent.data as ESCOMapping).altLabels && (displayContent.data as ESCOMapping).altLabels.length > 0 && (
              <div className="mt-2">
                <span className="font-medium">Alternative Bezeichnungen:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(displayContent.data as ESCOMapping).altLabels.map((label, idx) => (
                    <span key={idx} className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Description Section */}
      {(displayContent.type === 'competency' || displayContent.type === 'learningField' || displayContent.type === 'esco') && (
        <div className="p-4 bg-white rounded-lg border border-gray-200 mb-4">
          <h4 className="font-medium text-gray-700 mb-2">Beschreibung</h4>
          <p className="text-sm text-gray-600">
            {displayContent.type === 'competency' ? (displayContent.data as Competency).description :
             displayContent.type === 'esco' ? (displayContent.data as ESCOMapping).description :
             displayContent.type === 'learningField' ? (displayContent.data as any).description :
             'Keine Beschreibung verfügbar.'}
          </p>
        </div>
      )}

      {/* ESCO Mappings for Competency */}
      {displayContent.type === 'competency' && (displayContent.data as Competency).escoMappings && (displayContent.data as Competency).escoMappings.length > 0 && (
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-700 mb-2">ESCO Mappings</h4>
          <div className="space-y-2 max-h-60 overflow-auto">
            {(displayContent.data as Competency).escoMappings.map((esco, idx) => (
              <div key={idx} className="text-sm p-2 bg-purple-50 rounded">
                <p className="font-medium text-purple-800">{esco.preferredLabel}</p>
                {esco.description && (
                  <p className="text-xs text-purple-700 mt-1">{esco.description}</p>
                )}
                {esco.confidence !== undefined && (
                  <div className="mt-1.5 flex items-center">
                    <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${esco.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-xs text-gray-600">
                      {Math.round(esco.confidence * 100)}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// VisualsPanel - Main component
export function VisualsPanel({ curriculum }: { curriculum: CurriculumData }) {
  const [activeVisual, setActiveVisual] = useState<'classic' | 'mapping'>('classic');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedCompetency, setSelectedCompetency] = useState<Competency | null>(null);
  const [selectedESCO, setSelectedESCO] = useState<ESCOMapping | null>(null);

  // Handlers for selection
  const handleCompetencySelect = (competency: Competency) => {
    setSelectedCompetency(competency);
    setSelectedESCO(null);
  };

  const handleESCOSelect = (esco: ESCOMapping) => {
    setSelectedESCO(esco);
  };

  const handleNodeSelect = (node: any) => {
    setSelectedNode(node);
    
    // Clear specific selections
    setSelectedCompetency(null);
    setSelectedESCO(null);
  };

  if (!curriculum) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md p-6">
        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <p className="text-lg text-gray-600">Kein Lehrplan geladen</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Lehrplan Visualisierungen</h2>
          <p className="text-gray-600 mb-4">
            Verschiedene Darstellungen des Lehrplans für {curriculum.profession.title} mit {curriculum.learningFields.length} Lernfeldern und {curriculum.competencies?.length || 0} Kompetenzen.
          </p>
          
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={() => setActiveVisual('classic')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeVisual === 'classic' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <List className="w-5 h-5" />
              Klassische Baumansicht
            </button>
            <button
              onClick={() => setActiveVisual('mapping')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeVisual === 'mapping' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <GitPullRequest className="w-5 h-5" />
              Kompetenz-ESCO Mapping
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full mr-3">
                {activeVisual === 'classic' && <List className="w-6 h-6 text-blue-600" />}
                {activeVisual === 'mapping' && <GitPullRequest className="w-6 h-6 text-blue-600" />}
              </div>
              <h3 className="text-lg font-medium">
                {activeVisual === 'classic' && 'Klassische Baumansicht'}
                {activeVisual === 'mapping' && 'Kompetenz-ESCO Zuordnungen'}
              </h3>
            </div>
            
            <div className="visualization-container border border-gray-200 rounded-lg bg-gray-50">
              {activeVisual === 'classic' && (
                <ClassicTreeView 
                  curriculum={curriculum}
                  onSelectCompetency={handleCompetencySelect}
                  selectedCompetencyId={selectedCompetency?.id}
                />
              )}
              {activeVisual === 'mapping' && (
                <MappingView 
                  curriculum={curriculum}
                  onSelectCompetency={handleCompetencySelect}
                  onSelectESCO={handleESCOSelect}
                  selectedCompetencyId={selectedCompetency?.id}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between mt-4 bg-gray-50 rounded-lg p-3">
              <div className="flex flex-wrap items-center">
                <div className="flex items-center mr-4">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                  <span className="text-xs text-gray-600">Lehrplan</span>
                </div>
                
                <div className="flex items-center mr-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                  <span className="text-xs text-gray-600">Lernfelder</span>
                </div>
                
                <div className="flex items-center mr-4">
                  <div className="w-3 h-3 rounded-full bg-orange-400 mr-1"></div>
                  <span className="text-xs text-gray-600">Kompetenzen</span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-400 mr-1"></div>
                  <span className="text-xs text-gray-600">ESCO</span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 flex items-center mt-2 md:mt-0">
                <BookOpen className="w-3.5 h-3.5 mr-1" />
                <span>Klicken Sie auf Elemente für Details</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-600" />
              Detail-Informationen
            </h3>
            <div className="h-[468px]">
              <DetailPanel 
                curriculum={curriculum}
                selectedNode={selectedNode}
                selectedCompetency={selectedCompetency}
                selectedESCO={selectedESCO}
              />
            </div>
          </div>
        </div>
        
        {/* Legend for the different icon types used in visualizations */}
        <div className="bg-white rounded-lg shadow-md p-4 mt-6">
          <h3 className="font-medium flex items-center text-gray-700 mb-3">
            <svg className="w-4 h-4 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            Legende zu Kompetenzbereichen
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-gray-50 p-2 rounded-lg flex items-center">
              <Book size={16} className="text-blue-500 mr-2" />
              <span className="text-sm">Fachkompetenz</span>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg flex items-center">
              <Code size={16} className="text-green-500 mr-2" />
              <span className="text-sm">Methodenkompetenz</span>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg flex items-center">
              <Users size={16} className="text-orange-500 mr-2" />
              <span className="text-sm">Sozialkompetenz</span>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg flex items-center">
              <Briefcase size={16} className="text-purple-500 mr-2" />
              <span className="text-sm">Personalkompetenz</span>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg flex items-center">
              <Zap size={16} className="text-amber-500 mr-2" />
              <span className="text-sm">Fertigkeit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}