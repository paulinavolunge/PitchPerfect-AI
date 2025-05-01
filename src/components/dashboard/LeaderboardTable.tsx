
import React from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Medal, Users, ChartBarIncreasing } from 'lucide-react';

// Sample data for demonstration purposes
// In a real app, this would come from database/API
const sampleTeamData = [
  { id: 1, name: 'Alex Johnson', improvementDelta: 24, rawScore: 87, streak: 6 },
  { id: 2, name: 'Jamie Smith', improvementDelta: 18, rawScore: 92, streak: 4 },
  { id: 3, name: 'Taylor Brown', improvementDelta: 15, rawScore: 78, streak: 8 },
  { id: 4, name: 'Casey Williams', improvementDelta: 12, rawScore: 81, streak: 3 },
  { id: 5, name: 'Jordan Miller', improvementDelta: 9, rawScore: 90, streak: 5 },
  { id: 6, name: 'Riley Davis', improvementDelta: 7, rawScore: 85, streak: 2 },
];

interface LeaderboardTableProps {
  showImprovementOnly?: boolean;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ showImprovementOnly = true }) => {
  // Sort by improvement delta by default
  const sortedData = [...sampleTeamData].sort((a, b) => b.improvementDelta - a.improvementDelta);
  
  // Function to determine which medal to show (if any)
  const getMedalIcon = (position: number) => {
    if (position === 0) return <Medal className="h-4 w-4 text-yellow-500" />; // Gold
    if (position === 1) return <Medal className="h-4 w-4 text-gray-400" />; // Silver
    if (position === 2) return <Medal className="h-4 w-4 text-amber-700" />; // Bronze
    return null;
  };

  return (
    <Card>
      <CardHeader className="bg-brand-blue/10 flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-xl text-brand-dark flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Leaderboard
        </CardTitle>
        <div className="text-sm text-brand-dark/70 flex items-center gap-1.5">
          <ChartBarIncreasing className="h-4 w-4" />
          <span>By Improvement</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">Rank</TableHead>
              <TableHead>Team Member</TableHead>
              <TableHead className="text-right">Improvement</TableHead>
              {!showImprovementOnly && (
                <>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Streak</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((member, index) => (
              <TableRow key={member.id}>
                <TableCell className="text-center font-medium">
                  <div className="flex justify-center items-center">
                    {getMedalIcon(index) || index + 1}
                  </div>
                </TableCell>
                <TableCell>{member.name}</TableCell>
                <TableCell className="text-right">
                  <span className="text-green-600">+{member.improvementDelta}%</span>
                </TableCell>
                {!showImprovementOnly && (
                  <>
                    <TableCell className="text-right">{member.rawScore}</TableCell>
                    <TableCell className="text-right">{member.streak} days</TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LeaderboardTable;
