'use client';

import { Download, FileText } from 'lucide-react';

interface ExportPanelProps {
  data: {
    clients: any[];
    workers: any[];
    tasks: any[];
  };
  rules: any[];
  priorities: any[];
  canExport: boolean;
}

const escapeCSVValue = (value: any) => {
  if (Array.isArray(value)) {
    value = value.join(', ');
  }
  let str = String(value);
  if (str.includes('"')) {
    str = str.replace(/"/g, '""');
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str}"`;
  }
  return str;
};


export default function ExportPanel({ data, rules, priorities, canExport }: ExportPanelProps) {
  const downloadCSV = (dataArray: any[], filename: string) => {
    if (!dataArray.length) return;
    
    const headers = Object.keys(dataArray[0]);
    const csvContent = [
      headers.join(','),
      ...dataArray.map(row => 
        headers.map(header => escapeCSVValue(row[header])).join(',')

      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadRulesConfig = () => {
    const config = {
      rules,
      priorities,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rules-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    downloadCSV(data.clients, 'clients-cleaned.csv');
    downloadCSV(data.workers, 'workers-cleaned.csv');
    downloadCSV(data.tasks, 'tasks-cleaned.csv');
    downloadRulesConfig();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Export Data & Configuration</h3>
      
      {!canExport && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            ⚠️ Please fix all validation errors before exporting.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Individual Downloads */}
        <button
          onClick={() => downloadCSV(data.clients, 'clients-cleaned.csv')}
          disabled={!canExport || !data.clients.length}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="h-4 w-4" />
          Clients CSV
        </button>

        <button
          onClick={() => downloadCSV(data.workers, 'workers-cleaned.csv')}
          disabled={!canExport || !data.workers.length}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="h-4 w-4" />
          Workers CSV
        </button>

        <button
          onClick={() => downloadCSV(data.tasks, 'tasks-cleaned.csv')}
          disabled={!canExport || !data.tasks.length}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="h-4 w-4" />
          Tasks CSV
        </button>

        <button
          onClick={downloadRulesConfig}
          disabled={!canExport}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="h-4 w-4" />
          Rules Config
        </button>
      </div>

      {/* Download All */}
      <button
        onClick={downloadAll}
        disabled={!canExport}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        <Download className="h-5 w-5" />
        Download Complete Package
      </button>

      {/* Export Summary */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="font-semibold text-gray-700">{data.clients.length}</div>
            <div className="text-gray-500">Clients</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700">{data.workers.length}</div>
            <div className="text-gray-500">Workers</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700">{data.tasks.length}</div>
            <div className="text-gray-500">Tasks</div>
          </div>
        </div>
        <div className="mt-2 text-center text-gray-500">
          {rules.length} rules configured
        </div>
      </div>
    </div>
  );
}