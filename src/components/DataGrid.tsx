'use client';

import { useState } from 'react';
import { AlertCircle, Search, Wand2 } from 'lucide-react';
import { ValidationError } from '@/lib/types';

interface DataGridProps {
  data: any[];
  columns: string[];
  errors: ValidationError[];
  onCellEdit: (rowIndex: number, field: string, value: any) => void;
  onSearch?: (query: string) => void;
  searchResults?: any[];
  dataType: string;
}

export default function DataGrid({ 
  data, 
  columns, 
  errors, 
  onCellEdit, 
  onSearch,
  searchResults,
  dataType 
}: DataGridProps) {
  const [editingCell, setEditingCell] = useState<{row: number, col: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const displayData = searchResults && searchResults.length > 0 ? searchResults : data;

  const getErrorForCell = (rowIndex: number, field: string) => {
    return errors.find(e => e.rowIndex === rowIndex && e.field === field);
  };

  const handleCellEdit = (rowIndex: number, field: string, value: string) => {
    let processedValue: any = value;
    
    // Process arrays
    if (field.includes('IDs') || field.includes('Skills') || field === 'RequiredSkills') {
      processedValue = value.split(',').map(s => s.trim()).filter(Boolean);
    }
    // Process numbers
    else if (field.includes('Level') || field === 'Duration' || field === 'MaxConcurrent' || field === 'MaxLoadPerPhase') {
      processedValue = parseInt(value) || 0;
    }
    // Process number arrays
    else if (field === 'AvailableSlots' || field === 'PreferredPhases') {
      try {
        processedValue = JSON.parse(value);
      } catch {
        processedValue = value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      }
    }
    
    onCellEdit(rowIndex, field, processedValue);
    setEditingCell(null);
  };

  const handleSearch = () => {
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Search */}
      {onSearch && (
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search with natural language (e.g., 'tasks with duration > 2 phases')"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Wand2 className="h-4 w-4" />
            AI Search
          </button>
        </div>
      )}

      {searchResults && searchResults.length > 0 && (
        <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
          Found {searchResults.length} results for "{searchQuery}"
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map(col => {
                  const error = getErrorForCell(rowIndex, col);
                  const isEditing = editingCell?.row === rowIndex && editingCell?.col === col;
                  
                  return (
                    <td 
                      key={col} 
                      className={`px-6 py-4 whitespace-nowrap text-sm cursor-pointer
                        ${error ? 'bg-red-50 border-l-4 border-red-400' : ''}
                        ${isEditing ? 'bg-blue-50' : ''}`}
                      onClick={() => setEditingCell({ row: rowIndex, col })}
                    >
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <input
                            type="text"
                            defaultValue={Array.isArray(row[col]) ? row[col].join(', ') : row[col]}
                            onBlur={(e) => handleCellEdit(rowIndex, col, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCellEdit(rowIndex, col, e.currentTarget.value);
                              }
                              if (e.key === 'Escape') {
                                setEditingCell(null);
                              }
                            }}
                            className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <>
                            <span className={error ? 'text-red-600' : 'text-gray-900'}>
                              {Array.isArray(row[col]) ? row[col].join(', ') : row[col]}
                            </span>
                            {error && (
                              <div 
                                className="relative group"
                                title={error.message}
                              >
                                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                {/* Tooltip */}
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                  {error.message}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}