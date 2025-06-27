export interface Client {
  ClientID: string;
  ClientName: string;
  PriorityLevel: number;
  RequestedTaskIDs: string[];
  GroupTag: string;
  AttributesJSON: string;
}

export interface Worker {
  WorkerID: string;
  WorkerName: string;
  Skills: string[];
  AvailableSlots: number[];
  MaxLoadPerPhase: number;
  WorkerGroup: string;
  QualificationLevel: number;
}

export interface Task {
  TaskID: string;
  TaskName: string;
  Category: string;
  Duration: number;  
  RequiredSkills: string[];
  PreferredPhases: number[];
  MaxConcurrent: number;
}

export interface ValidationError {
  type: string;
  message: string;
  entity: 'clients' | 'workers' | 'tasks';
  field?: string;
  rowIndex?: number;
  severity: 'error' | 'warning';
}

export interface Rule {
  id: string;
  type: 'coRun' | 'slotRestriction' | 'loadLimit' | 'phaseWindow' | 'patternMatch';
  params: any;
  description: string;
}

export interface Priority {
  name: string;
  weight: number;
  description: string;
}

export type DataType = 'clients' | 'workers' | 'tasks';