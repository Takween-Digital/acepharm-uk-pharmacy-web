'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  BookOpen, 
  HelpCircle, 
  Layers, 
  FileText, 
  Calculator, 
  AlertCircle, 
  RotateCw,
  ExternalLink
} from 'lucide-react';
import { Button } from '@acepharm/ui';
import { Badge } from '@acepharm/ui';
import { apiClient } from '@/lib/api-client';

interface Citation {
  id: string;
  sourceType: string;
  sourceId: string;
  label?: string;
}

interface AceMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  citations?: Citation[];
  isStreaming?: boolean;
}

interface AskAcePanelProps {
  questionId: string;
  questionPublicId?: string;
  isCalculation?: boolean;
  highlightedText?: string;
  isSubmitted?: boolean; // AP-35: Lock Ask Ace until question submitted
}

const QUICK_PROMPTS = [
  { id: 'simpler', label: 'Explain simpler', icon: Sparkles, prompt: 'Explain this clinical concept in simpler terms.' },
  { id: 'whynot', label: 'Why not other options?', icon: HelpCircle, prompt: 'Why are the other options incorrect or contraindicated in this scenario?' },
  { id: 'similar', label: 'Show similar case', icon: Layers, prompt: 'Can you describe a similar clinical scenario testing this objective?' },
  { id: 'test', label: 'Test my knowledge', icon: BookOpen, prompt: 'Test my understanding of this topic with a targeted follow-up question.' },
  { id: 'exam', label: 'GPhC exam traps', icon: AlertCircle, prompt: 'What are common GPhC examination traps or high-risk monitoring points for this topic?' },
];

