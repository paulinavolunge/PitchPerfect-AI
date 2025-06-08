
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BarChart, Calendar } from 'lucide-react';

const Progress = () => {
  const mockData = {
    totalSessions: 12,
    lastWeekSessions: 5,
    averageScore: 82,
    recentScores: [76, 82, 85, 79, 88]
  };

  return (
    <>
      <Helmet>
        <title>Progress Tracking - PitchPerfect AI Dashboard</title>
        <meta name="description" content="Track your sales practice progress with detailed analytics, performance scores, and session history on PitchPerfect AI." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-grow pt-20 pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold text-brand-dark mb-6">Your Progress</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-brand-blue" />
                      Practice Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-brand-dark mb-1">
                      {mockData.totalSessions}
                    </div>
                    <p className="text-sm text-brand-dark/70">
                      {mockData.lastWeekSessions} sessions this week
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart className="h-5 w-5 text-brand-blue" />
                      Average Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-brand-dark mb-1">
                      {mockData.averageScore}%
                    </div>
                    <p className="text-sm text-brand-dark/70">
                      Based on clarity, engagement, and pacing
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockData.recentScores.map((score, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">Practice Session {mockData.totalSessions - index}</p>
                            <p className="text-sm text-brand-dark/70">Product Demo Pitch</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{score}%</span>
                          <div className={`text-xs px-2 py-1 rounded ${
                            score >= 85 ? 'bg-green-100 text-green-800' :
                            score >= 75 ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {score >= 85 ? 'Excellent' : score >= 75 ? 'Good' : 'Fair'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Progress;
