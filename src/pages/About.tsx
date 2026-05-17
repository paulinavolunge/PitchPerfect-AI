import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Linkedin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const LINKEDIN_URL = 'https://www.linkedin.com/in/paulina-volungeviciute-235a503b/';

const BELIEFS = [
  {
    title: 'Practice in private',
    body: "Real prospects shouldn't be your practice field. The gym for cold calling should look like a gym.",
  },
  {
    title: 'Cold calling is a skill',
    body: 'Not a personality trait. Anyone willing to put in the reps can get measurably better at the phone.',
  },
  {
    title: 'Reps over theory',
    body: 'Ten minutes of practice beats sixty minutes of reading. PitchPerfect AI is built to be the fastest path from anxious to ready.',
  },
] as const;

const About: React.FC = () => (
  <>
    <Helmet>
      <title>About — PitchPerfect AI</title>
      <meta
        name="description"
        content="Built on my last day at a sales job, because the tool I needed didn't exist. The honest story behind PitchPerfect AI."
      />
      <meta property="og:title" content="About — PitchPerfect AI" />
      <meta
        property="og:description"
        content="Built on my last day at a sales job, because the tool I needed didn't exist. The honest story behind PitchPerfect AI."
      />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content="About — PitchPerfect AI" />
      <meta
        name="twitter:description"
        content="Built on my last day at a sales job, because the tool I needed didn't exist. The honest story behind PitchPerfect AI."
      />
    </Helmet>

    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow">

        {/* ── Hero ── */}
        <section className="px-4 pt-16 pb-12 text-center">
          <p className="text-xs font-bold tracking-widest uppercase text-purple-600 mb-3">
            About
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
            I built this because I needed it.
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            I'm Paulina. PitchPerfect AI started on my last day at a sales job — the tool I
            wished existed when I was preparing for cold calls. So I built it. For me, and for
            anyone else who's ever stared at the phone and stalled.
          </p>
        </section>

        {/* ── Founder card ── */}
        <section className="px-4 pb-16 flex justify-center">
          <div className="bg-white rounded-2xl shadow-md px-10 py-8 flex flex-col items-center gap-4 w-full max-w-xs">
            {/* Photo placeholder — swap for real headshot after deploy */}
            <div
              className="w-[200px] h-[200px] rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0"
              aria-label="Founder photo placeholder"
            >
              <span className="text-5xl font-bold text-purple-400 select-none">PV</span>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">Paulina Vol</p>
              <p className="text-sm text-gray-500">Founder, PitchPerfect AI</p>
            </div>
            {/* LinkedIn — update LINKEDIN_URL above once confirmed */}
            {LINKEDIN_URL ? (
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Paulina Vol on LinkedIn"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <Linkedin className="h-4 w-4" aria-hidden />
                LinkedIn
              </a>
            ) : (
              <span className="flex items-center gap-2 text-sm text-gray-300 cursor-default select-none">
                <Linkedin className="h-4 w-4" aria-hidden />
                LinkedIn
              </span>
            )}
          </div>
        </section>

        {/* ── The story ── */}
        <section className="px-4 pb-20 max-w-[800px] mx-auto">
          <div className="space-y-6 text-base sm:text-lg text-gray-700 leading-relaxed">
            <p>
              I've worked in sales — and in clinical research, and in a few other things before
              that. What kept coming back was the same problem on the phone: knowing what to say,
              then freezing when the prospect threw something I wasn't ready for.
            </p>
            <p>
              I looked for a way to practice in private. A tool where I could actually hear
              myself, get told where I sounded weak, and try again. The closest options were
              either expensive enterprise platforms (built for sales teams with budget) or generic
              communication coaches that didn't simulate real buyers. Nothing felt like what I
              actually needed: a low-pressure place to rep cold calls before real ones.
            </p>
            <p>
              So on my last day at a sales role, I decided to build it. PitchPerfect AI is the
              tool I wanted — for me, and now for anyone else who'd rather bomb a cold call in
              private than on a real prospect.
            </p>
          </div>
        </section>

        {/* ── What I believe ── */}
        <section className="px-4 pb-20 max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-10">What I believe</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BELIEFS.map(({ title, body }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
              >
                <p className="text-sm font-bold text-purple-600 uppercase tracking-wide mb-2">
                  {title}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer CTA ── */}
        <section className="px-4 pb-20 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Stop dreading the phone.
          </h2>
          <p className="text-base text-gray-600 mb-8">
            Try a cold call free — no signup, no card, 90 seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/practice"
              className="inline-block rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 transition-colors"
            >
              Try a cold call free
            </Link>
            <Link
              to="/pricing"
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              See pricing →
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  </>
);

export default About;
