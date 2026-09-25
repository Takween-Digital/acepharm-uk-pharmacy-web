'use client';

import React from 'react';
import { QuestionPlayer, QuestionData } from '@/components/question-player';
import { Button } from '@acepharm/ui';
import { ArrowRight } from 'lucide-react';

const DEMO_QUESTION: QuestionData = {
  id: 'demo-q-1',
  publicId: 'DEMO-001',
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
      rationale: 'ARBs are preferred over ACE inhibitors in Black patients if a RAAS inhibitor is indicated (e.g. in type 2 diabetes), but CCBs remain the preferred first-line agent here.',
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

export default function DemoQuestionPage() {
  const handleStartPractice = () => {
    window.location.href = '/auth/register?redirect=/session/new';
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Demo Banner */}
      <div className="bg-indigo/10 border-b border-indigo/20 px-4 py-4 text-center">
        <p className="text-sm text-indigo font-medium">
          🎓 Demo Mode — Try Ace AI on a real GPhC question
        </p>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-ink">Try Ace on a Real Question</h1>
              <p className="text-sm text-slate mt-2">
                Ask Ace AI clinical questions about this scenario. Explore how Ace provides grounded, verified answers with citations.
              </p>
            </div>
            <a
              href="/"
              className="text-slate hover:text-ink text-xs font-semibold"
            >
              ← Back
            </a>
          </div>
        </div>

        {/* Question Player */}
        <QuestionPlayer
          question={DEMO_QUESTION}
          currentQuestionIndex={1}
          totalQuestions={1}
          sessionId="demo-session"
        />

        {/* Signup CTA Footer */}
        <div className="mt-12 p-6 bg-indigo/5 border border-indigo/20 rounded-card text-center">
          <h3 className="text-lg font-bold text-ink mb-2">Ready to start practicing?</h3>
          <p className="text-sm text-slate mb-4">
            Sign up for free to access our full library of GPhC exam questions with Ace AI tutoring.
          </p>
          <Button
            size="lg"
            variant="primary"
            onClick={handleStartPractice}
            className="inline-flex items-center gap-2"
          >
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-xs text-slate mt-3">
            No credit card required. Start studying in seconds.
          </p>
        </div>
      </main>
    </div>
  );
}
