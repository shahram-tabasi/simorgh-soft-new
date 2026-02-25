import React, { useState, useRef } from 'react';
import { PlusIcon, UploadIcon, MoveIcon, Trash2Icon, ChevronDownIcon, ChevronRightIcon, Settings2Icon, XIcon } from 'lucide-react';
import { DeviceItem, DeviceRow } from '../../types/project';
import { PartSelectionDialog, SelectedPart } from '../shared/PartSelectionDialog';
import * as XLSX from 'xlsx';

interface DeviceTableProps {
  devices: DeviceItem[];
  onDevicesUpdate: (devices: DeviceItem[]) => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  deviceId: string | null;
  rowId: string | null;
}

// Properties panel for a single device row
const DEVICE_PROPERTIES = [
  'CB ORDER', 'CB. RATING (A)', 'CONTACTOR. ORDER', 'CONTACTOR. RATING (A)',
  'OVER LOAD RELAY', 'OVER LOAD RATING(A)', 'EARTH FAULT', 'COREBALANCE CT',
  'PROTECTION RELAY', 'CT RATING', 'AMMETER', 'AMMETER SELECTOR',
  'PT RATING', 'VOLTMETER', 'VOLTMETER SELECTOR'
];

interface DevicePropertiesModalProps {
  device: DeviceItem;
  onClose: () => void;
  onUpdate: (parts: DeviceItem['selectedParts']) => void;
}

