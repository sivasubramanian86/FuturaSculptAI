import React, { useMemo, useState } from 'react';
import { TranslationKeys } from '../i18n';

interface FAQItem {
  id: string;
  category: 'rights' | 'privacy' | 'tech' | 'guide';
  question: string;
  answer: string;
}

const FAQ_DATABASE: FAQItem[] = [
  {
    id: 'FAQ-01',
    category: 'rights',
    question: 'Will FuturaSculptAI replace my job or recommend layoffs?',
    answer:
      'No. By non-negotiable architectural policy, FuturaSculptAI is barred from calculating headcount reductions, negative individual performance rankings, or automated termination. Instead, the platform reconfigures tasks across 6 categories (e.g. Automated, Augmented, Shielded) to eliminate ergonomic strain and unlocks employer-sponsored training pathways to upskill workers into higher-value roles.',
  },
  {
    id: 'FAQ-02',
    category: 'rights',
    question: 'How do I appeal an automated task redesign or career recommendation?',
    answer:
      'Every employee has a sovereign Right to Appeal. In the Workforce Opportunity Forge, click "File Appeal", enter your reason and employee ID, and attach evidence. The appeal is immediately routed to a designated human operations supervisor and ethics auditor for review. AI recommendations cannot override human judgment.',
  },
  {
    id: 'FAQ-03',
    category: 'privacy',
    question: 'How does FuturaSculptAI protect my personal workplace privacy?',
    answer:
      'All employee cohort data is protected by differential privacy algorithms. Whenever a role cohort has fewer than 10 workers (k < 10), the system automatically masks all individual identifiers and outputs generalized cohort metrics to prevent any de-anonymization or surveillance.',
  },
  {
    id: 'FAQ-04',
    category: 'privacy',
    question: 'What is the A2 Human-in-the-Loop Sign-Off Gate?',
    answer:
      'FuturaSculptAI operates under bounded autonomy tiers (A0 to A4). Tier A2 requires mandatory, cryptographic human approval before any task redesign can take effect. If any parameter is altered after approval, the system immediately revokes the sign-off and forces a fresh supervisor review.',
  },
  {
    id: 'FAQ-05',
    category: 'tech',
    question: 'Which Google Cloud technologies power FuturaSculptAI?',
    answer:
      'The platform is built 100% natively on Google Cloud: Google Cloud Run v2 (serverless microservices), Google Vertex AI (Gemini 2.5 Flash, Pro, and Thinking with Context Caching), Google Agent Development Kit (ADK 9-agent specialist swarm), BigQuery (temporal work graphs), and Cloud Sensitive Data Protection (DLP API).',
  },
  {
    id: 'FAQ-06',
    category: 'tech',
    question: 'How does the Google ADK 9-Agent Specialist Swarm work?',
    answer:
      'A supervisory Engagement Orchestrator coordinates 9 specialized sub-agents: Task Decomposer, Task Redesign, WorkGraph Architect, Skills Mobility, Skill Gap Analyst, Business Solution, FinOps Evaluator, Future Signals, and Governance Critic. They deliberate in parallel to balance safety, throughput, ergonomics, and cost.',
  },
  {
    id: 'FAQ-07',
    category: 'tech',
    question: 'What are SHA-256 Evidence Envelopes?',
    answer:
      'To eliminate AI hallucinations, all ingested documents, sensor logs, and video frames are fingerprinted with SHA-256 cryptographic hashes. Every recommendation must cite an exact evidence snippet verified through tokenized claim entailment scoring.',
  },
  {
    id: 'FAQ-08',
    category: 'guide',
    question: 'How do I switch between Citizen/Worker View and Enterprise View?',
    answer:
      'Use the toggle in the top-right header or in Settings. Citizen View simplifies concepts into human-first language and career opportunities, while Enterprise View exposes deep NetworkX graph topologies, FinOps token calculations, and Google SAIF security matrices.',
  },
];

interface FAQHelpProps {
  i18n: TranslationKeys;
}

export const FAQHelp: React.FC<FAQHelpProps> = ({ i18n }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openFaqId, setOpenFaqId] = useState<string>('FAQ-01');

  const filteredFaqs = useMemo(() => {
    return FAQ_DATABASE.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="faq-container glass-panel panel-card" style={{ padding: '28px' }} aria-label="FAQ and Help">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>❓</span>
          <span>{i18n.faqTitle}</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
          {i18n.faqDesc}
        </p>
      </div>

      {/* Search Input Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            padding: '10px 16px',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '16px' }}>🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={i18n.searchFaqPlaceholder}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`btn-subtle ${activeCategory === 'all' ? 'active' : ''}`}
          style={{ padding: '6px 14px', fontSize: '13px' }}
        >
          All Topics ({FAQ_DATABASE.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('rights')}
          className={`btn-subtle ${activeCategory === 'rights' ? 'active' : ''}`}
          style={{ padding: '6px 14px', fontSize: '13px' }}
        >
          ⚖️ Worker Rights & Security
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('privacy')}
          className={`btn-subtle ${activeCategory === 'privacy' ? 'active' : ''}`}
          style={{ padding: '6px 14px', fontSize: '13px' }}
        >
          🔒 Privacy & Ethical AI
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('tech')}
          className={`btn-subtle ${activeCategory === 'tech' ? 'active' : ''}`}
          style={{ padding: '6px 14px', fontSize: '13px' }}
        >
          ☁️ Google Cloud & AI Agents
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('guide')}
          className={`btn-subtle ${activeCategory === 'guide' ? 'active' : ''}`}
          style={{ padding: '6px 14px', fontSize: '13px' }}
        >
          🧭 Platform Guide
        </button>
      </div>

      {/* FAQ Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                style={{
                  borderRadius: '10px',
                  background: isOpen ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isOpen ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqId(isOpen ? '' : faq.id)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    fontWeight: 600,
                  }}
                >
                  <span>{faq.question}</span>
                  <span style={{ fontSize: '16px', color: 'var(--accent-cyan)' }}>{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div
                    style={{
                      padding: '0 20px 18px 20px',
                      color: 'var(--text-secondary)',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                      paddingTop: '12px',
                    }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            No questions matched your search. Try different keywords like "layoff", "privacy", or "Gemini".
          </div>
        )}
      </div>
    </div>
  );
};
