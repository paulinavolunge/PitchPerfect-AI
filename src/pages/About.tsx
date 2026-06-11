import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Linkedin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import paulinaPhoto from '@/assets/paulina.jpg';

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
      <title>About. PitchPerfect AI</title>
      <meta
        name="description"
        content="Built on my last day at a sales job, because the tool I needed didn't exist. The honest story behind PitchPerfect AI."
      />
      <meta property="og:title" content="About. PitchPerfect AI" />
      <meta
        property="og:description"
        content="Built on my last day at a sales job, because the tool I needed didn't exist. The honest story behind PitchPerfect AI."
      />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content="About. PitchPerfect AI" />
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
            I'm Paulina. PitchPerfect AI started on my last day at a sales job. The tool I
            wished existed when I was preparing for cold calls. So I built it. For me, and for
            anyone else who's ever stared at the phone and stalled.
          </p>
        </section>

        {/* ── Founder: photo + story side-by-side ── */}
        <section className="px-4 pb-20 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8 md:gap-12 items-start">
            {/* Portrait — rectangular 3:4 */}
            <div className="w-full max-w-[300px] mx-auto md:mx-0 aspect-[3/4] overflow-hidden rounded-lg bg-purple-100">
              <img
                src={paulinaPhoto}
                alt="Paulina Vol, Founder of PitchPerfect AI"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Story + attribution */}
            <div>
              <div className="space-y-6 text-base sm:text-lg text-gray-700 leading-relaxed">
                <p>
                  I've worked in sales, and in clinical research, and in a few other things before
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
                  tool I wanted. For me, and now for anyone else who'd rather bomb a cold call in
                  private than on a real prospect.
                </p>
              </div>

              <div className="mt-8 text-sm text-gray-700">
                <span className="font-bold text-gray-900">Paulina Vol, Founder</span>
                <span className="text-gray-600 mx-2">·</span>
                {LINKEDIN_URL ? (
                  <a
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Paulina Vol on LinkedIn"
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    LinkedIn
                  </a>
                ) : (
                  <span className="text-gray-600">LinkedIn</span>
                )}
              </div>
            </div>
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
            Try a cold call free. No signup, no card, 90 seconds.
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
