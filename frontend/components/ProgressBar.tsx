/**
 * Progress Bar - Smooth progress indicators for multi-step operations
 * Perfect for staking, node setup, and other async processes
 */

import React, { useState, useEffect } from 'react';

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  description?: string;
}

interface ProgressBarProps {
  steps: ProgressStep[];
  currentStep: number;
  onStepComplete?: (stepId: string) => void;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ProgressBar({
  steps,
  currentStep,
  onStepComplete,
  showLabels = true,
  size = 'md',
  className = ''
}: ProgressBarProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Mark steps as completed
    const newCompleted = new Set<string>();
    steps.forEach((step, index) => {
      if (index < currentStep) {
        newCompleted.add(step.id);
      }
    });
    setCompletedSteps(newCompleted);
  }, [currentStep, steps]);

  const getStepIcon = (step: ProgressStep, index: number) => {
    if (step.status === 'error') return '❌';
    if (step.status === 'completed' || index < currentStep) return '✅';
    if (index === currentStep) return '⏳';
    return '⏸️';
  };

  const getStepColor = (step: ProgressStep, index: number) => {
    if (step.status === 'error') return 'text-red-500';
    if (step.status === 'completed' || index < currentStep) return 'text-green-500';
    if (index === currentStep) return 'text-blue-500';
    return 'text-gray-400';
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Progress Steps */}
      <div className="flex justify-between mb-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex flex-col items-center flex-1 ${
              index < steps.length - 1 ? 'mr-2' : ''
            }`}
          >
            {/* Step Icon */}
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${getStepColor(step, index)}
              ${index <= currentStep ? 'bg-blue-100' : 'bg-gray-100'}
              transition-all duration-300 ease-in-out
            `}>
              {getStepIcon(step, index)}
            </div>
            
            {/* Step Label */}
            {showLabels && (
              <div className="text-center mt-2">
                <div className={`text-xs font-medium ${
                  index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-xs text-gray-400 mt-1">
                    {step.description}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]} overflow-hidden`}>
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-1000 ease-out"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
      </div>

      {/* Current Step Info */}
      {steps[currentStep] && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">⏳</span>
            <div>
              <div className="font-medium text-blue-900">
                {steps[currentStep].label}
              </div>
              {steps[currentStep].description && (
                <div className="text-sm text-blue-700">
                  {steps[currentStep].description}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Specialized progress components
export const StakingProgress: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const steps: ProgressStep[] = [
    { id: 'connect', label: 'Connect Wallet', status: 'pending' },
    { id: 'check-balance', label: 'Check Balance', status: 'pending' },
    { id: 'create-tx', label: 'Create Transaction', status: 'pending' },
    { id: 'sign', label: 'Sign Transaction', status: 'pending' },
    { id: 'confirm', label: 'Confirm on Chain', status: 'pending' }
  ];

  return (
    <ProgressBar
      steps={steps}
      currentStep={currentStep}
      size="md"
      className="max-w-2xl mx-auto"
    />
  );
};

export const NodeSetupProgress: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const steps: ProgressStep[] = [
    { id: 'init', label: 'Initialize Node', status: 'pending' },
    { id: 'network', label: 'Connect to Network', status: 'pending' },
    { id: 'sync', label: 'Sync Messages', status: 'pending' },
    { id: 'ready', label: 'Node Ready', status: 'pending' }
  ];

  return (
    <ProgressBar
      steps={steps}
      currentStep={currentStep}
      size="lg"
      className="max-w-3xl mx-auto"
    />
  );
};
