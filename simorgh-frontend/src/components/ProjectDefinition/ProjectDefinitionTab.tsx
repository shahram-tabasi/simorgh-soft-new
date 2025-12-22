import React from 'react';
import { useProject } from '../../context/ProjectContext';

interface ProjectDefinitionTabProps {
  onComplete: () => void;
}

export const ProjectDefinitionTab: React.FC<ProjectDefinitionTabProps> = ({
  onComplete
}) => {
  const {
    projectData,
    updateProjectData,
    saveProject
  } = useProject();

  const handleInputChange = (section: string, field: string, value: string) => {
    if (section === 'main') {
      updateProjectData({
        [field]: value
      });
    } else if (section === 'mediumVoltage' || section === 'lowVoltage') {
      updateProjectData({
        technicalSettings: {
          ...projectData.technicalSettings,
          [section]: {
            ...projectData.technicalSettings[section === 'mediumVoltage' ? 'mediumVoltage' : 'lowVoltage'],
            [field]: value
          }
        }
      });
    }
  };

  const handleCheckboxChange = (section: string, field: string, checked: boolean) => {
    if (section === 'lowVoltage' && field === 'enableReducedCrossSection') {
      updateProjectData({
        technicalSettings: {
          ...projectData.technicalSettings,
          lowVoltage: {
            ...projectData.technicalSettings.lowVoltage,
            enableReducedCrossSection: checked
          }
        }
      });
    }
  };

  const handleSave = async () => {
    try {
      await saveProject();
      alert('Project saved successfully!');
    } catch (error) {
      alert('Error saving project');
      console.error('Save error:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="border border-gray-200 rounded-md p-4">
          <h2 className="text-lg font-semibold mb-4">Master data</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-sm">Project name:</label>
              <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm" value={projectData.projectName} onChange={e => handleInputChange('main', 'projectName', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-sm">Project description:</label>
              <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm" value={projectData.projectDescription} onChange={e => handleInputChange('main', 'projectDescription', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-sm">Planner:</label>
              <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm" value={projectData.planner} onChange={e => handleInputChange('main', 'planner', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-sm">Design office:</label>
              <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm" value={projectData.designOffice} onChange={e => handleInputChange('main', 'designOffice', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-sm">Created on:</label>
              <div className="col-span-2 text-sm">{projectData.createdOn}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-sm">Changed on:</label>
              <div className="col-span-2 text-sm">{projectData.changedOn}</div>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 rounded-md p-4">
          <h2 className="text-lg font-semibold mb-4">Client data</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-sm">Location:</label>
              <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm" value={projectData.location} onChange={e => handleInputChange('main', 'location', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-sm">Client:</label>
              <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm" value={projectData.client} onChange={e => handleInputChange('main', 'client', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="border border-gray-200 rounded-md p-4">
          <h2 className="text-lg font-semibold mb-4">Regional settings</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-sm">Standard:</label>
              <select className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm" value={projectData.standard} onChange={e => handleInputChange('main', 'standard', e.target.value)}>
                <option value="IEC">IEC</option>
                <option value="ANSI">ANSI</option>
                <option value="GB">GB</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-sm">Country:</label>
              <select className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm" value={projectData.country} onChange={e => handleInputChange('main', 'country', e.target.value)}>
                <option value="iranin">iranin</option>
                <option value="United States">United States</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="China">China</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-sm">Language:</label>
              <select className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm" value={projectData.language} onChange={e => handleInputChange('main', 'language', e.target.value)}>
                <option value="persian">persian</option>
                <option value="English">English</option>
              </select>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 rounded-md p-4">
          <h2 className="text-lg font-semibold mb-4">Comment</h2>
          <textarea className="w-full border border-gray-300 rounded px-2 py-1 text-sm" rows={5} value={projectData.comment} onChange={e => handleInputChange('main', 'comment', e.target.value)} />
        </div>
      </div>
      <div className="space-y-6">
        <div className="border border-gray-200 rounded-md p-4">
          <h2 className="text-lg font-semibold mb-4">Technical settings</h2>
          <div className="mb-6">
            <h3 className="font-medium mb-3">Medium voltage</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm">Nominal voltage [kV]:</label>
                <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm" value={projectData.technicalSettings.mediumVoltage.nominalVoltage} onChange={e => handleInputChange('mediumVoltage', 'nominalVoltage', e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm">
                  Max. short-circuit power [MVA]:
                </label>
                <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm" value={projectData.technicalSettings.mediumVoltage.maxShortCircuitPower} onChange={e => handleInputChange('mediumVoltage', 'maxShortCircuitPower', e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm">
                  Min. short-circuit power [MVA]:
                </label>
                <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm" value={projectData.technicalSettings.mediumVoltage.minShortCircuitPower} onChange={e => handleInputChange('mediumVoltage', 'minShortCircuitPower', e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm">Max. cross section [mm²]:</label>
                <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100" value={projectData.technicalSettings.mediumVoltage.maxCrossSection} onChange={e => handleInputChange('mediumVoltage', 'maxCrossSection', e.target.value)} readOnly />
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm">Min. cross section [mm²]:</label>
                <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100" value={projectData.technicalSettings.mediumVoltage.minCrossSection} onChange={e => handleInputChange('mediumVoltage', 'minCrossSection', e.target.value)} readOnly />
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-3">Low voltage</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm">Nominal voltage [V]:</label>
                <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm" value={projectData.technicalSettings.lowVoltage.nominalVoltage} onChange={e => handleInputChange('lowVoltage', 'nominalVoltage', e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm">Frequency [Hz]:</label>
                <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100" value={projectData.technicalSettings.lowVoltage.frequency} onChange={e => handleInputChange('lowVoltage', 'frequency', e.target.value)} readOnly />
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm">
                  Permissible touch voltage [V]:
                </label>
                <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100" value={projectData.technicalSettings.lowVoltage.permissibleTouchVoltage} onChange={e => handleInputChange('lowVoltage', 'permissibleTouchVoltage', e.target.value)} readOnly />
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm">
                  Ambient temperature of device [°C]:
                </label>
                <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm" value={projectData.technicalSettings.lowVoltage.ambientTemperature} onChange={e => handleInputChange('lowVoltage', 'ambientTemperature', e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm">Number of poles:</label>
                <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100" value={projectData.technicalSettings.lowVoltage.numberOfPoles} onChange={e => handleInputChange('lowVoltage', 'numberOfPoles', e.target.value)} readOnly />
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm">Earth fault detection:</label>
                <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100" value={projectData.technicalSettings.lowVoltage.earthFaultDetection} onChange={e => handleInputChange('lowVoltage', 'earthFaultDetection', e.target.value)} readOnly />
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm">
                  Reference point for voltage drop calculation:
                </label>
                <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100" value={projectData.technicalSettings.lowVoltage.referencePoint} onChange={e => handleInputChange('lowVoltage', 'referencePoint', e.target.value)} readOnly />
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm">
                  Relative operating voltage at reference point [%]:
                </label>
                <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm" value={projectData.technicalSettings.lowVoltage.relativeOperatingVoltage} onChange={e => handleInputChange('lowVoltage', 'relativeOperatingVoltage', e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm">
                  Max. permissible voltage drop in network [%]:
                </label>
                <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm" value={projectData.technicalSettings.lowVoltage.maxPermissibleVoltage} onChange={e => handleInputChange('lowVoltage', 'maxPermissibleVoltage', e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm">Max. cross section [mm²]:</label>
                <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100" value={projectData.technicalSettings.lowVoltage.maxCrossSection} onChange={e => handleInputChange('lowVoltage', 'maxCrossSection', e.target.value)} readOnly />
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm">Min. cross section [mm²]:</label>
                <input type="text" className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100" value={projectData.technicalSettings.lowVoltage.minCrossSection} onChange={e => handleInputChange('lowVoltage', 'minCrossSection', e.target.value)} readOnly />
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm">
                  Enable reduced cross-section of PEN-conductors:
                </label>
                <div className="col-span-2">
                  <input type="checkbox" checked={projectData.technicalSettings.lowVoltage.enableReducedCrossSection} onChange={e => handleCheckboxChange('lowVoltage', 'enableReducedCrossSection', e.target.checked)} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={handleSave}
          >
            Save Project
          </button>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={onComplete}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};