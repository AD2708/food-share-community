
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, Package, Star } from "lucide-react";

interface StatusTimelineProps {
  status: string;
  createdAt: string;
  claimedAt?: string;
  pickedUpAt?: string;
  completedAt?: string;
}

const StatusTimeline: React.FC<StatusTimelineProps> = ({ 
  status, 
  createdAt, 
  claimedAt, 
  pickedUpAt, 
  completedAt 
}) => {
  const steps = [
    { 
      key: 'POSTED', 
      label: 'Posted', 
      icon: Clock, 
      date: createdAt,
      completed: true 
    },
    { 
      key: 'CLAIMED', 
      label: 'Claimed', 
      icon: CheckCircle, 
      date: claimedAt,
      completed: ['CLAIMED', 'PICKED_UP', 'COMPLETED'].includes(status)
    },
    { 
      key: 'PICKED_UP', 
      label: 'Picked Up', 
      icon: Package, 
      date: pickedUpAt,
      completed: ['PICKED_UP', 'COMPLETED'].includes(status)
    },
    { 
      key: 'COMPLETED', 
      label: 'Completed', 
      icon: Star, 
      date: completedAt,
      completed: status === 'COMPLETED'
    }
  ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.completed 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-xs mt-1 text-center">
                <div className={`font-medium ${step.completed ? 'text-green-600' : 'text-gray-500'}`}>
                  {step.label}
                </div>
                {step.date && (
                  <div className="text-gray-400">
                    {formatDate(step.date)}
                  </div>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-px ${
                steps[index + 1].completed ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatusTimeline;
