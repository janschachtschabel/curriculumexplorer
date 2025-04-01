export interface Competency {
  id: string;
  code?: string;
  title: string;
  description: string;
  competencyType?: string;
  level?: number;
  parentId?: string;
  escoMappings?: ESCOMapping[];
  competencyAnalysis?: CompetencyAnalysis;
}

export interface ESCOMapping {
  id: string;
  uri: string;
  preferredLabel: string;
  altLabels?: string[];
  description?: string;
  confidence?: number;
}

export interface CompetencyAnalysis {
  skillType?: string;
  lernzielbereich?: string;
  keywords?: string[];
  bloomLevel?: string;
  relevance?: number;
  difficulty?: number;
  digitalLevel?: number;
}

export interface LearningField {
  id: string;
  code: string;
  title: string;
  description: string;
  hours?: number;
  year?: number;
  schwerpunkt?: string;
  zeitraum?: string;
  competencies: Competency[];
}

export interface CurriculumData {
  id: string;
  title: string;
  description?: string;
  profession: {
    title: string;
    code?: string;
    description?: string;
    duration?: string;
    field?: string;
  };
  trainingYears?: number;
  totalHours?: number;
  issueDate?: string;
  validFrom?: string;
  validUntil?: string;
  publisher?: string;
  learningFields: LearningField[];
  competencies?: Competency[]; // Flat list of all competencies
  metadata?: {
    competencyCount?: number;
    escoMappingCount?: number;
    digitalCompetencyCount?: number;
    averageCompetenciesPerField?: number;
    competencyTypeDistribution?: Record<string, number>;
    bloomLevelDistribution?: Record<string, number>;
  };
  
  // Additional metadata from Anlagenmechaniker format
  documentMetadata?: any;
  escoData?: any;
  kldbMapping?: string;
  iscoMapping?: any;
}