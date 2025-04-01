import React from 'react';

interface ResourceCardProps {
  resource: {
    name: string;
    wlo_metadata?: any | any[];
    access_link?: string;
  };
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const metadataArray = resource.wlo_metadata 
    ? Array.isArray(resource.wlo_metadata) 
      ? resource.wlo_metadata 
      : [resource.wlo_metadata]
    : [];

  return (
    <>
      {metadataArray.map((metadata, index) => (
        <div 
          key={index} 
          className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          style={{ height: '356px' }}
        >
          <div className="h-full flex flex-col">
            {metadata.previewUrl && (
              <div className="h-40 mb-2 relative">
                <img
                  src={metadata.previewUrl}
                  alt={metadata.title || resource.name}
                  className="absolute inset-0 w-full h-full object-cover rounded"
                  loading="lazy"
                />
              </div>
            )}
            
            <div className="flex flex-col flex-1 overflow-hidden">
              <h4 className="font-medium text-base mb-2">
                {metadata.wwwUrl || resource.access_link ? (
                  <a 
                    href={metadata.wwwUrl || resource.access_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {metadata.title || resource.name}
                  </a>
                ) : (
                  metadata.title || resource.name
                )}
              </h4>
              
              {metadata.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {metadata.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-1 mt-auto">
                {metadata.subject && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {metadata.subject}
                  </span>
                )}
                {metadata.educationalContext?.map((context: string, idx: number) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {context}
                  </span>
                ))}
                {metadata.resourceType && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {metadata.resourceType}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}