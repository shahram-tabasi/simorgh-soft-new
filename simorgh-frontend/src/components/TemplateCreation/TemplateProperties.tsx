// src/components/TemplateCreation/TemplateProperties.tsx - FIXED SQL CONNECTION
import React, { useEffect, useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { PlusIcon, TrashIcon, Search, RefreshCw } from 'lucide-react';

interface TemplateItem {
  id: string;
  name: string;
  type: 'LV' | 'MV' | 'HV';
  properties: Record<string, PropertyValue>;
}

interface PropertyValue {
  parts: PartInfo[];
}

interface PartInfo {
  partNumber: string;
  label: string;
  quantity: number;
  priority: number;
  fullData?: any;
}

interface TemplatePropertiesProps {
  template: TemplateItem;
}

interface PartSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (part: any) => void;
  propertyName: string;
  currentPart?: PartInfo | null; // 🔹 برای تعویض پارت
}

// 🔹 دیالوگ انتخاب پارت از SQL Server - با قابلیت تعویض
const PartSelectionDialog: React.FC<PartSelectionDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
  propertyName,
  currentPart
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [parts, setParts] = useState<any[]>([]);
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ============================================
  // ADDED: Manufacturer filter state
  // ============================================
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchParts();
    }
  }, [isOpen]);

  // ADDED: Fetch when manufacturer filter changes
  useEffect(() => {
    if (isOpen && selectedManufacturer !== '') {
      fetchParts();
    }
  }, [selectedManufacturer]);

  const fetchParts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/eplan-parts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTerm: searchTerm || undefined,
          // ADDED: Include manufacturer filter in request
          manufacturer: selectedManufacturer || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch parts`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setParts(result.data);
        // ADDED: Store manufacturers list from response
        if (result.manufacturers && result.manufacturers.length > 0) {
          setManufacturers(result.manufacturers);
        }
        console.log(`✅ Loaded ${result.data.length} parts from SQL Server`);
      } else {
        throw new Error('Invalid response format from server');
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection error';
      setError(errorMsg);
      console.error('❌ SQL Server error:', err);

      // Fallback sample data
      setParts([
        {
          PartNumber: 'MCB/RI72J-C4(4A, DC, 6KA, 2Pole, Type C)',
          TypeNumber: '101-MN26-AA401A04',
          Designation1: 'Miniature Circuit Breaker(MCB)',
          Designation2: '4A, DC, 10KA, 2Pole, Type C',
          Designation3: 'DC, 2Pole #4A, Type C',
          Manufacturer: 'Iskra',
          OrderNumber: 'RI72J-C4',
          Description: 'MCB, DC, 10KA, 2Pole, Type C, 4A',
          ProductGroup: 'General',
          ProductSubgroup: 'Undefined'
        }
      ]);
      // ADDED: Fallback manufacturers
      setManufacturers(['Iskra', 'Siemens', 'ABB', 'Schneider']);
    } finally {
      setLoading(false);
    }
  };

  const filteredParts = parts.filter(part => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      part.PartNumber?.toLowerCase().includes(search) ||
      part.TypeNumber?.toLowerCase().includes(search) ||
      part.Designation1?.toLowerCase().includes(search) ||
      part.Description?.toLowerCase().includes(search) ||
      part.Manufacturer?.toLowerCase().includes(search)
    );
  });

  const handleOk = async () => {
    if (!selectedPart) return;

    try {
      // 🔹 ذخیره در MongoDB
      const response = await fetch('http://localhost:3001/api/save-part-to-mongo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partData: selectedPart,
          propertyName: propertyName,
          templateId: 'current-template', // باید از context بیاید
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log('✅ Part saved to MongoDB');
      }
    } catch (err) {
      console.error('❌ MongoDB save error:', err);
    }

    onSelect(selectedPart);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90%] h-[90%] flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">
              {currentPart ? '🔄 Replace Part' : '➕ Select Part'} for {propertyName}
            </h2>
            {currentPart && (
              <p className="text-sm text-blue-100 mt-1">
                Current: {currentPart.partNumber}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 rounded-full p-2"
          >
            ✕
          </button>
        </div>

        {/* Search Bar with Manufacturer Filter */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex gap-4">
            {/* ============================================ */}
            {/* ADDED: Manufacturer Filter Dropdown */}
            {/* ============================================ */}
            <div className="w-48">
              <select
                value={selectedManufacturer}
                onChange={(e) => setSelectedManufacturer(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">All Manufacturers</option>
                {manufacturers.map((man, idx) => (
                  <option key={idx} value={man}>{man}</option>
                ))}
              </select>
            </div>
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by part number, type, manufacturer, description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchParts()}
                autoFocus
              />
            </div>
            <button
              onClick={fetchParts}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>
          {/* ADDED: Show active filter indicator */}
          {selectedManufacturer && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-600">Filter:</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                {selectedManufacturer}
                <button
                  onClick={() => setSelectedManufacturer('')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ✕
                </button>
              </span>
            </div>
          )}
          {error && (
            <div className="mt-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Parts List */}
          <div className="w-1/2 border-r overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading parts from SQL Server...</p>
                </div>
              </div>
            ) : (
              <div className="p-2">
                <div className="mb-2 px-3 py-2 bg-gray-100 text-sm text-gray-600">
                  {filteredParts.length} part(s) found
                </div>
                {filteredParts.map((part, index) => (
                  <div
                    key={index}
                    className={`p-3 mb-2 border rounded cursor-pointer transition-colors ${
                      selectedPart?.PartNumber === part.PartNumber
                        ? 'bg-blue-100 border-blue-500 shadow-sm'
                        : 'border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedPart(part)}
                  >
                    <div className="flex items-start">
                      <span className="text-red-600 mr-2 text-lg">📦</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">
                          {part.PartNumber}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {part.Designation1}
                        </div>
                        <div className="flex gap-2 mt-2 text-xs text-gray-500">
                          <span className="bg-gray-100 px-2 py-0.5 rounded">
                            {part.Manufacturer}
                          </span>
                          {part.OrderNumber && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded">
                              {part.OrderNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredParts.length === 0 && !loading && (
                  <div className="text-center text-gray-500 mt-10">
                    <p className="text-lg mb-2">🔍 No parts found</p>
                    <p className="text-sm">Try a different search term</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Part Details */}
          <div className="w-1/2 overflow-y-auto p-6 bg-gray-50">
            {selectedPart ? (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-blue-900">
                  📋 Part Details
                </h3>
                <div className="space-y-3">
                  <DetailRow label="Product group" value={selectedPart.ProductGroup} />
                  <DetailRow label="Product subgroup" value={selectedPart.ProductSubgroup} />
                  <DetailRow label="Part number" value={selectedPart.PartNumber} highlight />
                  <DetailRow label="ERP number" value={selectedPart.ERPNumber} />
                  <DetailRow label="Type number" value={selectedPart.TypeNumber} />
                  <DetailRow label="Designation 1" value={selectedPart.Designation1} />
                  <DetailRow label="Designation 2" value={selectedPart.Designation2} />
                  <DetailRow label="Designation 3" value={selectedPart.Designation3} />
                  <DetailRow label="Manufacturer" value={selectedPart.Manufacturer} highlight />
                  <DetailRow label="Supplier" value={selectedPart.Supplier} />
                  <DetailRow label="Order number" value={selectedPart.OrderNumber} />
                  <DetailRow 
                    label="Description" 
                    value={selectedPart.Description} 
                    multiline 
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-lg">Select a part to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-between items-center bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedPart && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                ✓ Selected: {selectedPart.PartNumber}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleOk}
              disabled={!selectedPart}
              className={`px-6 py-2 rounded-lg transition-colors ${
                selectedPart
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {currentPart ? '🔄 Replace Part' : '✓ Select Part'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow: React.FC<{
  label: string;
  value?: string;
  multiline?: boolean;
  highlight?: boolean;
}> = ({ label, value, multiline, highlight }) => (
  <div className={`grid grid-cols-3 gap-4 ${highlight ? 'bg-yellow-50 p-2 rounded' : ''}`}>
    <div className="text-sm font-medium text-gray-600">{label}:</div>
    <div className="col-span-2">
      {multiline ? (
        <textarea
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          value={value || '-'}
          readOnly
          rows={3}
        />
      ) : (
        <input
          type="text"
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          value={value || '-'}
          readOnly
        />
      )}
    </div>
  </div>
);

export const TemplateProperties: React.FC<TemplatePropertiesProps> = ({
  template
}) => {
  const { updateTemplate } = useProject();
  const [properties, setProperties] = useState<Record<string, PropertyValue>>(
    template.properties || {}
  );
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    propertyName: string;
    currentPart: PartInfo | null;
    partIndex: number | null;
  }>({
    isOpen: false,
    propertyName: '',
    currentPart: null,
    partIndex: null
  });

  useEffect(() => {
    setProperties(template.properties || {});
  }, [template]);

  const lvProperties = [
    'CB ORDER', 'CB. RATING (A)', 'CONTACTOR. ORDER', 'CONTACTOR. RATING (A)',
    'OVER LOAD RELAY', 'OVER LAOD RATING(A)', 'EARTH FAULT', 'COREBALANCE CT',
    'PROTECTION RELAY', 'CT RATING', 'AMMETER', 'AMMETER selector',
    'PT RATING', 'VOLTMETER', 'VOLTMETER selector'
  ];

  const mvProperties = [
    'BREAKER TYPE', 'NOMINAL CURRENT', 'SHORT CIRCUIT CURRENT',
    'PROTECTION RELAY', 'CT RATIO', 'VT RATIO'
  ];

  const hvProperties = [
    'BREAKER TYPE', 'NOMINAL VOLTAGE', 'NOMINAL CURRENT',
    'SHORT CIRCUIT CURRENT', 'PROTECTION RELAY', 'INSULATION LEVEL'
  ];

  let propertiesToShow: string[] = [];
  switch (template.type) {
    case 'LV': propertiesToShow = lvProperties; break;
    case 'MV': propertiesToShow = mvProperties; break;
    case 'HV': propertiesToShow = hvProperties; break;
  }

  const handleOpenPartDialog = (propertyName: string, currentPart?: PartInfo, partIndex?: number) => {
    setDialogState({
      isOpen: true,
      propertyName,
      currentPart: currentPart || null,
      partIndex: partIndex ?? null
    });
  };

  const handlePartSelect = (part: any) => {
    const { propertyName, partIndex } = dialogState;
    const currentProperty = properties[propertyName] || { parts: [] };
    
    const newPart: PartInfo = {
      partNumber: part.PartNumber,
      label: part.Designation1 || '',
      quantity: 1,
      priority: partIndex !== null ? partIndex + 1 : currentProperty.parts.length + 1,
      fullData: part
    };

    let updatedParts;
    if (partIndex !== null) {
      // 🔹 تعویض پارت موجود
      updatedParts = currentProperty.parts.map((p, i) => 
        i === partIndex ? newPart : p
      );
    } else {
      // 🔹 افزودن پارت جدید
      updatedParts = [...currentProperty.parts, newPart];
    }

    const updatedProperty = { parts: updatedParts };
    const updatedProperties = {
      ...properties,
      [propertyName]: updatedProperty
    };

    setProperties(updatedProperties);
    updateTemplate(template.id, updatedProperties);
  };

  const handleRemovePart = (propertyName: string, partIndex: number) => {
    const currentProperty = properties[propertyName];
    if (!currentProperty) return;

    const updatedProperty = {
      parts: currentProperty.parts.filter((_, index) => index !== partIndex)
    };

    const updatedProperties = {
      ...properties,
      [propertyName]: updatedProperty
    };

    setProperties(updatedProperties);
    updateTemplate(template.id, updatedProperties);
  };

  const handleUpdatePart = (
    propertyName: string,
    partIndex: number,
    field: keyof PartInfo,
    value: any
  ) => {
    const currentProperty = properties[propertyName];
    if (!currentProperty) return;

    const updatedParts = [...currentProperty.parts];
    updatedParts[partIndex] = {
      ...updatedParts[partIndex],
      [field]: value
    };

    const updatedProperty = { parts: updatedParts };
    const updatedProperties = {
      ...properties,
      [propertyName]: updatedProperty
    };

    setProperties(updatedProperties);
    updateTemplate(template.id, updatedProperties);
  };

  return (
    <div className="h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{template.name}</h3>
        <p className="text-sm text-gray-500">Type: {template.type}</p>
      </div>

      <div className="border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b w-1/4">
                Property
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b w-1/4">
                Part
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b w-1/4">
                Label
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b w-1/6">
                Quantity
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b w-1/6">
                Priority
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b w-16">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {propertiesToShow.map((property, index) => {
              const propertyValue = properties[property] || { parts: [] };
              const parts = propertyValue.parts || [];

              return (
                <React.Fragment key={index}>
                  {parts.length === 0 ? (
                    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm border-b font-medium">
                        {property}
                      </td>
                      <td className="px-4 py-2 border-b" colSpan={5}>
                        <button
                          onClick={() => handleOpenPartDialog(property)}
                          className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Add Part from SQL Server
                        </button>
                      </td>
                    </tr>
                  ) : (
                    parts.map((part, partIndex) => (
                      <tr
                        key={`${index}-${partIndex}`}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        {partIndex === 0 && (
                          <td
                            className="px-4 py-3 text-sm border-b font-medium"
                            rowSpan={parts.length + 1}
                          >
                            {property}
                          </td>
                        )}
                        <td className="px-4 py-2 border-b">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100"
                              value={part.partNumber}
                              readOnly
                            />
                            <button
                              onClick={() => handleOpenPartDialog(property, part, partIndex)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Replace part"
                            >
                              🔄
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2 border-b">
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            value={part.label}
                            onChange={(e) =>
                              handleUpdatePart(property, partIndex, 'label', e.target.value)
                            }
                          />
                        </td>
                        <td className="px-4 py-2 border-b">
                          <input
                            type="number"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            value={part.quantity}
                            onChange={(e) =>
                              handleUpdatePart(
                                property,
                                partIndex,
                                'quantity',
                                parseInt(e.target.value) || 1
                              )
                            }
                            min="1"
                          />
                        </td>
                        <td className="px-4 py-2 border-b">
                          <input
                            type="number"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            value={part.priority}
                            onChange={(e) =>
                              handleUpdatePart(
                                property,
                                partIndex,
                                'priority',
                                parseInt(e.target.value) || 1
                              )
                            }
                            min="1"
                          />
                        </td>
                        <td className="px-4 py-2 border-b">
                          <button
                            onClick={() => handleRemovePart(property, partIndex)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  {parts.length > 0 && (
                    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 border-b" colSpan={5}>
                        <button
                          onClick={() => handleOpenPartDialog(property)}
                          className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Add Another Part
                        </button>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <PartSelectionDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, propertyName: '', currentPart: null, partIndex: null })}
        onSelect={handlePartSelect}
        propertyName={dialogState.propertyName}
        currentPart={dialogState.currentPart}
      />
    </div>
  );
};