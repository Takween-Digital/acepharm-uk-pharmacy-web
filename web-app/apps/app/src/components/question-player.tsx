'use client';

import React, { useState, useEffect } from 'react';
import { Button, Badge, Card, MarkdownRenderer } from '@acepharm/ui';
import { ReportQuestionModal } from '@/components/report-modal';
import { AskAcePanel } from '@/components/ask-ace-panel';
import { FloatingHighlightMenu } from '@/components/floating-highlight-menu';
import { FreeTierUpgradeModal } from '@/components/free-tier-upgrade-modal';
import { GphcCalculator } from '@/components/gphc-calculator';
import { ClinicalReferenceModal } from '@/components/clinical-reference-modal';
import { ProductTour } from '@/components/product-tour';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowRight, 
  Bookmark, 
  Flag, 
  Sparkles, 
  Clock, 
  Eye, 
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Stethoscope,
  Info,
  FileEdit,
  Save,
  Calculator,
  BookOpen,
  SlidersHorizontal,
  FileText,
  ShieldCheck,
  Zap,
  Check,
  X,
  Volume2,
  AlertCircle
} from 'lucide-react';
import { SessionStorageHelper, usePreferences, AuthStorage } from '@acepharm/preferences';
import { useAuth } from '@/lib/auth-context';

export interface Option {
  id: string;
  label: string;
  content: string;
  isCorrect?: boolean;
  rationale?: string;
}

export interface QuestionData {
  id: string;
  publicId: string;
  version: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'sba' | 'calculation';
  sector: 'community' | 'hospital' | 'gp' | 'any';
  stem: string;
  leadIn: string;
  options: Option[];
  explanation?: {
    summaryTakeaway: string;
    detailedExplanation: string;
    clinicalGuidanceReference?: string;
  };
}

const SAMPLE_QUESTION: QuestionData = {
  id: 'q-sample-1',
  publicId: 'ACP-CV-0012',
  version: 1,
  difficulty: 'medium',
  questionType: 'sba',
  sector: 'community',
  stem: 'A 62-year-old male of Afro-Caribbean heritage with a history of hypertension and osteoarthritis attends the community pharmacy for a blood pressure review. His clinic BP is 154/94 mmHg, confirmed with repeat daytime ABPM of 146/90 mmHg. He has no prior history of diabetes or renal impairment. Baseline U&Es are normal (eGFR > 90 mL/min/1.73m², K+ 4.4 mmol/L).',
  leadIn: 'According to NICE NG136 hypertension guidelines, which of the following is the most appropriate initial pharmacological therapy?',
  options: [
    {
      id: 'opt-a',
      label: 'A',
      content: 'Ramipril 2.5 mg once daily',
      isCorrect: false,
      rationale: 'Sub-optimal Step 1 for patients aged ≥ 55 or of Black African/African-Caribbean heritage without type 2 diabetes. Initial therapy is a CCB.',
    },
    {
      id: 'opt-b',
      label: 'B',
      content: 'Amlodipine 5 mg once daily',
      isCorrect: true,
      rationale: 'Correct choice. Under NICE NG136, initial (Step 1) antihypertensive monotherapy for patients of Black African or African-Caribbean origin without type 2 diabetes is a Calcium Channel Blocker (CCB).',
    },
    {
      id: 'opt-c',
      label: 'C',
      content: 'Indapamide 1.5 mg modified-release once daily',
      isCorrect: false,
      rationale: 'Thiazide-like diuretics are second-line (Step 2 in combination with CCB) or alternative Step 1 if a CCB is not tolerated or contraindicated (e.g. oedema).',
    },
    {
      id: 'opt-d',
      label: 'D',
      content: 'Losartan 50 mg once daily',
      isCorrect: false,
      rationale: 'ARBs are preferred over ACE inhibitors in Black patients if an RAAS inhibitor is indicated (e.g. in type 2 diabetes), but CCBs remain the preferred first-line agent here.',
    },
    {
      id: 'opt-e',
      label: 'E',
      content: 'Bisoprolol 2.5 mg once daily',
      isCorrect: false,
      rationale: 'Beta-blockers are no longer recommended as initial routine monotherapy for uncomplicated essential hypertension under NICE NG136.',
    },
  ],
  explanation: {
    summaryTakeaway: 'In adults of Black African or African-Caribbean heritage without type 2 diabetes, Step 1 antihypertensive monotherapy is a Calcium Channel Blocker (Amlodipine).',
    detailedExplanation: 'NICE NG136 specifies that for adults aged 55 and over, or adults of Black African or African-Caribbean origin of any age without type 2 diabetes, the first-line antihypertensive therapy is a calcium channel blocker (CCB). ACE inhibitors or ARBs have lower efficacy as monotherapy in these patient cohorts due to lower baseline plasma renin activity.',
    clinicalGuidanceReference: 'NICE Guideline NG136: Hypertension in adults: diagnosis and management (Updated 2023)',
  },
};

