import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { TemplateTree } from './TemplateTree';
import { TemplateProperties } from './TemplateProperties';

interface TemplateCreationTabProps {
  onComplete: () => void;
  initialSelectedTemplate?: string | null;
}

export const TemplateCreationTab: React.FC<TemplateCreationTabProps> = ({
  onComplete,
  initialSelectedTemplate
}) => {
  const {
    projectData
  } = useProject();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(initialSelectedTemplate ?? null);

  // When initialSelectedTemplate changes (e.g. navigated from Device Selection), select that template
  React.useEffect(() => {
    if (initialSelectedTemplate) {
      setSelectedTemplate(initialSelectedTemplate);
    }
  }, [initialSelectedTemplate]);

  // 🔹 بررسی امن برای projectData
  if (!projectData) {
    return (
      <div className="flex flex-col h-full">
        <h2 className="text-xl font-semibold mb-4">Create Template</h2>
        <div className="flex items-center justify-center h-48 text-gray-500">
          <p>Project data is not available. Please check your project configuration.</p>
        </div>
      </div>
    );
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const getSelectedTemplateData = () => {
    if (!selectedTemplate) return null;
    
    // 🔹 بررسی امن برای templates
    const templates = projectData.templates || {};
    
    for (const type of ['LV', 'MV', 'HV'] as const) {
      const templateList = templates[type] || [];
      const template = templateList.find(t => t.id === selectedTemplate);
      if (template) return template;
    }
    return null;
  };

  const selectedTemplateData = getSelectedTemplateData();

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-4">Create Template</h2>
      <div className="flex flex-grow border border-gray-200 rounded-md overflow-hidden">
        <div className="w-1/4 border-r border-gray-200 overflow-y-auto">
          <TemplateTree 
            projectData={projectData} 
            onTemplateSelect={handleTemplateSelect} 
            selectedTemplateId={selectedTemplate} 
          />
        </div>
        <div className="w-3/4 p-4 overflow-y-auto">
          {selectedTemplateData ? (
            <TemplateProperties template={selectedTemplateData} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Select a template from the tree or create a new one</p>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" 
          onClick={onComplete}
        >
          Next
        </button>
      </div>
    </div>
  );
};