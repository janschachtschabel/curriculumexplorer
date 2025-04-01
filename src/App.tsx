import React, { useState, useEffect } from 'react';
import { Upload, Search, FileJson, BarChart2, Network } from 'lucide-react';
import { searchWLO } from './lib/wloApi';
import { WLOMetadata } from './lib/types';
import { ResourceCard } from './components/preview/components/ResourceCard';
import { BILDUNGSSTUFE_MAPPING } from './lib/mappings';
import { CurriculumTree } from './components/CurriculumTree';
import { MappingPanel } from './components/MappingPanel';
import { StatisticsPanel } from './components/StatisticsPanel';
import { JsonSelector } from './components/JsonSelector';
import { DocumentMetadataPanel } from './components/DocumentMetadataPanel';
import { VisualsPanel } from './components/VisualsPanel';
import { parseCurriculum } from './lib/curriculumParser';
import { CurriculumData, Competency } from './lib/curriculumTypes';
import axios from 'axios';

function App() {
  const [curriculumData, setCurriculumData] = useState<CurriculumData | null>(null);
  const [selectedCompetency, setSelectedCompetency] = useState<Competency | null>(null);
  const [showProfessionInfo, setShowProfessionInfo] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<WLOMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tree' | 'stats' | 'visuals'>('tree');
  const [jsonFiles, setJsonFiles] = useState<string[]>([]);
  const [loadingJsonFiles, setLoadingJsonFiles] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiRetryCount, setApiRetryCount] = useState<number>(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Fetch available JSON files from the server
  useEffect(() => {
    const fetchJsonFiles = async () => {
      setLoadingJsonFiles(true);
      
      try {
        // Try to fetch from the API endpoint
        const response = await fetch('/api/json-files');
        if (!response.ok) {
          throw new Error(`Error fetching JSON files: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.files && Array.isArray(data.files)) {
          // Remove duplicates
          const uniqueFiles = [...new Set(data.files)];
          console.log('Found JSON files:', uniqueFiles);
          setJsonFiles(uniqueFiles);
          
          // If there are files, load the first one by default
          if (uniqueFiles.length > 0) {
            setSelectedFile(uniqueFiles[0]);
            loadJsonFile(uniqueFiles[0]);
          } else {
            setLoadingError("Keine Lehrplan-JSON-Dateien im json-Ordner gefunden.");
          }
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (error) {
        console.error('Error fetching JSON files list:', error);
        
        // Fallback to checking for files directly in the json folder
        try {
          console.log('Attempting direct file access...');
          
          // List of known JSON files to check for
          const knownFiles = [
            'Anlagenmechaniker-IH04-03-25-idF-18-02-23_Anlagenmechaniker_Anlagenmechanikerin.json',
            'Aenderungsschneider.pdf_converted_Änderungsschneider_Änderungsschneiderin.json',
            'Anlagenmechaniker_SHK_16-01-29-E.pdf_converted_Anlagenmechaniker_für_Sanitär-__Heizungs-_und_Klimatechnik_Anlagenmechanikerin_für_Sanitär-__Heizungs-_und_Klimatechnik.json',
            'Asphaltbauer84-02-10.pdf_converted_Asphaltbauer_Asphaltbauerin.json',
            'Aufbereitungsmechaniker92-04-29.pdf_converted_Aufbereitungsmechaniker_Aufbereitungsmechanikerin.json',
            'Augenoptiker11-03-25-E_01.pdf_converted_Augenoptiker_Augenoptikerin.json',
            'Ausbaufacharbeiter.pdf_converted_Ausbaufacharbeiter_-in.json'
          ];
          
          // The paths to check
          const paths = ['/json/', '/public/json/'];
          const foundFiles = [];
          
          for (const path of paths) {
            for (const file of knownFiles) {
              try {
                const fileUrl = `${path}${file}`;
                console.log(`Checking if file exists at: ${fileUrl}`);
                
                const response = await fetch(fileUrl, { method: 'HEAD' });
                if (response.ok) {
                  if (!foundFiles.includes(file)) { // Only add if not already in the list
                    foundFiles.push(file);
                    console.log(`Found file: ${fileUrl}`);
                  }
                }
              } catch (fileError) {
                // Ignore - file likely doesn't exist
              }
            }
          }
          
          if (foundFiles.length > 0) {
            console.log('Found files through direct access:', foundFiles);
            setJsonFiles(foundFiles);
            setSelectedFile(foundFiles[0]);
            loadJsonFile(foundFiles[0]);
          } else {
            // Last resort - just use the hardcoded list
            setJsonFiles(knownFiles);
            setSelectedFile(knownFiles[0]);
            loadJsonFile(knownFiles[0]);
          }
        } catch (fallbackError) {
          console.error('All file detection methods failed:', fallbackError);
          setLoadingError("Konnte keine JSON-Dateien finden. Bitte lade eine Datei hoch oder aktualisiere die Seite.");
        }
      } finally {
        setLoadingJsonFiles(false);
      }
    };
    
    fetchJsonFiles();
    
    // Clean up any active abort controllers when component unmounts
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, []);

  const loadJsonFile = async (filename: string) => {
    try {
      setLoading(true);
      setLoadingError(null);
      
      // First try the dedicated API endpoint
      try {
        console.log(`Trying API endpoint for JSON file: ${filename}`);
        const apiResponse = await fetch(`/api/json/${filename}`);
        
        if (apiResponse.ok) {
          const jsonData = await apiResponse.json();
          console.log("Successfully loaded JSON data from API endpoint");
          processJsonData(jsonData);
          return;
        } else {
          console.log(`API endpoint failed with status: ${apiResponse.status}`);
        }
      } catch (apiError) {
        console.log("API endpoint failed:", apiError);
      }
      
      // If API endpoint failed, try multiple potential paths directly
      const potentialPaths = [
        `/json/${filename}`,
        `/public/json/${filename}`
      ];
      
      let jsonResponse = null;
      let successPath = '';
      
      for (const path of potentialPaths) {
        try {
          console.log(`Trying to load JSON from: ${path}`);
          const response = await fetch(path);
          if (response.ok) {
            jsonResponse = response;
            successPath = path;
            break;
          }
        } catch (pathError) {
          console.log(`Failed to load from ${path}:`, pathError);
        }
      }
      
      if (!jsonResponse) {
        throw new Error(`Konnte die Datei ${filename} unter keinem der Pfade finden.`);
      }
      
      console.log(`Successfully loaded JSON from: ${successPath}`);
      
      try {
        const jsonData = await jsonResponse.json();
        processJsonData(jsonData);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error(`Fehler beim Parsen der JSON-Datei. Ungültiges JSON-Format: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
    } catch (error) {
      console.error('Error loading JSON file:', error);
      setLoadingError(`Fehler beim Laden der JSON-Datei: ${error instanceof Error ? error.message : String(error)}`);
      setCurriculumData(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Process the loaded JSON data
  const processJsonData = (jsonData: any) => {
    console.log("Raw JSON data loaded:", Object.keys(jsonData));
    
    try {
      const parsedData = parseCurriculum(jsonData);
      
      console.log("Geladene Lehrplandaten:", parsedData);
      
      if (!parsedData || !parsedData.learningFields || parsedData.learningFields.length === 0) {
        setLoadingError("Die geladene JSON-Datei enthält keine gültigen Lehrplandaten. Es wurden keine Lernfelder gefunden.");
        setCurriculumData(null);
      } else {
        setCurriculumData(parsedData);
        setSelectedCompetency(null);
        setShowProfessionInfo(false);
        setSearchResults([]);
        
        // Automatically expand the first learning field
        if (parsedData.learningFields && parsedData.learningFields.length > 0) {
          console.log("Erstes Lernfeld:", parsedData.learningFields[0]);
        }
      }
    } catch (parseError) {
      console.error("Error parsing curriculum:", parseError);
      setLoadingError(`Fehler beim Parsen der Lehrplandaten: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      setCurriculumData(null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonString = e.target?.result as string;
          // Basic validation to catch obvious non-JSON files
          if (!jsonString.trim().startsWith('{')) {
            throw new Error("Die hochgeladene Datei scheint kein gültiges JSON-Format zu haben.");
          }
          
          const data = JSON.parse(jsonString);
          
          // Additional validation on parsed data
          if (!data || typeof data !== 'object') {
            throw new Error("Die hochgeladene Datei hat kein gültiges JSON-Format.");
          }
          
          const parsedData = parseCurriculum(data);
          
          if (!parsedData || !parsedData.learningFields || parsedData.learningFields.length === 0) {
            setLoadingError("Die hochgeladene JSON-Datei enthält keine gültigen Lehrplandaten oder keine Lernfelder.");
            setCurriculumData(null);
          } else {
            setCurriculumData(parsedData);
            setSelectedCompetency(null);
            setShowProfessionInfo(false);
            setSearchResults([]);
            setLoadingError(null);
          }
        } catch (error) {
          console.error('Error parsing JSON:', error);
          setLoadingError(`Fehler beim Parsen der JSON-Datei: ${error instanceof Error ? error.message : String(error)}`);
          setCurriculumData(null);
        }
      };
      reader.onerror = (error) => {
        setLoadingError("Fehler beim Lesen der Datei");
      };
      reader.readAsText(file);
    }
  };

  const searchWLOContent = async (searchText: string) => {
    // Abort any ongoing requests
    if (abortController) {
      abortController.abort();
    }
    
    // Create a new abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);
    
    setLoading(true);
    setSearchTerm(searchText);
    setApiError(null);
    
    try {
      console.log(`Searching for WLO content with: "${searchText}"`);
      const response = await searchWLO({
        properties: ['cclom:title', 'ccm:educationalcontext'],
        values: [
          searchText,
          BILDUNGSSTUFE_MAPPING["Berufliche Bildung"]
        ],
        maxItems: 9,
        signal: controller.signal
      });

      if (!response || !response.nodes) {
        throw new Error('Ungültiges Antwortformat von der API');
      }

      const metadata = response.nodes.map((node: any) => ({
        title: node.properties['cclom:title']?.[0] || 'Untitled Resource',
        collectionId: node.properties['ccm:collectionid']?.[0] || '',
        hierarchyLevel: node.properties['ccm:hierarchyLevel']?.[0] || 1,
        parentPath: node.properties['ccm:parentPath']?.[0] || '',
        parentId: node.properties['ccm:parentId']?.[0] || '',
        refId: node.ref?.id || '',
        keywords: node.properties['cclom:general_keyword'] || [],
        description: node.properties['cclom:general_description']?.[0] || '',
        subject: node.properties['ccm:taxonid_DISPLAYNAME']?.[0] || '',
        educationalContext: node.properties['ccm:educationalcontext_DISPLAYNAME'] || [],
        wwwUrl: node.properties['cclom:location']?.[0] || 
                node.properties['ccm:wwwurl']?.[0] || 
                (node.ref?.id ? `https://redaktion.openeduhub.net/edu-sharing/components/collections?id=${node.ref.id}` : null),
        previewUrl: node.ref?.id ? `https://redaktion.openeduhub.net/edu-sharing/preview?nodeId=${node.ref.id}&storeProtocol=workspace&storeId=SpacesStore` : null,
        resourceType: node.properties['ccm:oeh_lrt_aggregated_DISPLAYNAME']?.[0] || 
                    node.properties['ccm:resourcetype_DISPLAYNAME']?.[0] || 
                    node.properties['ccm:oeh_lrt_aggregated']?.[0]?.split('/').pop() || 
                    'Lernressource'
      }));

      setSearchResults(metadata);
      console.log(`Found ${metadata.length} results`);
    } catch (error) {
      // Ignore aborted requests
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
      console.error('Search failed:', error);
      let errorMessage = 'Unbekannter Fehler';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = `Fehler bei der Suche: ${error.message} (Status Code: ${error.response.status})`;
        
        // If it's a 500 error, suggest retrying
        if (error.response.status === 500) {
          errorMessage += " - Der Server hat einen internen Fehler.";
        }
      } else {
        errorMessage = `Fehler bei der Suche: ${errorMessage}`;
      }
      
      setApiError(errorMessage);
      setSearchResults([]);
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  // Extract relevant search terms from competency data
  const extractSearchTerm = (competency: Competency): string => {
    // Use the title as the primary search term
    let searchTerm = competency.title;
    
    // Remove articles at the beginning
    searchTerm = searchTerm.replace(/^(die|der|das|den|dem|ein|eine|einer|eines|zum)\s+/i, '');
    
    // If there are ESCO mappings with high confidence, add the first one to improve search
    if (competency.escoMappings && competency.escoMappings.length > 0) {
      // Sort by confidence if available
      const sortedMappings = [...competency.escoMappings].sort(
        (a, b) => (b.confidence || 0) - (a.confidence || 0)
      );
      
      // Add the most relevant ESCO term if it's not too long
      if (sortedMappings[0].preferredLabel.length < 30) {
        searchTerm = `${searchTerm} ${sortedMappings[0].preferredLabel}`;
      }
    }
    
    console.log(`Search term for "${competency.title}": "${searchTerm}"`);
    return searchTerm;
  };

  const handleCompetencySelect = async (competency: Competency) => {
    setSelectedCompetency(competency);
    setShowProfessionInfo(false);
    
    // Use title for search
    const searchTerm = extractSearchTerm(competency);
    await searchWLOContent(searchTerm);
  };

  const handleESCOSkillSearch = async (skillName: string) => {
    setShowProfessionInfo(false);
    await searchWLOContent(skillName);
  };
  
  const handleProfessionSelect = () => {
    setSelectedCompetency(null);
    setShowProfessionInfo(true);
    
    // Search for relevant content about the profession if ESCO data is available
    if (curriculumData?.escoData?.occupation?.name) {
      searchWLOContent(curriculumData.escoData.occupation.name);
    } else {
      // Otherwise use the profession title
      searchWLOContent(curriculumData?.profession.title || '');
    }
  };

  const retryApiRequest = async () => {
    if (selectedCompetency) {
      setApiRetryCount(count => count + 1);
      const searchTerm = extractSearchTerm(selectedCompetency);
      await searchWLOContent(searchTerm);
    } else if (searchTerm) {
      setApiRetryCount(count => count + 1);
      await searchWLOContent(searchTerm);
    }
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
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Curriculum Explorer</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1">
              <JsonSelector 
                jsonFiles={jsonFiles.map(file => ({
                  value: file,
                  label: formatFileName(file)
                }))}
                selectedFile={selectedFile}
                onSelect={(filename) => {
                  setSelectedFile(filename);
                  loadJsonFile(filename);
                }}
                loading={loadingJsonFiles}
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <label className="cursor-pointer flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Upload className="w-5 h-5" />
                <span>Upload JSON</span>
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
              </label>
              
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  activeTab === 'tree' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } transition-colors`}
                onClick={() => setActiveTab('tree')}
              >
                <FileJson className="w-5 h-5" />
                Curriculum
              </button>
              
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  activeTab === 'stats' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } transition-colors`}
                onClick={() => setActiveTab('stats')}
              >
                <BarChart2 className="w-5 h-5" />
                Statistik
              </button>

              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  activeTab === 'visuals' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } transition-colors`}
                onClick={() => setActiveTab('visuals')}
              >
                <Network className="w-5 h-5" />
                Visuals
              </button>
            </div>
          </div>
          
          {loadingError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              <p className="font-medium">Hinweis:</p>
              <p>{loadingError}</p>
            </div>
          )}
        </div>

        {loading && !curriculumData ? (
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
            <p className="text-lg text-gray-600">Lade Lehrplan...</p>
          </div>
        ) : curriculumData ? (
          activeTab === 'tree' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4 bg-white rounded-lg shadow-md p-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                <h2 className="text-xl font-semibold mb-4 text-green-700">Lehrplan Struktur</h2>
                <CurriculumTree 
                  curriculum={curriculumData}
                  selectedCompetency={selectedCompetency}
                  onSelectCompetency={handleCompetencySelect}
                  onSelectProfession={handleProfessionSelect}
                />
              </div>
              
              <div className="md:col-span-3 bg-white rounded-lg shadow-md p-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                <h2 className="text-xl font-semibold mb-4 text-blue-700">
                  {showProfessionInfo ? 'Berufsinformationen' : 'ESCO Mappings'}
                </h2>
                
                {showProfessionInfo ? (
                  <DocumentMetadataPanel 
                    metadata={curriculumData.documentMetadata}
                    kldbMapping={curriculumData.kldbMapping}
                    iscoMapping={curriculumData.iscoMapping}
                    escoData={curriculumData.escoData}
                  />
                ) : (
                  <MappingPanel 
                    competency={selectedCompetency}
                    onSearchESCOSkill={handleESCOSkillSearch}
                  />
                )}
              </div>
              
              <div className="md:col-span-5 bg-white rounded-lg shadow-md p-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                <h2 className="text-xl font-semibold mb-4">WLO Inhalte</h2>
                {selectedCompetency || searchTerm ? (
                  <>
                    <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                      <p className="text-sm text-gray-600">Suche nach:</p>
                      <p className="font-medium">{searchTerm}</p>
                      <p className="text-xs text-gray-500 mt-1">Bildungsstufe: Berufliche Bildung</p>
                    </div>
                    
                    {apiError && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                        <p className="text-sm font-medium">{apiError}</p>
                        <div className="mt-2 flex justify-end">
                          <button 
                            onClick={retryApiRequest}
                            className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded flex items-center"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <div className="animate-spin h-3 w-3 border border-yellow-800 rounded-full border-t-transparent mr-1"></div>
                                Versuche erneut...
                              </>
                            ) : (
                              "Erneut versuchen"
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {loading ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {searchResults.map((result, index) => (
                          <ResourceCard
                            key={index}
                            resource={{
                              name: result.title,
                              wlo_metadata: result
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Search className="w-12 h-12 mb-2 text-gray-400" />
                        <p>Keine passenden Inhalte gefunden.</p>
                        <p className="text-sm">Wähle eine andere Kompetenz oder ESCO-Fertigkeit aus.</p>
                      </div>
                    )}
                  </>
                ) : showProfessionInfo ? (
                  <div className="flex flex-col h-full">
                    <div className="p-4 bg-gray-50 rounded-lg mb-4">
                      <h3 className="font-semibold text-lg mb-3 text-gray-700">Berufsbeschreibung</h3>
                      <p className="text-gray-600">{curriculumData.profession.description}</p>
                    </div>
                    
                    {curriculumData.escoData?.occupation?.description && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3 text-blue-700">ESCO Beschreibung</h3>
                        <p className="text-gray-600">{curriculumData.escoData.occupation.description}</p>
                      </div>
                    )}
                    
                    <div className="mt-auto">
                      <p className="text-center text-gray-500 p-4">
                        Wählen Sie eine Kompetenz aus dem Lehrplan, um passende Lernressourcen anzuzeigen.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <Search className="w-12 h-12 mb-2 text-gray-400" />
                    <p>Wähle eine Kompetenz aus dem Lehrplan aus</p>
                    <p className="text-sm">oder klicke auf eine ESCO-Fertigkeit,</p>
                    <p className="text-sm">um passende Inhalte anzuzeigen.</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'stats' ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-green-700">Lehrplan Statistik</h2>
              <StatisticsPanel curriculum={curriculumData} />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <VisualsPanel curriculum={curriculumData} />
            </div>
          )
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center h-64">
            <FileJson className="w-16 h-16 mb-4 text-gray-400" />
            <p className="text-lg text-gray-600 mb-2">Kein Lehrplan geladen</p>
            <p className="text-sm text-gray-500">Wähle einen Lehrplan aus der Dropdown-Liste oder lade eine JSON-Datei hoch.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;