import React, { useEffect, useState } from 'react';
import { FileJson, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface JsonOption {
  value: string;
  label: string;
}

interface JsonSelectorProps {
  jsonFiles: JsonOption[];
  selectedFile: string;
  onSelect: (filename: string) => void;
  loading?: boolean;
}

export function JsonSelector({ jsonFiles, selectedFile, onSelect, loading = false }: JsonSelectorProps) {
  const [localJsonFiles, setLocalJsonFiles] = useState<JsonOption[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Process and deduplicate the files when the component mounts or jsonFiles changes
  useEffect(() => {
    if (jsonFiles.length > 0) {
      // Remove duplicates based on the value field
      const uniqueFiles = removeDuplicates(jsonFiles);
      setLocalJsonFiles(uniqueFiles);
    } else {
      refreshJsonFiles();
    }
  }, [jsonFiles]);

  // Function to remove duplicates from the file list
  const removeDuplicates = (files: JsonOption[]): JsonOption[] => {
    const uniqueValues = new Set<string>();
    return files.filter(file => {
      if (uniqueValues.has(file.value)) {
        return false;
      }
      uniqueValues.add(file.value);
      return true;
    });
  };

  // Function to refresh and detect JSON files
  const refreshJsonFiles = async () => {
    setRefreshing(true);
    console.log("Starting JSON file detection...");
    
    try {
      // First try the server API
      const response = await axios.get('/api/json-files');
      if (response.status === 200 && response.data.files && Array.isArray(response.data.files)) {
        const formattedFiles = response.data.files.map((file: string) => ({
          value: file,
          label: formatFileName(file)
        }));
        
        // Remove duplicates
        const uniqueFiles = removeDuplicates(formattedFiles);
        setLocalJsonFiles(uniqueFiles);
        
        // If no file is selected and we have files, select the first one
        if (!selectedFile && uniqueFiles.length > 0) {
          onSelect(uniqueFiles[0].value);
        }
      }
    } catch (error) {
      console.error("Failed to load JSON files", error);
      
      // Fallback to hardcoded list as last resort
      const hardcodedFiles = getHardcodedFileList();
      setLocalJsonFiles(hardcodedFiles);
    } finally {
      setRefreshing(false);
    }
  };

  // Get hardcoded file list as absolute last resort
  const getHardcodedFileList = (): JsonOption[] => {
    const knownFiles = [
      'Anlagenmechaniker-IH04-03-25-idF-18-02-23_Anlagenmechaniker_Anlagenmechanikerin.json',
      'Aenderungsschneider.pdf_converted_Änderungsschneider_Änderungsschneiderin.json',
      'Anlagenmechaniker_SHK_16-01-29-E.pdf_converted_Anlagenmechaniker_für_Sanitär-__Heizungs-_und_Klimatechnik_Anlagenmechanikerin_für_Sanitär-__Heizungs-_und_Klimatechnik.json',
      'Asphaltbauer84-02-10.pdf_converted_Asphaltbauer_Asphaltbauerin.json'
    ];
    
    return knownFiles.map(file => ({
      value: file,
      label: formatFileName(file)
    }));
  };

  // Format filename for display
  const formatFileName = (fileName: string) => {
    return fileName
      .replace(/\.json$/, '')
      .replace(/\.pdf_converted_/, ': ')
      .replace(/_/g, ' ')
      .replace(/-/g, ' ');
  };

  return (
    <div className="flex items-center">
      <div className="p-2 bg-gray-100 rounded-l-lg">
        <FileJson className="w-5 h-5 text-gray-600" />
      </div>
      <div className="relative flex-1">
        <select
          className="block w-full rounded-r-lg border-gray-300 border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          value={selectedFile}
          onChange={(e) => onSelect(e.target.value)}
          disabled={loading || refreshing || localJsonFiles.length === 0}
        >
          {localJsonFiles.length === 0 ? (
            <option value="">Keine JSON-Dateien gefunden</option>
          ) : (
            <>
              <option value="">Lehrplan auswählen...</option>
              {localJsonFiles.map((file) => (
                <option key={file.value} value={file.value}>
                  {file.label}
                </option>
              ))}
            </>
          )}
        </select>
        {(loading || refreshing) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
          </div>
        )}
      </div>
      <button 
        onClick={refreshJsonFiles}
        className="ml-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        title="Dateiliste aktualisieren"
        disabled={refreshing}
      >
        <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}