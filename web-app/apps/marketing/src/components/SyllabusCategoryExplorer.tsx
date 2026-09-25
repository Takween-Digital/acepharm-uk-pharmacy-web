import React, { useState, useMemo } from 'react';
import { Card, Button } from '@acepharm/ui';
import { QUESTION_INVENTORY, type CategoryQuestionStat } from '@acepharm/preferences';

export interface CategoryInfo {
  id: string;
  name: string;
  weighting: 'High' | 'Medium' | 'Low';
  bnfChapter: string;
  questionCount: number;
  description: string;
  keyTopics: string[];
  status?: 'live' | 'authoring';
}

const GPHC_CATEGORIES: CategoryInfo[] = QUESTION_INVENTORY.categories.map((cat: CategoryQuestionStat) => ({
  id: cat.id,
  name: cat.name,
  weighting: cat.weighting,
  bnfChapter: cat.bnfChapter,
  questionCount: cat.count,
  description: cat.description,
  keyTopics: cat.keyTopics,
  status: cat.status || 'live',
}));


export default function SyllabusCategoryExplorer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeighting, setSelectedWeighting] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');

  const filteredCategories = useMemo(() => {
    return GPHC_CATEGORIES.filter((cat) => {
      const matchesSearch =
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.bnfChapter.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.keyTopics.some((topic) => topic.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesWeighting = selectedWeighting === 'All' || cat.weighting === selectedWeighting;

      return matchesSearch && matchesWeighting;
    });
  }, [searchTerm, selectedWeighting]);

  const totalFilteredQuestions = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + cat.questionCount, 0);
  }, [filteredCategories]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-4 sm:p-5 rounded-card border border-border shadow-xs">
        {/* Search Input */}
        <div className="w-full sm:w-72">
          <label htmlFor="syllabus-search" className="sr-only">Search GPhC categories</label>
          <input
            id="syllabus-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search topic (e.g., Asthma, DOAC, MEP)..."
            className="w-full text-xs sm:text-sm py-2 px-3 rounded-btn border border-border bg-canvas text-ink placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-all"
          />
        </div>

        {/* Weighting Pills Filter */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate whitespace-nowrap mr-1">GPhC Weighting:</span>
          {(['All', 'High', 'Medium', 'Low'] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setSelectedWeighting(w)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                selectedWeighting === w
                  ? 'bg-indigo text-white border-indigo shadow-xs'
                  : 'bg-canvas border-border text-slate hover:text-ink'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Count Stats */}
      <div className="flex items-center justify-between text-xs text-slate px-1">
        <span>
          Showing <strong>{filteredCategories.length}</strong> GPhC curriculum categories
        </span>
        <span>
          <strong>{totalFilteredQuestions}</strong> authentic revision scenarios live in view ({QUESTION_INVENTORY.totalLiveCount}+ total bank)
        </span>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => (
          <Card
            key={cat.id}
            className="p-5 bg-surface border border-border hover:border-indigo/50 hover:shadow-card transition-all rounded-card flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-mono font-semibold text-slate whitespace-normal break-words leading-tight">
                  {cat.bnfChapter}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${
                    cat.weighting === 'High'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : cat.weighting === 'Medium'
                      ? 'bg-amber-light text-amber border-amber/20'
                      : 'bg-slate-lighter/50 text-slate border-slate-lighter'
                  }`}
                >
                  {cat.weighting} Weight
                </span>
              </div>

              <h3 className="text-base font-bold text-ink group-hover:text-indigo transition-colors leading-tight break-words">
                {cat.name}
              </h3>

              <p className="text-xs text-slate leading-relaxed break-words">
                {cat.description}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-border/60">
              {/* Key topics clickable filter pills (AP-24) */}
              <div className="flex flex-wrap gap-1.5 items-center">
                {cat.keyTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setSearchTerm(topic)}
                    className="text-[10px] font-medium bg-canvas hover:bg-indigo hover:text-white text-slate border border-border/80 hover:border-indigo px-2 py-0.5 rounded transition-all cursor-pointer whitespace-normal break-words leading-tight max-w-full inline-block"
                    title={`Filter by ${topic}`}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs pt-1 gap-2">
                <span className="font-semibold text-ink font-mono text-[11px]">
                  {cat.questionCount > 0 ? `${cat.questionCount} Questions Live` : 'In Review Queue'}
                </span>
                <a
                  href="https://app.acepharmexams.co.uk/auth/register"
                  className="inline-flex items-center justify-center gap-1 font-bold text-xs px-3 py-1.5 rounded-btn bg-indigo text-white hover:bg-indigo-deep transition-all shadow-xs whitespace-nowrap"
                  title={cat.questionCount > 0 ? `Practise ${cat.name}` : `View ${cat.name} syllabus`}
                >
                  {cat.questionCount > 0 ? 'Practise Topic' : 'View Syllabus'}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12 bg-surface border border-dashed border-border rounded-card space-y-3">
          <p className="text-sm font-semibold text-ink">No categories match &quot;{searchTerm}&quot;</p>
          <p className="text-xs text-slate max-w-sm mx-auto">
            Try searching for other clinical terms like &apos;Cardio&apos;, &apos;NICE&apos;, &apos;MEP&apos;, &apos;Diabetes&apos; or reset the filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSearchTerm(''); setSelectedWeighting('All'); }}
            className="text-xs mt-2"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