export function AskAcePanel({ questionId, questionPublicId, isCalculation, highlightedText, isSubmitted }: AskAcePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<AceMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Trigger inquiry when text is highlighted and "Ask Ace about this" is clicked
  useEffect(() => {
    if (highlightedText && highlightedText.trim()) {
      setIsOpen(true);
      handleSendMessage(`Can you explain the following highlighted clinical excerpt:\n\n"${highlightedText.trim()}"`, 'free_text');
      // Scroll smoothly to Ask Ace panel
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [highlightedText]);

  // Auto-scroll when new messages appear
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle sending prompt
  const handleSendMessage = async (promptText: string, intent: string = 'free_text') => {
    if (!promptText.trim() || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage: AceMessage = {
      id: userMsgId,
      role: 'user',
      content: promptText.trim(),
      intent,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    if (!isOpen) setIsOpen(true);

    const assistantMsgId = `ast-${Date.now()}`;
    // Add temporary loading/streaming message
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        isStreaming: true,
      },
    ]);

    try {
      const data = await apiClient.post('/api/v1/ace/message', {
        threadId,
        contextType: 'question',
        contextId: questionId,
        prompt: promptText.trim(),
        intent,
      });
      if (data.threadId) {
        setThreadId(data.threadId);
      }

      // Simulate streamed text reveal for smooth UX
      const fullText = data.content || 'I could not retrieve an answer for this query.';
      let displayedText = '';
      const chunkSize = Math.max(1, Math.floor(fullText.length / 15));
      let currentIdx = 0;

      const interval = setInterval(() => {
        currentIdx += chunkSize;
        displayedText = fullText.slice(0, currentIdx);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: displayedText,
                  citations: data.citations || [],
                  isStreaming: currentIdx < fullText.length,
                }
              : msg
          )
        );

        if (currentIdx >= fullText.length) {
          clearInterval(interval);
          setIsLoading(false);
        }
      }, 30);
    } catch (err: any) {
      console.error('Ask Ace error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  'Ace is currently experiencing a connection delay. Please consult the verified clinical explanation and BNF guidance references provided in the explanation.',
                isStreaming: false,
              }
            : msg
        )
      );
      setIsLoading(false);
    }
  };

  const handleQuickPromptClick = (qp: (typeof QUICK_PROMPTS)[0]) => {
    handleSendMessage(qp.prompt, qp.id);
  };

  const promptOptions = isCalculation
    ? [
        { id: 'steps', label: 'Step-by-step breakdown', icon: Calculator, prompt: 'Break down the mathematical working step-by-step.' },
        ...QUICK_PROMPTS,
      ]
    : QUICK_PROMPTS;

  return (
    <>
      {/* Floating Toggle Button (visible when drawer is closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-4 bottom-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-indigo text-white font-semibold text-sm shadow-lg hover:bg-indigo-deep hover:shadow-xl transition-all animate-pulse"
          title="Open Ask Ace AI assistant"
        >
          <Sparkles className="w-5 h-5" />
          Ask Ace
        </button>
      )}

      {/* Floating Right-Side Drawer */}
      {isOpen && (
        <>
          {/* Backdrop to close drawer */}
          <div
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-xs md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            ref={panelRef}
            className="fixed right-0 top-0 bottom-0 z-40 w-full sm:w-96 max-w-full bg-surface border-l border-border shadow-2xl overflow-hidden flex flex-col transition-all duration-200 animate-in slide-in-from-right"
          >
            {/* 1. Header / Toggle Bar */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-border bg-indigo/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo/10 flex items-center justify-center text-indigo">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
                    Ask Ace
                    <Badge variant="info" className="text-[10px] py-0 px-1.5 font-bold uppercase tracking-wider">
                      Grounded AI Tutor
                    </Badge>
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-canvas text-slate hover:text-ink transition-colors"
                title="Close Ask Ace drawer"
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>
            </div>

            {/* 2. Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* AP-35: State Banner - Locked/Unlocked */}
          {!isSubmitted && (
            <div className="flex items-start gap-2 p-3 bg-amber/10 border border-amber/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber mt-0.5 shrink-0" />
              <div className="flex-1 text-xs text-amber-800">
                <p className="font-semibold">Ask Ace locked</p>
                <p className="text-[11px] mt-0.5 opacity-90">Submit your answer first to unlock clinical explanations. Double-click any text to select and ask Ace about it.</p>
              </div>
            </div>
          )}

          {/* Quick-Prompt Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate">
              Quick Explanations:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {promptOptions.map((qp) => {
                const Icon = qp.icon;
                return (
                  <button
                    key={qp.id}
                    type="button"
                    disabled={isLoading || !isSubmitted}
                    onClick={() => handleQuickPromptClick(qp)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface border border-border/80 text-ink hover:border-indigo hover:text-indigo hover:bg-indigo/5 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon className="w-3.5 h-3.5 text-indigo" />
                    <span>{qp.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conversation Stream & Chat History */}
          {messages.length > 0 && (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 text-xs sm:text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo text-white font-medium rounded-br-xs'
                        : 'bg-surface border border-border text-ink rounded-bl-xs shadow-xs'
                    }`}
                  >
                    {msg.content ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate py-1">
                        <RotateCw className="w-3.5 h-3.5 animate-spin text-indigo" />
                        <span className="text-xs">Ace is reviewing clinical subtopic notes & guidance...</span>
                      </div>
                    )}

                    {/* Citations block for assistant responses */}
                    {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-border/60 flex flex-wrap items-center gap-1.5 text-[11px] text-slate">
                        <span className="font-semibold text-slate">Grounded Sources:</span>
                        {msg.citations.map((cite, i) => (
                          <span
                            key={cite.id || i}
                            className="inline-flex items-center gap-1 bg-canvas border border-border px-2 py-0.5 rounded text-[10px] text-ink font-medium"
                          >
                            <BookOpen className="w-2.5 h-2.5 text-indigo" />
                            {cite.sourceType === 'subtopic_note' ? 'NICE/BNF Subtopic Notes' : 'Question Explanation & Distractors'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Free Text Input Field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="flex items-center gap-2 pt-2 border-t border-border"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isSubmitted ? "Ask Ace any clinical question about this vignette (e.g. 'Why is Indapamide chosen here?')..." : "Submit your answer first to unlock Ask Ace..."}
              disabled={isLoading || !isSubmitted}
              className="flex-1 bg-surface border border-border rounded-md px-3.5 py-2 text-xs text-ink placeholder:text-slate/60 focus:outline-none focus:ring-1 focus:ring-indigo focus:border-indigo transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!inputText.trim() || isLoading || !isSubmitted}
              className="flex items-center gap-1 text-xs px-3.5 py-2 shrink-0 font-semibold"
              title={!isSubmitted ? "Submit your answer first to ask Ace questions" : ""}
            >
              {isLoading ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Ask</span>
                </>
              )}
            </Button>
          </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
