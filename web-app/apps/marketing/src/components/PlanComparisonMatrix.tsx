import React, { useState } from 'react';
import { QUESTION_INVENTORY } from '@acepharm/preferences';
import { Check, X, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface FeatureRow {
  category: string;
  name: string;
  description?: string;
  free: string | boolean;
  pro: string | boolean;
}

const COMPARISON_FEATURES: FeatureRow[] = [
  // 1. Question Bank & Mocks
  {
    category: 'Question Bank & Mocks',
    name: 'Practice Questions Monthly Access',
    free: '30 questions / month',
    pro: `Unlimited full bank (${QUESTION_INVENTORY.totalLiveCount.toLocaleString()} revision scenarios)`,
  },
  {
    category: 'Question Bank & Mocks',
    name: 'GPhC Paper 1 & Paper 2 Timed Exam Mocks',
    free: 'Sample 10-item demo',
    pro: 'Full timed mocks with Pearson VUE countdown',
  },
  {
    category: 'Question Bank & Mocks',
    name: 'Detailed Option Rationale & Guidance Citations',
    free: true,
    pro: true,
  },
  {
    category: 'Question Bank & Mocks',
    name: 'Pearson VUE Built-in Calculator & Lab Ranges',
    free: true,
    pro: true,
  },

  // 2. AI Tutor & Diagnostic Coaching
  {
    category: 'AI Tutoring & Coaching',
    name: 'Ace AI Tutor (Available 24/7)',
    description: 'Conversational mentoring with BNF / NICE guideline citations',
    free: false,
    pro: 'Unlimited enquiries & step explanations',
  },
  {
    category: 'AI Tutoring & Coaching',
    name: 'Interactive Consultation Simulation',
    description: 'Patient exchange scenarios with structured clinical rubric evaluations',
    free: '1 introductory scenario',
    pro: 'Full scenario bank across all sectors',
  },
  {
    category: 'AI Tutoring & Coaching',
    name: 'Personalized Weekly Clinical Insights',
    free: false,
    pro: true,
  },

  // 3. Spaced Repetition & Analytics
  {
    category: 'Spaced Repetition & Analytics',
    name: 'SM-2 Algorithm Clinical Flashcard Decks',
    free: false,
    pro: 'Automated daily spaced drills',
  },
  {
    category: 'Spaced Repetition & Analytics',
    name: 'Diagnostic Weak Area Generator',
    description: 'Generates targeted drills based on low first-attempt accuracy',
    free: false,
    pro: true,
  },
  {
    category: 'Spaced Repetition & Analytics',
    name: 'Isolated First-Attempt vs Practice Calibration',
    free: true,
    pro: true,
  },
  {
    category: 'Spaced Repetition & Analytics',
    name: 'Subtopic Personal Clinical Notes & Bookmarks',
    free: true,
    pro: true,
  },
];

export default function PlanComparisonMatrix() {
  const [isExpanded, setIsExpanded] = useState(true);

  // Group by category
  const categories = Array.from(new Set(COMPARISON_FEATURES.map((f) => f.category)));

  return (
    <div className="mt-16 space-y-8">
      {/* Comparison Section Card */}
      <div className="bg-surface border border-border rounded-card shadow-xs overflow-hidden">
        {/* Header Controls */}
        <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-ink">Feature Comparison Matrix</h2>
            <p className="text-xs text-slate mt-0.5">Full side-by-side breakdown of the AcePharm revision tiers.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo hover:text-indigo-deep transition-colors px-2.5 py-1 rounded-md hover:bg-indigo-wash"
          >
            <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isExpanded && (
          <>
            {/* 1. Mobile-friendly Clean Card Breakdown (< md screens) */}
            <div className="md:hidden divide-y divide-border">
              {categories.map((category) => (
                <div key={category} className="p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo shrink-0" />
                    <h3 className="text-xs font-bold text-ink uppercase tracking-wider">{category}</h3>
                  </div>

                  <div className="space-y-3">
                    {COMPARISON_FEATURES.filter((f) => f.category === category).map((row) => (
                      <div key={row.name} className="p-3 rounded-xl bg-canvas border border-border/80 space-y-2.5">
                        <div>
                          <div className="font-semibold text-xs text-ink">{row.name}</div>
                          {row.description && (
                            <div className="text-[11px] text-slate mt-0.5">{row.description}</div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                          {/* Free column */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate uppercase tracking-wider block">Explorer</span>
                            <div>
                              {typeof row.free === 'boolean' ? (
                                row.free ? (
                                  <span className="inline-flex items-center gap-1 text-teal font-semibold text-[11px]">
                                    <Check className="w-3.5 h-3.5" /> Included
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-slate-lighter text-[11px]">
                                    <X className="w-3.5 h-3.5" /> No
                                  </span>
                                )
                              ) : (
                                <span className="font-medium text-[11px] text-slate">{row.free}</span>
                              )}
                            </div>
                          </div>

                          {/* Pro column */}
                          <div className="space-y-1 bg-indigo/[0.04] p-1.5 rounded-lg -m-1">
                            <span className="text-[10px] font-bold text-indigo uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-indigo" /> Pro
                            </span>
                            <div>
                              {typeof row.pro === 'boolean' ? (
                                row.pro ? (
                                  <span className="inline-flex items-center gap-1 text-teal font-bold text-[11px]">
                                    <Check className="w-3.5 h-3.5" /> Included
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-slate-lighter text-[11px]">
                                    <X className="w-3.5 h-3.5" /> No
                                  </span>
                                )
                              ) : (
                                <span className="font-bold text-indigo text-[11px]">{row.pro}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 2. Desktop High-Density Table (>= md screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-canvas border-b border-border text-slate">
                    <th className="py-3.5 px-6 font-bold uppercase tracking-wider w-1/2">Revision Feature</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-center w-1/4">Explorer (Free)</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-center w-1/4 bg-indigo/5 text-indigo">
                      AcePharm Pro
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categories.map((category) => (
                    <React.Fragment key={category}>
                      <tr className="bg-canvas/60">
                        <td colSpan={3} className="py-2.5 px-6 font-bold text-ink uppercase tracking-wider text-[11px] bg-canvas">
                          {category}
                        </td>
                      </tr>
                      {COMPARISON_FEATURES.filter((f) => f.category === category).map((row) => (
                        <tr key={row.name} className="hover:bg-canvas/40 transition-colors">
                          <td className="py-3 px-6 text-ink">
                            <div className="font-semibold">{row.name}</div>
                            {row.description && (
                              <div className="text-[11px] text-slate mt-0.5">{row.description}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center text-slate">
                            {typeof row.free === 'boolean' ? (
                              row.free ? (
                                <span className="text-teal font-bold text-sm">✓</span>
                              ) : (
                                <span className="text-slate-lighter text-sm">✕</span>
                              )
                            ) : (
                              <span className="font-medium text-[11px]">{row.free}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center bg-indigo/[0.02]">
                            {typeof row.pro === 'boolean' ? (
                              row.pro ? (
                                <span className="text-teal font-bold text-sm">✓</span>
                              ) : (
                                <span className="text-slate-lighter text-sm">✕</span>
                              )
                            ) : (
                              <span className="font-bold text-indigo text-[11px]">{row.pro}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
