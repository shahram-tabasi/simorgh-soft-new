import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, UploadIcon, TrashIcon, CopyIcon, ArrowUpIcon, ArrowDownIcon, MaximizeIcon, MinimizeIcon, ChevronDownIcon, ChevronRightIcon, XIcon } from 'lucide-react';
import { ProjectData, Equipment, DeviceTableRow } from '../../types/project';

// ===== PROPS INTERFACES =====
interface DeviceTableProps {
  selectedEquipment: Equipment | null;
  updateEquipment: (id: string, data: Partial<Equipment>) => void;
  projectData: ProjectData;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

interface EquipmentTreeProps {
  projectData: ProjectData;
  addEquipment: (equipment: Equipment) => void;
  deleteEquipment: (id: string) => void;
  copyEquipment: (id: string) => void;
  selectedEquipment: Equipment | null;
  setSelectedEquipment: (equipment: Equipment | null) => void;
}

interface DeviceSelectionTabProps {
  projectData: ProjectData;
  selectedEquipment: Equipment | null;
  setSelectedEquipment: (equipment: Equipment | null) => void;
  updateEquipment: (id: string, data: Partial<Equipment>) => void;
  addEquipment: (equipment: Equipment) => void;
  deleteEquipment: (id: string) => void;
  copyEquipment: (id: string) => void;
  onNext: () => void;
}

// ===== DEVICE TABLE COMPONENT =====
const DeviceTable: React.FC<DeviceTableProps> = ({ 
  selectedEquipment, 
  updateEquipment, 
  projectData,
  isFullscreen,
  onToggleFullscreen
}) => {
  const [rows, setRows] = useState<DeviceTableRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ 
    visible: boolean; 
    x: number; 
    y: number; 
    type: 'row' | 'cell' | null; 
    cellRowId?: string 
  } | null>(null);
  const [moveToRow, setMoveToRow] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCellRowId, setSelectedCellRowId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedEquipment) {
      setRows(selectedEquipment.devices || []);
    } else {
      setRows([]);
    }
  }, [selectedEquipment]);

  useEffect(() => {
    if (selectedEquipment && rows.length > 0) {
      updateEquipment(selectedEquipment.id, { devices: rows });
    }
  }, [rows, selectedEquipment, updateEquipment]);

  const handleRowClick = (id: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const newSelected = new Set(selectedRows);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedRows(newSelected);
    } else {
      setSelectedRows(new Set([id]));
    }
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'row' | 'cell', rowId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (type === 'row' && selectedRows.size > 0) {
      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type: 'row' });
    } else if (type === 'cell' && rowId) {
      setSelectedCellRowId(rowId);
      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type: 'cell', cellRowId: rowId });
    }
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
    setMoveToRow('');
  };

  useEffect(() => {
    const handleClickOutside = () => handleCloseContextMenu();
    if (contextMenu?.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const reorderRows = (newRows: DeviceTableRow[]) => {
    const reordered = newRows.map((row, index) => ({
      ...row,
      rowNumber: index + 1
    }));
    setRows(reordered);
  };

  const handleMoveRows = (direction: 'up' | 'down') => {
    const selectedIds = Array.from(selectedRows);
    const indices = selectedIds.map(id => rows.findIndex(r => r.id === id)).sort((a, b) => a - b);
    
    if (direction === 'up' && indices[0] > 0) {
      const newRows = [...rows];
      indices.forEach(idx => {
        [newRows[idx], newRows[idx - 1]] = [newRows[idx - 1], newRows[idx]];
      });
      reorderRows(newRows);
    } else if (direction === 'down' && indices[indices.length - 1] < rows.length - 1) {
      const newRows = [...rows];
      indices.reverse().forEach(idx => {
        [newRows[idx], newRows[idx + 1]] = [newRows[idx + 1], newRows[idx]];
      });
      reorderRows(newRows);
    }
    handleCloseContextMenu();
  };

  const handleMoveToRow = () => {
    const targetRowNum = parseInt(moveToRow);
    if (!targetRowNum || targetRowNum < 1 || targetRowNum > rows.length) {
      alert('Invalid row number');
      return;
    }

    const selectedIds = Array.from(selectedRows);
    const selectedRowsData = rows.filter(r => selectedIds.includes(r.id));
    const otherRows = rows.filter(r => !selectedIds.includes(r.id));
    
    const targetIndex = targetRowNum - 1;
    const newRows = [
      ...otherRows.slice(0, targetIndex),
      ...selectedRowsData,
      ...otherRows.slice(targetIndex)
    ];
    
    reorderRows(newRows);
    handleCloseContextMenu();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, rowId: string) => {
    e.preventDefault();
    const templateId = e.dataTransfer.getData('templateId');
    
    if (!selectedEquipment) return;
    
    let templateName = '';
    let templateType: 'LV' | 'MV' | 'HV' | null = null;
    
    for (const type of ['LV', 'MV', 'HV'] as const) {
      const template = projectData.templates[type].find(t => t.id === templateId);
      if (template) {
        templateName = template.name;
        templateType = type;
        break;
      }
    }
    
    if (templateType && templateType !== selectedEquipment.type) {
      alert(`Cannot add ${templateType} template to ${selectedEquipment.type} equipment!`);
      return;
    }
    
    setRows(rows.map(row => 
      row.id === rowId ? { ...row, templateId, templateName } : row
    ));
  };

  const handleAddTemplateToCell = (templateId: string) => {
    if (!selectedCellRowId || !selectedEquipment) return;
    
    let templateName = '';
    let templateType: 'LV' | 'MV' | 'HV' | null = null;
    
    for (const type of ['LV', 'MV', 'HV'] as const) {
      const template = projectData.templates[type].find(t => t.id === templateId);
      if (template) {
        templateName = template.name;
        templateType = type;
        break;
      }
    }
    
    if (templateType && templateType !== selectedEquipment.type) {
      alert(`Cannot add ${templateType} template to ${selectedEquipment.type} equipment!`);
      return;
    }
    
    setRows(rows.map(row => 
      row.id === selectedCellRowId ? { ...row, templateId, templateName } : row
    ));
    
    handleCloseContextMenu();
    setSelectedCellRowId(null);
  };

  const handleAddRow = () => {
    if (!selectedEquipment) {
      alert('Please select an equipment first!');
      return;
    }

    const newRow: DeviceTableRow = {
      id: `device-${Date.now()}`,
      rowNumber: rows.length + 1,
      templateId: '',
      templateName: '',
      busSection: '',
      feederNo: '',
      wiringType: '',
      ratingPower: '',
      flc: '',
      equipmentId: selectedEquipment.id
    };
    setRows([...rows, newRow]);
  };

  const handleImportExcel = () => {
    if (!selectedEquipment) {
      alert('Please select an equipment first!');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const dataRows = lines.slice(1);
      
      const importedRows: DeviceTableRow[] = dataRows
        .filter(line => line.trim())
        .map((line, index) => {
          const cells = line.split(/[,\t]/).map(cell => cell.trim().replace(/^"|"$/g, ''));
          
          return {
            id: `device-${Date.now()}-${index}`,
            rowNumber: rows.length + index + 1,
            templateId: '',
            templateName: cells[0] || '',
            busSection: cells[1] || '',
            feederNo: cells[2] || '',
            wiringType: cells[3] || '',
            ratingPower: cells[4] || '',
            flc: cells[5] || '',
            equipmentId: selectedEquipment!.id
          };
        });

      setRows([...rows, ...importedRows]);
      alert(`Successfully imported ${importedRows.length} rows!`);
    } catch (error) {
      alert('Error importing file. Expected format: Template, Bus Section, Feeder No, Wiring Type, Rating Power, FLC');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateRowField = (rowId: string, field: keyof DeviceTableRow, value: string) => {
    setRows(rows.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    ));
  };

  if (!selectedEquipment) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded">
        <div className="text-center">
          <p className="text-gray-500">No Equipment Selected</p>
          <p className="text-sm text-gray-400 mt-2">Select equipment to manage devices</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
      
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Device Table: {selectedEquipment.name}</h3>
          <p className="text-xs text-gray-500">Type: <span className="font-semibold">{selectedEquipment.type}</span> | Power: {selectedEquipment.power || 'N/A'}</p>
        </div>
        <div className="flex space-x-2">
          <button 
            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700" 
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <MinimizeIcon className="w-4 h-4 inline mr-1" /> : <MaximizeIcon className="w-4 h-4 inline mr-1" />}
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
          <button 
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700" 
            onClick={handleAddRow}
          >
            <PlusIcon className="w-4 h-4 inline mr-1" />
            Add Row
          </button>
          <button 
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700" 
            onClick={handleImportExcel}
          >
            <UploadIcon className="w-4 h-4 inline mr-1" />
            Import CSV
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded overflow-hidden" onContextMenu={(e) => handleContextMenu(e, 'row')}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left font-medium text-gray-600 border-b w-12">#</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Template</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Bus Section</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Feeder No</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Wiring Type</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Rating Power</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">FLC (A)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.id}
                className={`cursor-pointer ${selectedRows.has(row.id) ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                onClick={(e) => handleRowClick(row.id, e)}
              >
                <td className="px-4 py-2 border-b text-center font-medium bg-gray-50">
                  {row.rowNumber}
                </td>
                <td 
                  className="px-4 py-2 border-b" 
                  onDragOver={handleDragOver} 
                  onDrop={e => handleDrop(e, row.id)}
                  onContextMenu={(e) => handleContextMenu(e, 'cell', row.id)}
                >
                  <div className={`px-2 py-1 rounded text-sm ${!row.templateName ? 'bg-gray-100 border border-dashed text-gray-400' : 'bg-blue-50 border border-blue-200'}`}>
                    {row.templateName || 'Drop here or right-click'}
                  </div>
                </td>
                <td className="px-4 py-2 border-b">
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm" 
                    value={row.busSection} 
                    onChange={e => updateRowField(row.id, 'busSection', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2 border-b">
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm" 
                    value={row.feederNo} 
                    onChange={e => updateRowField(row.id, 'feederNo', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2 border-b">
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm" 
                    value={row.wiringType} 
                    onChange={e => updateRowField(row.id, 'wiringType', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2 border-b">
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm" 
                    value={row.ratingPower} 
                    onChange={e => updateRowField(row.id, 'ratingPower', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2 border-b">
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm" 
                    value={row.flc} 
                    onChange={e => updateRowField(row.id, 'flc', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {rows.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No devices. Click "Add Row" or "Import CSV".
          </div>
        )}
      </div>

      {contextMenu?.visible && contextMenu.type === 'row' && (
        <div
          className="fixed z-50 w-64 bg-white border shadow-lg rounded py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100" 
            onClick={() => handleMoveRows('up')}
          >
            <ArrowUpIcon className="w-4 h-4 inline mr-2" />
            Move Up
          </button>
          <button 
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100" 
            onClick={() => handleMoveRows('down')}
          >
            <ArrowDownIcon className="w-4 h-4 inline mr-2" />
            Move Down
          </button>
          <div className="border-t my-1"></div>
          <div className="px-4 py-2">
            <input
              type="number"
              min="1"
              className="w-full border rounded px-2 py-1 text-sm"
              value={moveToRow}
              onChange={(e) => setMoveToRow(e.target.value)}
              placeholder="Move to row #"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="w-full mt-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              onClick={handleMoveToRow}
            >
              Move
            </button>
          </div>
          <div className="border-t my-1"></div>
          <button 
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-600" 
            onClick={handleCloseContextMenu}
          >
            Cancel
          </button>
        </div>
      )}

      {contextMenu?.visible && contextMenu.type === 'cell' && selectedEquipment && (
        <div
          className="fixed z-50 w-64 bg-white border shadow-lg rounded py-1 max-h-96 overflow-y-auto"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 border-b bg-gray-50">
            <p className="text-xs font-semibold text-gray-600">Add Template ({selectedEquipment.type})</p>
          </div>
          {projectData.templates[selectedEquipment.type].length > 0 ? (
            projectData.templates[selectedEquipment.type].map(template => (
              <button
                key={template.id}
                className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50"
                onClick={() => handleAddTemplateToCell(template.id)}
              >
                {template.name}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 italic">
              No {selectedEquipment.type} templates available
            </div>
          )}
          <div className="border-t my-1"></div>
          <button 
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-600" 
            onClick={handleCloseContextMenu}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

// ===== EQUIPMENT TREE COMPONENT =====
const EquipmentTree: React.FC<EquipmentTreeProps> = ({ 
  projectData, 
  addEquipment, 
  deleteEquipment, 
  copyEquipment, 
  selectedEquipment, 
  setSelectedEquipment 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'LV' | 'MV' | 'HV'>('LV');
  const [contextMenu, setContextMenu] = useState<{ 
    visible: boolean; 
    x: number; 
    y: number; 
    equipment: Equipment | null 
  }>({ 
    visible: false, 
    x: 0, 
    y: 0, 
    equipment: null 
  });
  const [expandedEquipment, setExpandedEquipment] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, equipment: null });
      }
    };
    
    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.visible]);

  const handleCreate = () => {
    if (newName.trim()) {
      addEquipment({
        id: `eq-${Date.now()}`,
        name: newName,
        power: '',
        type: newType,
        properties: {},
        devices: []
      });
      setNewName('');
      setNewType('LV');
      setShowAddModal(false);
    }
  };

  const toggleExpand = (equipmentId: string) => {
    const newExpanded = new Set(expandedEquipment);
    if (newExpanded.has(equipmentId)) {
      newExpanded.delete(equipmentId);
    } else {
      newExpanded.add(equipmentId);
    }
    setExpandedEquipment(newExpanded);
  };

  const getTypeColor = (type: 'LV' | 'MV' | 'HV') => {
    switch (type) {
      case 'LV': return 'text-green-600 bg-green-50';
      case 'MV': return 'text-orange-600 bg-orange-50';
      case 'HV': return 'text-red-600 bg-red-50';
    }
  };

  return (
    <div className="h-full p-4 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-sm">Equipment</h3>
        <button
          className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
          onClick={() => setShowAddModal(true)}
        >
          <PlusIcon className="w-3 h-3 inline mr-1" />
          Add
        </button>
      </div>

      <div className="space-y-1">
        {/* نمایش نام پروژه در بالا */}
        <div className="p-2 bg-blue-100 border-2 border-blue-300 rounded font-semibold text-sm">
          <div className="flex items-center">
            <span className="text-blue-800">📋 {projectData.projectName}</span>
          </div>
        </div>

        {projectData.equipments.map(eq => {
          const isExpanded = expandedEquipment.has(eq.id);
          const hasDevices = eq.devices && eq.devices.length > 0;
          
          return (
            <div key={eq.id} className="ml-4">
              <div
                className={`p-2 bg-white border rounded cursor-pointer ${
                  selectedEquipment?.id === eq.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedEquipment(eq)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenu({ visible: true, x: e.clientX, y: e.clientY, equipment: eq });
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    {hasDevices && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(eq.id);
                        }}
                        className="mr-1"
                      >
                        {isExpanded ? (
                          <ChevronDownIcon className="w-4 h-4" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <div className="text-sm font-medium">{eq.name}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${getTypeColor(eq.type)}`}>
                    {eq.type}
                  </span>
                </div>
                {eq.power && <div className="text-xs text-gray-500 mt-1 ml-5">{eq.power}</div>}
                {hasDevices && (
                  <div className="text-xs text-gray-400 mt-1 ml-5">{eq.devices.length} device(s)</div>
                )}
              </div>

              {/* نمایش دستگاه‌ها (devices) زیر Equipment */}
              {isExpanded && hasDevices && (
                <div className="ml-6 mt-1 space-y-1">
                  {eq.devices.map((device, idx) => (
                    <div 
                      key={device.id} 
                      className="p-2 bg-gray-50 border border-gray-200 rounded text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">
                          {idx + 1}. {device.templateName || 'No Template'}
                        </span>
                        <span className="text-gray-500">{device.flc ? `${device.flc}A` : ''}</span>
                      </div>
                      {device.busSection && (
                        <div className="text-gray-500 mt-1">Bus: {device.busSection}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {projectData.equipments.length === 0 && (
          <div className="text-center text-gray-400 text-xs py-8">
            No equipment
          </div>
        )}
      </div>

      {contextMenu.visible && contextMenu.equipment && (
        <div
          className="fixed z-50 w-48 bg-white border shadow-lg rounded py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100" 
            onClick={() => {
              copyEquipment(contextMenu.equipment!.id);
              setContextMenu({ visible: false, x: 0, y: 0, equipment: null });
            }}
          >
            <CopyIcon className="w-4 h-4 inline mr-2" />
            Copy
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
            onClick={() => {
              if (confirm('Delete this equipment?')) {
                deleteEquipment(contextMenu.equipment!.id);
              }
              setContextMenu({ visible: false, x: 0, y: 0, equipment: null });
            }}
          >
            <TrashIcon className="w-4 h-4 inline mr-2" />
            Delete
          </button>
          <div className="border-t my-1"></div>
          <button 
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-600" 
            onClick={() => setContextMenu({ visible: false, x: 0, y: 0, equipment: null })}
          >
            <XIcon className="w-4 h-4 inline mr-2" />
            Cancel
          </button>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-96">
            <h3 className="font-semibold mb-4">Add Equipment</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Type</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as 'LV' | 'MV' | 'HV')}
                >
                  <option value="LV">LV (Low Voltage)</option>
                  <option value="MV">MV (Medium Voltage)</option>
                  <option value="HV">HV (High Voltage)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Equipment name"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button 
                className="px-4 py-2 border rounded text-sm" 
                onClick={() => {
                  setShowAddModal(false);
                  setNewName('');
                  setNewType('LV');
                }}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm" 
                onClick={handleCreate}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== DEVICE SELECTION TAB (MAIN COMPONENT) =====
const DeviceSelectionTab: React.FC<DeviceSelectionTabProps> = ({ 
  projectData,
  selectedEquipment,
  setSelectedEquipment,
  updateEquipment,
  addEquipment,
  deleteEquipment,
  copyEquipment,
  onNext 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Device Specifications - Fullscreen</h2>
            <button
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center"
              onClick={handleToggleFullscreen}
            >
              <MinimizeIcon className="w-4 h-4 mr-2" />
              Exit Fullscreen
            </button>
          </div>
          
          <DeviceTable 
            selectedEquipment={selectedEquipment}
            updateEquipment={updateEquipment}
            projectData={projectData}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Device Selection - {projectData.projectName}</h2>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="border rounded">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h3 className="font-medium">Templates</h3>
          </div>
          <div className="p-2 max-h-96 overflow-y-auto">
            {(['LV', 'MV', 'HV'] as const).map(type => (
              <div key={type} className="mb-3">
                <div className="text-xs font-semibold text-gray-600 mb-1">{type}</div>
                {projectData.templates[type].map(template => (
                  <div
                    key={template.id}
                    className="p-2 text-sm bg-white border rounded mb-1 cursor-move hover:bg-blue-50"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('templateId', template.id)}
                  >
                    {template.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 border rounded">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h3 className="font-medium">Device Specifications</h3>
          </div>
          <div className="p-4">
            <DeviceTable 
              selectedEquipment={selectedEquipment}
              updateEquipment={updateEquipment}
              projectData={projectData}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
            />
          </div>
        </div>

        <div className="border rounded">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h3 className="font-medium">Equipment Tree</h3>
          </div>
          <EquipmentTree 
            projectData={projectData}
            addEquipment={addEquipment}
            deleteEquipment={deleteEquipment}
            copyEquipment={copyEquipment}
            selectedEquipment={selectedEquipment}
            setSelectedEquipment={setSelectedEquipment}
          />
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button 
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" 
          onClick={onNext}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default DeviceSelectionTab;