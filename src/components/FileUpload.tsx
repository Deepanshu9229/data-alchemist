'use client';

import { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File, type: string) => void;
  type: string;
  isLoading?: boolean;
}

export default function FileUpload({ onFileUpload, type, isLoading }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log(`Selected file: ${file.name} for ${type}`);
      setSelectedFile(file.name);
      onFileUpload(file, type);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2 ">
      <label className="block text-sm font-medium text-gray-700 capitalize">
        {type} Data
      </label>
      
      <div
        onClick={handleClick}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${selectedFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isLoading}
        />
        
        {isLoading ? (
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        ) : selectedFile ? (
          <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
        ) : (
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        )}
        
        <p className="text-sm text-gray-600">
          {isLoading 
            ? 'Processing...' 
            : selectedFile 
              ? `✅ ${selectedFile}` 
              : `Click to upload ${type} file`
          }
        </p>
        
        <p className="text-xs text-gray-500 mt-1">
          CSV, XLS, XLSX supported
        </p>
      </div>
    </div>
  );
}