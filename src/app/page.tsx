'use client';

import { useState, useEffect } from 'react';
import FileUpload from '@/components/FileUpload';
import DataGrid from '@/components/DataGrid';
import ValidationPanel from '@/components/ValidationPanel';
import RuleBuilder from '@/components/RuleBuilder';
import PriorityConfig from '@/components/PriorityConfig';
import ExportPanel from '@/components/ExportPanel';
import { validateAll } from '@/lib/validators';
import { parseFile, normalizeData } from '@/lib/parser';
import { Client, Worker, Task, ValidationError, Rule, Priority, DataType } from '@/lib/types';
import { Sparkles, Database, Settings, Download } from 'lucide-react';

const initialPriorities: Priority[] = [
  { name: 'Priority Level', weight: 70, description: 'Client priority importance' },
  { name: 'Fairness', weight: 60, description: 'Equal distribution across workers' },
  { name: 'Workload Balance', weight: 50, description: 'Balanced task distribution' },
  { name: 'Cost Efficiency', weight: 40, description: 'Resource optimization' }
];

export default function Home() {
  const [data, setData] = useState<{
    clients: Client[];
    workers: Worker[];
    tasks: Task[];
  }>({ clients: [], workers: [], tasks: [] });

  const [uploadedFiles, setUploadedFiles] = useState({
    clients: false,
    workers: false,
    tasks: false
  });

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>(initialPriorities);
  const [activeTab, setActiveTab] = useState<'upload' | 'validate' | 'rules' | 'export'>('upload');
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [searchResults, setSearchResults] = useState<Record<string, any[]>>({});

  useEffect(() => {
    // Run validation whenever data changes
    const validationErrors = validateAll(data.clients, data.workers, data.tasks);
    setErrors(validationErrors);
  }, [data]);

  const handleFileUpload = async (file: File, type: string) => {
    console.log(`Processing file: ${file.name} as ${type}`);
    setLoadingStates(prev => ({ ...prev, [type]: true }));
    
    try {
      // Parse file on client side
      console.log('Parsing file...');
      const rawData = await parseFile(file);
      console.log('Raw data:', rawData.slice(0, 2));

      // Normalize data
      const normalizedData = normalizeData(rawData, type);
      console.log('Normalized data:', normalizedData.slice(0, 2));

      // Update state
      setData(prev => ({ ...prev, [type]: normalizedData }));
      setUploadedFiles(prev => ({ ...prev, [type]: true }));
      
      console.log(`Successfully loaded ${normalizedData.length} ${type} records`);
      
      // Switch to validation tab after upload
      if (normalizedData.length > 0) {
        setTimeout(() => setActiveTab('validate'), 500);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + (error as Error).message);
    } finally {
      setLoadingStates(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleCellEdit = (dataType: DataType, rowIndex: number, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [dataType]: prev[dataType].map((item, index) => 
        index === rowIndex ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSearch = async (query: string, dataType: DataType) => {
    if (!query.trim()) {
      setSearchResults(prev => ({ ...prev, [dataType]: [] }));
      return;
    }

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          query,
          data: data[dataType]
        })
      });

      const result = await response.json();
      setSearchResults(prev => ({ ...prev, [dataType]: result.results || [] }));
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to simple search
      const filtered = data[dataType].filter(item => 
        JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(prev => ({ ...prev, [dataType]: filtered }));
    }
  };

  const canExport = errors.filter(e => e.severity === 'error').length === 0;

  const tabs = [
    { id: 'upload', label: 'Data Upload', icon: Database },
    { id: 'validate', label: 'Validation', icon: Sparkles },
    { id: 'rules', label: 'Rules & Priorities', icon: Settings },
    { id: 'export', label: 'Export', icon: Download }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Data Alchemist
        </h1>
        <p className="text-lg text-gray-600">
          Transform messy spreadsheets into clean, validated data with AI-powered insights
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-white rounded-lg shadow-sm p-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-800 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'upload' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <FileUpload
                onFileUpload={handleFileUpload}
                type="clients"
                isLoading={loadingStates.clients}
              />
              <FileUpload
                onFileUpload={handleFileUpload}
                type="workers"
                isLoading={loadingStates.workers}
              />
              <FileUpload
                onFileUpload={handleFileUpload}
                type="tasks"
                isLoading={loadingStates.tasks}
              />
            </div>
            
            {/* Sample Data Links */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">🔗 Sample Data</h3>
              <p className="text-sm text-blue-800 mb-2">
                Don't have data? Download our sample files:
              </p>
              <div className="flex gap-2">
                <a 
                  href="data-alchemist\public\samples\clients.csv" 
                  download 
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  clients.csv
                </a>
                <a 
                  href="data-alchemist\public\samples\workers.csv" 
                  download 
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  workers.csv
                </a>
                <a 
                  href="data-alchemist\public\samples\tasks.csv" 
                  download 
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  tasks.csv
                </a>
              </div>
            </div>

            {/* Upload Progress */}
            {(uploadedFiles.clients || uploadedFiles.workers || uploadedFiles.tasks) && (
              <div className="mt-6 bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">📊 Upload Progress</h4>
                <div className="space-y-2">
                  {uploadedFiles.clients && (
                    <div className="text-sm text-green-700">✅ Clients: {data.clients.length} records</div>
                  )}
                  {uploadedFiles.workers && (
                    <div className="text-sm text-green-700">✅ Workers: {data.workers.length} records</div>
                  )}
                  {uploadedFiles.tasks && (
                    <div className="text-sm text-green-700">✅ Tasks: {data.tasks.length} records</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'validate' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {data.clients.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Clients Data ({data.clients.length} records)</h3>
                  <DataGrid
                    data={data.clients}
                    columns={Object.keys(data.clients[0] || {})}
                    errors={errors.filter(e => e.entity === 'clients')}
                    onCellEdit={(row, field, value) => handleCellEdit('clients', row, field, value)}
                    onSearch={(query) => handleSearch(query, 'clients')}
                    searchResults={searchResults.clients}
                    dataType="clients"
                  />
                </div>
              )}

              {data.workers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Workers Data ({data.workers.length} records)</h3>
                  <DataGrid
                    data={data.workers}
                    columns={Object.keys(data.workers[0] || {})}
                    errors={errors.filter(e => e.entity === 'workers')}
                    onCellEdit={(row, field, value) => handleCellEdit('workers', row, field, value)}
                    onSearch={(query) => handleSearch(query, 'workers')}
                    searchResults={searchResults.workers}
                    dataType="workers"
                  />
                </div>
              )}

              {data.tasks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Tasks Data ({data.tasks.length} records)</h3>
                  <DataGrid
                    data={data.tasks}
                    columns={Object.keys(data.tasks[0] || {})}
                    errors={errors.filter(e => e.entity === 'tasks')}
                    onCellEdit={(row, field, value) => handleCellEdit('tasks', row, field, value)}
                    onSearch={(query) => handleSearch(query, 'tasks')}
                    searchResults={searchResults.tasks}
                    dataType="tasks"
                  />
                </div>
              )}

              {!data.clients.length && !data.workers.length && !data.tasks.length && (
                <div className="text-center py-12 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No data uploaded yet. Go to the Upload tab to get started.</p>
                </div>
              )}
            </div>

            <div>
              <ValidationPanel 
                errors={errors} 
                uploadedFiles={uploadedFiles}
              />
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RuleBuilder
              rules={rules}
              onRulesChange={setRules}
              data={data}
            />
            <PriorityConfig
              priorities={priorities}
              onPrioritiesChange={setPriorities}
            />
          </div>
        )}

        {activeTab === 'export' && (
          <div className="max-w-2xl mx-auto">
            <ExportPanel
              data={data}
              rules={rules}
              priorities={priorities}
              canExport={canExport}
            />
          </div>
        )}
      </div>

{/* Progress Footer */}
<div className="mt-12 bg-white p-6 rounded-lg shadow-sm">
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-4">
      <div className={`w-3 h-3 rounded-full ${
        uploadedFiles.clients || uploadedFiles.workers || uploadedFiles.tasks 
          ? 'bg-green-500' 
          : 'bg-gray-300'
      }`} />
      <span className="text-sm text-gray-600">
        Data Upload: {Object.values(uploadedFiles).filter(Boolean).length}/3 files uploaded
      </span>
    </div>
    
    <div className="flex items-center gap-4">
      <div className={`w-3 h-3 rounded-full ${
        errors.filter(e => e.severity === 'error').length === 0 && 
        (data.clients.length > 0 || data.workers.length > 0 || data.tasks.length > 0)
          ? 'bg-green-500' 
          : 'bg-red-500'
      }`} />
      <span className="text-sm text-gray-600">
        Validation: {errors.filter(e => e.severity === 'error').length} errors
      </span>
    </div>
    
    <div className="flex items-center gap-4">
      <div className={`w-3 h-3 rounded-full ${
        rules.length > 0 
          ? 'bg-green-500' 
          : 'bg-gray-300'
      }`} />
      <span className="text-sm text-gray-600">
        Rules: {rules.length} configured
      </span>
    </div>
    
    <div className="flex items-center gap-4">
      <div className={`w-3 h-3 rounded-full ${
        canExport 
          ? 'bg-green-500' 
          : 'bg-gray-300'
      }`} />
      <span className="text-sm text-gray-600">
        Export: {canExport ? 'Ready' : 'Pending validation'}
      </span>
    </div>
  </div>
  
  {/* Progress Bar */}
  <div className="mt-4">
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-gray-600 h-2 rounded-full transition-all duration-300"
        style={{ 
          width: `${(() => {
            let progress = 0;
            // Upload progress (25%)
            const uploadCount = Object.values(uploadedFiles).filter(Boolean).length;
            if (uploadCount > 0) progress += 25;
            
            // Validation progress (25%)
            if (errors.filter(e => e.severity === 'error').length === 0 && 
                (data.clients.length > 0 || data.workers.length > 0 || data.tasks.length > 0)) {
              progress += 25;
            }
            
            // Rules progress (25%)
            if (rules.length > 0) progress += 25;
            
            // Export progress (25%)
            if (canExport) progress += 25;
            
            return progress;
          })()}%`
        }}
      />
    </div>
    <div className="flex justify-between text-xs text-gray-500 mt-1">
      <span>Upload</span>
      <span>Validate</span>
      <span>Configure</span>
      <span>Export</span>
    </div>
  </div>
</div>
    </div>
  );
}