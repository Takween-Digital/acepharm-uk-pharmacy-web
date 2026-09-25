'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SessionSummary, ReviewGridItem } from '@/components/session-summary';

function SessionSummaryContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId') || 'adhoc-practice';
  const [reviewGrid, setReviewGrid] = useState<ReviewGridItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Retrieve all question responses from session storage
    const allResponses: ReviewGridItem[] = [];
    try {
      const sessionsData = sessionStorage.getItem('acepharm_sessions');
      if (sessionsData) {
        const sessions = JSON.parse(sessionsData);
        if (sessions[sessionId]) {
          const questions = sessions[sessionId];
          Object.entries(questions).forEach(([questionId, questionData]: [string, any], index: number) => {
            if (questionData && typeof questionData === 'object') {
              allResponses.push({
                index: index + 1,
                questionId: questionData.questionId || questionId,
                publicId: questionData.publicId || `Q-${index + 1}`,
                isCorrect: questionData.isCorrect || false,
                confidence: questionData.confidence,
                timeTakenSeconds: questionData.timeTakenSeconds || 0,
                difficulty: questionData.difficulty || 'medium',
              });
            }
          });
        }
      }
    } catch (err) {
      console.error('Failed to load session results:', err);
    }

    setReviewGrid(allResponses);
    setIsLoading(false);
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate">Loading your session results...</p>
        </div>
      </div>
    );
  }

  return <SessionSummary reviewGrid={reviewGrid} sessionId={sessionId} />;
}

export default function SessionSummaryPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-2 border-indigo border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate">Loading your session results...</p>
            </div>
          </div>
        }
      >
        <SessionSummaryContent />
      </Suspense>
    </main>
  );
}
