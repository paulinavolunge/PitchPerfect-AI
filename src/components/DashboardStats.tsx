
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, TrendingUp, Users } from 'lucide-react';

// Mock data for the stats
const mockData = {
  totalPitches: 28,
  winRate: 72,
  objectionMastery: 65,
  recentPitches: [
    { name: 'Mon', count: 3 },
    { name: 'Tue', count: 5 },
    { name: 'Wed', count: 2 },
    { name: 'Thu', count: 4 },
    { name: 'Fri', count: 6 },
    { name: 'Sat', count: 1 },
    { name: 'Sun', count: 0 },
  ],
  objectionCategories: [
    { category: 'Price', mastered: 80 },
    { category: 'Timing', mastered: 65 },
    { category: 'Competition', mastered: 70 },
    { category: 'Need', mastered: 45 },
  ]
};

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

const DashboardStats = () => {
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
            <div className="text-2xl font-bold">{mockData.totalPitches}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.winRate}%</div>
            <div className="mt-2">
              <Progress value={mockData.winRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Objection Mastery</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.objectionMastery}%</div>
            <div className="mt-2">
              <Progress value={mockData.objectionMastery} className="h-2" />
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
                <BarChart data={mockData.recentPitches}>
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
            {mockData.objectionCategories.map((category) => (
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
