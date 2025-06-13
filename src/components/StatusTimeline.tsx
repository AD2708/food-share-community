
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, Package, Star, Users } from "lucide-react";

interface StatusTimelineProps {
  status: string;
  createdAt: string;
  claimedAt?: string;
  pickedUpAt?: string;
  completedAt?: string;
  interactionCount?: number;
}

const StatusTimeline: React.FC<StatusTimelineProps> = ({ 
  status, 
  createdAt, 
  claimedAt, 
  pickedUpAt, 
  completedAt,
  interactionCount = 0
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
    <div className="space-y-3">
      {/* Interaction Count Badge */}
      {interactionCount > 0 && (
        <div className="flex items-center justify-center">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Users className="h-3 w-3 mr-1" />
            {interactionCount} {interactionCount === 1 ? 'interaction' : 'interactions'}
          </Badge>
        </div>
      )}
      
      {/* Timeline */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg overflow-x-auto">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center min-w-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="text-xs mt-1 text-center min-w-0">
                  <div className={`font-medium truncate ${step.completed ? 'text-green-600' : 'text-gray-500'}`}>
                    {step.label}
                  </div>
                  {step.date && (
                    <div className="text-gray-400 text-xs truncate">
                      {formatDate(step.date)}
                    </div>
                  )}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-px mx-2 flex-shrink-0 ${
                  steps[index + 1].completed ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusTimeline;
