import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { PlusIcon, Trash2Icon, FileTextIcon, FileSpreadsheetIcon, FileIcon, ImageIcon } from 'lucide-react';
import { OutputType } from '../../types/project';

export const OutputTypesTab: React.FC = () => {
  const { projectData, updateProjectData } = useProject();
  const [outputTypes, setOutputTypes] = useState<OutputType[]>(
    projectData.outputTypes || [
      { id: '1', name: 'Single Line Diagram', format: 'PDF', template: 'SLD-01', enabled: true },
      { id: '2', name: 'Cable Schedule', format: 'Excel', template: 'CS-01', enabled: true },
      { id: '3', name: 'Load List', format: 'Excel', template: 'LL-01', enabled: false },
      { id: '4', name: 'Technical Report', format: 'Word', template: 'TR-01', enabled: false },
      { id: '5', name: 'CAD Drawing', format: 'DWG', template: 'CAD-01', enabled: false },
    ]
  );

  const handleAddOutput = () => {
    const newOutput: OutputType = {
      id: `output-${Date.now()}`,
      name: `New Output ${outputTypes.length + 1}`,
      format: 'PDF',
      template: 'TEMPLATE-01',
      enabled: true
    };
    const updated = [...outputTypes, newOutput];
    setOutputTypes(updated);
    updateProjectData({ outputTypes: updated });
  };

  const handleDeleteOutput = (id: string) => {
    const updated = outputTypes.filter(o => o.id !== id);
    setOutputTypes(updated);
    updateProjectData({ outputTypes: updated });
  };

  const handleUpdateOutput = (id: string, field: keyof OutputType, value: any) => {
    const updated = outputTypes.map(output =>
      output.id === id ? { ...output, [field]: value } : output
    );
    setOutputTypes(updated);
    updateProjectData({ outputTypes: updated });
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'PDF':
        return <FileTextIcon className="w-5 h-5 text-red-600" />;
      case 'Excel':
        return <FileSpreadsheetIcon className="w-5 h-5 text-green-600" />;
      case 'Word':
        return <FileIcon className="w-5 h-5 text-blue-600" />;
      case 'DWG':
        return <ImageIcon className="w-5 h-5 text-purple-600" />;
      default:
        return <FileTextIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Output Types Configuration</h2>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm flex items-center hover:bg-blue-700"
          onClick={handleAddOutput}
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          Add Output Type
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
        <h3 className="font-medium text-blue-900 mb-2">📋 Output Types Guide</h3>
        <p className="text-sm text-blue-800">
          Configure the types of outputs/reports you want to generate from your project data.
          Enable/disable outputs, select formats, and assign templates for each type.
        </p>
      </div>

      <div className="border border-gray-200 rounded-md overflow-hidden flex-1">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b w-12">
                Enabled
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">
                Output Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b w-32">
                Format
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">
                Template
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 border-b w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {outputTypes.map((output, index) => (
              <tr key={output.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-sm border-b">
                  <input
                    type="checkbox"
                    checked={output.enabled}
                    onChange={(e) => handleUpdateOutput(output.id, 'enabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3 text-sm border-b">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    value={output.name}
                    onChange={(e) => handleUpdateOutput(output.id, 'name', e.target.value)}
                  />
                </td>
                <td className="px-4 py-3 text-sm border-b">
                  <div className="flex items-center">
                    {getFormatIcon(output.format)}
                    <select
                      className="ml-2 border border-gray-300 rounded px-2 py-1 text-sm"
                      value={output.format}
                      onChange={(e) => handleUpdateOutput(output.id, 'format', e.target.value as any)}
                    >
                      <option value="PDF">PDF</option>
                      <option value="Excel">Excel</option>
                      <option value="Word">Word</option>
                      <option value="DWG">DWG</option>
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm border-b">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    value={output.template}
                    onChange={(e) => handleUpdateOutput(output.id, 'template', e.target.value)}
                  />
                </td>
                <td className="px-4 py-3 text-sm border-b text-center">
                  <button
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    onClick={() => handleDeleteOutput(output.id)}
                    title="Delete"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-md p-4">
          <h3 className="font-medium mb-2">📊 Statistics</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Outputs:</span>
              <span className="font-medium">{outputTypes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Enabled:</span>
              <span className="font-medium text-green-600">
                {outputTypes.filter(o => o.enabled).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Disabled:</span>
              <span className="font-medium text-red-600">
                {outputTypes.filter(o => !o.enabled).length}
              </span>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-md p-4">
          <h3 className="font-medium mb-2">📝 Format Distribution</h3>
          <div className="space-y-2 text-sm">
            {['PDF', 'Excel', 'Word', 'DWG'].map(format => {
              const count = outputTypes.filter(o => o.format === format).length;
              return (
                <div key={format} className="flex justify-between">
                  <span className="text-gray-600">{format}:</span>
                  <span className="font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};