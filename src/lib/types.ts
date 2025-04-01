export interface WLOMetadata {
  title: string;
  collectionId?: string;
  refId?: string;
  parentPath?: string;
  parentId?: string;
  hierarchyLevel?: number;
  keywords: string[];
  description: string;
  subject: string;
  educationalContext: string[];
  wwwUrl: string | null;
  previewUrl: string | null;
  resourceType?: string;
}

export interface WLOSearchParams {
  properties: string[];
  values: string[];
  maxItems?: number;
  skipCount?: number;
  propertyFilter?: string;
  combineMode?: 'OR' | 'AND';
  signal?: AbortSignal;
}

export interface CollectionParams {
  collectionId: string;
  maxDepth?: number;
  skipCount?: number;
  maxItems?: number;
}