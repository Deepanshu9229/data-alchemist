'use client';

import { useState } from 'react';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import { Rule } from '@/lib/types';

interface RuleBuilderProps {
  rules: Rule[];
  onRulesChange: (rules: Rule[]) => void;
  data: any;
}

interface RuleEditorProps {
  rule: Rule;
  onChange: (params: any) => void;
  data: any;
}

export default function RuleBuilder({ rules, onRulesChange, data }: RuleBuilderProps) {
  const [newRuleType, setNewRuleType] = useState<string>('coRun');
  const [naturalLanguageRule, setNaturalLanguageRule] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  const addRule = () => {
    const newRule: Rule = {
      id: Date.now().toString(),
      type: newRuleType as any,
      params: getDefaultParams(newRuleType),
      description: `${newRuleType} rule`
    };
    onRulesChange([...rules, newRule]);
  };

  const removeRule = (id: string) => {
    onRulesChange(rules.filter(rule => rule.id !== id));
  };

  const updateRule = (id: string, updates: Partial<Rule>) => {
    onRulesChange(rules.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ));
  };

  const getDefaultParams = (type: string): Record<string, any> => {
    switch(type) {
      case 'coRun': return { tasks: [] };
      case 'slotRestriction': return { group: '', minCommonSlots: 1 };
      case 'loadLimit': return { workerGroup: '', maxSlotsPerPhase: 1 };
      case 'phaseWindow': return { taskId: '', allowedPhases: [] };
      default: return {};
    }
  };

  const handleNaturalLanguageRule = async () => {
    if (!naturalLanguageRule.trim()) return;
    
    setIsConverting(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'convertRule', 
          description: naturalLanguageRule,
          context: data
        })
      });
      
      const rule = await response.json();
      if (rule && rule.type) {
        onRulesChange([...rules, rule]);
        setNaturalLanguageRule('');
      }
    } catch (error) {
      console.error('Failed to convert rule:', error);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Business Rules Configuration</h3>

      {/* Natural Language Rule Input */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🤖 AI Rule Creator
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={naturalLanguageRule}
            onChange={(e) => setNaturalLanguageRule(e.target.value)}
            placeholder="e.g., 'Tasks T1 and T2 must run together' or 'Limit sales team to max 3 slots per phase'"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700"
          />
          <button
            onClick={handleNaturalLanguageRule}
            disabled={isConverting || !naturalLanguageRule.trim()}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-900 disabled:opacity-50 flex items-center gap-2"
          >
            {isConverting ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            Convert
          </button>
        </div>
      </div>

      {/* Manual Rule Builder */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Manual Rule Builder
        </label>
        <div className="flex gap-2 mb-4">
          <select
            value={newRuleType}
            onChange={(e) => setNewRuleType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="coRun">Co-Run Tasks</option>
            <option value="slotRestriction">Slot Restriction</option>
            <option value="loadLimit">Load Limit</option>
            <option value="phaseWindow">Phase Window</option>
          </select>
          <button
            onClick={addRule}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Rule
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No rules configured yet. Add rules using AI or manual builder.
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="border p-4 rounded-lg bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium capitalize text-gray-800">{rule.type}</h4>
                  <p className="text-sm text-gray-600">{rule.description}</p>
                </div>
                <button
                  onClick={() => removeRule(rule.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <RuleEditor 
                rule={rule} 
                onChange={(params) => updateRule(rule.id, { params })} 
                data={data} 
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RuleEditor({ rule, onChange, data }: RuleEditorProps) {
  const handleInputChange = (updates: Record<string, any>) => {
    onChange(updates);
  };

  switch(rule.type) {
    case 'coRun':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Task IDs</label>
          <input
            type="text"
            value={Array.isArray(rule.params.tasks) ? rule.params.tasks.join(', ') : ''}
            onChange={(e) => handleInputChange({
              ...rule.params, 
              tasks: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
            })}
            placeholder="T1, T2, T3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      );
    
    case 'loadLimit':
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Worker Group</label>
            <input
              type="text"
              value={rule.params.workerGroup || ''}
              onChange={(e) => handleInputChange({...rule.params, workerGroup: e.target.value})}
              placeholder="e.g., Sales, Engineering"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Slots Per Phase</label>
            <input
              type="number"
              value={rule.params.maxSlotsPerPhase || 1}
              onChange={(e) => handleInputChange({...rule.params, maxSlotsPerPhase: parseInt(e.target.value) || 1})}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      );

    case 'slotRestriction':
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
            <input
              type="text"
              value={rule.params.group || ''}
              onChange={(e) => handleInputChange({...rule.params, group: e.target.value})}
              placeholder="e.g., TeamA, ProjectX"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Common Slots</label>
            <input
              type="number"
              value={rule.params.minCommonSlots || 1}
              onChange={(e) => handleInputChange({...rule.params, minCommonSlots: parseInt(e.target.value) || 1})}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      );

    case 'phaseWindow':
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task ID</label>
            <input
              type="text"
              value={rule.params.taskId || ''}
              onChange={(e) => handleInputChange({...rule.params, taskId: e.target.value})}
              placeholder="T1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Phases</label>
            <input
              type="text"
              value={Array.isArray(rule.params.allowedPhases) ? rule.params.allowedPhases.join(', ') : ''}
              onChange={(e) => handleInputChange({
                ...rule.params, 
                allowedPhases: e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
              })}
              placeholder="1, 2, 3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      );

    default:
      return (
        <div className="text-sm text-gray-500">
          Rule configuration for {rule.type}
        </div>
      );
  }
}