import * as XLSX from 'xlsx';

export async function parseFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let workbook: XLSX.WorkBook;
        
        if (file.name.toLowerCase().endsWith('.csv')) {
          // Handle CSV files
          const csvData = data as string;
          workbook = XLSX.read(csvData, { type: 'string' });
        } else {
          // Handle Excel files
          workbook = XLSX.read(data, { type: 'array' });
        }
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        console.log('Parsed data:', jsonData.slice(0, 2)); // Debug log
        resolve(jsonData);
      } catch (error) {
        console.error('Parse error:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error('File read error:', error);
      reject(error);
    };
    
    // Read file based on type
    if (file.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}

export function normalizeData(data: any[], type: string): any[] {
  console.log(`Normalizing ${type} data:`, data.slice(0, 2));
  
  return data.map((row, index) => {
    try {
      switch(type) {
        case 'clients':
          return {
            ClientID: row.ClientID || `C${String(index + 1).padStart(3, '0')}`,
            ClientName: row.ClientName || 'Unknown Client',
            PriorityLevel: parseInt(row.PriorityLevel) || 1,
            RequestedTaskIDs: parseArrayField(row.RequestedTaskIDs),
            GroupTag: row.GroupTag || 'Default',
            AttributesJSON: row.AttributesJSON || '{}'
          };
        
        case 'workers':
          return {
            WorkerID: row.WorkerID || `W${String(index + 1).padStart(3, '0')}`,
            WorkerName: row.WorkerName || 'Unknown Worker',
            Skills: parseArrayField(row.Skills),
            AvailableSlots: parseNumberArray(row.AvailableSlots),
            MaxLoadPerPhase: parseInt(row.MaxLoadPerPhase) || 1,
            WorkerGroup: row.WorkerGroup || 'Default',
            QualificationLevel: parseInt(row.QualificationLevel) || 1
          };
        
        case 'tasks':
          return {
            TaskID: row.TaskID || `T${String(index + 1).padStart(3, '0')}`,
            TaskName: row.TaskName || 'Unknown Task',
            Category: row.Category || 'General',
            Duration: parseInt(row.Duration) || 1,
            RequiredSkills: parseArrayField(row.RequiredSkills),
            PreferredPhases: parseNumberArray(row.PreferredPhases),
            MaxConcurrent: parseInt(row.MaxConcurrent) || 1
          };
        
        default:
          return row;
      }
    } catch (error) {
      console.error(`Error normalizing row ${index}:`, error, row);
      return row;
    }
  });
}

function parseArrayField(field: any): string[] {
  if (!field) return [];
  if (Array.isArray(field)) return field.map(String);
  
  const str = String(field);
  if (str.includes(',')) {
    return str.split(',').map(s => s.trim()).filter(Boolean);
  }
  
  return str.trim() ? [str.trim()] : [];
}

function parseNumberArray(field: any): number[] {
  if (!field) return [];
  if (Array.isArray(field)) return field.map(Number).filter(n => !isNaN(n));
  
  const str = String(field);
  
  // Handle JSON array format like "[1,2,3]"
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      return JSON.parse(str).filter((n: any) => !isNaN(Number(n))).map(Number);
    } catch {
      // If JSON parsing fails, try comma-separated
      return str.slice(1, -1).split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    }
  }
  
  // Handle comma-separated format like "1,2,3"
  if (str.includes(',')) {
    return str.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  }
  
  // Single number
  const num = parseInt(str);
  return isNaN(num) ? [] : [num];
}