import React from 'react';
import { Download } from 'lucide-react';
import { WLOMetadata } from '../lib/types';

interface CollectionTreeProps {
  collections: WLOMetadata[];
  onDownload: () => void;
}

function buildTree(collections: WLOMetadata[]) {
  const tree: { [key: string]: WLOMetadata[] } = {};
  const roots: WLOMetadata[] = [];

  // Group collections by parent ID
  collections.forEach(collection => {
    const parentId = collection.parentId || 'root';
    if (!tree[parentId]) {
      tree[parentId] = [];
    }
    tree[parentId].push(collection);

    // If no parent ID, it's a root collection
    if (!collection.parentId) {
      roots.push(collection);
    }
  });

  function renderBranch(collection: WLOMetadata, prefix = '', isLast = true): string {
    const children = tree[collection.refId || ''] || [];
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    const branchSymbol = isLast ? '└── ' : '├── ';
    
    let result = prefix + branchSymbol + collection.title;
    
    // Add subject and educational context if available
    if (collection.subject || collection.educationalContext?.length > 0) {
      result += ' [';
      if (collection.subject) {
        result += collection.subject;
      }
      if (collection.subject && collection.educationalContext?.length > 0) {
        result += ' | ';
      }
      if (collection.educationalContext?.length > 0) {
        result += collection.educationalContext.join(', ');
      }
      result += ']';
    }
    result += '\n';
    
    if (collection.description) {
      const descLines = collection.description.split('\n');
      descLines.forEach(line => {
        if (line.trim()) {
          result += prefix + (isLast ? '    ' : '│   ') + '│ ' + line + '\n';
        }
      });
    }
    
    if (collection.keywords?.length > 0) {
      result += prefix + (isLast ? '    ' : '│   ') + '│ Keywords: ' + collection.keywords.join(', ') + '\n';
    }
    
    if (collection.wwwUrl) {
      result += prefix + (isLast ? '    ' : '│   ') + '│ URL: ' + collection.wwwUrl + '\n';
    }

    children.forEach((child, index) => {
      result += renderBranch(child, childPrefix, index === children.length - 1);
    });

    return result;
  }

  return roots.map((root, index) => renderBranch(root, '', index === roots.length - 1)).join('');
}

export function CollectionTree({ collections, onDownload }: CollectionTreeProps) {
  const treeText = buildTree(collections);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Collection Hierarchy</h2>
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          Download Tree
        </button>
      </div>
      <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto whitespace-pre font-mono text-sm">
        {treeText}
      </pre>
    </div>
  );
}