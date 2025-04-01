import axios from 'axios';
import { WLOSearchParams, CollectionParams } from './types';

// Create a simple event emitter for debug info
type DebugListener = (info: string) => void;
const debugListeners: DebugListener[] = [];

export function onDebugInfo(listener: DebugListener) {
  debugListeners.push(listener);
  return () => {
    const index = debugListeners.indexOf(listener);
    if (index > -1) {
      debugListeners.splice(index, 1);
    }
  };
}

function emitDebugInfo(info: string) {
  debugListeners.forEach(listener => listener(info));
}

export async function searchWLO({
  properties,
  values,
  maxItems = 5,
  skipCount = 0,
  propertyFilter = '-all-',
  combineMode = 'AND',
  signal
}: WLOSearchParams) {
  try {
    // Construct the search criteria array
    const criteria = [];
    
    // Add title/search word as first criterion
    if (properties.includes('cclom:title') && values[0]) {
      criteria.push({
        property: 'ngsearchword',
        values: [values[0]]
      });
    }

    // Map old property names to new ones
    const propertyMapping: Record<string, string> = {
      'ccm:oeh_lrt_aggregated': 'ccm:oeh_lrt_aggregated',
      'ccm:taxonid': 'virtual:taxonid',
      'ccm:educationalcontext': 'ccm:educationalcontext'
    };

    // Add remaining criteria with mapped properties
    for (let i = 0; i < properties.length; i++) {
      if (properties[i] !== 'cclom:title' && values[i]) {
        criteria.push({
          property: propertyMapping[properties[i]] || properties[i],
          values: [values[i]]
        });
      }
    }

    const searchParams = new URLSearchParams({
      contentType: 'FILES',
      maxItems: maxItems.toString(),
      skipCount: skipCount.toString(),
      propertyFilter
    });

    const url = `/api/edu-sharing/rest/search/v1/queries/-home-/mds_oeh/ngsearch?${searchParams}`;
    
    console.log('WLO SEARCH REQUEST:');
    console.log('- URL:', url);
    console.log('- Criteria:', JSON.stringify(criteria, null, 2));
    
    emitDebugInfo(`REQUEST: POST ${url}\nBody: ${JSON.stringify({ criteria }, null, 2)}`);

    try {
      const response = await axios.post(
        url,
        { criteria },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          signal
        }
      );

      console.log(`WLO SEARCH RESPONSE: Status ${response.status}, Found ${response.data?.nodes?.length || 0} results`);
      emitDebugInfo(`RESPONSE: Status ${response.status}, Found ${response.data?.nodes?.length || 0} results`);
      
      return response.data;
    } catch (error) {
      console.error('Search failed with axios:', error);
      
      // Fall back to fetch API
      console.log('Trying with fetch API as fallback');
      const fetchResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ criteria }),
        signal
      });
      
      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! Status: ${fetchResponse.status}`);
      }
      
      const data = await fetchResponse.json();
      console.log('Successfully fetched with fetch API');
      return data;
    }
  } catch (error) {
    console.error('Error in searchWLO function:', error);
    throw error;
  }
}

export async function getCollectionContents({ 
  collectionId,
  skipCount = 0,
  maxItems = 100
}: CollectionParams) {
  try {
    const url = `/api/edu-sharing/rest/node/v1/nodes/-home-/${collectionId}/children`;
    
    emitDebugInfo(`GET ${url}\nParams: ${JSON.stringify({ maxItems, skipCount, filter: 'files', propertyFilter: '-all-' }, null, 2)}`);

    const response = await axios.get(
      url,
      {
        params: {
          maxItems: maxItems,
          skipCount: skipCount,
          filter: 'files',
          propertyFilter: '-all-'
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error in getCollectionContents function:', error);
    throw error;
  }
}

async function fetchCollectionHierarchy(
  collectionId: string,
  maxDepth: number = 1,
  currentDepth: number = 1,
  parentPath: string[] = [],
  allCollections: any[] = [],
  visitedCollections: string[] = []
): Promise<void> {
  if (visitedCollections.includes(collectionId)) return;
  visitedCollections.push(collectionId);

  try {
    // Get subcollections
    const childrenUrl = `/api/edu-sharing/rest/node/v1/nodes/-home-/${collectionId}/children`;
    
    emitDebugInfo(`GET ${childrenUrl}?maxItems=100&skipCount=0&filter=folders&propertyFilter=-all-`);

    const response = await axios.get(childrenUrl, {
      params: {
        maxItems: 100,
        skipCount: 0,
        filter: 'folders',
        propertyFilter: '-all-'
      },
      headers: { 'Accept': 'application/json' }
    });

    const children = response.data?.nodes || [];

    // Add current collection from the response data
    if (children.length > 0) {
      const firstChild = children[0];
      allCollections.push({
        properties: {
          'cclom:title': [firstChild.parent.name || firstChild.parent.title || 'Untitled Collection'],
          'cm:description': [firstChild.parent.description || ''],
          'ccm:taxonid_DISPLAYNAME': firstChild.properties?.['ccm:taxonid_DISPLAYNAME'] || [],
          'ccm:educationalcontext_DISPLAYNAME': firstChild.properties?.['ccm:educationalcontext_DISPLAYNAME'] || [],
          'cclom:general_keyword': firstChild.properties?.['cclom:general_keyword'] || [],
          'cclom:location': [firstChild.parent.content?.url || ''],
          'ccm:hierarchyLevel': [currentDepth],
          'ccm:parentPath': [parentPath.join('/')],
          'ccm:parentId': [parentPath[parentPath.length - 1] || ''],
          'ccm:collectionid': [collectionId]
        },
        ref: { id: collectionId }
      });
    }
    
    const currentPath = [...parentPath, collectionId];
    
    // Add all child collections
    children.forEach(child => {
      if (child.type === 'ccm:map' && child.isDirectory) {
        allCollections.push({
          properties: {
            'cclom:title': [child.title || child.name || 'Untitled Collection'],
            'cm:description': [child.properties?.['cm:description']?.[0] || ''],
            'ccm:taxonid_DISPLAYNAME': child.properties?.['ccm:taxonid_DISPLAYNAME'] || [],
            'ccm:educationalcontext_DISPLAYNAME': child.properties?.['ccm:educationalcontext_DISPLAYNAME'] || [],
            'cclom:general_keyword': child.properties?.['cclom:general_keyword'] || [],
            'cclom:location': [child.content?.url || ''],
            'ccm:hierarchyLevel': [currentDepth + 1],
            'ccm:parentPath': [currentPath.join('/')],
            'ccm:parentId': [collectionId],
            'ccm:collectionid': [child.ref?.id || '']
          },
          ref: { id: child.ref?.id || '' }
        });
      }
    });

    // If we haven't reached max depth, fetch subcollections
    if (currentDepth < maxDepth) {
      for (const child of children) {
        const childId = child?.ref?.id;
        if (childId && childId !== collectionId && !visitedCollections.includes(childId) && child.type === 'ccm:map' && child.isDirectory) {
          await fetchCollectionHierarchy(
            childId,
            maxDepth,
            currentDepth + 1,
            currentPath,
            allCollections,
            visitedCollections
          );
        }
      }
    }
  } catch (error) {
    console.error(`Failed to fetch collection hierarchy for ${collectionId}:`, error);
    throw error;
  }
}

export async function getCollectionStructure({ 
  collectionId,
  maxDepth,
  skipCount = 0,
  maxItems = 100
}: CollectionParams) {
  try {
    const allCollections: any[] = [];
    await fetchCollectionHierarchy(collectionId, maxDepth || 1, 1, [], allCollections, []);

    return { nodes: allCollections };
  } catch (error) {
    console.error('Error in getCollectionStructure:', error);
    throw error;
  }
}