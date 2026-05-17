import React from 'react';

const HEADERS = [
  '',
  'PitchPerfect AI',
  'Yoodli ($11/mo)',
  'Hyperbound (enterprise)',
  'Trellus ($60/mo)',
] as const;

const ROWS: Array<{ feature: string; pp: string; yoodli: string; hyper: string; trellus: string }> = [
  {
    feature: 'Free demo without signup',
    pp:      '✓',
    yoodli:  '✗ (5 lifetime free)',
    hyper:   '✓ (9 bots)',
    trellus: '✗',
  },
  {
    feature: 'One-time pricing option',
    pp:      '✓ ($4.99)',
    yoodli:  '✗',
    hyper:   '✗',
    trellus: '✗',
  },
  {
    feature: 'Built for solo reps',
    pp:      '✓',
    yoodli:  '✓',
    hyper:   '✗ (25-seat min)',
    trellus: '✗',
  },
  {
    feature: 'Specific objection-handling practice',
    pp:      '✓',
    yoodli:  '✗ (general comms)',
    hyper:   '✓',
    trellus: '✗ (real-time only)',
  },
  {
    feature: 'Mobile-first practice',
    pp:      '✓',
    yoodli:  '✓',
    hyper:   '✗',
    trellus: '✗',
  },
  {
    feature: 'Starts at',
    pp:      '$4.99 one-time',
    yoodli:  '$11/mo',
    hyper:   'Custom',
    trellus: '$60/user/mo',
  },
];

function cellClass(val: string, isPP: boolean): string {
  if (isPP) return 'text-blue-600 font-semibold';
  if (val.startsWith('✓')) return 'text-emerald-600';
  if (val.startsWith('✗')) return 'text-gray-400';
  return 'text-gray-600';
}

const ComparisonTable: React.FC = () => (
  <section className="mt-12 mb-8" aria-label="Competitor comparison">
    <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">How we compare</h2>
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full min-w-[620px] text-sm border-collapse">
        <thead>
          <tr>
            {HEADERS.map((col, i) => (
              <th
                key={i}
                scope="col"
                className={[
                  'text-left py-3 px-4 font-semibold border-b-2 border-gray-200',
                  i === 0 ? 'text-gray-400 w-44' :
                  i === 1 ? 'text-blue-600 bg-blue-50' :
                  'text-gray-500',
                ].join(' ')}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, ri) => {
            const cells = [row.pp, row.yoodli, row.hyper, row.trellus];
            return (
              <tr key={ri} className={ri % 2 === 1 ? 'bg-gray-50/60' : ''}>
                <td className="py-3 px-4 text-gray-700 font-medium border-b border-gray-100">
                  {row.feature}
                </td>
                {cells.map((val, ci) => (
                  <td
                    key={ci}
                    className={[
                      'py-3 px-4 border-b border-gray-100',
                      ci === 0 ? 'bg-blue-50' : '',
                      cellClass(val, ci === 0),
                    ].join(' ')}
                  >
                    {val}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </section>
);

export default ComparisonTable;
