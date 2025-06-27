import { Client, Worker, Task, ValidationError } from './types';

export function validateAll(clients: Client[], workers: Worker[], tasks: Task[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Individual file validations (always run)
  errors.push(...validateClientsIndividual(clients));
  errors.push(...validateWorkersIndividual(workers));
  errors.push(...validateTasksIndividual(tasks));
  
  // Cross-reference validations (only when multiple files are present)
  if (clients.length > 0 && tasks.length > 0) {
    errors.push(...validateClientTaskReferences(clients, tasks));
  }
  
  if (tasks.length > 0 && workers.length > 0) {
    errors.push(...validateTaskWorkerReferences(tasks, workers));
  }
  
  if (clients.length > 0 && workers.length > 0 && tasks.length > 0) {
    errors.push(...validateCrossReferences(clients, workers, tasks));
  }
  
  return errors;
}

// Individual validations for clients (no cross-references)
export function validateClientsIndividual(clients: Client[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const clientIds = new Set<string>();

  clients.forEach((client, index) => {
    // Required fields check
    if (!client.ClientID) {
      errors.push({
        type: 'missing',
        message: 'ClientID is required',
        entity: 'clients',
        field: 'ClientID',
        rowIndex: index,
        severity: 'error'
      });
    }

    // Duplicate IDs
    if (client.ClientID && clientIds.has(client.ClientID)) {
      errors.push({
        type: 'duplicate',
        message: `Duplicate ClientID: ${client.ClientID}`,
        entity: 'clients',
        field: 'ClientID',
        rowIndex: index,
        severity: 'error'
      });
    }
    if (client.ClientID) clientIds.add(client.ClientID);

    // Priority level validation
    if (client.PriorityLevel < 1 || client.PriorityLevel > 5) {
      errors.push({
        type: 'range',
        message: `PriorityLevel must be between 1-5, got ${client.PriorityLevel}`,
        entity: 'clients',
        field: 'PriorityLevel',
        rowIndex: index,
        severity: 'error'
      });
    }

    // JSON validation
    if (client.AttributesJSON) {
      try {
        JSON.parse(client.AttributesJSON);
      } catch {
        errors.push({
          type: 'json',
          message: 'Invalid JSON in AttributesJSON',
          entity: 'clients',
          field: 'AttributesJSON',
          rowIndex: index,
          severity: 'error'
        });
      }
    }
  });

  return errors;
}

// Individual validations for workers
export function validateWorkersIndividual(workers: Worker[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const workerIds = new Set<string>();

  workers.forEach((worker, index) => {
    // Required fields
    if (!worker.WorkerID) {
      errors.push({
        type: 'missing',
        message: 'WorkerID is required',
        entity: 'workers',
        field: 'WorkerID',
        rowIndex: index,
        severity: 'error'
      });
    }

    // Duplicate IDs
    if (worker.WorkerID && workerIds.has(worker.WorkerID)) {
      errors.push({
        type: 'duplicate',
        message: `Duplicate WorkerID: ${worker.WorkerID}`,
        entity: 'workers',
        field: 'WorkerID',
        rowIndex: index,
        severity: 'error'
      });
    }
    if (worker.WorkerID) workerIds.add(worker.WorkerID);

    // Available slots validation
    if (!Array.isArray(worker.AvailableSlots) || worker.AvailableSlots.length === 0) {
      errors.push({
        type: 'missing',
        message: 'AvailableSlots cannot be empty',
        entity: 'workers',
        field: 'AvailableSlots',
        rowIndex: index,
        severity: 'error'
      });
    }

    // MaxLoadPerPhase validation
    if (worker.MaxLoadPerPhase < 1) {
      errors.push({
        type: 'range',
        message: 'MaxLoadPerPhase must be >= 1',
        entity: 'workers',
        field: 'MaxLoadPerPhase',
        rowIndex: index,
        severity: 'error'
      });
    }

    // Phase numbers validation
    worker.AvailableSlots?.forEach(slot => {
      if (slot < 1 || slot > 10) {
        errors.push({
          type: 'range',
          message: `Invalid phase number: ${slot} (must be 1-10)`,
          entity: 'workers',
          field: 'AvailableSlots',
          rowIndex: index,
          severity: 'error'
        });
      }
    });
  });

  return errors;
}

// Individual validations for tasks
export function validateTasksIndividual(tasks: Task[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const taskIds = new Set<string>();

  tasks.forEach((task, index) => {
    // Required fields
    if (!task.TaskID) {
      errors.push({
        type: 'missing',
        message: 'TaskID is required',
        entity: 'tasks',
        field: 'TaskID',
        rowIndex: index,
        severity: 'error'
      });
    }

    // Duplicate IDs
    if (task.TaskID && taskIds.has(task.TaskID)) {
      errors.push({
        type: 'duplicate',
        message: `Duplicate TaskID: ${task.TaskID}`,
        entity: 'tasks',
        field: 'TaskID',
        rowIndex: index,
        severity: 'error'
      });
    }
    if (task.TaskID) taskIds.add(task.TaskID);

    // Duration validation
    if (task.Duration < 1) {
      errors.push({
        type: 'range',
        message: `Duration must be >= 1, got ${task.Duration}`,
        entity: 'tasks',
        field: 'Duration',
        rowIndex: index,
        severity: 'error'
      });
    }

    // MaxConcurrent validation
    if (task.MaxConcurrent < 1) {
      errors.push({
        type: 'range',
        message: 'MaxConcurrent must be >= 1',
        entity: 'tasks',
        field: 'MaxConcurrent',
        rowIndex: index,
        severity: 'error'
      });
    }

    // PreferredPhases validation
    if (!Array.isArray(task.PreferredPhases) || task.PreferredPhases.length === 0) {
      errors.push({
        type: 'missing',
        message: 'PreferredPhases cannot be empty',
        entity: 'tasks',
        field: 'PreferredPhases',
        rowIndex: index,
        severity: 'warning'
      });
    }
  });

  return errors;
}

// Cross-reference validation: Client -> Task references
export function validateClientTaskReferences(clients: Client[], tasks: Task[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const taskIds = new Set(tasks.map(t => t.TaskID));

  clients.forEach((client, index) => {
    client.RequestedTaskIDs?.forEach(taskId => {
      if (taskId && !taskIds.has(taskId)) {
        errors.push({
          type: 'reference',
          message: `Unknown TaskID referenced: ${taskId}`,
          entity: 'clients',
          field: 'RequestedTaskIDs',
          rowIndex: index,
          severity: 'error'
        });
      }
    });
  });

  return errors;
}

// Cross-reference validation: Task -> Worker skill coverage
export function validateTaskWorkerReferences(tasks: Task[], workers: Worker[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const allSkills = new Set(workers.flatMap(w => w.Skills || []));

  tasks.forEach((task, index) => {
    task.RequiredSkills?.forEach(skill => {
      if (skill && !allSkills.has(skill)) {
        errors.push({
          type: 'skillCoverage',
          message: `No worker has required skill: ${skill}`,
          entity: 'tasks',
          field: 'RequiredSkills',
          rowIndex: index,
          severity: 'warning'
        });
      }
    });

    // Max concurrent vs qualified workers
    const qualifiedWorkers = workers.filter(w => 
      task.RequiredSkills?.every(skill => w.Skills?.includes(skill))
    );
    
    if (task.MaxConcurrent > qualifiedWorkers.length) {
      errors.push({
        type: 'concurrency',
        message: `MaxConcurrent (${task.MaxConcurrent}) exceeds qualified workers (${qualifiedWorkers.length})`,
        entity: 'tasks',
        field: 'MaxConcurrent',
        rowIndex: index,
        severity: 'warning'
      });
    }
  });

  return errors;
}

// Full cross-reference validation (when all files are present)
export function validateCrossReferences(clients: Client[], workers: Worker[], tasks: Task[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Phase-slot saturation check
  const phaseWorkload: Record<number, number> = {};
  const phaseCapacity: Record<number, number> = {};

  // Calculate workload per phase
  tasks.forEach(task => {
    task.PreferredPhases?.forEach(phase => {
      phaseWorkload[phase] = (phaseWorkload[phase] || 0) + (task.Duration || 1);
    });
  });

  // Calculate capacity per phase
  workers.forEach(worker => {
    worker.AvailableSlots?.forEach(phase => {
      phaseCapacity[phase] = (phaseCapacity[phase] || 0) + (worker.MaxLoadPerPhase || 1);
    });
  });

  // Check saturation
  Object.keys(phaseWorkload).forEach(phase => {
    const phaseNum = parseInt(phase);
    const workload = phaseWorkload[phaseNum];
    const capacity = phaseCapacity[phaseNum] || 0;
    
    if (workload > capacity) {
      errors.push({
        type: 'saturation',
        message: `Phase ${phase} is oversaturated: workload ${workload} > capacity ${capacity}`,
        entity: 'tasks',
        severity: 'warning'
      });
    }
  });

  return errors;
}