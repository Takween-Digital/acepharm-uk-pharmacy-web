'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Badge, Card } from '@acepharm/ui';
import { apiClient } from '@/lib/api-client';
import { QUESTION_INVENTORY } from '@acepharm/preferences';
import { 
  Play, 
  Timer, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  SlidersHorizontal, 
  Flame, 
  Clock, 
  Target,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface CategoryOption {
  id: string;
  name: string;
  count: number;
  subtopics: { id: string; name: string; count: number }[];
}

const CATEGORIES_DATA: CategoryOption[] = QUESTION_INVENTORY.categories
  .filter((c) => c.count > 0)
  .map((c) => ({
    id: c.id,
    name: c.name,
    count: c.count,
    subtopics: (c.subtopics || []).map((s) => ({
      id: s.id,
      name: s.name,
      count: s.count,
    })),
  }));

export function SessionBuilder() {
  const [categories, setCategories] = useState<CategoryOption[]>(CATEGORIES_DATA);
  const [mode, setMode] = useState<'learn' | 'timed'>('learn');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(['cat-cv', 'cat-resp']);
  const [selectedSubtopicIds, setSelectedSubtopicIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unattempted' | 'incorrect' | 'due_for_review'>('all');
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [isStarting, setIsStarting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.acepharmexams.co.uk';

  useEffect(() => {
    async function loadLiveCurriculum() {
      try {
        const res = await fetch(`${API_URL}/api/v1/curriculum/tree`);
        const searchParams = new URLSearchParams(window.location.search);
        const preselectedCat = searchParams.get('categoryId');
        const topicId = searchParams.get('topicId');
        const countParam = searchParams.get('count');
        const modeParam = searchParams.get('mode');

        if (countParam && !isNaN(Number(countParam))) {
          setQuestionCount(Number(countParam));
        }
        if (modeParam === 'diagnostic') {
          setStatusFilter('unattempted');
        }
        if (modeParam === 'drill' && topicId) {
          // For drill mode, pre-select the topic and set appropriate parameters
          setSelectedSubtopicIds([topicId]);
          setQuestionCount(10); // Default to 10 questions for drill
        }

        if (res.ok) {
          const data = await res.json();
          const pathway = data.pathways?.[0];
          const inventoryMap = new Map(QUESTION_INVENTORY.categories.map((c) => [c.id, c]));
          if (pathway && pathway.categories && pathway.categories.length > 0) {
            const mapped: CategoryOption[] = pathway.categories
              .filter((c: any) => (inventoryMap.get(c.id)?.count ?? 0) > 0)
              .map((c: any) => {
                const inv = inventoryMap.get(c.id);
                return {
                  id: c.id,
                  name: c.name,
                  count: inv?.count || (c.subtopics?.length || 1) * 5,
                  subtopics: (c.subtopics || []).map((sub: any) => {
                    const subMatch = inv?.subtopics?.find((s) => s.id === sub.id);
                    return {
                      id: sub.id,
                      name: sub.name,
                      count: subMatch?.count || 5,
                    };
                  }),
                };
              });
            setCategories(mapped);
            if (preselectedCat && mapped.some((m) => m.id === preselectedCat)) {
              setSelectedCategoryIds([preselectedCat]);
            } else if (modeParam === 'diagnostic') {
              // For diagnostic baseline, select top therapeutic categories
              setSelectedCategoryIds(mapped.slice(0, 5).map((c) => c.id));
            } else if (mapped.length > 0) {
              setSelectedCategoryIds(mapped.slice(0, 2).map((c) => c.id));
            }
          }
        } else if (preselectedCat) {
          setSelectedCategoryIds([preselectedCat]);
        }
      } catch (e) {
        console.warn('Could not load live curriculum categories in session builder:', e);
      }
    }
    loadLiveCurriculum();
  }, []);

  // Toggle Category selection
  const handleToggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleSelectAllCategories = () => {
    if (selectedCategoryIds.length === categories.length) {
      setSelectedCategoryIds([]);
    } else {
      setSelectedCategoryIds(categories.map((c) => c.id));
    }
  };

  // Estimate total matched pool
  const totalAvailableInSelection = categories
    .filter((c) => selectedCategoryIds.includes(c.id))
    .reduce((acc, c) => acc + c.count, 0);

  const effectiveCount = Math.min(questionCount, totalAvailableInSelection || 1);

  const handleStartSession = async () => {
    setIsStarting(true);
    const catQuery = selectedCategoryIds.join(',');

    try {
      const data = await apiClient.post('/api/v1/sessions/create', {
        mode,
        questionCount: effectiveCount,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        statusFilter: statusFilter !== 'all' ? statusFilter : undefined,
      });

      sessionStorage.setItem('acepharm_active_session', JSON.stringify(data));
      window.location.href = `/session/active?mode=${mode}&count=${effectiveCount}&categories=${encodeURIComponent(catQuery)}&filter=${statusFilter}`;
    } catch (err: any) {
      console.error('Session creation failed:', err);
      alert(err.message || 'Failed to create session. Please try again.');
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate hover:text-ink px-2.5 py-1.5 rounded-btn bg-surface border border-border hover:border-slate transition-all shadow-2xs"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180 text-indigo" />
              <span>Back</span>
            </a>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo/10 text-indigo">
                <SlidersHorizontal className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-ink">Custom Practice Session Builder</h1>
            </div>
          </div>
          <p className="text-sm text-slate mt-1">
            Tailor your GPhC revision by clinical system, attempt history, and exam timing mode.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {QUESTION_INVENTORY.totalLiveCount} Questions Live
          </Badge>
        </div>
      </div>

      {/* 1. Mode Selection (Learn Mode vs Timed Exam) */}
      <Card className="p-5 bg-surface border-border space-y-4">
        <h2 className="text-sm font-bold text-ink flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo" /> 1. Select Practice Mode
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setMode('learn')}
            className={`p-4 rounded-card border text-left transition-all ${
              mode === 'learn'
                ? 'border-indigo bg-indigo/5 shadow-sm ring-1 ring-indigo'
                : 'border-border bg-canvas/40 hover:bg-canvas'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-sm text-ink flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo" /> Learn Mode (Recommended)
              </span>
              {mode === 'learn' && <Badge variant="success" className="text-[10px]">Active</Badge>}
            </div>
            <p className="text-xs text-slate leading-relaxed">
              Instant per-option feedback after each question with BNF rationales, confidence capture, and Ace AI guidance.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode('timed')}
            className={`p-4 rounded-card border text-left transition-all ${
              mode === 'timed'
                ? 'border-indigo bg-indigo/5 shadow-sm ring-1 ring-indigo'
                : 'border-border bg-canvas/40 hover:bg-canvas'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-sm text-ink flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-teal" /> Timed Exam Simulation
              </span>
              {mode === 'timed' && <Badge variant="success" className="text-[10px]">Active</Badge>}
            </div>
            <p className="text-xs text-slate leading-relaxed">
              Simulates real GPhC Paper 1 & Paper 2 timing (90s per question). Full review and scoring grid presented at the end.
            </p>
          </button>
        </div>
      </Card>

      {/* 2. Question Pool & Attempt Status Filter */}
      <Card className="p-5 bg-surface border-border space-y-4">
        <h2 className="text-sm font-bold text-ink flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500" /> 2. Question Pool / Attempt History
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'all', label: 'All Questions', desc: 'Full active pool' },
            { id: 'unattempted', label: 'Unattempted Only', desc: 'Fresh questions' },
            { id: 'incorrect', label: 'Incorrect Previous', desc: 'Focus on mistakes' },
            { id: 'due_for_review', label: 'Due for Review', desc: 'Spaced repetition' },
          ].map((status) => (
            <button
              key={status.id}
              type="button"
              onClick={() => setStatusFilter(status.id as any)}
              className={`p-3 rounded-lg border text-left transition-all ${
                statusFilter === status.id
                  ? 'border-indigo bg-indigo/10 text-indigo font-semibold shadow-sm'
                  : 'border-border bg-canvas text-slate hover:text-ink'
              }`}
            >
              <span className="text-xs block font-bold text-ink">{status.label}</span>
              <span className="text-[10px] text-slate mt-0.5 block">{status.desc}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* 3. Curriculum Categories Selector */}
      <Card className="p-5 bg-surface border-border space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo" /> 3. Select Clinical Categories
            </h2>
            <p className="text-xs text-slate">
              Choose one or more high-yield therapeutic systems from the GPhC syllabus.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSelectAllCategories}
            className="text-xs font-semibold text-indigo hover:text-indigo-deep transition-colors"
          >
            {selectedCategoryIds.length === CATEGORIES_DATA.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((cat) => {
            const isSelected = selectedCategoryIds.includes(cat.id);
            return (
              <div
                key={cat.id}
                onClick={() => handleToggleCategory(cat.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-indigo bg-indigo/5 text-ink shadow-sm'
                    : 'border-border bg-canvas/50 text-slate hover:text-ink hover:bg-canvas'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // Handled by parent div
                    className="h-4 w-4 rounded text-indigo focus:ring-indigo cursor-pointer"
                  />
                  <span className="text-xs font-medium text-ink">{cat.name}</span>
                </div>
                <Badge variant={isSelected ? 'default' : 'outline'} className="text-[10px] font-mono">
                  {cat.count} Qs
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 4. Question Count Slider & Launch Bar */}
      <Card className="p-5 bg-surface border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo" /> 4. Number of Questions
          </h2>
          <span className="text-base font-bold text-indigo font-mono bg-indigo/10 px-3 py-1 rounded-md">
            {questionCount} Questions
          </span>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full h-2 bg-canvas rounded-lg appearance-none cursor-pointer accent-indigo"
          />
          <div className="flex justify-between text-[11px] text-slate font-mono">
            <span>5 Qs (Quick)</span>
            <span>10 Qs</span>
            <span>20 Qs (Standard)</span>
            <span>35 Qs</span>
            <span>50 Qs (Full Mock)</span>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate">
            Pool matched: <strong className="text-ink">{totalAvailableInSelection} questions available</strong> • Est. time: ~{effectiveCount * 1.5} mins
          </div>

          <Button
            variant="primary"
            size="lg"
            disabled={totalAvailableInSelection === 0 || isStarting}
            onClick={handleStartSession}
            className="w-full sm:w-auto flex items-center justify-center gap-2 shadow-md text-sm px-6 py-2.5 font-semibold"
          >
            <Play className="w-4 h-4 fill-current" />
            {isStarting ? 'Preparing Session...' : `Start Session (${effectiveCount} Questions)`}
          </Button>
        </div>
      </Card>
    </div>
  );
}
