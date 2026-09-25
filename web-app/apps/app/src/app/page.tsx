'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, 
  Badge, 
  Card, 
  HeroRecommendationSkeleton, 
  StreakTrackerSkeleton, 
  CategoryCardSkeleton,
  Skeleton 
} from '@acepharm/ui';
import { StreakTracker } from '@/components/streak-tracker';
import { CategoryResetModal } from '@/components/category-reset-modal';
import { CancellationFlowModal } from '@/components/cancellation-flow-modal';
import { SubscriptionModal } from '@/components/subscription-modal';
import { AppHeader } from '@/components/app-header';
import { EmailVerificationBanner } from '@/components/email-verification-banner';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-client';
import { QUESTION_INVENTORY } from '@acepharm/preferences';
import {
  Play,
  Target,
  Flame,
  RotateCcw,
  BookOpen,
  Layers,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Stethoscope,
  BarChart3,
  SlidersHorizontal,
  FileSpreadsheet,
  CreditCard,
  LogOut,
  UserCheck,
  AlertCircle
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  total: number;
  attempted: number;
  accuracy: number;
  status: string;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  // AP-39: Redirect unauthorized users
  React.useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }, [user]);

  const [selectedResetCategory, setSelectedResetCategory] = useState<{ id: string; name: string; count: number } | null>(null);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [categoriesOverview, setCategoriesOverview] = useState<CategoryItem[]>(() =>
    QUESTION_INVENTORY.categories
      .filter((c) => c.count > 0)
      .map((c) => ({
        id: c.id,
        name: c.name,
        total: c.count,
        attempted: 0,
        accuracy: 0,
        status: 'Not started',
      }))
  );
  const [streakMetrics, setStreakMetrics] = useState<{
    currentStreak: number;
    longestStreak: number;
    todayQuestionsCount: number;
    todayActiveMinutes: number;
    isMeaningfulToday: boolean;
    streakHistory?: { date: string; questionsCount: number; activeMinutes: number; isMeaningful: boolean }[];
  }>({
    currentStreak: 0,
    longestStreak: 0,
    todayQuestionsCount: 0,
    todayActiveMinutes: 0,
    isMeaningfulToday: false,
    streakHistory: undefined,
  });
  const [recommendation, setRecommendation] = useState<{
    topicName: string;
    subtopicName: string;
    targetCount: number;
    explanation: string;
    estimatedAccuracy: number;
  }>({
    topicName: 'Diagnostic Assessment',
    subtopicName: 'Curriculum Baseline',
    targetCount: 10,
    explanation: 'Recommended starting point: completing this 10-question assessment allows AcePharm to calibrate your initial strengths and revision priorities.',
    estimatedAccuracy: 50,
  });
  const [dailyGoal, setDailyGoal] = useState({
    answeredToday: 0,
    dailyTarget: 20,
  });
  // Wave 5: Weak topics drill recommendations
  const [weakTopics, setWeakTopics] = useState<Array<{
    subtopicId: string;
    name: string;
    accuracy: number;
    totalQuestions: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.acepharmexams.co.uk';

  useEffect(() => {
    async function loadLiveData() {
      try {
        // 1. Fetch real curriculum tree from Cloudflare D1
        try {
          const data = await apiClient.get('/api/v1/curriculum/tree');
          const pathway = data?.pathways?.[0];
          const inventoryMap = new Map(QUESTION_INVENTORY.categories.map((c) => [c.id, c.count]));
          if (pathway && pathway.categories) {
            const baseCategories: CategoryItem[] = pathway.categories
              .filter((cat: any) => (inventoryMap.get(cat.id) ?? 0) > 0)
              .map((cat: any) => {
                const verifiedTotal = inventoryMap.get(cat.id) || 0;
                return {
                  id: cat.id,
                  name: cat.name,
                  total: verifiedTotal,
                  attempted: 0,
                  accuracy: 0,
                  status: 'Not started',
                };
              });
            setCategoriesOverview(baseCategories);
          }
        } catch (curriculumErr) {
          console.warn('Could not load curriculum tree:', curriculumErr);
        }

        // 2. Fetch live user streak metrics, daily goal & progress metrics if authenticated
        if (user) {
          const token = getAccessToken();

          // Fetch Live Progress Metrics & Coverage Map
          try {
            const mData = await apiClient.get('/api/v1/analytics/metrics', { token });
            if (mData?.coverageMap && mData.coverageMap.length > 0) {
              const liveCategories: CategoryItem[] = mData.coverageMap.map((cov: any) => {
                const subAccuracies = (cov.subtopics || [])
                  .map((s: any) => s.firstPassAccuracy || 0)
                  .filter((a: number) => a > 0);
                const avgAcc = subAccuracies.length > 0
                  ? Math.round(subAccuracies.reduce((a: number, b: number) => a + b, 0) / subAccuracies.length)
                  : (cov.attemptedQuestions > 0 ? 70 : 0);

                return {
                  id: cov.categoryId,
                  name: cov.categoryName,
                  total: cov.totalQuestions || 10,
                  attempted: cov.attemptedQuestions || 0,
                  accuracy: avgAcc,
                  status: cov.statusLabel || (cov.attemptedQuestions > 0 ? 'Developing' : 'Not started'),
                };
              });
              setCategoriesOverview(liveCategories);
            }
          } catch (metricsErr) {
            console.warn('Could not load analytics metrics:', metricsErr);
          }

          // Fetch Streak
          try {
            const sData = await apiClient.get('/api/v1/analytics/streak', { token });
            if (sData) {
              setStreakMetrics({
                currentStreak: sData.currentStreak ?? 0,
                longestStreak: sData.longestStreak ?? 0,
                todayQuestionsCount: sData.todayQuestionsCount ?? 0,
                todayActiveMinutes: sData.todayActiveMinutes ?? 0,
                isMeaningfulToday: Boolean(sData.isMeaningfulToday),
                streakHistory: sData.streakHistory,
              });
            }
          } catch (streakErr) {
            console.warn('Could not load streak metrics:', streakErr);
          }

          // Fetch Daily Goal
          try {
            const gData = await apiClient.get('/api/v1/analytics/daily-goal', { token });
            if (gData) {
              setDailyGoal({
                answeredToday: gData.answeredToday ?? 0,
                dailyTarget: gData.dailyTarget ?? 20,
              });
            }
          } catch (goalErr) {
            console.warn('Could not load daily goal:', goalErr);
          }

          // Fetch Recommendation
          try {
            const rData = await apiClient.get('/api/v1/analytics/recommendation', { token });
            if (rData?.recommendation) {
              setRecommendation({
                topicName: rData.recommendation.topicName || 'Therapeutics',
                subtopicName: rData.recommendation.subtopicName || 'Clinical Guidelines',
                targetCount: rData.recommendation.recommendedCount || 15,
                explanation: rData.recommendation.explanation || 'Personalized recommendation based on your syllabus coverage.',
                estimatedAccuracy: rData.recommendation.estimatedAccuracy || 50,
              });
            }
          } catch (recErr) {
            console.warn('Could not load recommendation:', recErr);
          }

          // Wave 5: Fetch weak topics for drill recommendations
          try {
            const wData = await apiClient.get('/api/v1/analytics/weak-topics', { token });
            if (wData?.weakTopics && Array.isArray(wData.weakTopics)) {
              setWeakTopics(wData.weakTopics.slice(0, 3)); // Top 3 weak areas
            }
          } catch (weakErr) {
            console.warn('Could not load weak topics:', weakErr);
          }
        }
      } catch (err) {
        console.warn('Could not fetch live database metrics, using fallback:', err);
      } finally {
        setLoading(false);
      }
    }

    loadLiveData();
  }, [user]);

  const totalAttempted = categoriesOverview.reduce((sum, cat) => sum + (cat.attempted || 0), 0);
  const isNewLearner = totalAttempted === 0;

  const getSubscriptionBadgeInfo = () => {
    if (!profile) return null;

    if (profile.isPro) {
      return {
        label: 'Pro Plan',
        variant: 'success' as const,
        bgClass: 'bg-teal-wash text-teal border border-teal/20',
      };
    }

    return {
      label: 'Free Tier',
      variant: 'default' as const,
      bgClass: 'bg-slate-wash text-slate border border-slate/20',
    };
  };

  const subscriptionBadge = getSubscriptionBadgeInfo();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-canvas">
      {/* Responsive Unified Navigation Header */}
      <AppHeader onOpenSubscription={() => setShowSubscriptionModal(true)} />

      {/* Email Verification Banner */}
      <EmailVerificationBanner />

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 1. Hero Recommendation & Quick Practice Launcher */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {loading ? (
            <>
              <div className="lg:col-span-2">
                <HeroRecommendationSkeleton />
              </div>
              <StreakTrackerSkeleton />
            </>
          ) : isNewLearner ? (
            <>
              {/* Dedicated New-Learner Empty State (ACE-19) */}
              <Card className="p-6 lg:col-span-2 bg-surface border-indigo/30 ring-1 ring-indigo/10 shadow-sm flex flex-col justify-between space-y-5">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs font-semibold bg-indigo-wash text-indigo border border-indigo-200">
                        <Sparkles className="w-3.5 h-3.5 mr-1 inline" /> Getting Started
                      </Badge>
                      {subscriptionBadge && (
                        <Badge variant={subscriptionBadge.variant} className={`text-xs font-semibold ${subscriptionBadge.bgClass}`}>
                          {subscriptionBadge.label}
                        </Badge>
                      )}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-light text-teal text-xs font-bold border border-teal/20 whitespace-nowrap shrink-0">
                      {profile?.displayName ? `Welcome, ${profile.displayName.split(' ')[0]}` : 'New Learner'}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-ink leading-tight">
                    Let's build your starting point
                  </h2>
                  <p className="text-slate text-xs sm:text-sm mt-2 leading-relaxed">
                    Complete a ten-question session and AcePharm will begin creating your progress overview. We'll identify your baseline strengths and calibrate high-yield areas for focused revision.
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex flex-wrap items-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => { window.location.href = '/session/new?mode=diagnostic&count=10'; }}
                    className="flex items-center gap-2 text-xs font-bold shadow-md"
                  >
                    <Play className="w-4 h-4 fill-current" /> Take your first 10-question assessment
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => { window.location.href = '/session/new'; }}
                    className="text-xs font-semibold flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-indigo" /> Custom Session Builder
                  </Button>
                </div>
              </Card>

              {/* Meaningful Session Streak Widget with Placeholder 14-day Chart */}
              <StreakTracker 
                currentStreak={streakMetrics.currentStreak} 
                longestStreak={streakMetrics.longestStreak} 
                isMeaningfulToday={streakMetrics.isMeaningfulToday} 
                todayQuestionsCount={streakMetrics.todayQuestionsCount} 
                todayActiveMinutes={streakMetrics.todayActiveMinutes}
                dailyGoalTarget={dailyGoal.dailyTarget}
                streakHistory={streakMetrics.streakHistory}
                isNewLearner={true}
              />
            </>
          ) : (
            <>
              <Card className="p-6 lg:col-span-2 bg-surface border-indigo/30 ring-1 ring-indigo/10 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5 mr-1 inline" /> Recommended Focus Drill
                      </Badge>
                      {subscriptionBadge && (
                        <Badge variant={subscriptionBadge.variant} className={`text-xs font-semibold ${subscriptionBadge.bgClass}`}>
                          {subscriptionBadge.label}
                        </Badge>
                      )}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-light text-teal text-xs font-bold border border-teal/20 whitespace-nowrap shrink-0">
                      {profile?.displayName ? `Good evening, ${profile.displayName.split(' ')[0]}` : 'Active Session'}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-ink leading-tight">
                    {recommendation.topicName}: {recommendation.subtopicName}, {recommendation.targetCount} questions
                  </h2>
                  <p className="text-slate text-xs sm:text-sm mt-2 leading-relaxed">
                    {recommendation.explanation}
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex flex-wrap items-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => { window.location.href = '/session/active'; }}
                    className="flex items-center gap-2 text-xs font-bold shadow-md"
                  >
                    <Play className="w-4 h-4 fill-current" /> Start Recommended Focus Session
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => { window.location.href = '/session/new'; }}
                    className="text-xs font-semibold flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-indigo" /> Custom Session Builder
                  </Button>
                </div>
              </Card>

              {/* Meaningful Session Streak Widget */}
              <StreakTracker 
                currentStreak={streakMetrics.currentStreak} 
                longestStreak={streakMetrics.longestStreak} 
                isMeaningfulToday={streakMetrics.isMeaningfulToday} 
                todayQuestionsCount={streakMetrics.todayQuestionsCount} 
                todayActiveMinutes={streakMetrics.todayActiveMinutes}
                dailyGoalTarget={dailyGoal.dailyTarget}
                streakHistory={streakMetrics.streakHistory}
                isNewLearner={false}
              />
            </>
          )}
        </div>

        {/* Wave 5: Weak Topics Drill Recommendations */}
        {weakTopics.length > 0 && (
          <Card className="p-6 bg-amber/5 border border-amber/20 shadow-sm space-y-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-ink">Areas to Focus On</h3>
                <p className="text-xs text-slate mt-0.5">
                  These topics need more practice. Targeted drill recommended.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {weakTopics.map((topic) => (
                <button
                  key={topic.subtopicId}
                  onClick={() => {
                    window.location.href = `/session/new?mode=drill&topicId=${encodeURIComponent(topic.subtopicId)}&count=10`;
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-surface hover:border-amber hover:bg-amber/5 transition-all text-left"
                >
                  <div>
                    <p className="text-xs font-semibold text-ink">{topic.name}</p>
                    <p className="text-[11px] text-slate mt-0.5">
                      {topic.accuracy}% accuracy • {topic.totalQuestions} questions
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate flex-shrink-0" />
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* 2. Core Curriculum Systems & Category Reset (Dual-Store Management) */}
        <Card className="p-6 bg-surface border-border shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo" /> GPhC Therapeutic Systems & Practice Status
              </h2>
              <p className="text-xs text-slate mt-0.5">
                {isNewLearner
                  ? "All 19 high-yield therapeutic systems ready. Take your first assessment to begin establishing your baseline."
                  : "First-attempt baselines stay permanent. Reset individual categories anytime to refresh your practice pool."
                }
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => { window.location.href = '/session/new'; }}
              className="text-xs self-start sm:self-auto font-semibold"
            >
              Configure Practice Session
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 9 }).map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))
            ) : (
              categoriesOverview.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 rounded-lg border border-border bg-canvas/40 hover:bg-canvas transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-ink leading-snug">{cat.name}</h3>
                      <span className="text-[11px] text-slate font-mono">
                        {cat.attempted} / {cat.total} questions attempted
                      </span>
                    </div>
                    <Badge
                      variant={
                        cat.status === 'Secure' ? 'success' :
                        cat.status === 'Developing' ? 'info' :
                        cat.status === 'Needs Attention' ? 'warning' : 'default'
                      }
                      className="text-[10px]"
                    >
                      {cat.status}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate font-mono">
                      <span>Accuracy: {cat.accuracy}%</span>
                      <span>{Math.round((cat.attempted / cat.total) * 100)}% Coverage</span>
                    </div>
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="bg-indigo h-full rounded-full"
                        style={{ width: `${(cat.attempted / cat.total) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => { window.location.href = `/session/new?categoryId=${cat.id}`; }}
                      className="text-xs font-semibold text-indigo hover:text-indigo-deep flex items-center gap-1"
                    >
                      Practise <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedResetCategory({ id: cat.id, name: cat.name, count: cat.total })}
                      className="text-[11px] text-slate hover:text-rose-600 flex items-center gap-1 transition-colors"
                      title="Reset practice attempts for this category"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset Practice
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Subscription & Account Self-Service Footer Panel */}
        <div className="p-5 bg-surface border border-border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-indigo-wash text-indigo border border-indigo/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-ink text-sm">Subscription & Billing Management</p>
                <Badge variant={user ? "success" : "teal"} className="text-[10px] py-0">
                  {user ? "Active Pro Member" : "Explorer Access"}
                </Badge>
              </div>
              <p className="text-slate text-xs mt-0.5">
                Manage your £4.99/mo or £49.99/yr membership, download VAT invoices, update cards, or cancel anytime.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
            <button
              type="button"
              onClick={async () => {
                // Wave 3: Link to Stripe customer portal
                try {
                  const data = await apiClient.post('/api/v1/stripe/customer-portal', {});
                  if (data.url) {
                    window.location.href = data.url;
                  }
                } catch (err) {
                  setShowSubscriptionModal(true);
                }
              }}
              className="text-indigo hover:text-indigo-deep text-xs font-semibold px-3 py-1.5 rounded-btn border border-indigo/20 bg-indigo-wash hover:bg-indigo/10 transition-colors flex items-center gap-1.5"
            >
              Manage Subscription
            </button>
            <button
              type="button"
              onClick={() => setShowCancellationModal(true)}
              className="text-slate hover:text-danger text-xs font-semibold underline transition-colors"
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      </main>

      {/* In-App Subscription & Billing Portal Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onOpenCancellation={() => setShowCancellationModal(true)}
      />

      {/* Explicit Category Reset Modal */}
      {selectedResetCategory && (
        <CategoryResetModal
          isOpen={Boolean(selectedResetCategory)}
          onClose={() => setSelectedResetCategory(null)}
          categoryId={selectedResetCategory.id}
          categoryName={selectedResetCategory.name}
          questionCount={selectedResetCategory.count}
          onResetSuccess={() => {
            setCategoriesOverview((prev) =>
              prev.map((c) =>
                c.id === selectedResetCategory.id
                  ? { ...c, attempted: 0, accuracy: 0, status: 'First Pass' }
                  : c
              )
            );
          }}
        />
      )}

      {/* Section 7.4 In-App Cancellation Flow Modal */}
      <CancellationFlowModal
        isOpen={showCancellationModal}
        onClose={() => setShowCancellationModal(false)}
        currentPeriodEnd={new Date(Date.now() + 30 * 86400000)}
        onCancellationComplete={() => {
          // Handled inside modal with immediate optimistic feedback
        }}
      />
    </div>
  );
}
