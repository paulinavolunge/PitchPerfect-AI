
import React from 'react';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { PrimaryButton } from '../ui/primary-button';

interface ProgressStats {
  practiceSessionsCompleted: number;
  totalPracticeMinutes: number;
  improvementRate: number;
  consistentStrengths: string[];
  focusAreas: string[];
  streak: number;
  nextMilestone: {
    name: string;
    description: string;
    progress: number;
  };
}

interface ProgressTrackerProps {
  stats: ProgressStats;
  onStartPractice: () => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ stats, onStartPractice }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Progress</h2>
        <PrimaryButton onClick={onStartPractice}>Practice Now</PrimaryButton>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-4xl font-bold text-blue-600">{stats.practiceSessionsCompleted}</div>
          <div className="text-sm text-gray-500">Practice Sessions</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-4xl font-bold text-green-600">{stats.totalPracticeMinutes}</div>
          <div className="text-sm text-gray-500">Minutes Practiced</div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-end gap-2">
            <div className="text-4xl font-bold text-amber-600">{stats.streak}</div>
            <div className="text-xl font-bold text-amber-400 mb-1">🔥</div>
          </div>
          <div className="text-sm text-gray-500">Day Streak</div>
        </Card>
      </div>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Overall Improvement</h3>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Based on your last 5 sessions</span>
          <span className="font-bold text-green-600">{stats.improvementRate}%</span>
        </div>
        <Progress value={stats.improvementRate} className="h-2 mb-6" />
        
        <h4 className="font-medium text-gray-700 mb-2">Your Consistent Strengths:</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {stats.consistentStrengths.map((strength, idx) => (
            <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {strength}
            </span>
          ))}
        </div>
        
        <h4 className="font-medium text-gray-700 mb-2">Focus Areas:</h4>
        <div className="flex flex-wrap gap-2">
          {stats.focusAreas.map((area, idx) => (
            <span key={idx} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
              {area}
            </span>
          ))}
        </div>
      </Card>
      
      <Card className="p-6 border-2 border-blue-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Next Milestone: {stats.nextMilestone.name}</h3>
          <span className="text-sm font-bold text-blue-600">{stats.nextMilestone.progress}%</span>
        </div>
        <p className="text-gray-600 mb-3">{stats.nextMilestone.description}</p>
        <Progress value={stats.nextMilestone.progress} className="h-2" />
      </Card>
    </div>
  );
};
