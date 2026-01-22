
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
import { useIsMobile } from '@/hooks/use-mobile';
import HelpIcon from '@/components/ui/help-icon';

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
  const isMobile = useIsMobile();

  const hasData = pitchCount > 0;

  if (!hasData) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <div className="text-4xl">📊</div>
          <h3 className="text-xl font-semibold text-gray-700">Your stats will appear here after your first session</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Complete a practice session to see your performance metrics, streak progress, and improvement analytics.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:col-span-3 gap-6">
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Total Pitches</CardTitle>
              <HelpIcon 
                tooltip="Total number of practice sessions you've completed. Each session helps build your sales skills." 
                size={14}
              />
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pitchCount}</div>
            <p className="text-xs text-muted-foreground">
              {pitchCount > 0 ? '+12% from last month' : 'No activity yet'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <HelpIcon 
                tooltip="Percentage of pitches that scored 70% or higher. Higher win rates indicate better performance and persuasion skills." 
                size={14}
              />
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate ? `${winRate}%` : 'N/A'}</div>
            <div className="mt-2">
              <Progress value={winRate || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Practice Streak</CardTitle>
              <HelpIcon 
                tooltip="Number of consecutive days you've practiced. Building a daily habit is key to improving your sales skills!" 
                size={14}
              />
            </div>
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
          <div className="flex items-center gap-2">
            <CardTitle>Recent Pitch Activity</CardTitle>
            <HelpIcon 
              tooltip="Daily breakdown of your practice sessions over the past week. Consistent practice leads to better results." 
              size={14}
            />
          </div>
        </CardHeader>
        <CardContent className="px-2">
          <ChartContainer className="aspect-[4/3] h-[300px] sm:h-[350px]" config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentPitches}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Pitches" fill="var(--color-pitch)" radius={[4, 4, 0, 0]} />
                <ChartLegend>
                  <ChartLegendContent />
                </ChartLegend>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      
      {/* Objection Handling */}
      <Card className="col-span-3 lg:col-span-1">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Objection Handling</CardTitle>
            <HelpIcon 
              tooltip="Your mastery level for handling different types of sales objections. Practice more to improve these scores." 
              size={14}
            />
          </div>
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