export function QuestionPlayer({
  question = SAMPLE_QUESTION,
  currentQuestionIndex = 1,
  totalQuestions = 20,
  sessionId,
  userPreferences = {
    showConfidencePrompt: true,
    hideOptionsByDefault: false,
    showDifficultyLabels: true,
  },
  onNext,
}: {
  question?: QuestionData;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  sessionId?: string;
  userPreferences?: {
    showConfidencePrompt: boolean;
    hideOptionsByDefault: boolean;
    showDifficultyLabels: boolean;
  };
  onNext?: () => void;
}) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high' | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [personalNote, setPersonalNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);
  const [hideOptions, setHideOptions] = useState(userPreferences.hideOptionsByDefault);
  const [showConfidencePrompt, setShowConfidencePrompt] = useState(userPreferences.showConfidencePrompt);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isRefModalOpen, setIsRefModalOpen] = useState(false);
  const [isMyNotesOpen, setIsMyNotesOpen] = useState(false);
  const [allNotes, setAllNotes] = useState<Array<{ questionId: string; questionPublicId: string; content: string; savedAt: string }>>([]);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [allBookmarks, setAllBookmarks] = useState<Array<{ questionId: string; questionPublicId: string; difficulty: string }>>([]);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Fetch all bookmarked questions
  const fetchAllBookmarks = () => {
    if (typeof window === 'undefined') return;
    const bookmarks: Array<{ questionId: string; questionPublicId: string; difficulty: string }> = [];

    try {
      const sessionsData = sessionStorage.getItem('acepharm_sessions');
      if (sessionsData) {
        const sessions = JSON.parse(sessionsData);
        Object.values(sessions).forEach((session: any) => {
          if (typeof session === 'object') {
            Object.values(session).forEach((question: any) => {
              if (question && typeof question === 'object' && question.isBookmarked) {
                bookmarks.push({
                  questionId: question.questionId || '',
                  questionPublicId: question.publicId || 'Unknown',
                  difficulty: question.difficulty || 'medium',
                });
              }
            });
          }
        });
      }
    } catch {
      // Ignored
    }

    setAllBookmarks(bookmarks);
  };

  // Fetch all saved notes from session storage
  const fetchAllNotes = () => {
    if (typeof window === 'undefined') return;
    const sessionKey = sessionId || 'adhoc-practice';
    const notes: Array<{ questionId: string; questionPublicId: string; content: string; savedAt: string }> = [];

    try {
      // Scan sessionStorage for all notes in this session
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(`acepharm_note_${sessionKey}_`)) {
          const content = sessionStorage.getItem(key) || '';
          const questionId = key.replace(`acepharm_note_${sessionKey}_`, '');
          // Try to get question public ID from session data
          const sessionsData = sessionStorage.getItem('acepharm_sessions');
          let publicId = `Q-${notes.length + 1}`;
          if (sessionsData) {
            try {
              const sessions = JSON.parse(sessionsData);
              if (sessions[sessionKey]?.[questionId]) {
                publicId = sessions[sessionKey][questionId].publicId || publicId;
              }
            } catch {
              // Ignored
            }
          }
          notes.push({
            questionId,
            questionPublicId: publicId,
            content,
            savedAt: new Date().toLocaleString(),
          });
        }
      }
    } catch {
      // Ignored
    }

    setAllNotes(notes);
  };

  // Show product tour on first question for first-time users
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentQuestionIndex === 1) {
      const tourCompleted = localStorage.getItem('acepharm_tour_completed');
      if (!tourCompleted) {
        setIsTourOpen(true);
      }
    }
  }, [currentQuestionIndex]);

  // Auto-save & resume state from SessionStorage for network resilience and reload recovery
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sessionKey = sessionId || 'adhoc-practice';

    // 1. Restore response state (selected option, confidence, submission state)
    const saved = SessionStorageHelper.getResponse(sessionKey, question.id);
    if (saved && saved.selectedOptionId) {
      // Only restore submitted state if there is a valid selectedOptionId
      setSelectedOptionId(saved.selectedOptionId);
      if (saved.confidence) setConfidence(saved.confidence);
      if (saved.isSubmitted) setIsSubmitted(true);
    } else {
      // Reset state for new question or corrupted saved data
      setSelectedOptionId(null);
      setConfidence(null);
      setIsSubmitted(false);
    }

    // 2. Restore drafted personal notes from session storage
    try {
      const savedNote = sessionStorage.getItem(`acepharm_note_${sessionKey}_${question.id}`);
      if (savedNote) {
        setPersonalNote(savedNote);
        setShowNotesDrawer(true);
      } else {
        setShowNotesDrawer(false);
        setPersonalNote('');
      }
    } catch {
      // Ignored if storage unavailable
    }

    // 3. Restore timer state
    try {
      const savedTime = sessionStorage.getItem(`acepharm_timer_${sessionKey}_${question.id}`);
      if (savedTime) {
        setSecondsElapsed(parseInt(savedTime, 10) || 0);
      } else {
        setSecondsElapsed(0);
      }
    } catch {
      // Ignored if storage unavailable
    }
  }, [sessionId, question.id]);

  const persistResponse = (optId: string | null, conf: any, submitted: boolean) => {
    if (typeof window === 'undefined') return;
    const sessionKey = sessionId || 'adhoc-practice';

    // Save to SessionStorageHelper for individual question state
    SessionStorageHelper.saveResponse(sessionKey, question.id, {
      selectedOptionId: optId,
      confidence: conf,
      isSubmitted: submitted,
    });

    // Also save complete question metadata for session summary aggregation
    const selectedOption = question.options.find((o) => o.id === optId);
    const responseData = {
      questionId: question.id,
      publicId: question.publicId,
      selectedOptionId: optId,
      isCorrect: selectedOption?.isCorrect ?? false,
      confidence: conf,
      isSubmitted: submitted,
      timeTakenSeconds: secondsElapsed,
      difficulty: question.difficulty,
    };

    try {
      const sessionsData = sessionStorage.getItem('acepharm_sessions') || '{}';
      const sessions = JSON.parse(sessionsData);
      if (!sessions[sessionKey]) sessions[sessionKey] = {};
      sessions[sessionKey][question.id] = responseData;
      sessionStorage.setItem('acepharm_sessions', JSON.stringify(sessions));
    } catch {
      // Ignored if storage unavailable
    }
  };

  const handleSelectOption = (optId: string) => {
    if (isSubmitted) return;
    setSelectedOptionId(optId);
    persistResponse(optId, confidence, false);
  };

  const handleSelectConfidence = (conf: 'low' | 'medium' | 'high') => {
    setConfidence(conf);
    persistResponse(selectedOptionId, conf, isSubmitted);
  };

  const handleSaveNote = () => {
    if (!personalNote.trim()) return;
    setIsSavingNote(true);
    const sessionKey = sessionId || 'adhoc-practice';
    try {
      sessionStorage.setItem(`acepharm_note_${sessionKey}_${question.id}`, personalNote);
    } catch {
      // Ignored
    }
    setTimeout(() => {
      setIsSavingNote(false);
      setNoteSavedFeedback(true);
      setTimeout(() => setNoteSavedFeedback(false), 2000);
    }, 400);
  };

  const handleToggleBookmark = () => {
    const newBookmarkState = !isBookmarked;
    setIsBookmarked(newBookmarkState);

    // Persist bookmark to session storage
    if (typeof window === 'undefined') return;
    const sessionKey = sessionId || 'adhoc-practice';
    try {
      const sessionsData = sessionStorage.getItem('acepharm_sessions') || '{}';
      const sessions = JSON.parse(sessionsData);
      if (!sessions[sessionKey]) sessions[sessionKey] = {};
      if (!sessions[sessionKey][question.id]) {
        sessions[sessionKey][question.id] = {
          questionId: question.id,
          publicId: question.publicId,
          difficulty: question.difficulty,
        };
      }
      sessions[sessionKey][question.id].isBookmarked = newBookmarkState;
      sessionStorage.setItem('acepharm_sessions', JSON.stringify(sessions));
    } catch {
      // Ignored
    }
  };

  // Timer tick & session persistence
  useEffect(() => {
    if (isSubmitted) return;
    const sessionKey = sessionId || 'adhoc-practice';
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => {
        const nextTime = prev + 1;
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(`acepharm_timer_${sessionKey}_${question.id}`, nextTime.toString());
          } catch {
            // Ignored
          }
        }
        return nextTime;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, sessionId, question.id]);

  // Keyboard shortcut listener (A–E, 1–3 for confidence, Enter, Space), guarded against text-field focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isTextField = 
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        activeEl?.isContentEditable;

      // Strictly guard and do not intercept keystrokes when learner is typing in notes/reports/inputs
      if (isTextField) return;

      if (!isSubmitted) {
        // 1. Option selection: A, B, C, D, E
        const key = e.key.toUpperCase();
        const optIndex = ['A', 'B', 'C', 'D', 'E'].indexOf(key);
        if (optIndex >= 0 && optIndex < question.options.length) {
          e.preventDefault();
          handleSelectOption(question.options[optIndex].id);
        }

        // 2. Confidence rating: 1 (Low), 2 (Medium), 3 (High)
        if (e.key === '1') {
          e.preventDefault();
          handleSelectConfidence('low');
        } else if (e.key === '2') {
          e.preventDefault();
          handleSelectConfidence('medium');
        } else if (e.key === '3') {
          e.preventDefault();
          handleSelectConfidence('high');
        }

        // 3. Submit: Enter or Space (if option is selected)
        if ((e.key === 'Enter' || e.key === ' ') && selectedOptionId) {
          e.preventDefault();
          handleSubmit();
        }

        // 4. Space / 'C' to toggle cover-options mode when nothing selected
        if (e.key.toLowerCase() === 'c') {
          e.preventDefault();
          setHideOptions((prev) => !prev);
        }
      } else {
        // Post-submission: Enter or Space to proceed to next question
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNext?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitted, selectedOptionId, question.options, confidence, onNext]);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [highlightedText, setHighlightedText] = useState<string>('');
  const playerRef = React.useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    // Strict submission guard: option MUST be selected and question MUST not be already submitted
    if (selectedOptionId === null || selectedOptionId === undefined || selectedOptionId === '' || isSubmitted) {
      return;
    }
    // OPTIMISTIC-UI SUBMISSION: Immediate feedback rendering (<300ms perceived latency)
    setIsSubmitted(true);
    persistResponse(selectedOptionId, confidence, true);

    // Free-tier milestone check: trigger upgrade modal AFTER question-30 explanation finishes rendering
    const currentAnsweredCount = Number(localStorage.getItem('acepharm_free_tier_count') || '0') + 1;
    localStorage.setItem('acepharm_free_tier_count', currentAnsweredCount.toString());

    if (currentAnsweredCount === 30 || currentQuestionIndex === 30) {
      // Soft delay to guarantee the student has read and rendered the complete explanation first
      setTimeout(() => {
        setShowUpgradeModal(true);
      }, 1200);
    }
  };

  const { user } = useAuth();

  const handleExit = () => {
    if (typeof window === 'undefined') return;
    // Check if user has a valid JWT token
    const token = AuthStorage.getToken();
    if (token && user) {
      // Authenticated user - redirect to dashboard
      window.location.href = '/';
    } else {
      // Not authenticated - redirect to login
      window.location.href = '/auth/login';
    }
  };

  const selectedOption = question.options.find((o) => o.id === selectedOptionId);
  const isUserCorrect = selectedOption?.isCorrect ?? false;

  return (
    <div ref={playerRef} className="max-w-4xl mx-auto space-y-6 relative">
      {/* Highlight-To-Ask Floating Menu (Mobile & Desktop Text Selection Handles) */}
      <FloatingHighlightMenu
        containerRef={playerRef}
        onAskAce={(text) => {
          setHighlightedText(text);
        }}
      />

      {/* Top Session Progress Bar with Back/Exit button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 pb-2 border-b border-border text-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleExit}
            className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-indigo hover:bg-indigo-deep px-3 py-2 rounded-lg border border-indigo hover:border-indigo-deep transition-all shadow-sm hover:shadow-md"
            title="Exit practice session and return to dashboard"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            <span>Exit Session</span>
          </button>
          <span className="font-bold text-ink font-mono text-sm">
            Question {currentQuestionIndex} <span className="text-slate font-normal">/ {totalQuestions}</span>
          </span>
          <Badge variant="outline" className="font-mono text-[11px]">
            {question.publicId}
          </Badge>
          <Badge variant="outline" className="capitalize text-[11px] hidden sm:inline-block">
            {question.sector} Pharmacy
          </Badge>
          {question.questionType === 'calculation' && (
            <Badge variant="teal" className="text-[11px] hidden md:inline-block font-mono">
              Paper 1 Calculation
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 px-2 py-1.5 bg-canvas rounded-lg border border-border/60 shadow-sm">
          {/* GPhC Calculator Button */}
          <button
            type="button"
            onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
            className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 text-xs font-medium border ${
              isCalculatorOpen
                ? 'bg-indigo text-white border-indigo shadow-sm'
                : 'bg-surface text-slate border-border/40 hover:bg-canvas hover:text-ink hover:border-indigo/40'
            }`}
            title="Open Pearson VUE style GPhC exam calculator"
          >
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">Calculator</span>
          </button>

          {/* Clinical & Lab References Button */}
          <button
            type="button"
            onClick={() => setIsRefModalOpen(true)}
            className="px-2.5 py-1 rounded transition-all flex items-center gap-1.5 text-xs font-medium border bg-surface text-slate border-border/40 hover:bg-canvas hover:text-ink hover:border-teal/40"
            title="Open Biochemical lab reference ranges and therapeutic drug levels"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Lab Ranges</span>
          </button>

          {/* Hide Options Toggle */}
          <button
            type="button"
            onClick={() => setHideOptions(!hideOptions)}
            className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 text-xs font-medium border ${
              hideOptions
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-surface text-slate border-border/40 hover:bg-canvas hover:text-ink hover:border-amber-200'
            }`}
            title="Cover options for active diagnostic recall"
          >
            {hideOptions ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="hidden md:inline text-[11px]">{hideOptions ? 'Show' : 'Cover'}</span>
          </button>

          {/* Personal Question Note */}
          <button
            type="button"
            onClick={() => setShowNotesDrawer(!showNotesDrawer)}
            className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 text-xs font-medium border ${
              showNotesDrawer
                ? 'bg-indigo/20 text-indigo border-indigo/40'
                : 'bg-surface text-slate border-border/40 hover:bg-canvas hover:text-ink hover:border-indigo/40'
            }`}
            title="Add personal clinical note"
          >
            <FileEdit className="w-4 h-4" />
            <span className="hidden lg:inline">Notes</span>
          </button>

          {/* My Notes History Button */}
          <button
            type="button"
            onClick={() => {
              fetchAllNotes();
              setIsMyNotesOpen(true);
            }}
            className="px-2.5 py-1 rounded transition-all flex items-center gap-1.5 text-xs font-medium border bg-surface text-slate border-border/40 hover:bg-canvas hover:text-ink hover:border-indigo/40"
            title="View all saved notes from this session"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden lg:inline">My Notes</span>
          </button>

          {/* Bookmarked Questions Button */}
          <button
            type="button"
            onClick={() => {
              fetchAllBookmarks();
              setIsBookmarksOpen(true);
            }}
            className="px-2.5 py-1 rounded transition-all flex items-center gap-1.5 text-xs font-medium border bg-surface text-slate border-border/40 hover:bg-canvas hover:text-ink hover:border-rose-200"
            title="View all bookmarked questions"
          >
            <Bookmark className="w-4 h-4" />
            <span className="hidden lg:inline">Bookmarks</span>
          </button>

          {/* Bookmark */}
          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 text-xs font-medium border ${
              isBookmarked
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-surface text-slate border-border/40 hover:bg-canvas hover:text-ink hover:border-rose-200'
            }`}
            title="Bookmark question"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-rose-600' : ''}`} />
            <span className="hidden lg:inline text-[11px]">Save</span>
          </button>

          {/* Flag / Report */}
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="px-2.5 py-1 rounded transition-all flex items-center gap-1.5 text-xs font-medium border bg-surface text-slate border-border/40 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
            title="Report question error"
          >
            <Flag className="w-4 h-4" />
            <span className="hidden lg:inline">Report</span>
          </button>

          {/* Question Timer */}
          <div className="px-2.5 py-1 rounded flex items-center gap-1.5 text-xs font-mono font-bold text-teal bg-teal/10 border border-teal/30">
            <Clock className="w-4 h-4" />
            <span>{Math.floor(secondsElapsed / 60)}:{(secondsElapsed % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* Floating Draggable-style GPhC Calculator */}
      {isCalculatorOpen && (
        <div className="fixed bottom-6 right-6 z-50 shadow-2xl animate-in slide-in-from-bottom-5">
          <GphcCalculator onClose={() => setIsCalculatorOpen(false)} />
        </div>
      )}

      {/* Clinical Lab Ranges Modal */}
      <ClinicalReferenceModal
        isOpen={isRefModalOpen}
        onClose={() => setIsRefModalOpen(false)}
      />

      {/* Personal Notes Drawer (Collapsible) */}
      {showNotesDrawer && (
        <Card className="p-4 bg-surface border-indigo/40 ring-1 ring-indigo/20 shadow-md space-y-3 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-ink flex-1">
              <FileEdit className="w-4 h-4 text-indigo shrink-0" />
              <span>Personal Clinical Notes for {question.publicId}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {noteSavedFeedback && (
                <span className="text-[11px] text-teal font-semibold flex items-center gap-1 animate-pulse whitespace-nowrap">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowNotesDrawer(false)}
                className="p-1 rounded hover:bg-canvas/50 transition-colors text-slate hover:text-ink"
                title="Close notes"
                aria-label="Close notes drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <textarea
            rows={3}
            value={personalNote}
            onChange={(e) => setPersonalNote(e.target.value)}
            placeholder="Add personal clinical mnemonics, calculation shortcuts, or learning reminders for this question..."
            className="w-full text-xs p-3 rounded-lg border border-border bg-canvas text-ink placeholder:text-slate/60 focus:ring-1 focus:ring-indigo focus:border-indigo"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotesDrawer(false)}
              className="text-xs flex items-center gap-1.5"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveNote}
              disabled={isSavingNote || !personalNote.trim()}
              className="text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingNote ? 'Saving...' : 'Save Note'}
            </Button>
          </div>
        </Card>
      )}

      {/* 1. Clinical Vignette & Stem */}
      <Card className="p-6 bg-surface border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate uppercase tracking-wider">
            <Stethoscope className="w-4 h-4 text-indigo" /> Clinical Scenario
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo/5 border border-indigo/20 text-indigo text-[11px] font-semibold whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5" />
            Double-click any word to ask Ace
          </div>
        </div>

        <p className="text-base text-ink leading-relaxed font-normal select-text cursor-text">
          {question.stem}
        </p>

        <div className="pt-3 border-t border-border/80">
          <h2 className="text-sm sm:text-base font-bold text-ink leading-snug select-text cursor-text">
            {question.leadIn}
          </h2>
        </div>
      </Card>

      {/* 2. Answer Options */}
      {!hideOptions && !isSubmitted ? (
        <div className="space-y-3" role="radiogroup" aria-label="Answer options">
          {question.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const showResults = isSubmitted;

            // Strict Selection Styling: Border & Tint only (No plain generic colors)
            let optionStyles = 'border-border bg-surface hover:bg-canvas/60 text-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none';
            if (isSelected && !showResults) {
              optionStyles = 'border-indigo bg-indigo/5 ring-2 ring-indigo text-ink shadow-sm focus-visible:outline-none';
            } else if (showResults) {
              if (opt.isCorrect) {
                // Multi-sensory WCAG 2.2 AA feedback (Border, Tint, Text, Icon)
                optionStyles = 'border-teal bg-teal/10 text-ink ring-2 ring-teal shadow-sm';
              } else if (isSelected && !opt.isCorrect) {
                optionStyles = 'border-rose-500 bg-rose-50/70 text-ink ring-2 ring-rose-500 shadow-sm';
              } else {
                optionStyles = 'border-border/60 bg-surface opacity-60 text-slate';
              }
            }

            return (
              <div
                key={opt.id}
                role="radio"
                data-option-id={opt.id}
                aria-checked={isSelected}
                aria-label={`Option ${opt.label}: ${opt.content}`}
                tabIndex={isSubmitted ? -1 : 0}
                onKeyDown={(e) => {
                  if (!isSubmitted && (e.key === ' ' || e.key === 'Enter')) {
                    e.preventDefault();
                    handleSelectOption(opt.id);
                  }
                }}
                onClick={() => handleSelectOption(opt.id)}
                className={`p-4 rounded-card border transition-all select-none ${
                  !isSubmitted ? 'cursor-pointer' : 'cursor-default'
                } ${optionStyles}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="w-6 h-6 rounded-md font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-current">
                      {opt.label}
                    </span>
                    <div className="text-sm font-medium pt-0.5 leading-relaxed">
                      {opt.content}
                    </div>
                  </div>

                  {/* Icon Feedback (Never relies on colour alone for VoiceOver / NVDA & low vision) */}
                  {showResults && (
                    <div className="shrink-0 pt-0.5" aria-hidden="true">
                      {opt.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-teal" />
                      ) : isSelected && !opt.isCorrect ? (
                        <XCircle className="w-5 h-5 text-rose-500" />
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center bg-surface border-border border-dashed space-y-2">
          <EyeOff className="w-8 h-8 text-slate mx-auto" />
          <h3 className="text-sm font-semibold text-ink">Options Hidden for Active Recall</h3>
          <p className="text-xs text-slate max-w-sm mx-auto">
            Formulate your clinical answer diagnostic first before uncovering the options.
          </p>
          <Button variant="outline" size="sm" onClick={() => setHideOptions(false)} className="text-xs mt-2">
            Reveal Options
          </Button>
        </Card>
      )}

      {/* 3. Pre-Submission Confidence Selector & Submit Bar */}
      {!isSubmitted ? (
        <Card className="p-4 bg-surface border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          {showConfidencePrompt ? (
            <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
              <span className="font-semibold text-slate whitespace-nowrap">State Confidence:</span>
              <div className="flex items-center gap-1.5 w-full justify-between sm:justify-start">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleSelectConfidence(level)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all border ${
                      confidence === level
                        ? 'bg-indigo text-white border-indigo shadow-sm'
                        : 'bg-canvas border-border text-slate hover:text-ink'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate">
              <span>Select your answer and press Submit.</span>
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            disabled={selectedOptionId === null || selectedOptionId === undefined || selectedOptionId === ''}
            onClick={handleSubmit}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs px-6 font-bold shadow-sm"
          >
            Submit Answer
          </Button>
        </Card>
      ) : (
        /* ========================================================================= */
        /* PROTOTYPE FIXED SECTION ORDER:                                            */
        /* 1. Feedback Banner                                                        */
        /* 2. Takeaway Point                                                         */
        /* 3. Per-Option Rationale Breakdown                                         */
        /* 4. Subtopic Notes Disclosure                                              */
        /* ========================================================================= */
        <div className="space-y-5 animate-fade-in">
          {/* 1. FEEDBACK BANNER */}
          <div
            className={`p-4 rounded-card border text-sm font-semibold flex items-center justify-between ${
              isUserCorrect
                ? 'bg-teal/10 border-teal/40 text-teal'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isUserCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-teal shrink-0" />
                  <span>Correct! Guideline-recommended therapy identified.</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <span>Incorrect. Review the clinical guidance and distractor rationales below.</span>
                </>
              )}
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => onNext?.()}
              className="flex items-center gap-1 text-xs shadow-sm"
            >
              Next Question <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* 2. TAKEAWAY POINT (High-Yield Clinical Pearls) */}
          {question.explanation?.summaryTakeaway && (
            <div className="p-4 rounded-card bg-indigo/5 border-l-4 border-indigo space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Key Clinical Takeaway
              </div>
              <p className="text-xs sm:text-sm font-medium text-ink leading-relaxed">
                {question.explanation.summaryTakeaway}
              </p>
            </div>
          )}

          {/* 3. PER-OPTION RATIONALE BREAKDOWN */}
          <Card className="p-5 bg-surface border-border shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2 pb-2 border-b border-border">
              <CheckCircle2 className="w-4 h-4 text-indigo" /> Option Rationales & Distractor Analysis
            </h3>

            <div className="space-y-3">
              {question.options.map((opt) => (
                <div
                  key={opt.id}
                  className={`p-3.5 rounded-lg border text-xs leading-relaxed transition-all ${
                    opt.isCorrect
                      ? 'border-teal/50 bg-teal/5 text-ink ring-1 ring-teal/30'
                      : opt.id === selectedOptionId
                      ? 'border-rose-300 bg-rose-50/60 text-ink'
                      : 'border-border/80 bg-canvas/40 text-slate'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <span className="w-5 h-5 rounded font-mono text-[11px] flex items-center justify-center border border-current">
                      {opt.label}
                    </span>
                    <span className="text-ink">{opt.content}</span>
                    {opt.isCorrect && (
                      <Badge variant="teal" className="text-[10px] py-0 px-1.5">
                        Correct Answer
                      </Badge>
                    )}
                    {opt.id === selectedOptionId && !opt.isCorrect && (
                      <Badge variant="danger" className="text-[10px] py-0 px-1.5">
                        Your Choice
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate mt-1.5 pl-7">
                    {opt.rationale}
                  </p>
                </div>
              ))}
            </div>

            {/* Detailed Clinical Explanation */}
            {question.explanation?.detailedExplanation && (
              <div className="pt-4 border-t border-border space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate">
                  Clinical Pathophysiology & Evidence Base
                </h4>
                <div className="text-xs sm:text-sm text-ink leading-relaxed">
                  <MarkdownRenderer content={question.explanation.detailedExplanation} />
                </div>
              </div>
            )}

            {/* Guideline Citation */}
            {question.explanation?.clinicalGuidanceReference && (
              <div className="pt-3 border-t border-border text-xs text-slate flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo shrink-0" />
                <span><strong>Guideline Source:</strong> {question.explanation.clinicalGuidanceReference}</span>
              </div>
            )}
          </Card>

          {/* 4. SUBTOPIC NOTES DISCLOSURE */}
          <details className="group border border-border rounded-card bg-surface overflow-hidden transition-all shadow-sm">
            <summary className="p-4 text-xs sm:text-sm font-bold text-ink cursor-pointer hover:bg-canvas/50 flex items-center justify-between list-none select-none">
              <span className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-indigo" />
                Subtopic Clinical Revision Notes (Hypertension — NICE NG136)
              </span>
              <ChevronRight className="w-4 h-4 text-slate transition-transform duration-200 group-open:rotate-90" />
            </summary>
            <div className="p-5 border-t border-border bg-canvas/30 text-xs sm:text-sm leading-relaxed space-y-4">
              <MarkdownRenderer
                content={`
### NICE NG136 Hypertension Summary & Stepped Care Table

| Step | Patient Cohort | Recommended Drug Class | Notes & BNF Monitoring |
| :--- | :--- | :--- | :--- |
| **Step 1** | Under 55 & non-Black OR Type 2 Diabetes (any age/origin) | **ACE inhibitor** (e.g. Ramipril) OR **ARB** (e.g. Losartan) | Monitor eGFR, serum creatinine, and K+ within 1-2 weeks of initiation/titration. |
| **Step 1** | Aged ≥ 55 OR Black African/African-Caribbean origin (without T2DM) | **Calcium Channel Blocker (CCB)** (e.g. Amlodipine) | If CCB not tolerated (e.g. ankle oedema), use thiazide-like diuretic (Indapamide). |
| **Step 2** | Step 1 not at target | **CCB + ACEi/ARB** | In Black patients, ARBs are preferred over ACE inhibitors. |
| **Step 3** | Step 2 not at target | **CCB + ACEi/ARB + Thiazide-like diuretic** | Indapamide 1.5mg m/r or 2.5mg standard is preferred over bendroflumethiazide. |
| **Step 4** | Resistant hypertension (clinic BP ≥ 140/90 on Step 3) | Add **Low-dose Spironolactone** (if K+ ≤ 4.5 mmol/L) OR **Alpha/Beta-blocker** (if K+ > 4.5) | Refer to specialist if blood pressure remains uncontrolled. |
`}
              />
            </div>
          </details>

          {/* 5. ASK ACE AI CLINICAL TUTOR PANEL (Milestone 5 & Section 5.2) */}
          <AskAcePanel
            questionId={question.id}
            questionPublicId={question.publicId}
            isCalculation={question.questionType === 'calculation'}
            highlightedText={highlightedText}
          />
        </div>
      )}

      {/* Report Question Modal with Auto-Attached Metadata */}
      <ReportQuestionModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        questionId={question.id}
        publicId={question.publicId}
        questionVersion={question.version}
        sessionId={sessionId}
      />

      {/* Bookmarked Questions Modal */}
      {isBookmarksOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col bg-surface border-border shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-rose-600" />
                <h2 className="text-lg font-bold text-ink">Bookmarked Questions ({allBookmarks.length})</h2>
              </div>
              <button
                onClick={() => setIsBookmarksOpen(false)}
                className="p-1 rounded hover:bg-canvas/50 transition-colors text-slate hover:text-ink"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {allBookmarks.length === 0 ? (
                <div className="text-center py-8 text-slate">
                  <p className="text-sm">No bookmarks yet. Start bookmarking questions to review them later!</p>
                </div>
              ) : (
                allBookmarks.map((bookmark, index) => (
                  <div
                    key={`${bookmark.questionId}-${index}`}
                    className="p-3 rounded-lg border border-rose-200 bg-rose-50/40 hover:bg-rose-50/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-xs font-bold text-rose-600">{bookmark.questionPublicId}</div>
                        <div className="text-[11px] text-slate mt-0.5 capitalize">
                          Difficulty: {bookmark.difficulty}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const sessionKey = sessionId || 'adhoc-practice';
                          try {
                            const sessionsData = sessionStorage.getItem('acepharm_sessions') || '{}';
                            const sessions = JSON.parse(sessionsData);
                            if (sessions[sessionKey]?.[bookmark.questionId]) {
                              sessions[sessionKey][bookmark.questionId].isBookmarked = false;
                              sessionStorage.setItem('acepharm_sessions', JSON.stringify(sessions));
                            }
                            fetchAllBookmarks();
                          } catch {
                            // Ignored
                          }
                        }}
                        className="p-1 rounded hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors flex-shrink-0"
                        title="Remove bookmark"
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBookmarksOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* My Notes Modal */}
      {isMyNotesOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col bg-surface border-border shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo" />
                <h2 className="text-lg font-bold text-ink">My Notes ({allNotes.length})</h2>
              </div>
              <button
                onClick={() => setIsMyNotesOpen(false)}
                className="p-1 rounded hover:bg-canvas/50 transition-colors text-slate hover:text-ink"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {allNotes.length === 0 ? (
                <div className="text-center py-8 text-slate">
                  <p className="text-sm">No notes saved yet. Start adding notes to your questions!</p>
                </div>
              ) : (
                allNotes.map((note, index) => (
                  <div
                    key={`${note.questionId}-${index}`}
                    className="p-3 rounded-lg border border-border bg-canvas/40 hover:bg-canvas/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="text-xs font-bold text-indigo">{note.questionPublicId}</div>
                        <div className="text-[11px] text-slate mt-0.5">Saved: {note.savedAt}</div>
                      </div>
                      <button
                        onClick={() => {
                          const sessionKey = sessionId || 'adhoc-practice';
                          const key = `acepharm_note_${sessionKey}_${note.questionId}`;
                          sessionStorage.removeItem(key);
                          fetchAllNotes();
                        }}
                        className="p-1 rounded hover:bg-rose-50 text-slate hover:text-rose-600 transition-colors flex-shrink-0"
                        title="Delete note"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMyNotesOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Free Tier Upgrade Soft Modal (Rendered ONLY after Question 30 Explanation) */}
      <FreeTierUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        questionsAnswered={30}
      />

      {/* Product Tour Modal */}
      <ProductTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onComplete={() => {
          // Tour completed - user can now practice
        }}
      />
    </div>
  );
}
