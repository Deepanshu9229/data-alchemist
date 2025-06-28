'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Search, Wand2, X } from 'lucide-react';
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
  const [editValue, setEditValue] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const displayData = isSearchActive && searchResults && searchResults.length > 0 ? searchResults : data;

  const getErrorForCell = (rowIndex: number, field: string) => {
    return errors.find(e => e.rowIndex === rowIndex && e.field === field);
  };

  const startEdit = (rowIndex: number, field: string, currentValue: any) => {
    // Find the actual row index in the original data
    const actualRowIndex = isSearchActive ? 
      data.findIndex(item => JSON.stringify(item) === JSON.stringify(displayData[rowIndex])) : 
      rowIndex;
    
    setEditingCell({ row: actualRowIndex, col: field });
    setEditValue(Array.isArray(currentValue) ? currentValue.join(', ') : String(currentValue || ''));
  };

  const saveEdit = () => {
    if (!editingCell) return;
    
    const { row, col } = editingCell;
    let processedValue: any = editValue;
    
    // Process different data types
    if (col.includes('IDs') || col.includes('Skills') || col === 'RequiredSkills') {
      processedValue = editValue.split(',').map(s => s.trim()).filter(Boolean);
    }
    else if (col.includes('Level') || col === 'Duration' || col === 'MaxConcurrent' || col === 'MaxLoadPerPhase') {
      processedValue = parseInt(editValue) || 0;
    }
    else if (col === 'AvailableSlots' || col === 'PreferredPhases') {
      try {
        processedValue = JSON.parse(editValue);
      } catch {
        processedValue = editValue.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      }
    }
    
    onCellEdit(row, col, processedValue);
    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleSearch = () => {
    if (onSearch && searchQuery.trim()) {
      setIsSearchActive(true);
      onSearch(searchQuery);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchActive(false);
    if (onSearch) {
      onSearch('');
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
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search with natural language (e.g., 'tasks with duration > 2 phases')"
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
          >
            <Wand2 className="h-4 w-4" />
            AI Search
          </button>
        </div>
      )}

      {isSearchActive && searchResults && searchResults.length > 0 && (
        <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded flex justify-between items-center">
          <span>Found {searchResults.length} results for "{searchQuery}"</span>
          <button
            onClick={clearSearch}
            className="text-blue-500 hover:text-blue-700"
          >
            Clear
          </button>
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
                  const actualRowIndex = isSearchActive ? 
                    data.findIndex(item => JSON.stringify(item) === JSON.stringify(row)) : 
                    rowIndex;
                  const error = getErrorForCell(actualRowIndex, col);
                  const isEditing = editingCell?.row === actualRowIndex && editingCell?.col === col;
                  
                  return (
                    <td 
                      key={col} 
                      className={`px-6 py-4 whitespace-nowrap text-sm relative
                        ${error ? 'bg-red-50 border-l-4 border-red-400' : ''}
                        ${isEditing ? 'bg-blue-50' : 'cursor-pointer hover:bg-gray-50'}`}
                      onClick={() => !isEditing && startEdit(rowIndex, col, row[col])}
                    >
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={saveEdit}
                              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className={`${error ? 'text-red-600' : 'text-gray-900'} truncate max-w-xs`}>
                              {Array.isArray(row[col]) ? row[col].join(', ') : String(row[col] || '')}
                            </span>
                            {error && (
                              <div 
                                className="relative group flex-shrink-0"
                                title={error.message}
                              >
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 max-w-xs">
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

      {displayData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No data found</p>
        </div>
      )}
    </div>
  );
}