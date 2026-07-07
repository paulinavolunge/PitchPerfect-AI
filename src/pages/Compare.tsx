
import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Check, X } from 'lucide-react';

const Compare = () => {
  const comparisonData = [
    {
      feature: 'Getting started',
      pitchPerfect: true,
      competitors: false,
      note: 'Free round in 90 seconds, no signup. Most enterprise tools require booking a demo call first, then waiting days for a slot.'
    },
    {
      feature: 'Pricing',
      pitchPerfect: true,
      competitors: 'limited',
      note: '$29/month, cancel anytime. Most competitors require a custom quote and annual contract.'
    },
    {
      feature: 'Seat minimum',
      pitchPerfect: true,
      competitors: false,
      note: 'None. Works for a team of one. Many enterprise tools require 5+ seats minimum.'
    },
    {
      feature: 'Who sees your scores',
      pitchPerfect: true,
      competitors: false,
      note: "Just you. Most team-focused tools put your scores on a manager's dashboard."
    },
    {
      feature: 'Built for',
      pitchPerfect: true,
      competitors: 'limited',
      note: 'An individual rep who wants to get better. Most competitors are built to be rolled out by a sales org.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>PitchPerfect AI vs Enterprise Sales Training Tools</title>
        <meta name="description" content="Most AI sales roleplay tools are built for sales orgs buying seats for a whole team. See what's different about a tool built for one rep instead." />
        <meta name="keywords" content="sales tool comparison, AI SDR tools, cold call practice, sales roleplay, objection handling practice" />
        <meta property="og:title" content="PitchPerfect AI vs Enterprise Sales Training Tools" />
        <meta property="og:description" content="No demo call, no seat minimum, no manager dashboard. Built for the rep, not the sales org." />
        <link rel="canonical" href={`${window.location.origin}/compare`} />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold mb-2 text-deep-navy">Why not an enterprise sales tool instead?</h1>
              <p className="text-deep-navy/80 mb-8">
                Most AI roleplay tools are built for VPs buying seats for a whole team, with a demo call before you even get to try it. Your next objection isn't waiting for a sales cycle. Here's what changes when it's built for one rep instead, starting right now.
              </p>
              
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-vibrant-blue-50">
                      <TableHead className="font-bold text-deep-navy">Feature</TableHead>
                      <TableHead className="font-bold text-primary-600">PitchPerfect AI</TableHead>
                      <TableHead className="font-bold text-deep-navy/70">Other AI SDR Tools</TableHead>
                      <TableHead className="font-bold text-deep-navy">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.feature}</TableCell>
                        <TableCell>
                          {row.pitchPerfect ? (
                            <Check className="h-5 w-5 text-primary-600" />
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          {typeof row.competitors === 'boolean' ? (
                            row.competitors ? (
                              <Check className="h-5 w-5 text-primary-600" />
                            ) : (
                              <X className="h-5 w-5 text-red-500" />
                            )
                          ) : (
                            <span className="text-amber-500 flex items-center">
                              ⚠️ {row.competitors}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.note}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-deep-navy">Built for the rep, not the sales org</h2>
                <p className="text-deep-navy/80 mb-4">
                  I'm an introvert. Roleplaying objections live, in front of a room of coworkers, was genuinely
                  nerve-wracking for me, not something a confident VP shopping for a training platform worries about.
                  Most tools in this space are built to be sold to a sales org: a manager watching a dashboard,
                  a demo call before you can even try it, a contract sized for a whole team, weeks before anyone
                  actually gets to practice.
                </p>
                <p className="text-deep-navy/80 mb-4">
                  PitchPerfect AI skips all of that. You find out if it actually helps you in the time it takes
                  to make one practice call, not a 30-minute sales pitch to buy a tool that's supposed to help you sell.
                </p>
                <p className="text-deep-navy/80 mb-4">
                  Your next real objection is coming this week, whether you've practiced or not. If you're already
                  inside a sales org with budget for an enterprise platform and a manager who wants to track the
                  whole team, those tools might be the right fit. If you're the rep who wants to stop freezing on
                  the same objection, on your own time, with no one else seeing your scores, that's exactly who
                  this is for.
                </p>
                <p className="font-medium text-primary-600">
                  Try your first round free, right now. No demo call required.
                </p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Compare;