const DevicePropertiesModal: React.FC<DevicePropertiesModalProps> = ({ device, onClose, onUpdate }) => {
  const [parts, setParts] = useState<NonNullable<DeviceItem['selectedParts']>>(
    device.selectedParts || []
  );
  const [partDialogOpen, setPartDialogOpen] = useState(false);
  const [activeProperty, setActiveProperty] = useState<string>('');

  const getPartsForProperty = (propName: string) =>
    parts.filter(p => p.propertyName === propName);

  const openAddPart = (propName: string) => {
    setActiveProperty(propName);
    setPartDialogOpen(true);
  };

  const handlePartSelected = (part: SelectedPart) => {
    const newEntry = { propertyName: activeProperty, part };
    const updated = [...parts, newEntry];
    setParts(updated);
    onUpdate(updated);
  };

  const removePart = (propName: string, partNumber: string) => {
    const updated = parts.filter(p => !(p.propertyName === propName && p.part.PartNumber === partNumber));
    setParts(updated);
    onUpdate(updated);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-lg shadow-xl w-[80%] max-h-[85%] flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Device Properties</h2>
              <p className="text-sm text-blue-100 mt-0.5">{device.deviceName}</p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-blue-700 rounded-full p-1">
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto p-4">
            <table className="w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left font-medium text-gray-600 border-b w-1/4">Property</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Parts</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600 border-b w-36">Action</th>
                </tr>
              </thead>
              <tbody>
                {DEVICE_PROPERTIES.map((prop) => {
                  const propParts = getPartsForProperty(prop);
                  return (
                    <tr key={prop} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-700 align-top">{prop}</td>
                      <td className="px-4 py-2 align-top">
                        {propParts.length > 0 ? (
                          <div className="space-y-1">
                            {propParts.map((entry, i) => (
                              <div key={i} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded px-2 py-1">
                                <span className="text-xs font-medium text-blue-800 truncate flex-1">
                                  📦 {entry.part.PartNumber}
                                </span>
                                {entry.part.Manufacturer && (
                                  <span className="text-xs text-gray-500">{entry.part.Manufacturer}</span>
                                )}
                                <button
                                  onClick={() => removePart(prop, entry.part.PartNumber)}
                                  className="text-red-400 hover:text-red-600 ml-1"
                                >
                                  <XIcon className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No part assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-2 align-top">
                        <button
                          onClick={() => openAddPart(prop)}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center gap-1"
                        >
                          <PlusIcon className="w-3 h-3" />
                          Add Part
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t bg-gray-50 flex justify-end">
            <button onClick={onClose}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              Close
            </button>
          </div>
        </div>
      </div>

      <PartSelectionDialog
        isOpen={partDialogOpen}
        onClose={() => setPartDialogOpen(false)}
        onSelect={handlePartSelected}
        title={`Select Part for: ${activeProperty}`}
        subtitle={device.deviceName}
      />
    </>
  );
};

export const DeviceTable: React.FC<DeviceTableProps> = ({ devices, onDevicesUpdate }) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, deviceId: null, rowId: null
  });
  const [moveToRowNumber, setMoveToRowNumber] = useState<string>('');
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [propertiesDevice, setPropertiesDevice] = useState<DeviceItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMoveRows = () => {
    const targetRow = parseInt(moveToRowNumber);
    if (isNaN(targetRow) || targetRow < 1) { alert('Please enter a valid row number'); return; }
    const newDevices = [...devices];
    const selectedDevices = newDevices.filter(d => selectedRows.has(d.id));
    const unselectedDevices = newDevices.filter(d => !selectedRows.has(d.id));
    const updatedDevices = unselectedDevices.slice(0, targetRow - 1)
      .concat(selectedDevices)
      .concat(unselectedDevices.slice(targetRow - 1));
    const reindexedDevices = updatedDevices.map((d, index) => ({ ...d, rowNumber: index + 1 }));
    onDevicesUpdate(reindexedDevices);
    setSelectedRows(new Set());
    setShowMoveDialog(false);
    setMoveToRowNumber('');
  };

  const handleAddRow = () => {
    const newDevice: DeviceItem = {
      id: `device-${Date.now()}`,
      rowNumber: devices.length + 1,
      templateId: '',
      deviceName: `Device ${devices.length + 1}`,
      flc: '', ratingPower: '', wiringType: '', feederNo: '', busSection: '',
      children: [],
      selectedParts: []
    };
    onDevicesUpdate([...devices, newDevice]);
  };

  const handleAddSubRow = (deviceId: string) => {
    const newDevices = devices.map(device => {
      if (device.id === deviceId) {
        const newSubRow: DeviceRow = {
          id: `row-${Date.now()}`,
          rowNumber: (device.children?.length || 0) + 1,
          deviceId,
          templateId: '',
          flc: '', ratingPower: '', wiringType: '', feederNo: '', busSection: ''
        };
        return { ...device, children: [...(device.children || []), newSubRow] };
      }
      return device;
    });
    onDevicesUpdate(newDevices);
  };

  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) return;
    onDevicesUpdate(devices.filter(d => !selectedRows.has(d.id)));
    setSelectedRows(new Set());
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
        const importedDevices: DeviceItem[] = jsonData.map((row, index) => ({
          id: `imported-${Date.now()}-${index}`,
          rowNumber: devices.length + index + 1,
          deviceName: row['Device Name'] || row['deviceName'] || `Imported Device ${index + 1}`,
          templateId: row['Template'] || row['templateId'] || '',
          busSection: row['Bus Section'] || row['busSection'] || '',
          feederNo: row['Feeder No'] || row['feederNo'] || '',
          wiringType: row['Wiring Type'] || row['wiringType'] || '',
          ratingPower: row['Rating Power'] || row['ratingPower'] || '',
          flc: row['FLC'] || row['flc'] || '',
          children: [],
          selectedParts: []
        }));
        onDevicesUpdate([...devices, ...importedDevices]);
        alert(`Successfully imported ${importedDevices.length} devices`);
      } catch (error) {
        console.error('Error importing Excel:', error);
        alert('Error importing Excel file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleContextMenu = (e: React.MouseEvent, deviceId: string, rowId?: string) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, deviceId, rowId: rowId || null });
  };

  const handleRowSelect = (deviceId: string, isCtrlPressed: boolean) => {
    if (isCtrlPressed) {
      const newSelected = new Set(selectedRows);
      if (newSelected.has(deviceId)) newSelected.delete(deviceId);
      else newSelected.add(deviceId);
      setSelectedRows(newSelected);
    } else {
      setSelectedRows(new Set([deviceId]));
    }
  };

  const toggleDeviceExpand = (deviceId: string) => {
    onDevicesUpdate(devices.map(d => d.id === deviceId ? { ...d, isExpanded: !d.isExpanded } : d));
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent, deviceId: string, rowId?: string) => {
    e.preventDefault();
    const templateId = e.dataTransfer.getData('templateId');
    if (rowId) {
      onDevicesUpdate(devices.map(d => d.id === deviceId ? {
        ...d,
        children: d.children?.map(c => c.id === rowId ? { ...c, templateId } : c)
      } : d));
    } else {
      onDevicesUpdate(devices.map(d => d.id === deviceId ? { ...d, templateId } : d));
    }
  };

  const updateDeviceField = (deviceId: string, field: keyof DeviceItem, value: any) => {
    onDevicesUpdate(devices.map(d => d.id === deviceId ? { ...d, [field]: value } : d));
  };

  const updateSubRowField = (deviceId: string, rowId: string, field: keyof DeviceRow, value: any) => {
    onDevicesUpdate(devices.map(d => {
      if (d.id !== deviceId) return d;
      return { ...d, children: d.children?.map(c => c.id === rowId ? { ...c, [field]: value } : c) };
    }));
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex space-x-2">
          <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm flex items-center" onClick={handleAddRow}>
            <PlusIcon className="w-4 h-4 mr-1" /> Add Device
          </button>
          <button className="px-3 py-1 bg-green-600 text-white rounded-md text-sm flex items-center" onClick={() => fileInputRef.current?.click()}>
            <UploadIcon className="w-4 h-4 mr-1" /> Import Excel
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
          <button className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm flex items-center"
            onClick={() => setShowMoveDialog(true)} disabled={selectedRows.size === 0}>
            <MoveIcon className="w-4 h-4 mr-1" /> Move Selected ({selectedRows.size})
          </button>
          <button className="px-3 py-1 bg-red-600 text-white rounded-md text-sm flex items-center"
            onClick={handleDeleteSelected} disabled={selectedRows.size === 0}>
            <Trash2Icon className="w-4 h-4 mr-1" /> Delete Selected
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-2 py-2 text-left text-sm font-medium text-gray-600 border-b w-8">#</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b">Device Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b">Template</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b">Bus Section</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b">Feeder No</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b">Wiring Type</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b">Rating Power</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b">FLC (A)</th>
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-600 border-b w-28">Properties</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <React.Fragment key={device.id}>
                {/* Main device row */}
                <tr
                  className={`${selectedRows.has(device.id) ? 'bg-blue-100' : 'hover:bg-gray-50'} cursor-pointer`}
                  onClick={(e) => handleRowSelect(device.id, e.ctrlKey || e.metaKey)}
                  onContextMenu={(e) => handleContextMenu(e, device.id)}
                >
                  <td className="px-2 py-2 text-sm border-b text-center font-medium">{device.rowNumber}</td>
                  <td className="px-4 py-2 text-sm border-b">
                    <div className="flex items-center">
                      <button onClick={(e) => { e.stopPropagation(); toggleDeviceExpand(device.id); }} className="mr-2">
                        {device.isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                      </button>
                      <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        value={device.deviceName}
                        onChange={(e) => updateDeviceField(device.id, 'deviceName', e.target.value)}
                        onClick={(e) => e.stopPropagation()} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm border-b" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, device.id)}>
                    <div className={`h-8 flex items-center ${!device.templateId ? 'bg-gray-100 border border-dashed border-gray-300 rounded' : 'bg-blue-50 border border-blue-200 rounded px-2'}`}>
                      {device.templateId || 'Drop template here'}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm border-b">
                    <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      value={device.busSection}
                      onChange={(e) => updateDeviceField(device.id, 'busSection', e.target.value)}
                      onClick={(e) => e.stopPropagation()} />
                  </td>
                  <td className="px-4 py-2 text-sm border-b">
                    <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      value={device.feederNo}
                      onChange={(e) => updateDeviceField(device.id, 'feederNo', e.target.value)}
                      onClick={(e) => e.stopPropagation()} />
                  </td>
                  <td className="px-4 py-2 text-sm border-b">
                    <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      value={device.wiringType}
                      onChange={(e) => updateDeviceField(device.id, 'wiringType', e.target.value)}
                      onClick={(e) => e.stopPropagation()} />
                  </td>
                  <td className="px-4 py-2 text-sm border-b">
                    <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      value={device.ratingPower}
                      onChange={(e) => updateDeviceField(device.id, 'ratingPower', e.target.value)}
                      onClick={(e) => e.stopPropagation()} />
                  </td>
                  <td className="px-4 py-2 text-sm border-b">
                    <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      value={device.flc}
                      onChange={(e) => updateDeviceField(device.id, 'flc', e.target.value)}
                      onClick={(e) => e.stopPropagation()} />
                  </td>
                  {/* Properties Column */}
                  <td className="px-2 py-2 text-sm border-b text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPropertiesDevice(device); }}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 border border-indigo-300 text-indigo-700 rounded hover:bg-indigo-100 text-xs"
                    >
                      <Settings2Icon className="w-3.5 h-3.5" />
                      Props
                      {(device.selectedParts?.length ?? 0) > 0 && (
                        <span className="bg-indigo-600 text-white rounded-full px-1.5 py-0.5 text-xs leading-none">
                          {device.selectedParts!.length}
                        </span>
                      )}
                    </button>
                  </td>
                </tr>

                {/* Sub-rows */}
                {device.isExpanded && device.children && device.children.map((row) => (
                  <tr key={row.id} className="bg-gray-50" onContextMenu={(e) => handleContextMenu(e, device.id, row.id)}>
                    <td className="px-2 py-2 text-sm border-b text-center text-gray-500">{device.rowNumber}.{row.rowNumber}</td>
                    <td className="px-4 py-2 text-sm border-b pl-12 text-gray-500">Sub-row {row.rowNumber}</td>
                    <td className="px-4 py-3 text-sm border-b" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, device.id, row.id)}>
                      <div className={`h-8 flex items-center ${!row.templateId ? 'bg-gray-100 border border-dashed border-gray-300 rounded' : 'bg-blue-50 border border-blue-200 rounded px-2'}`}>
                        {row.templateId || 'Drop template'}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm border-b">
                      <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                        value={row.busSection} onChange={(e) => updateSubRowField(device.id, row.id, 'busSection', e.target.value)} />
                    </td>
                    <td className="px-4 py-2 text-sm border-b">
                      <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                        value={row.feederNo} onChange={(e) => updateSubRowField(device.id, row.id, 'feederNo', e.target.value)} />
                    </td>
                    <td className="px-4 py-2 text-sm border-b">
                      <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                        value={row.wiringType} onChange={(e) => updateSubRowField(device.id, row.id, 'wiringType', e.target.value)} />
                    </td>
                    <td className="px-4 py-2 text-sm border-b">
                      <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                        value={row.ratingPower} onChange={(e) => updateSubRowField(device.id, row.id, 'ratingPower', e.target.value)} />
                    </td>
                    <td className="px-4 py-2 text-sm border-b">
                      <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                        value={row.flc} onChange={(e) => updateSubRowField(device.id, row.id, 'flc', e.target.value)} />
                    </td>
                    <td className="px-2 py-2 text-sm border-b text-center text-gray-400">—</td>
                  </tr>
                ))}

                {/* Add sub-row button */}
                {device.isExpanded && (
                  <tr>
                    <td colSpan={9} className="px-4 py-2 border-b">
                      <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center pl-8" onClick={() => handleAddSubRow(device.id)}>
                        <PlusIcon className="w-4 h-4 mr-1" /> Add Sub-row
                      </button>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div className="fixed z-50 w-48 bg-white border border-gray-200 shadow-lg rounded-md py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => { if (contextMenu.deviceId) handleAddSubRow(contextMenu.deviceId); setContextMenu({ ...contextMenu, visible: false }); }}>
            Add Sub-row
          </button>
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => { setShowMoveDialog(true); setContextMenu({ ...contextMenu, visible: false }); }}>
            Move Row
          </button>
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
            onClick={() => {
              if (contextMenu.deviceId && !contextMenu.rowId) onDevicesUpdate(devices.filter(d => d.id !== contextMenu.deviceId));
              setContextMenu({ ...contextMenu, visible: false });
            }}>
            Delete Row
          </button>
        </div>
      )}

      {/* Move Dialog */}
      {showMoveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-semibold mb-4">Move Rows</h3>
            <p className="text-sm text-gray-600 mb-4">Moving {selectedRows.size} selected row(s)</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Move to row number:</label>
              <input type="number" min="1" className="w-full border border-gray-300 rounded px-3 py-2"
                value={moveToRowNumber} onChange={(e) => setMoveToRowNumber(e.target.value)} autoFocus />
            </div>
            <div className="flex justify-end space-x-3">
              <button className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                onClick={() => { setShowMoveDialog(false); setMoveToRowNumber(''); }}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700" onClick={handleMoveRows}>Move</button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside context menu */}
      {contextMenu.visible && (
        <div className="fixed inset-0 z-40" onClick={() => setContextMenu({ ...contextMenu, visible: false })} />
      )}

      {/* Device Properties Modal */}
      {propertiesDevice && (
        <DevicePropertiesModal
          device={propertiesDevice}
          onClose={() => setPropertiesDevice(null)}
          onUpdate={(newParts) => {
            updateDeviceField(propertiesDevice.id, 'selectedParts', newParts);
            setPropertiesDevice({ ...propertiesDevice, selectedParts: newParts });
          }}
        />
      )}
    </div>
  );
};
