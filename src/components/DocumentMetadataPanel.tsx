import React from 'react';
import { FileText, Users, Award, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface ESCOOccupation {
  name: string;
  uri: string;
  isco_code?: string;
  description?: string;
  similarity_score?: number;
  matching_reason?: string;
  alternative_labels?: string[];
}

interface AlternativeOccupation extends ESCOOccupation {
  search_type?: string;
}

interface ISCOMapping {
  primary_isco?: string;
  has_direct_match?: boolean;
  isco_codes?: { code: string; is_direct: boolean }[];
  kldb_title?: string;
}

interface DocumentMetadata {
  document_type?: string;
  source_file?: string;
  processing_date?: string;
  esco_mapping_enabled?: boolean;
  competence_analysis_enabled?: boolean;
  converter?: string;
  llm_model?: string;
  template?: string;
}

interface ESCOData {
  matching_method?: string;
  occupation?: ESCOOccupation;
  skills?: any[];
  alternative_occupations?: AlternativeOccupation[];
}

interface DocumentMetadataPanelProps {
  metadata?: DocumentMetadata;
  kldbMapping?: string;
  iscoMapping?: ISCOMapping;
  escoData?: ESCOData;
}

export function DocumentMetadataPanel({ metadata, kldbMapping, iscoMapping, escoData }: DocumentMetadataPanelProps) {
  if (!metadata && !kldbMapping && !iscoMapping && !escoData) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p>Keine Metadaten verfügbar</p>
      </div>
    );
  }

  // Get all available skills
  const allSkills = escoData?.skills || [];

  return (
    <div className="space-y-6 overflow-auto max-h-[calc(100vh-340px)]">
      {/* Document Metadata */}
      {metadata && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-lg mb-3 flex items-center text-gray-700">
            <FileText className="w-5 h-5 mr-2" />
            Dokumentinformationen
          </h3>
          <div className="grid grid-cols-1 gap-2 text-sm">
            {metadata.document_type && (
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Dokumenttyp:</span>
                <span>{metadata.document_type}</span>
              </div>
            )}
            {metadata.source_file && (
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Quelldatei:</span>
                <span>{metadata.source_file}</span>
              </div>
            )}
            {metadata.processing_date && (
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Verarbeitungsdatum:</span>
                <span>{metadata.processing_date}</span>
              </div>
            )}
            {metadata.converter && (
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Konverter:</span>
                <span>{metadata.converter}</span>
              </div>
            )}
            {metadata.llm_model && (
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">KI-Modell:</span>
                <span>{metadata.llm_model}</span>
              </div>
            )}
            {metadata.template && (
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Template:</span>
                <span>{metadata.template}</span>
              </div>
            )}
            <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center">
                <span className="text-gray-600 font-medium mr-2">ESCO-Mapping:</span>
                {metadata.esco_mapping_enabled ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 font-medium mr-2">Kompetenzanalyse:</span>
                {metadata.competence_analysis_enabled ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Classification Codes */}
      {(kldbMapping || iscoMapping) && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-lg mb-3 flex items-center text-blue-700">
            <Award className="w-5 h-5 mr-2" />
            Berufliche Klassifikation
          </h3>
          <div className="space-y-2 text-sm">
            {kldbMapping && (
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">KldB 2010 Code:</span>
                <span className="font-mono bg-blue-100 px-2 py-0.5 rounded">{kldbMapping}</span>
              </div>
            )}
            {iscoMapping?.primary_isco && (
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">ISCO-08 Code:</span>
                <span className="font-mono bg-blue-100 px-2 py-0.5 rounded">{iscoMapping.primary_isco}</span>
              </div>
            )}
            {iscoMapping?.kldb_title && (
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">KldB Titel:</span>
                <span>{iscoMapping.kldb_title}</span>
              </div>
            )}
            {iscoMapping?.has_direct_match !== undefined && (
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">Direkte Übereinstimmung:</span>
                <div className="flex items-center">
                  {iscoMapping.has_direct_match ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500 mr-1" />
                  )}
                  <span>{iscoMapping.has_direct_match ? 'Ja' : 'Nein'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ESCO Occupation Match */}
      {escoData?.occupation && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-lg mb-3 flex items-center text-green-700">
            <Users className="w-5 h-5 mr-2" />
            ESCO Berufsklassifikation
          </h3>
          <div className="space-y-3">
            {escoData.matching_method && (
              <div className="text-sm text-green-700 flex justify-between">
                <span className="font-medium">Matching-Methode:</span>
                <span>{escoData.matching_method}</span>
              </div>
            )}
            
            <div className="bg-white rounded-lg border border-green-200 p-3">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-green-800">
                  {escoData.occupation.name}
                </h4>
                {escoData.occupation.similarity_score !== undefined && (
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    {escoData.occupation.similarity_score}% Übereinstimmung
                  </span>
                )}
              </div>
              
              {escoData.occupation.isco_code && (
                <div className="text-sm mt-1">
                  <span className="text-gray-600">ISCO Code:</span> <span className="font-mono">{escoData.occupation.isco_code}</span>
                </div>
              )}
              
              {escoData.occupation.description && (
                <p className="text-sm mt-2 text-gray-700">
                  {escoData.occupation.description}
                </p>
              )}
              
              {escoData.occupation.matching_reason && (
                <div className="mt-2 text-sm bg-green-50 p-2 rounded">
                  <span className="font-medium text-green-700">Begründung:</span>
                  <p className="text-gray-700">{escoData.occupation.matching_reason}</p>
                </div>
              )}
              
              {escoData.occupation.uri && (
                <a 
                  href={escoData.occupation.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-sm text-green-600 hover:text-green-800 flex items-center"
                >
                  ESCO Eintrag ansehen <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              )}
            </div>
            
            {/* Show ALL Skills without limit */}
            {allSkills.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium text-green-700 mb-2">Berufliche Fertigkeiten</h4>
                <div className="space-y-2">
                  {allSkills.map((skill, index) => (
                    <div key={index} className="bg-white p-2 rounded border border-green-100 text-sm">
                      <div className="font-medium text-green-800">{skill.name}</div>
                      {skill.description?.literal && (
                        <div className="text-xs text-gray-600 mt-1">
                          {skill.description.literal}
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          skill.essential 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {skill.essential ? 'Essenziell' : 'Optional'}
                        </span>
                        {skill.uri && (
                          <a 
                            href={skill.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 hover:text-green-800 flex items-center"
                          >
                            ESCO <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Show ALL Alternative Occupations without limit */}
            {escoData.alternative_occupations && escoData.alternative_occupations.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium text-green-700 mb-2">Alternative Berufe</h4>
                <div className="space-y-2">
                  {escoData.alternative_occupations.map((occupation, index) => (
                    <div key={index} className="bg-white p-2 rounded border border-green-100 text-sm">
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-green-800">{occupation.name}</div>
                        {occupation.similarity_score !== undefined && (
                          <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                            {occupation.similarity_score}%
                          </span>
                        )}
                      </div>
                      
                      {occupation.isco_code && (
                        <div className="text-xs mt-1">
                          <span className="text-gray-600">ISCO Code:</span> <span className="font-mono">{occupation.isco_code}</span>
                        </div>
                      )}

                      {occupation.uri && (
                        <a 
                          href={occupation.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-xs text-green-600 hover:text-green-800 flex items-center"
                        >
                          ESCO <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}