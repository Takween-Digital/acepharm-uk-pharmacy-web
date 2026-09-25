'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card } from '@acepharm/ui';
import {
  ChevronRight,
  ChevronLeft,
  X,
  Lightbulb,
  Zap,
  BookOpen,
  Calculator,
  Bookmark,
  FileEdit,
  Flag,
  Clock,
} from 'lucide-react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlightSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your GPhC Practice Hub',
    description: 'Master the exam tools and techniques that top performers use. Take a quick 2-minute tour to learn the platform.',
    icon: <Lightbulb className="w-6 h-6 text-amber-500" />,
    position: 'bottom',
  },
  {
    id: 'select-answer',
    title: 'Select Your Answer',
    description: 'Click or use keyboard shortcut (A-E) to select an answer option. Your choice is auto-saved as you work.',
    icon: <Zap className="w-6 h-6 text-indigo" />,
    highlightSelector: '[role="button"][data-option-id]',
    position: 'top',
  },
  {
    id: 'confidence',
    title: 'Rate Your Confidence',
    description: 'After selecting, indicate your confidence level (Low/Medium/High). This helps track your learning patterns.',
    icon: <Zap className="w-6 h-6 text-indigo" />,
    position: 'bottom',
  },
  {
    id: 'calculator',
    title: 'Built-in GPhC Calculator',
    description: 'Use the calculator for pharmaceutical calculations (Paper 1). It mimics the official Pearson VUE exam calculator.',
    icon: <Calculator className="w-6 h-6 text-blue-500" />,
    position: 'left',
  },
  {
    id: 'lab-ranges',
    title: 'Clinical Reference Ranges',
    description: 'Quick access to biochemical lab ranges and therapeutic drug levels. Essential for Paper 2 questions.',
    icon: <BookOpen className="w-6 h-6 text-teal" />,
    position: 'left',
  },
  {
    id: 'hide-options',
    title: 'Active Recall Mode',
    description: 'Toggle "Cover Options" to test your diagnostic recall without seeing the answer choices. Use keyboard shortcut (C).',
    icon: <BookOpen className="w-6 h-6 text-amber-500" />,
    position: 'left',
  },
  {
    id: 'notes',
    title: 'Personal Clinical Notes',
    description: 'Save clinical mnemonics, calculation shortcuts, or learning reminders for each question. Your notes sync across sessions.',
    icon: <FileEdit className="w-6 h-6 text-indigo" />,
    position: 'left',
  },
  {
    id: 'bookmarks',
    title: 'Bookmark for Later Review',
    description: 'Mark questions to review later. Access all your bookmarks from the toolbar or revisit them in targeted drills.',
    icon: <Bookmark className="w-6 h-6 text-rose-500" />,
    position: 'left',
  },
  {
    id: 'report',
    title: 'Report Question Issues',
    description: 'Found an error or unclear wording? Report it directly. Our content team reviews feedback to improve questions.',
    icon: <Flag className="w-6 h-6 text-rose-600" />,
    position: 'left',
  },
  {
    id: 'timer',
    title: 'Pace Your Practice',
    description: 'The timer shows your per-question duration. GPhC target: 90 seconds per question on Paper 2.',
    icon: <Clock className="w-6 h-6 text-teal" />,
    position: 'left',
  },
  {
    id: 'complete',
    title: 'You\'re Ready to Practice!',
    description: 'You now know the core tools. Work through questions, submit your answers, and review the detailed explanations. Good luck!',
    icon: <Zap className="w-6 h-6 text-teal" />,
    position: 'bottom',
  },
];

interface ProductTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function ProductTour({ isOpen, onClose, onComplete }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null);

  const step = TOUR_STEPS[currentStep];

  // Find and highlight the element based on selector
  useEffect(() => {
    if (step.highlightSelector) {
      setTimeout(() => {
        const element = document.querySelector(step.highlightSelector!) as HTMLElement | null;
        setHighlightElement(element);
      }, 100);
    } else {
      setHighlightElement(null);
    }
  }, [step.highlightSelector]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    localStorage.setItem('acepharm_tour_completed', 'true');
    setHighlightElement(null);
    onComplete?.();
    onClose();
  };

  const skipTour = () => {
    localStorage.setItem('acepharm_tour_completed', 'true');
    setHighlightElement(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with spotlight effect */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={skipTour} />

      {/* Highlight ring around active element */}
      {highlightElement && (
        <div
          className="fixed z-40 border-2 border-indigo rounded-lg pointer-events-none animate-pulse"
          style={{
            top: `${highlightElement.offsetTop - 8}px`,
            left: `${highlightElement.offsetLeft - 8}px`,
            width: `${highlightElement.offsetWidth + 16}px`,
            height: `${highlightElement.offsetHeight + 16}px`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
          }}
        />
      )}

      {/* Tour Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <Card
          className={`pointer-events-auto max-w-sm mx-4 bg-gradient-to-br from-surface to-canvas border-indigo/20 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            step.id === 'welcome' || step.id === 'complete'
              ? 'relative'
              : 'absolute'
          }`}
          style={
            highlightElement && step.id !== 'welcome' && step.id !== 'complete'
              ? {
                  top: `${
                    step.position === 'top'
                      ? highlightElement.offsetTop - 320
                      : step.position === 'bottom'
                        ? highlightElement.offsetTop + highlightElement.offsetHeight + 16
                        : highlightElement.offsetTop - 160
                  }px`,
                  left: `${
                    step.position === 'left'
                      ? highlightElement.offsetLeft - 420
                      : step.position === 'right'
                        ? highlightElement.offsetLeft + highlightElement.offsetWidth + 16
                        : 'auto'
                  }px`,
                  right: step.position !== 'left' && step.position !== 'right' ? '50%' : 'auto',
                  transform:
                    step.position !== 'left' && step.position !== 'right'
                      ? 'translateX(50%)'
                      : 'none',
                }
              : {}
          }
        >
          <div className="p-6 space-y-4">
            {/* Icon and Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-indigo/10">{step.icon}</div>
                <div>
                  <h3 className="text-base font-bold text-ink">{step.title}</h3>
                  <p className="text-xs text-slate font-mono">
                    Step {currentStep + 1} of {TOUR_STEPS.length}
                  </p>
                </div>
              </div>
              <button
                onClick={skipTour}
                className="p-1.5 rounded hover:bg-canvas/50 transition-colors text-slate hover:text-ink shrink-0"
                title="Skip tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-slate leading-relaxed">{step.description}</p>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-canvas rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%`,
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={skipTour}
                className="text-xs font-semibold text-slate hover:text-ink transition-colors"
              >
                Skip Tour
              </button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="text-xs flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNext}
                  className="text-xs flex items-center gap-1"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? (
                    <>
                      Done <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
