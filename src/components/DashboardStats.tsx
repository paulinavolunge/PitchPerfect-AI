
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, TrendingUp, Users, Flame } from 'lucide-react';

// Chart config for colors
const chartConfig = {
  pitch: {
    label: "Pitches",
    theme: {
      light: "#4f46e5",
      dark: "#818cf8"
    }
  }
};

interface DashboardStatsProps {
  streakCount?: number;
  pitchCount?: number;
  winRate?: number | null;
  recentPitches?: { name: string; count: number }[];
  objectionCategories?: { category: string; mastered: number }[];
}

const DashboardStats = ({ 
  streakCount = 0, 
  pitchCount = 0,
  winRate = 0,
  recentPitches = [],
  objectionCategories = [
    { category: 'Price', mastered: 0 },
    { category: 'Timing', mastered: 0 },
    { category: 'Competition', mastered: 0 },
    { category: 'Need', mastered: 0 },
  ]
}: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-3 lg:col-span-3 gap-6">
        <Card className="col-span-3 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pitches</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pitchCount}</div>
            <p className="text-xs text-muted-foreground">
              {pitchCount > 0 ? '+12% from last month' : 'No activity yet'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate ? `${winRate}%` : 'N/A'}</div>
            <div className="mt-2">
              <Progress value={winRate || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streakCount} day{streakCount !== 1 ? 's' : ''}</div>
            <div className="mt-2">
              <Progress value={Math.min(streakCount * 10, 100)} className="h-2 bg-gray-200">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(streakCount * 10, 100)}%` }} />
              </Progress>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <Card className="col-span-3 lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Pitch Activity</CardTitle>
        </CardHeader>
        <CardContent className="px-2">
          <ChartContainer className="aspect-[4/3]" config={chartConfig}>
            {/* Fix: Wrap the ResponsiveContainer in a React.Fragment to make it a single React element */}
            <React.Fragment>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={recentPitches}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Pitches" fill="var(--color-pitch)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <ChartLegend>
                <ChartLegendContent />
              </ChartLegend>
            </React.Fragment>
          </ChartContainer>
        </CardContent>
      </Card>
      
      {/* Objection Handling */}
      <Card className="col-span-3 lg:col-span-1">
        <CardHeader>
          <CardTitle>Objection Handling</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {objectionCategories.map((category) => (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{category.category}</div>
                  <div className="text-sm text-muted-foreground">{category.mastered}%</div>
                </div>
                <Progress value={category.mastered} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
