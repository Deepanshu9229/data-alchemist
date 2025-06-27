'use client';

import { useState } from 'react';
import { Priority } from '@/lib/types';

interface PriorityConfigProps {
  priorities: Priority[];
  onPrioritiesChange: (priorities: Priority[]) => void;
}

export default function PriorityConfig({ priorities, onPrioritiesChange }: PriorityConfigProps) {
  const updateWeight = (index: number, weight: number) => {
    const updated = [...priorities];
    updated[index].weight = weight;
    onPrioritiesChange(updated);
  };

  const presets = {
    'Maximize Fulfillment': { 'Priority Level': 80, 'Fairness': 60, 'Workload Balance': 40, 'Cost Efficiency': 30 },
    'Fair Distribution': { 'Priority Level': 50, 'Fairness': 90, 'Workload Balance': 70, 'Cost Efficiency': 40 },
    'Minimize Workload': { 'Priority Level': 40, 'Fairness': 60, 'Workload Balance': 90, 'Cost Efficiency': 60 },
    'Cost Efficient': { 'Priority Level': 60, 'Fairness': 40, 'Workload Balance': 50, 'Cost Efficiency': 90 }
  };

  const applyPreset = (presetName: string) => {
    const preset = presets[presetName as keyof typeof presets];
    const updated = priorities.map(p => ({
      ...p,
      weight: preset[p.name as keyof typeof preset] || p.weight
    }));
    onPrioritiesChange(updated);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Priority & Weights Configuration</h3>
      
      {/* Preset Buttons */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Quick Presets</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(presets).map(preset => (
            <button
              key={preset}
              onClick={() => applyPreset(preset)}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Priority Sliders */}
      <div className="space-y-6">
        {priorities.map((priority, index) => (
          <div key={priority.name}>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                {priority.name}
              </label>
              <span className="text-sm font-bold text-blue-600">
                {priority.weight}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={priority.weight}
              onChange={(e) => updateWeight(index, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <p className="text-xs text-gray-500 mt-1">{priority.description}</p>
          </div>
        ))}
      </div>

      {/* Weight Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Weight Distribution</h4>
        <div className="space-y-1">
          {priorities.map(priority => (
            <div key={priority.name} className="flex justify-between text-sm">
              <span>{priority.name}:</span>
              <span className="font-medium">{priority.weight}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}