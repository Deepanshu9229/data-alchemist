'use client';

import { AlertCircle, CheckCircle, XCircle, Lightbulb, Info } from 'lucide-react';
import { ValidationError } from '@/lib/types';

interface ValidationPanelProps {
  errors: ValidationError[];
  uploadedFiles: { clients: boolean; workers: boolean; tasks: boolean };
  onFixSuggestion?: (error: ValidationError) => void;
  suggestions?: any[];
}

export default function ValidationPanel({ 
  errors, 
  uploadedFiles, 
  onFixSuggestion, 
  suggestions 
}: ValidationPanelProps) {
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  const errorsByType = errors.reduce((acc, error) => {
    acc[error.type] = (acc[error.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const allFilesUploaded = uploadedFiles.clients && uploadedFiles.workers && uploadedFiles.tasks;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        {errors.length === 0 ? (
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500 mr-2" />
        )}
        Validation Summary
      </h3>

      {/* Upload Status */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
          <Info className="h-4 w-4 mr-1" />
          Upload Status
        </h4>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className={`p-2 rounded ${uploadedFiles.clients ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            {uploadedFiles.clients ? '✅' : '⏳'} Clients
          </div>
          <div className={`p-2 rounded ${uploadedFiles.workers ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            {uploadedFiles.workers ? '✅' : '⏳'} Workers
          </div>
          <div className={`p-2 rounded ${uploadedFiles.tasks ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            {uploadedFiles.tasks ? '✅' : '⏳'} Tasks
          </div>
        </div>
        {!allFilesUploaded && (
          <p className="text-xs text-blue-600 mt-2">
            💡 Upload all three files for complete cross-reference validation
          </p>
        )}
      </div>

      {errors.length === 0 && allFilesUploaded ? (
        <div className="text-green-600 bg-green-50 p-4 rounded-lg">
          ✅ All validations passed! Your data is ready for export.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-red-800">Errors</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
              <div className="text-sm text-yellow-800">Warnings</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{Object.keys(errorsByType).length}</div>
              <div className="text-sm text-blue-800">Issue Types</div>
            </div>
          </div>

          {/* Error Types Breakdown */}
          {Object.keys(errorsByType).length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(errorsByType).map(([type, count]) => (
                <div key={type} className="bg-gray-50 p-2 rounded text-sm">
                  <span className="font-medium capitalize">{type}:</span> {count}
                </div>
              ))}
            </div>
          )}

          {/* Error List */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {errors.map((error, index) => (
              <div key={index} className={`flex items-start p-3 rounded-lg ${
                error.severity === 'error' ? 'bg-red-50' : 'bg-yellow-50'
              }`}>
                <AlertCircle className={`h-4 w-4 mt-0.5 mr-2 flex-shrink-0 ${
                  error.severity === 'error' ? 'text-red-500' : 'text-yellow-500'
                }`} />
                <div className="flex-1">
                  <p className={`text-sm ${
                    error.severity === 'error' ? 'text-red-800' : 'text-yellow-800'
                  }`}>
                    {error.message}
                  </p>
                  <p className={`text-xs ${
                    error.severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {error.entity} 
                    {error.rowIndex !== undefined && ` (row ${error.rowIndex + 1})`}
                    {error.field && ` - ${error.field}`}
                  </p>
                </div>
                {onFixSuggestion && (
                  <button
                    onClick={() => onFixSuggestion(error)}
                    className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
                  >
                    <Lightbulb className="h-3 w-3" />
                    Fix
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* AI Suggestions */}
          {suggestions && suggestions.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                <Lightbulb className="h-4 w-4 mr-1" />
                AI Suggestions
              </h4>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="text-sm text-blue-700">
                    • {suggestion.suggestedFix} (Confidence: {Math.round(suggestion.confidence * 100)}%)
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}