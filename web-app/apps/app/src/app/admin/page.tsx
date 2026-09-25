'use client';

import React from 'react';
import Link from 'next/link';
import { Card, Button, Badge } from '@acepharm/ui';
import { 
  Layers, 
  ShieldCheck, 
  FileSpreadsheet, 
  FileEdit, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  Activity, 
  LifeBuoy, 
  Users,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function AdminHubIndexPage() {
  const adminSections = [
    {
      category: 'Content & Authoring',
      items: [
        {
          title: 'Curriculum Hierarchy',
          description: 'Organize high-yield therapeutic categories, GPhC syllabus weighting, and subtopics.',
          href: '/admin/curriculum',
          icon: Layers,
          color: 'text-indigo',
          bgColor: 'bg-indigo/10',
        },
        {
          title: 'Review Queue',
          description: 'Review pending questions, clinical justifications, and pharmacist revisions.',
          href: '/admin/review',
          icon: ShieldCheck,
          color: 'text-teal',
          bgColor: 'bg-teal/10',
        },
        {
          title: 'Spreadsheet Importer',
          description: 'Bulk upload and validate questions, explanations, and answer matrices.',
          href: '/admin/import',
          icon: FileSpreadsheet,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
        },
        {
          title: 'Question Authoring',
          description: 'Draft single best answer (SBA) and multi-choice clinical scenarios with BNF references.',
          href: '/admin/questions/new',
          icon: FileEdit,
          color: 'text-indigo',
          bgColor: 'bg-indigo/10',
        },
      ],
    },
    {
      category: 'Governance & Operations',
      items: [
        {
          title: 'AI Tutor Oversight',
          description: 'Inspect live Ask Ace dialogues, audit BNF grounding accuracy, and monitor tokens.',
          href: '/admin/ai-oversight',
          icon: Activity,
          color: 'text-rose-500',
          bgColor: 'bg-rose-500/10',
        },
        {
          title: 'Reported Content',
          description: 'Review student feedback, question error reports, and BNF drug update alerts.',
          href: '/admin/reported',
          icon: HelpCircle,
          color: 'text-amber-600',
          bgColor: 'bg-amber-600/10',
        },
        {
          title: 'Subtopic Clinical Notes',
          description: 'Manage official high-yield summaries and guidance annotations.',
          href: '/admin/subtopic-notes',
          icon: FileText,
          color: 'text-indigo',
          bgColor: 'bg-indigo/10',
        },
        {
          title: 'Support Tickets',
          description: 'Manage inbound queries, billing support requests, and user inquiries.',
          href: '/admin/tickets',
          icon: LifeBuoy,
          color: 'text-cyan-600',
          bgColor: 'bg-cyan-600/10',
        },
        {
          title: 'User Management',
          description: 'Manage student accounts, role permissions, and access levels.',
          href: '/admin/users',
          icon: Users,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-600/10',
        },
        {
          title: 'Blog & Revision Guides',
          description: 'Publish and edit student revision guides, blueprints, and study advice.',
          href: '/admin/blog',
          icon: BookOpen,
          color: 'text-purple-600',
          bgColor: 'bg-purple-600/10',
        },
      ],
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-wash via-canvas to-surface border border-indigo/15 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2">
            <Badge variant="outline" className="bg-surface text-indigo border-indigo/30 font-bold text-[10px] uppercase tracking-wider">
              Staff Portal
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Admin Management Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate max-w-xl leading-relaxed">
            Centralized control center for question authoring, curriculum mapping, clinical review pipelines, and AI tutor oversight.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/review">
            <Button variant="primary" className="gap-2 text-xs font-bold shadow-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Review Queue</span>
            </Button>
          </Link>
          <Link href="/admin/curriculum">
            <Button variant="outline" className="gap-2 text-xs font-semibold">
              <Layers className="w-4 h-4 text-indigo" />
              <span>Curriculum</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="space-y-8">
        {adminSections.map((section) => (
          <div key={section.category} className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <span className="w-2 h-2 rounded-full bg-indigo" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate">
                {section.category}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="group">
                    <Card className="h-full p-5 bg-surface border border-border hover:border-indigo/40 hover:shadow-md transition-all rounded-xl flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center ${item.color}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate group-hover:text-indigo group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-ink group-hover:text-indigo transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-xs text-slate mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
