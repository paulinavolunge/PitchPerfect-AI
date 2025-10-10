
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Users, ChevronDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// Sample team performance data
const sampleTeamData = [
  {
    id: 1,
    name: "Alex Johnson",
    role: "Senior Sales Rep",
    avgResponseTime: 1.8, // in seconds
    successRate: 76,
    completedSessions: 42,
    improvement: 7,
    focus: "Price objections"
  },
  {
    id: 2,
    name: "Jamie Smith",
    role: "Sales Representative",
    avgResponseTime: 2.5,
    successRate: 68,
    completedSessions: 31,
    improvement: -3,
    focus: "Need-based objections"
  },
  {
    id: 3,
    name: "Taylor Wilson",
    role: "Account Executive",
    avgResponseTime: 1.2,
    successRate: 84,
    completedSessions: 56,
    improvement: 12,
    focus: "Competitor comparisons"
  },
  {
    id: 4,
    name: "Casey Brown",
    role: "Junior Sales Rep",
    avgResponseTime: 3.1,
    successRate: 58,
    completedSessions: 19,
    improvement: 15,
    focus: "Timing objections"
  },
  {
    id: 5,
    name: "Morgan Lee",
    role: "Sales Manager",
    avgResponseTime: 1.5,
    successRate: 82,
    completedSessions: 47,
    improvement: 5,
    focus: "Budget constraints"
  }
];

// Sample time series data for performance over time
const timeSeriesData = [
  {
    month: "Jan",
    "Alex Johnson": 64,
    "Jamie Smith": 56,
    "Taylor Wilson": 73,
    "Casey Brown": 42,
    "Morgan Lee": 77,
    teamAverage: 62
  },
  {
    month: "Feb",
    "Alex Johnson": 67,
    "Jamie Smith": 59,
    "Taylor Wilson": 75,
    "Casey Brown": 45,
    "Morgan Lee": 78,
    teamAverage: 65
  },
  {
    month: "Mar",
    "Alex Johnson": 69,
    "Jamie Smith": 58,
    "Taylor Wilson": 78,
    "Casey Brown": 52,
    "Morgan Lee": 80,
    teamAverage: 67
  },
  {
    month: "Apr",
    "Alex Johnson": 72,
    "Jamie Smith": 62,
    "Taylor Wilson": 80,
    "Casey Brown": 56,
    "Morgan Lee": 81,
    teamAverage: 70
  },
  {
    month: "May",
    "Alex Johnson": 76,
    "Jamie Smith": 68,
    "Taylor Wilson": 84,
    "Casey Brown": 58,
    "Morgan Lee": 82,
    teamAverage: 74
  }
];

// Colors for the chart lines
const colors = {
  "Alex Johnson": "#4f46e5",
  "Jamie Smith": "#10b981",
  "Taylor Wilson": "#ef4444",
  "Casey Brown": "#f59e0b",
  "Morgan Lee": "#8b5cf6",
  teamAverage: "#6b7280"
};

interface TeamAnalyticsProps {
  className?: string;
}

const TeamAnalytics: React.FC<TeamAnalyticsProps> = ({ className }) => {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  
  const filteredData = selectedMember 
    ? sampleTeamData.filter(member => member.name === selectedMember) 
    : sampleTeamData;
    
  const handleSelectMember = (name: string) => {
    setSelectedMember(name === selectedMember ? null : name);
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <h2 className="text-2xl font-bold text-brand-dark flex items-center">
          <Users className="mr-2 h-5 w-5" /> Team Performance
        </h2>
        
        <div className="flex items-center space-x-2">
          <Tabs defaultValue="month" className="w-[300px]">
            <TabsList>
              <TabsTrigger 
                value="week" 
                onClick={() => setTimeRange('week')}
              >
                Week
              </TabsTrigger>
              <TabsTrigger 
                value="month" 
                onClick={() => setTimeRange('month')}
              >
                Month
              </TabsTrigger>
              <TabsTrigger 
                value="quarter" 
                onClick={() => setTimeRange('quarter')}
              >
                Quarter
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Team Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Comparison Over Time</CardTitle>
          <CardDescription>
            Track how team members are improving their sales skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                {Object.keys(timeSeriesData[0])
                  .filter(key => key !== 'month')
                  .map((key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={colors[key as keyof typeof colors] || `#${Math.floor(Math.random()*16777215).toString(16)}`}
                      strokeWidth={key === 'teamAverage' ? 3 : 2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      opacity={selectedMember ? (key === selectedMember || key === 'teamAverage' ? 1 : 0.3) : 1}
                    />
                  ))
                }
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Individual Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Member Performance</CardTitle>
          <CardDescription>
            Detailed performance metrics for each team member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Member</TableHead>
                <TableHead className="text-center">Response Time</TableHead>
                <TableHead className="text-center">Success Rate</TableHead>
                <TableHead className="text-center">Sessions</TableHead>
                <TableHead className="text-center">Improvement</TableHead>
                <TableHead>Area to Focus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((member) => (
                <TableRow 
                  key={member.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSelectMember(member.name)}
                >
                  <TableCell className="font-medium">
                    <div>
                      <div>{member.name}</div>
                      <div className="text-xs text-gray-500">{member.role}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <div>{member.avgResponseTime}s</div>
                      <div className={`text-xs ${member.avgResponseTime < 2 ? 'text-green-600' : 'text-amber-600'}`}>
                        {member.avgResponseTime < 2 ? 'Excellent' : 'Average'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center">
                      <div>{member.successRate}%</div>
                      <Progress 
                        value={member.successRate} 
                        className="h-1.5 w-16" 
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {member.completedSessions}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <span className={`flex items-center ${member.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {member.improvement >= 0 ? (
                          <ArrowUpRight className="mr-1 h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="mr-1 h-3 w-3" />
                        )}
                        {Math.abs(member.improvement)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{member.focus}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Skills Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Response Time Analysis</CardTitle>
            <CardDescription>Average response time by objection type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Price', avg: 2.1, best: 1.2 },
                    { name: 'Need', avg: 2.5, best: 1.4 },
                    { name: 'Timing', avg: 2.3, best: 1.6 },
                    { name: 'Competition', avg: 3.2, best: 1.9 },
                    { name: 'Authority', avg: 2.7, best: 1.7 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar name="Team Average (s)" dataKey="avg" fill="#93c5fd" />
                  <Bar name="Best Performer (s)" dataKey="best" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Success Rate by Scenario</CardTitle>
            <CardDescription>Percentage of successful objection handling</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Price', avg: 68, best: 84 },
                    { name: 'Need', avg: 72, best: 89 },
                    { name: 'Timing', avg: 65, best: 81 },
                    { name: 'Competition', avg: 70, best: 85 },
                    { name: 'Authority', avg: 63, best: 79 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar name="Team Average (%)" dataKey="avg" fill="#86efac" />
                  <Bar name="Best Performer (%)" dataKey="best" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamAnalytics;
