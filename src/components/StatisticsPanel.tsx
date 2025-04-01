import React from 'react';
import { BarChart, PieChart, BookOpen, Users, Clock, Award, FileText, Brain, Layers, Target } from 'lucide-react';
import { CurriculumData } from '../lib/curriculumTypes';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface StatisticsPanelProps {
  curriculum: CurriculumData;
}

export function StatisticsPanel({ curriculum }: StatisticsPanelProps) {
  const metadata = curriculum.metadata || {};
  
  // Calculate hours per year
  const hoursPerYear: Record<number, number> = {};
  curriculum.learningFields.forEach(field => {
    const year = field.year || 1;
    hoursPerYear[year] = (hoursPerYear[year] || 0) + (field.hours || 0);
  });
  
  // Calculate competency types per learning field
  const competencyTypesByField: Record<string, Record<string, number>> = {};
  const lernzielbereicheByField: Record<string, Record<string, number>> = {};
  
  // Separate taxonomy levels by learning area
  const taxonomyLevelsByLernzielbereich: Record<string, Record<string, number>> = {};
  
  curriculum.learningFields.forEach(field => {
    competencyTypesByField[field.code] = {};
    lernzielbereicheByField[field.code] = {};
    
    field.competencies.forEach(comp => {
      // Count competency types
      if (comp.competencyType) {
        competencyTypesByField[field.code][comp.competencyType] = 
          (competencyTypesByField[field.code][comp.competencyType] || 0) + 1;
      }
      
      // Count learning areas (Lernzielbereiche)
      const lernzielbereich = comp.competencyAnalysis?.lernzielbereich || 'Nicht definiert';
      if (lernzielbereich) {
        lernzielbereicheByField[field.code][lernzielbereich] = 
          (lernzielbereicheByField[field.code][lernzielbereich] || 0) + 1;
        
        // Group taxonomy levels by learning area
        if (comp.competencyAnalysis?.bloomLevel) {
          if (!taxonomyLevelsByLernzielbereich[lernzielbereich]) {
            taxonomyLevelsByLernzielbereich[lernzielbereich] = {};
          }
          
          taxonomyLevelsByLernzielbereich[lernzielbereich][comp.competencyAnalysis.bloomLevel] = 
            (taxonomyLevelsByLernzielbereich[lernzielbereich][comp.competencyAnalysis.bloomLevel] || 0) + 1;
        }
      }
    });
  });
  
  // Create data for charts
  const allCompetencyTypes = Array.from(
    new Set(
      Object.values(competencyTypesByField)
        .flatMap(types => Object.keys(types))
    )
  ).sort();
  
  const allLernzielbereiche = Array.from(
    new Set(
      Object.values(lernzielbereicheByField)
        .flatMap(areas => Object.keys(areas))
    )
  ).sort();
  
  // Generate chart colors
  const generateColors = (count: number, baseHue: number) => {
    return Array.from({ length: count }, (_, i) => 
      `hsl(${baseHue + (i * 360 / count) % 360}, 70%, 65%)`
    );
  };
  
  const competencyTypeColors = generateColors(allCompetencyTypes.length, 200);
  const lernzielbereichColors = generateColors(allLernzielbereiche.length, 120);
  
  // Charts configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 10,
          font: {
            size: 10
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          font: {
            size: 9
          }
        }
      },
      y: {
        stacked: true,
        min: 0
      }
    }
  };
  
  // Convert competency type distribution to array for chart
  const competencyTypes = Object.entries(metadata.competencyTypeDistribution || {})
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
  
  // Calculate competencies per learning field
  const competenciesPerField = curriculum.learningFields.map(field => ({
    field: field.title,
    count: field.competencies.length,
    code: field.code
  })).sort((a, b) => b.count - a.count);
  
  // Data for competency types by field chart
  const competencyTypesByFieldData = {
    labels: curriculum.learningFields.map(field => field.code),
    datasets: allCompetencyTypes.map((type, index) => ({
      label: type,
      data: curriculum.learningFields.map(field => 
        competencyTypesByField[field.code][type] || 0
      ),
      backgroundColor: competencyTypeColors[index],
    }))
  };
  
  // Data for learning areas by field chart
  const lernzielbereicheByFieldData = {
    labels: curriculum.learningFields.map(field => field.code),
    datasets: allLernzielbereiche.map((area, index) => ({
      label: area,
      data: curriculum.learningFields.map(field => 
        lernzielbereicheByField[field.code][area] || 0
      ),
      backgroundColor: lernzielbereichColors[index],
    }))
  };
  
  // Prepare taxonomy levels by learning area charts
  const taxonomyChartsByLernzielbereich = Object.entries(taxonomyLevelsByLernzielbereich).map(([lernzielbereich, levels]) => {
    // Sort taxonomy levels in logical order
    const sortedLevels = Object.entries(levels).sort((a, b) => {
      const orderMap: Record<string, number> = {
        'Erinnern': 1,
        'Verstehen': 2,
        'Anwenden': 3,
        'Analysieren': 4,
        'Bewerten': 5,
        'Erschaffen': 6,
        'Erzeugen': 6,
      };
      return (orderMap[a[0]] || 99) - (orderMap[b[0]] || 99);
    });
    
    const data = {
      labels: sortedLevels.map(([level]) => level),
      datasets: [
        {
          label: lernzielbereich,
          data: sortedLevels.map(([, count]) => count),
          backgroundColor: generateColors(sortedLevels.length, 
            lernzielbereich === 'Kognitiv' ? 180 :
            lernzielbereich === 'Affektiv' ? 300 :
            lernzielbereich === 'Psychomotorisch' ? 60 : 240
          ),
        }
      ]
    };
    
    return { lernzielbereich, data };
  });
  
  // Pie chart data for overall distributions
  const competencyTypesPieData = {
    labels: competencyTypes.map(t => t.type),
    datasets: [
      {
        data: competencyTypes.map(t => t.count),
        backgroundColor: generateColors(competencyTypes.length, 200),
        borderWidth: 1
      }
    ]
  };
  
  // Pie chart for learning areas
  const lernzielbereichePieData = {
    labels: allLernzielbereiche,
    datasets: [
      {
        data: allLernzielbereiche.map(area => 
          Object.values(curriculum.learningFields).reduce((sum, field) => 
            sum + (lernzielbereicheByField[field.code][area] || 0), 0)
        ),
        backgroundColor: lernzielbereichColors,
        borderWidth: 1
      }
    ]
  };
  
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 10,
          font: {
            size: 10
          }
        }
      }
    }
  };
  
  const horizontalBarOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return ` ${context.parsed.x} Kompetenzen`;
          }
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-4 border border-green-200">
        <h3 className="font-semibold text-lg mb-3 flex items-center text-green-800">
          <Award className="w-5 h-5 mr-2" />
          Allgemeine Informationen
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">Beruf:</span>
            <span className="font-medium">{curriculum.profession.title}</span>
          </div>
          {curriculum.documentMetadata?.document_type && (
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Dokumententyp:</span>
              <span className="font-medium">{curriculum.documentMetadata.document_type}</span>
            </div>
          )}
          {curriculum.profession.code && (
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Kennziffer:</span>
              <span className="font-medium">{curriculum.profession.code}</span>
            </div>
          )}
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">Ausbildungsjahre:</span>
            <span className="font-medium">{curriculum.trainingYears}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">Gesamtstunden:</span>
            <span className="font-medium">{curriculum.totalHours || curriculum.learningFields.reduce((total, field) => total + (field.hours || 0), 0)}</span>
          </div>
          {curriculum.profession.duration && (
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Ausbildungsdauer:</span>
              <span className="font-medium">{curriculum.profession.duration}</span>
            </div>
          )}
          {curriculum.profession.field && (
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Berufsfeld:</span>
              <span className="font-medium">{curriculum.profession.field}</span>
            </div>
          )}
          {curriculum.issueDate && (
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Ausgabedatum:</span>
              <span className="font-medium">{curriculum.issueDate}</span>
            </div>
          )}
          {curriculum.publisher && (
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Herausgeber:</span>
              <span className="font-medium">{curriculum.publisher}</span>
            </div>
          )}
          {curriculum.kldbMapping && (
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">KldB 2010:</span>
              <span className="font-medium">{curriculum.kldbMapping}</span>
            </div>
          )}
          {curriculum.iscoMapping?.primary_isco && (
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">ISCO-08:</span>
              <span className="font-medium">{curriculum.iscoMapping.primary_isco}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 border border-green-200">
        <h3 className="font-semibold text-lg mb-3 flex items-center text-green-800">
          <BookOpen className="w-5 h-5 mr-2" />
          Lehrplan Übersicht
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-3 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-green-700">{curriculum.learningFields.length}</span>
            <span className="text-sm text-green-600">Lernfelder</span>
          </div>
          <div className="bg-green-50 rounded-lg p-3 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-green-700">{metadata.competencyCount || curriculum.competencies?.length || curriculum.learningFields.reduce((sum, field) => sum + field.competencies.length, 0)}</span>
            <span className="text-sm text-green-600">Kompetenzen</span>
          </div>
          <div className="bg-green-50 rounded-lg p-3 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-green-700">{metadata.escoMappingCount || 0}</span>
            <span className="text-sm text-green-600">ESCO Mappings</span>
          </div>
          <div className="bg-green-50 rounded-lg p-3 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-green-700">{Object.keys(metadata.competencyTypeDistribution || {}).length || 0}</span>
            <span className="text-sm text-green-600">Kompetenztypen</span>
          </div>
        </div>
        
        {curriculum.documentMetadata && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-sm mb-2 text-green-700">Dokumentinformationen</h4>
            <div className="text-sm space-y-1">
              {curriculum.documentMetadata.processing_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Verarbeitet am:</span>
                  <span className="font-medium">{curriculum.documentMetadata.processing_date}</span>
                </div>
              )}
              {curriculum.documentMetadata.source_file && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Quelldatei:</span>
                  <span className="font-medium">{curriculum.documentMetadata.source_file}</span>
                </div>
              )}
              {curriculum.documentMetadata.llm_model && (
                <div className="flex justify-between">
                  <span className="text-gray-600">KI-Modell:</span>
                  <span className="font-medium">{curriculum.documentMetadata.llm_model}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 border border-blue-200">
        <h3 className="font-semibold text-lg mb-3 flex items-center text-blue-800">
          <BarChart className="w-5 h-5 mr-2" />
          Kompetenzen pro Lernfeld
        </h3>
        {competenciesPerField.length > 0 ? (
          <div className="space-y-2">
            {competenciesPerField.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-36 truncate text-sm mr-2" title={`${item.code}: ${item.field}`}>
                  {item.code ? `${item.code}:` : ''} {item.field}
                </div>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2"
                    style={{ 
                      width: `${Math.min(100, (item.count / Math.max(...competenciesPerField.map(i => i.count))) * 100)}%` 
                    }}
                  >
                    <span className="text-xs text-white font-medium">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-6">
            Keine Daten verfügbar
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 border border-blue-200">
        <h3 className="font-semibold text-lg mb-3 flex items-center text-blue-800">
          <Clock className="w-5 h-5 mr-2" />
          Stundenverteilung nach Ausbildungsjahr
        </h3>
        {Object.keys(hoursPerYear).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(hoursPerYear)
              .sort(([yearA], [yearB]) => Number(yearA) - Number(yearB))
              .map(([year, hours]) => (
                <div key={year} className="flex items-center">
                  <div className="w-32 text-sm mr-2">
                    Ausbildungsjahr {year}
                  </div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2"
                      style={{ 
                        width: `${Math.min(100, (hours / Math.max(...Object.values(hoursPerYear))) * 100)}%` 
                      }}
                    >
                      <span className="text-xs text-white font-medium">{hours} Std.</span>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        ) : (
          <div className="text-center text-gray-500 py-6">
            Keine Daten verfügbar
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 border border-green-200 col-span-1 md:col-span-2">
        <h3 className="font-semibold text-lg mb-3 flex items-center text-green-800">
          <Target className="w-5 h-5 mr-2" />
          Verteilung der Kompetenzdimensionen
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2 text-green-700 flex items-center">
              <div className="w-4 h-4 mr-1 bg-green-500 rounded-full"></div> 
              Gesamtverteilung Kompetenzdimensionen
            </h4>
            {competencyTypes.length > 0 ? (
              <div className="h-64">
                <Pie 
                  data={competencyTypesPieData} 
                  options={pieChartOptions}
                />
              </div>
            ) : (
              <div className="text-center text-gray-500 py-6">
                Keine Daten verfügbar
              </div>
            )}
          </div>
          
          <div>
            <h4 className="font-medium mb-2 text-green-700 flex items-center">
              <div className="w-4 h-4 mr-1 bg-purple-500 rounded-full"></div> 
              Gesamtverteilung Lernzielbereiche
            </h4>
            {allLernzielbereiche.length > 0 ? (
              <div className="h-64">
                <Pie 
                  data={lernzielbereichePieData} 
                  options={pieChartOptions}
                />
              </div>
            ) : (
              <div className="text-center text-gray-500 py-6">
                Keine Daten verfügbar
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 border border-blue-200 col-span-1 md:col-span-2">
        <h3 className="font-semibold text-lg mb-3 flex items-center text-blue-800">
          <Layers className="w-5 h-5 mr-2" />
          Kompetenztypen nach Lernfeld
        </h3>
        {allCompetencyTypes.length > 0 ? (
          <div className="h-80">
            <Bar 
              data={competencyTypesByFieldData} 
              options={chartOptions}
            />
          </div>
        ) : (
          <div className="text-center text-gray-500 py-6">
            Keine Daten verfügbar
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 border border-blue-200 col-span-1 md:col-span-2">
        <h3 className="font-semibold text-lg mb-3 flex items-center text-blue-800">
          <Brain className="w-5 h-5 mr-2" />
          Lernzielbereiche nach Lernfeld
        </h3>
        {allLernzielbereiche.length > 0 ? (
          <div className="h-80">
            <Bar 
              data={lernzielbereicheByFieldData} 
              options={chartOptions}
            />
          </div>
        ) : (
          <div className="text-center text-gray-500 py-6">
            Keine Daten zur Verteilung der Lernzielbereiche verfügbar
          </div>
        )}
      </div>
      
      {/* Separate taxonomy levels by learning area */}
      {taxonomyChartsByLernzielbereich.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 border border-blue-200 col-span-1 md:col-span-2">
          <h3 className="font-semibold text-lg mb-3 flex items-center text-blue-800">
            <FileText className="w-5 h-5 mr-2" />
            Taxonomiestufen nach Lernzielbereich
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {taxonomyChartsByLernzielbereich.map((chart, index) => (
              <div key={index} className="border rounded-lg p-3 bg-gray-50">
                <h4 className="font-medium mb-3 text-center">
                  Lernzielbereich: {chart.lernzielbereich}
                </h4>
                <div className="h-60">
                  <Bar 
                    data={chart.data} 
                    options={horizontalBarOptions}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}