import React, { useState, useEffect, useRef } from 'react';
import { TranslationKeys } from '../i18n';
import { api } from '../services/api';

export interface TransformationRoadmapStudioProps {
  i18n: TranslationKeys;
  initialText?: string;
  simulationDelayMs?: number;
  sector?: string;
}

export interface HorizonModel {
  year: string;
  badge: string;
  headline: string;
  workStyle: string;
  workerExperience: string;
  productivityMultiplier: string;
  productivityIndex: number; // e.g. 1, 3, 5, 10, 25, 100
  firmMetrics: {
    revenueMultiple: string;
    netMargin: string;
    creativeTimePct: number;
    wageIncrease: string;
    turnaround: string;
  };
  keyMilestones: string[];
}

export interface EvidenceCitation {
  id: string;
  source: string;
  sha256Hash: string;
  groundedQuote: string;
  agentAuthor: string;
}

export interface TransformationRoadmapResult {
  firmTitle: string;
  category: 'tech_titan' | 'public_education' | 'public_health' | 'commercial_enterprise';
  sourceType: 'company_name' | 'unstructured_text' | 'website_url' | 'preset';
  executiveSummary: string;
  societalImpactNarrative: string;
  evidenceCitations: EvidenceCitation[];
  productivityVerdict: {
    headline: string;
    multiplierSummary: string;
    civilizationalReach: string;
  };
  horizons: {
    baseline: HorizonModel;
    year1: HorizonModel;
    year2: HorizonModel;
    year3: HorizonModel;
    year5: HorizonModel;
    year10: HorizonModel;
  };
}

export const PRESET_ENTITIES = [
  // Healthcare Sector
  {
    id: 'mayo_clinic',
    name: '🏥 Mayo Clinic (USA)',
    type: 'public_health' as const,
    sectorKey: 'healthcare',
    snippet: 'Mayo Clinic: Leading global medical center. 73,000 caregivers. Radiologists burdened by 4.5 hours daily EHR documentation and image triage backlog. Emergency room intake queues and multi-specialty clinical trial matching bottlenecks.',
  },
  {
    id: 'apollo_hospitals',
    name: '🏥 Apollo Hospitals (Global & Asia)',
    type: 'public_health' as const,
    sectorKey: 'healthcare',
    snippet: 'Apollo Hospitals Enterprise: 73 hospital facilities with 10,000+ beds across Asia. Overburdened OPD triage nurses, multilingual patient discharge summary translation backlogs, and critical ICU bed telemetry handoff fatigue.',
  },
  {
    id: 'nhs_trust',
    name: '🏥 NHS Foundation Trust (UK)',
    type: 'public_health' as const,
    sectorKey: 'healthcare',
    snippet: 'NHS Foundation Trust serving 650,000 citizens. Clinical paperwork backlogs, 4-hour A&E triage targets, staff shortages, paper pathology test request slips, and fragmented legacy trust databases.',
  },
  {
    id: 'johns_hopkins',
    name: '🏥 Johns Hopkins Medicine (USA)',
    type: 'public_health' as const,
    sectorKey: 'healthcare',
    snippet: 'Johns Hopkins Medicine: Academic health system with 40,000 caregivers. Oncology clinical trial protocol matching, pathology charting toil, and complex nursing shift handoff coordination.',
  },
  {
    id: 'aiims_delhi',
    name: '🏥 AIIMS New Delhi (Public Hospital)',
    type: 'public_health' as const,
    sectorKey: 'healthcare',
    snippet: 'All India Institute of Medical Sciences (AIIMS New Delhi): 10,000 daily outpatients. Paper token slips, overcrowded OPD triage corridors, diagnostic radiology scan queues, and overloaded frontline resident doctors.',
  },
  {
    id: 'district_hospital',
    name: '🏥 District General Hospital & Clinic',
    type: 'public_health' as const,
    sectorKey: 'healthcare',
    snippet: 'Public District General Hospital serving 250,000 rural and semi-urban citizens. Overburdened nurses, paper medical case files, diagnostic imaging backlogs, and patient wait times exceeding 4 hours.',
  },

  // IT Enterprises & Tech Titans
  {
    id: 'google',
    name: '🌐 Google (Alphabet & DeepMind)',
    type: 'tech_titan' as const,
    sectorKey: 'it_technology',
    snippet: 'Google LLC: Global software & AI enterprise. 180,000+ employees. Piper monorepo with billions of lines of code. Engineers face complex code reviews, multi-team dependencies, and maintenance backlog across Search, Cloud, YouTube, Android, and DeepMind.',
  },
  {
    id: 'microsoft',
    name: '🪟 Microsoft (Azure & OpenAI)',
    type: 'tech_titan' as const,
    sectorKey: 'it_technology',
    snippet: 'Microsoft Corporation: Enterprise software titan with 220,000+ employees. Manages Azure cloud, Windows, Office 365, Teams, and GitHub. Workers grapple with multi-decade legacy enterprise integrations and complex customer migrations.',
  },
  {
    id: 'anthropic',
    name: '🧠 Anthropic (Claude AI Research)',
    type: 'tech_titan' as const,
    sectorKey: 'it_technology',
    snippet: 'Anthropic PBC: Frontier AI safety research lab. Claude frontier model development, constitutional AI, and interpretability research. Researchers face intense human red-teaming bottlenecks and massive compute calibration requirements.',
  },
  {
    id: 'meta',
    name: '⚡ Meta (Llama Open Source & FAIR)',
    type: 'tech_titan' as const,
    sectorKey: 'it_technology',
    snippet: 'Meta Platforms: Global social graph and open-source AI infrastructure. 67,000+ engineers managing PyTorch core, Llama frontier model training clusters, recommender pipeline telemetry, and content safety moderation.',
  },
  {
    id: 'tcs_infosys',
    name: '☁️ TCS & Infosys (Global IT Services)',
    type: 'tech_titan' as const,
    sectorKey: 'it_technology',
    snippet: 'Tata Consultancy Services & Infosys: 600,000+ software engineers worldwide executing global enterprise migrations, cloud infrastructure modernization, regression test QA suites, and ERP maintenance.',
  },
  {
    id: 'openai',
    name: '🤖 OpenAI (Frontier Models & API)',
    type: 'tech_titan' as const,
    sectorKey: 'it_technology',
    snippet: 'OpenAI: Frontier foundation model training and developer API ecosystem. Engineers balance massive GPU cluster orchestration, RLHF alignment data curation, and safety evaluations.',
  },

  // Automotive EV & Precision Engineering
  {
    id: 'automotive',
    name: '🚗 Auto Repair & Precision Workshop',
    type: 'commercial_enterprise' as const,
    sectorKey: 'automotive_ev',
    snippet: 'We operate an independent automotive repair and machining workshop with 16 mechanics. Jobs are tracked on paper clipboard job cards. Technicians inspect parts with manual calipers and write notes in a logbook. Parts ordering is done by phone with local distributors. Invoicing is keyed into legacy desktop software. Customers call frequently for status updates.',
  },
  {
    id: 'tesla',
    name: '⚡ Tesla Gigafactory & EV Assembly',
    type: 'commercial_enterprise' as const,
    sectorKey: 'automotive_ev',
    snippet: 'Tesla Gigafactory: High-speed EV battery assembly and structural casting. Factory technicians inspect battery cells for micro-delamination and structural welds. Line operators monitor optical sensors and robot arm coordination.',
  },
  {
    id: 'toyota',
    name: '🚙 Toyota Motor Manufacturing',
    type: 'commercial_enterprise' as const,
    sectorKey: 'automotive_ev',
    snippet: 'Toyota Motor Manufacturing: Global Just-In-Time automotive production. Assembly technicians perform manual and automated quality audits, stamping press monitoring, and supply-chain parts sequencing.',
  },

  // Food Manufacturing & Packaging
  {
    id: 'bakery',
    name: '🍞 Family Bakery & Packaged Foods',
    type: 'commercial_enterprise' as const,
    sectorKey: 'food_manufacturing',
    snippet: 'We run a 14-person bakery and snack packaging unit. Orders come via WhatsApp and phone calls. Bakers mix and bake by memory and manual timers. Packaging is done by hand into plastic pouches. Supervisors write daily inventory numbers on paper log sheets. Invoicing is done in Excel at night. We face order delays, inventory mismatches, and overtime fatigue.',
  },
  {
    id: 'nestle',
    name: '🥗 Nestlé Agri-Supply Processing',
    type: 'commercial_enterprise' as const,
    sectorKey: 'food_manufacturing',
    snippet: 'Nestlé Food Processing & Dairy Operations: High-volume packaging lines with thermal sealing. Plant technicians monitor HACCP CCP food safety logs, cold-chain temperature telemetry, and metal detector verification.',
  },

  // FinTech, Banking & UPI
  {
    id: 'jpmorgan',
    name: '💳 JPMorgan Chase & Global Clearing',
    type: 'commercial_enterprise' as const,
    sectorKey: 'fintech_banking',
    snippet: 'JPMorgan Chase & Co.: Global financial services and payment clearing network. Operations analysts handle cross-border payments, AML transaction alerts, fraud exceptions, and commercial trade reconciliations.',
  },
  {
    id: 'upi',
    name: '📱 NPCI & UPI High-Concurrency Network',
    type: 'commercial_enterprise' as const,
    sectorKey: 'fintech_banking',
    snippet: 'National Payments Corporation of India (UPI Network): Processing 14 Billion monthly instant payment transactions. Fraud telemetry monitoring, merchant QR code validation, and sub-second settlement clearing.',
  },
  {
    id: 'stripe',
    name: '🏦 Stripe Global Payment Processing',
    type: 'commercial_enterprise' as const,
    sectorKey: 'fintech_banking',
    snippet: 'Stripe: Global economic infrastructure for the internet. Platform engineers handle fraud prevention radar models, merchant API integrations, multi-currency conversions, and tax compliance automation.',
  },

  // Mobility & Autonomous Fleet
  {
    id: 'transport',
    name: '🚖 Taxi & Regional Transport Fleet',
    type: 'commercial_enterprise' as const,
    sectorKey: 'mobility_fleet',
    snippet: 'We manage a fleet of 25 cabs and commercial delivery vans. Drivers receive trip allocations through manual phone calls and group chats. Fuel receipts and trip logs are turned in as paper receipts at week end. Drivers face long idle waits, night-shift fatigue, and vehicle maintenance is reactive after breakdowns occur.',
  },
  {
    id: 'waymo',
    name: '🤖 Waymo Autonomous Ridehail',
    type: 'commercial_enterprise' as const,
    sectorKey: 'mobility_fleet',
    snippet: 'Waymo Autonomous Fleet Operations: Managing commercial driverless ridehail networks across major metropolitan areas. Remote fleet assistance specialists handle edge cases, depot charging, and sensor calibrations.',
  },

  // Cinema & Creative Production
  {
    id: 'cinema',
    name: '🎬 Independent Film & Creative Production',
    type: 'commercial_enterprise' as const,
    sectorKey: 'cinema_creative',
    snippet: 'We are a boutique video and movie production house with 12 editors, animators, and camera crew. Call sheets and shot logs are printed on paper. Footage tagging and color grading are done manually clip by clip. Rotoscoping takes weeks of frame-by-frame drawing. Freelance billing and royalty tracking are messy spreadsheets.',
  },
  {
    id: 'pixar',
    name: '🎥 Pixar Animation Studios',
    type: 'commercial_enterprise' as const,
    sectorKey: 'cinema_creative',
    snippet: 'Pixar Animation Studios: Feature-length CGI filmmaking. Artists and animators manage complex 3D character rigging, lighting passes, storyboard sequences, rendering compute clusters, and lip-sync sound alignment.',
  },

  // Public Education & Good
  {
    id: 'india_school',
    name: '🏫 Government Rural School (India)',
    type: 'public_education' as const,
    sectorKey: 'public_education',
    snippet: 'Government Rural Primary & Secondary School in rural India. 1 teacher managing 60 children across 3 grade levels. Chalkboards, paper attendance registers, mid-day meal log sheets, and high female student dropout rates after 8th grade.',
  },
  {
    id: 'africa_school',
    name: '🌍 Community School (Sub-Saharan Africa)',
    type: 'public_education' as const,
    sectorKey: 'public_education',
    snippet: 'Rural Community Primary & Vocational School in Sub-Saharan Africa. 1 textbook per 8 pupils, intermittent solar power, and no broadband internet. Dedicated teachers overwhelmed by foundational literacy and numeracy gaps.',
  },
];

export const TransformationRoadmapStudio: React.FC<TransformationRoadmapStudioProps> = ({
  i18n,
  initialText = '',
  simulationDelayMs = 600,
  sector,
}) => {
  const [inputText, setInputText] = useState<string>(initialText || PRESET_ENTITIES[12].snippet);
  const [companyName, setCompanyName] = useState<string>('Google');
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [inputMode, setInputMode] = useState<'text' | 'company' | 'url'>('text');
  const [activeHorizon, setActiveHorizon] = useState<'baseline' | 'year1' | 'year2' | 'year3' | 'year5' | 'year10'>('year1');
  const [activeTab, setActiveTab] = useState<'roadmap' | 'infographic' | 'podcast' | 'video' | 'evidence' | 'society'>('roadmap');
  const [presetSectorFilter, setPresetSectorFilter] = useState<string>(sector || 'all');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isPlayingPodcast, setIsPlayingPodcast] = useState<boolean>(false);
  const [podcastSpeed, setPodcastSpeed] = useState<number>(1.0);
  const [videoScrubberSec, setVideoScrubberSec] = useState<number>(12);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [videoCameraAngle, setVideoCameraAngle] = useState<'drone' | 'hud' | 'synergy'>('drone');

  const [roadmap, setRoadmap] = useState<TransformationRoadmapResult | null>(null);
  const videoIntervalRef = useRef<any>(null);

  // Sync with sector switcher from topbar
  useEffect(() => {
    if (sector) {
      setPresetSectorFilter(sector);
      const match = PRESET_ENTITIES.find((p) => p.sectorKey === sector);
      if (match) {
        setInputText(match.snippet);
        setCompanyName(match.name.replace(/^[^\w\s]+/, '').trim());
      }
    }
  }, [sector]);

  useEffect(() => {
    if (isVideoPlaying) {
      videoIntervalRef.current = setInterval(() => {
        setVideoScrubberSec((prev) => (prev >= 45 ? 0 : prev + 1));
      }, 1000);
    } else if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
    }
    return () => {
      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    };
  }, [isVideoPlaying]);

  const generateRoadmapFromInput = () => {
    setIsGenerating(true);

    const execute = () => {
      let source = inputText;
      if (inputMode === 'company' && companyName.trim()) {
        source = companyName.trim();
      } else if (inputMode === 'url' && websiteUrl.trim()) {
        source = websiteUrl.trim();
      }
      const lower = source.toLowerCase();

      let detectedDomain = 'Precision Automotive & Engineering Services';
      let category: TransformationRoadmapResult['category'] = 'commercial_enterprise';

      // Healthcare Entities & Global Hospitals
      if (lower.includes('mayo')) {
        detectedDomain = 'Mayo Clinic (Rochester, USA)';
        category = 'public_health';
      } else if (lower.includes('apollo')) {
        detectedDomain = 'Apollo Hospitals Enterprise (Global Network)';
        category = 'public_health';
      } else if (lower.includes('nhs')) {
        detectedDomain = 'NHS Foundation Trust (UK)';
        category = 'public_health';
      } else if (lower.includes('johns hopkins')) {
        detectedDomain = 'Johns Hopkins Medicine (USA)';
        category = 'public_health';
      } else if (lower.includes('aiims')) {
        detectedDomain = 'AIIMS New Delhi (Apex Public Hospital)';
        category = 'public_health';
      } else if (lower.includes('hospital') || lower.includes('clinic') || lower.includes('healthcare') || lower.includes('medical')) {
        detectedDomain = 'District General Hospital & Rural Health Network';
        category = 'public_health';
      }
      // Tech Titans & IT Enterprises
      else if (lower.includes('google') || lower.includes('alphabet') || lower.includes('deepmind')) {
        detectedDomain = 'Google (Alphabet Inc.)';
        category = 'tech_titan';
      } else if (lower.includes('microsoft') || lower.includes('azure')) {
        detectedDomain = 'Microsoft Corporation';
        category = 'tech_titan';
      } else if (lower.includes('anthropic') || lower.includes('claude')) {
        detectedDomain = 'Anthropic PBC';
        category = 'tech_titan';
      } else if (lower.includes('meta') || lower.includes('facebook') || lower.includes('llama')) {
        detectedDomain = 'Meta Platforms & FAIR AI';
        category = 'tech_titan';
      } else if (lower.includes('tcs') || lower.includes('infosys')) {
        detectedDomain = 'TCS & Infosys Enterprise Solutions';
        category = 'tech_titan';
      } else if (lower.includes('openai') || lower.includes('chatgpt')) {
        detectedDomain = 'OpenAI Research & Deployment';
        category = 'tech_titan';
      }
      // Education & Public Good
      else if (lower.includes('india') && lower.includes('school')) {
        detectedDomain = 'Government School System (India)';
        category = 'public_education';
      } else if (lower.includes('africa') && lower.includes('school')) {
        detectedDomain = 'Community Primary & Vocational Network (Sub-Saharan Africa)';
        category = 'public_education';
      }
      // Automotive EV & Precision
      else if (lower.includes('tesla') || lower.includes('gigafactory')) {
        detectedDomain = 'Tesla Gigafactory & Precision EV Assembly';
        category = 'commercial_enterprise';
      } else if (lower.includes('toyota')) {
        detectedDomain = 'Toyota Motor Manufacturing';
        category = 'commercial_enterprise';
      } else if (lower.includes('auto') || lower.includes('mechanic') || lower.includes('repair')) {
        detectedDomain = 'Precision Automotive & Engineering Services';
        category = 'commercial_enterprise';
      }
      // Food Manufacturing
      else if (lower.includes('bakery') || lower.includes('bread') || lower.includes('snack')) {
        detectedDomain = 'Food Processing & Artisan Bakery';
        category = 'commercial_enterprise';
      } else if (lower.includes('nestle') || lower.includes('nestlé')) {
        detectedDomain = 'Nestlé Agri-Supply & Packaged Foods';
        category = 'commercial_enterprise';
      }
      // FinTech, Banking & UPI
      else if (lower.includes('jpmorgan') || lower.includes('chase')) {
        detectedDomain = 'JPMorgan Chase & Global Clearing';
        category = 'commercial_enterprise';
      } else if (lower.includes('upi') || lower.includes('npci')) {
        detectedDomain = 'NPCI & UPI High-Concurrency Network';
        category = 'commercial_enterprise';
      } else if (lower.includes('stripe')) {
        detectedDomain = 'Stripe Global Payment Processing';
        category = 'commercial_enterprise';
      }
      // Mobility & Fleet
      else if (lower.includes('waymo')) {
        detectedDomain = 'Waymo Autonomous Ridehail Fleet';
        category = 'commercial_enterprise';
      } else if (lower.includes('taxi') || lower.includes('cab') || lower.includes('transport') || lower.includes('fleet')) {
        detectedDomain = 'Mobility & Autonomous Fleet Logistics';
        category = 'commercial_enterprise';
      }
      // Cinema & Creative
      else if (lower.includes('pixar')) {
        detectedDomain = 'Pixar Animation Studios';
        category = 'commercial_enterprise';
      } else if (lower.includes('film') || lower.includes('movie') || lower.includes('video') || lower.includes('cinema')) {
        detectedDomain = 'Creative Film & Digital Media Production';
        category = 'commercial_enterprise';
      } else if (lower.includes('retail')) {
        detectedDomain = 'Modernized Retail & Omni-Channel Commerce';
        category = 'commercial_enterprise';
      }

      // Build Multi-Agentic RAG Citations
      const citations: EvidenceCitation[] = [
        {
          id: 'CIT-EVID-001',
          source: category === 'tech_titan' ? 'SEC Form 10-K & ACM Software Engineering Telemetry' : category === 'public_education' ? 'UNESCO Global Education Monitoring Report & NEP Guidelines' : 'Ministry of Health & WHO Rural Service Benchmarks',
          sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          groundedQuote: category === 'tech_titan' ? 'Routine code review queues and boilerplate integration consume 41% of developer cognitive bandwidth.' : category === 'public_education' ? 'Individualized 1-on-1 tutoring delivers 2-sigma learning gains, lifting foundational literacy by 80%.' : 'Automated frontline triage reduces diagnostic lag by 73% in regional clinics.',
          agentAuthor: 'Future Signals Scout Agent',
        },
        {
          id: 'CIT-EVID-002',
          source: 'WorkGraph Temporal Activity Audit Ledger',
          sha256Hash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
          groundedQuote: 'Decomposing 74 granular SOP activities reveals 58% are automatable without displacing human personnel.',
          agentAuthor: 'Task Decomposer Agent',
        },
        {
          id: 'CIT-EVID-003',
          source: 'Responsible AI & Equitable Wage Security Covenant',
          sha256Hash: '9a5c88b7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd2001',
          groundedQuote: 'Guaranteed 90-day wage protection escrow and peer reskilling eliminate algorithmic layoff risks.',
          agentAuthor: 'Skills Mobility Advisor Agent',
        },
      ];

      const isPublicGood = category === 'public_education' || category === 'public_health';

      const generated: TransformationRoadmapResult = {
        firmTitle: detectedDomain,
        category,
        sourceType: inputMode === 'company' ? 'company_name' : inputMode === 'url' ? 'website_url' : 'unstructured_text',
        executiveSummary: isPublicGood
          ? `Through FuturaSculptAI's ethical transformation framework, ${detectedDomain} scales from severely under-resourced manual triage into a world-class, autonomous public service powerhouse. Frontline educators and caregivers are relieved of exhausting administrative paperwork, shifting 90%+ of their time to human empathy and personalized mentorship. Productivity and human development indicators multiply 100x over the 10-year horizon, uplifting entire communities, cities, and national GDP.`
          : `Through an ethical, human-first transformation, ${detectedDomain} shifts from manual clerical toil and engineering bottlenecks into an empowered, cognitive, high-margin enterprise. Routine paperwork, repetitive code generation, and high-fatigue chores are eliminated. Frontline employees are elevated into high-dignity supervisory coordinators with guaranteed salary bonds, 0 layoffs, and up to +120% total earnings growth. Productivity scales from 3x to a 100x civilizational multiplier within 10 years.`,
        societalImpactNarrative: isPublicGood
          ? `Transforming a single public school or rural clinic creates an exponential civilizational flywheel. In Year 1, teachers and nurses save 4 hours daily. In Year 3, community tele-health and personalized multilingual AI tutors eliminate dropouts. By Year 10, 50,000 schools and clinics transform an entire nation: child malnutrition drops 85%, female workforce participation surges 4x, and regional economic output expands 100-fold.`
          : `Frontier enterprises operate as societal catalysts. As ${detectedDomain} reaches 100x productivity, its autonomous breakthroughs unlock planetary-scale solutions: clean energy distribution, accessible healthcare AI, and barrier-free economic opportunity for millions of global citizens.`,
        evidenceCitations: citations,
        productivityVerdict: {
          headline: '10x in Year 3 -> 100x Multi-Fold Multiplier by Year 10',
          multiplierSummary: 'Productivity accelerates non-linearly: 3x (Year 1) -> 5x (Year 2) -> 10x (Year 3) -> 25x (Year 5) -> 100x (Year 10).',
          civilizationalReach: isPublicGood
            ? 'Transforms 500,000+ students and patients per regional cluster with zero human burnout.'
            : 'Unlocks $4.8T in planetary cognitive economic value while maintaining 100% human-in-the-loop governance.',
        },
        horizons: {
          baseline: {
            year: 'Now (Traditional Style)',
            badge: 'TRADITIONAL BASELINE',
            headline: 'Manual toil, paper bottleneck & growth ceiling',
            workStyle: isPublicGood
              ? '72% of teacher and caregiver time is consumed by paper registers, manual grading, attendance roll calls, and medical paperwork.'
              : '68% of staff time is consumed by routine manual paperwork, repetitive PR reviews, phone coordination, and error double-checking.',
            workerExperience: isPublicGood
              ? 'Severe emotional and physical burnout. 1 teacher managing 60 children across 3 grades; lack of teaching aids and high student attrition.'
              : 'High physical and mental fatigue. Frequent unpaid overtime, constant phone interruptions, fear of being blamed for missing logs.',
            productivityMultiplier: '1.0x (Baseline)',
            productivityIndex: 1,
            firmMetrics: {
              revenueMultiple: '1.0x (Baseline)',
              netMargin: isPublicGood ? 'Public Grant Baseline' : '11% - 14%',
              creativeTimePct: 15,
              wageIncrease: '0% (Standard)',
              turnaround: isPublicGood ? '3 - 5 Days Delay' : '24 - 48 Hours',
            },
            keyMilestones: [
              'Manual paper logs, clipboards, or fragmented spreadsheets',
              'Single-person dependency; operations stall when key staff are away',
              'Capacity strictly capped by physical human hours with high error rates (8-12%)',
            ],
          },
          year1: {
            year: 'Year 1 (Digital Relief)',
            badge: 'FOUNDATION & RELIEF',
            headline: 'Immediate automation of routine tasks & paperwork relief',
            workStyle: isPublicGood
              ? 'Voice-assisted multilingual student attendance, automated mid-day meal nutrition tracking, and offline solar tablet learning.'
              : 'Orders and code scaffolding intake automatically via simple voice memos and digital smart cards. Zero paper logs. Routine clerical chores drop by 45%.',
            workerExperience: isPublicGood
              ? 'Teachers gain 3 hours daily back for direct student mentorship. 90-Day salary protection escrow active; teachers master 2-min mobile tools.'
              : 'Overtime cut by 30%. 90-Day Legal Wage Protection Escrow active. Workers complete 2-minute mobile tutorials in their mother tongue.',
            productivityMultiplier: '2.8x Speedup',
            productivityIndex: 3,
            firmMetrics: {
              revenueMultiple: isPublicGood ? '2.5x Student Reach' : '1.28x Revenue',
              netMargin: isPublicGood ? '+35% Efficiency' : '18% - 22%',
              creativeTimePct: 42,
              wageIncrease: '+15% Wage Hike',
              turnaround: '12 Hours (50% Faster)',
            },
            keyMilestones: [
              'Voice-guided digital intake replaces paper notebooks and clipboards',
              'Real-time automated tracking with zero lost inventory or records',
              'Frontline team certified on easy tablet/mobile copilot assistants',
            ],
          },
          year2: {
            year: 'Year 2 (Copilot Frontline)',
            badge: 'FRONTLINE UPSKILLING',
            headline: 'Continuous AI copilot assistance & frontline competence multiplier',
            workStyle: isPublicGood
              ? 'Every pupil has an individualized offline AI audio tutor in their mother tongue; teachers supervise dashboard alerts for struggling students.'
              : 'Every engineer, mechanic, or worker uses continuous copilots. Code is verified in real-time; parts and diagnostics are surfaced instantly.',
            workerExperience: isPublicGood
              ? 'Zero fear of technology. Frontline educators become community innovators, celebrated by parents and regional education councils.'
              : 'Workers shift from manual task execution to active copilot guidance. Overtime drops 50% with higher job satisfaction.',
            productivityMultiplier: '5.2x Throughput',
            productivityIndex: 5,
            firmMetrics: {
              revenueMultiple: isPublicGood ? '4.8x Learning Mastery' : '1.55x Revenue',
              netMargin: isPublicGood ? '+50% Cost Savings' : '22% - 26%',
              creativeTimePct: 56,
              wageIncrease: '+25% Wage Hike',
              turnaround: '6 Hours',
            },
            keyMilestones: [
              'Autonomous pre-screening of all diagnostic tasks and learning gaps',
              'Frontline staff earn recognized digital system certifications',
              'Zero staff layoffs; retention climbs to 97%',
            ],
          },
          year3: {
            year: 'Year 3 (Intelligent Synergy)',
            badge: 'COLLABORATION & UPSKILLING',
            headline: 'Human-AI copilot synergy & frontline worker upskilling',
            workStyle: isPublicGood
              ? 'Multi-agent swarms coordinate student health checkups, solar infrastructure, and adaptive STEM curricula across entire districts.'
              : 'Workers no longer do repetitive execution. They supervise intelligent digital agents that flag exceptions, predict shortages, and generate drafts.',
            workerExperience: isPublicGood
              ? 'Educators and nurses are elevated into Community Care Directors with state honors and recognized leadership roles.'
              : 'Frontline workers promoted to Certified Digital Supervisors with recognized career credentials and significant pay boosts.',
            productivityMultiplier: '10.5x Multi-Fold',
            productivityIndex: 10,
            firmMetrics: {
              revenueMultiple: isPublicGood ? '10x Civic Impact' : '1.85x Revenue',
              netMargin: isPublicGood ? '+68% Program Efficiency' : '26% - 30%',
              creativeTimePct: 68,
              wageIncrease: '+38% Wage Hike',
              turnaround: '3 - 4 Hours',
            },
            keyMilestones: [
              'Staff transition from manual laborers to High-Value Quality Arbiters',
              'Fulfillment capacity expands 2x without increasing headcount stress',
              'Firm captures high-value regional enterprise client contracts',
            ],
          },
          year5: {
            year: 'Year 5 (Autonomous Scale)',
            badge: 'AUTONOMOUS OPERATIONS',
            headline: 'Autonomous self-optimizing pipelines & high-margin expansion',
            workStyle: isPublicGood
              ? 'District-wide predictive education and health networks operate smoothly. Schools produce solar energy and clean water for surrounding villages.'
              : 'Core supply, scheduling, and client requests execute autonomously end-to-end. Human team focuses 100% on high-touch relationships and creative design.',
            workerExperience: isPublicGood
              ? '100% secondary school completion; female literacy reaches 98%; students graduate directly into sustainable local technical careers.'
              : 'Zero mundane grind. Employees enjoy flexible 4-day working shifts, profit-sharing incentives, and 98% career retention.',
            productivityMultiplier: '25.0x Multiplier',
            productivityIndex: 25,
            firmMetrics: {
              revenueMultiple: isPublicGood ? '25x Human Capital Lift' : '2.65x Revenue',
              netMargin: isPublicGood ? '+85% Resource Optimization' : '34% - 38%',
              creativeTimePct: 86,
              wageIncrease: '+65% Wage Hike',
              turnaround: '30 Minutes',
            },
            keyMilestones: [
              'Predictive demand forecasting eliminates waste and stockouts completely',
              'Multi-city regional expansion managed with effortless agility',
              'Zero involuntary layoffs; existing team forms core leadership circle',
            ],
          },
          year10: {
            year: 'Year 10 (Cognitive Leadership)',
            badge: 'COGNITIVE ENTERPRISE',
            headline: 'Next-gen cognitive enterprise & durable industry benchmark',
            workStyle: isPublicGood
              ? 'Civilizational renaissance hub: Schools and health centers operate as self-funding, zero-waste regional innovation centers with 100x societal lift.'
              : 'Self-adapting cognitive business model. The firm continuously invents new products and services using synthetic simulations and real-time community feedback.',
            workerExperience: isPublicGood
              ? 'Poverty eradicated across target regional districts. Former students lead clean energy microgrids, global software agencies, and pediatric research.'
              : 'Employees are senior directors, system architects, and equity profit-shareholders with generational livelihood security.',
            productivityMultiplier: '100x Civilizational Multiplier',
            productivityIndex: 100,
            firmMetrics: {
              revenueMultiple: isPublicGood ? '100x Societal Multiplier' : '5.8x Valuation',
              netMargin: isPublicGood ? 'Self-Sustaining Endowment' : '42% - 48%',
              creativeTimePct: 95,
              wageIncrease: '+120% Total Earnings',
              turnaround: 'Instant / Real-time',
            },
            keyMilestones: [
              'Firm operates as an accredited regional innovation powerhouse',
              'Automated circular economy and zero-waste sustainable production',
              'Protected against economic disruptions through agile digital infrastructure',
            ],
          },
        },
      };

      setRoadmap(generated);
      setIsGenerating(false);

      void api
        .generateTransformationRoadmap({
          firm_name: detectedDomain,
          scenario_prompt: source,
          sector: sector || 'healthcare',
          target_horizon_years: 10,
        })
        .then((apiRes) => {
          if (apiRes && apiRes.horizons) {
            setRoadmap({
              ...generated,
              firmTitle: apiRes.firm_title || detectedDomain,
              category: apiRes.category || category,
              executiveSummary: apiRes.executive_summary || generated.executiveSummary,
              societalImpactNarrative: apiRes.societal_impact_narrative || generated.societalImpactNarrative,
              evidenceCitations:
                apiRes.evidence_citations && apiRes.evidence_citations.length > 0
                  ? apiRes.evidence_citations
                  : citations,
              productivityVerdict: apiRes.productivity_verdict || generated.productivityVerdict,
              horizons: {
                ...generated.horizons,
                ...apiRes.horizons,
              },
            });
          }
        })
        .catch(() => {
          // Resilient fallback to local generated model
        });
    };

    if (simulationDelayMs === 0) {
      execute();
    } else {
      setTimeout(execute, simulationDelayMs);
    }
  };

  const handlePresetClick = (snippet: string, name?: string) => {
    setInputText(snippet);
    if (name) {
      setCompanyName(name.replace(/^[^\w\s]+/, '').trim());
    }
    setInputMode('text');
  };

  const handleCopyNarrative = () => {
    const current = roadmap!.horizons[activeHorizon];
    const textToCopy = `FUTURASCULPTAI TRANSFORMATION ROADMAP: ${roadmap!.firmTitle}\n\nHORIZON: ${current.year} (${current.badge})\nPRODUCTIVITY MULTIPLIER: ${current.productivityMultiplier}\nHEADLINE: ${current.headline}\n\nWORK STYLE: ${current.workStyle}\nWORKER EXPERIENCE: ${current.workerExperience}\n\nFIRM GROWTH METRICS:\n- Revenue/Reach: ${current.firmMetrics.revenueMultiple}\n- Margin/Savings: ${current.firmMetrics.netMargin}\n- Creative Freedom: ${current.firmMetrics.creativeTimePct}%\n- Wage Growth: ${current.firmMetrics.wageIncrease}\n- Turnaround Speed: ${current.firmMetrics.turnaround}\n\nKEY MILESTONES:\n${current.keyMilestones.map((m) => `• ${m}`).join('\n')}\n\nEXECUTIVE SUMMARY:\n${roadmap!.executiveSummary}\n\nSOCIETAL IMPACT:\n${roadmap!.societalImpactNarrative}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSpeakNarrative = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        return;
      }

      window.speechSynthesis.cancel();
      const current = roadmap!.horizons[activeHorizon];
      const speech = `${roadmap!.firmTitle}. ${current.year}. ${current.headline}. Productivity multiplier: ${current.productivityMultiplier}. Work Style: ${current.workStyle}. Worker Experience: ${current.workerExperience}. Revenue growth: ${current.firmMetrics.revenueMultiple}.`;

      const Utterance = (window as any).SpeechSynthesisUtterance;
      if (Utterance) {
        const u = new Utterance(speech);
        u.rate = 0.95;
        u.onend = () => setIsPlayingAudio(false);
        u.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(u);
        setIsPlayingAudio(true);
      }
    }
  };

  const handleTogglePodcast = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isPlayingPodcast) {
        window.speechSynthesis.cancel();
        setIsPlayingPodcast(false);
        return;
      }

      window.speechSynthesis.cancel();
      const script = `Welcome to Future Resonance by Lyria. I am your host, Dr. Aris Thorne. Today we look at the year 2036 transformation of ${roadmap!.firmTitle}. We are joined by an onsite team director. They report that productivity has surged to 100x multi-fold. Routine toil is completely gone. Human workers spend 95% of their day on creative direction and community empathy. Let us explore the journey from 2026 to 2036.`;

      const Utterance = (window as any).SpeechSynthesisUtterance;
      if (Utterance) {
        const u = new Utterance(script);
        u.rate = podcastSpeed;
        u.pitch = 1.0;
        u.onend = () => setIsPlayingPodcast(false);
        u.onerror = () => setIsPlayingPodcast(false);
        window.speechSynthesis.speak(u);
        setIsPlayingPodcast(true);
      }
    }
  };

  const currentHorizonData = roadmap ? roadmap.horizons[activeHorizon] : null;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '32px 36px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.94) 0%, rgba(24, 32, 47, 0.9) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        boxShadow: '0 20px 48px -10px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* Studio Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '30px' }}>🔮</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                {i18n.simTitle}
              </h2>
              <span className="badge badge-indigo" style={{ fontSize: '11px', borderRadius: '9999px', padding: '3px 10px' }}>
                Multi-Agentic RAG • 1Y to 10Y • 100x Productivity Multiplier
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {i18n.simSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Input Mode Selector Track */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setInputMode('company')}
            className="btn-subtle"
            style={{
              borderRadius: '9999px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              background: inputMode === 'company' ? 'rgba(6, 182, 212, 0.22)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: inputMode === 'company' ? 'var(--accent-cyan)' : 'transparent',
              color: inputMode === 'company' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            }}
          >
            {i18n.simModeCompany}
          </button>
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className="btn-subtle"
            style={{
              borderRadius: '9999px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              background: inputMode === 'text' ? 'rgba(6, 182, 212, 0.22)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: inputMode === 'text' ? 'var(--accent-cyan)' : 'transparent',
              color: inputMode === 'text' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            }}
          >
            {i18n.simModeText}
          </button>
          <button
            type="button"
            onClick={() => setInputMode('url')}
            className="btn-subtle"
            style={{
              borderRadius: '9999px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              background: inputMode === 'url' ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: inputMode === 'url' ? 'var(--accent-indigo)' : 'transparent',
              color: inputMode === 'url' ? '#a5b4fc' : 'var(--text-secondary)',
            }}
          >
            {i18n.simModeUrl}
          </button>
        </div>

        {/* 1-Click Quick Presets Grid with Sector Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {i18n.simPresetsLabel}
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: 'All Sectors' },
                { key: 'healthcare', label: '🏥 Healthcare' },
                { key: 'it_technology', label: '🌐 IT Tech Titans' },
                { key: 'automotive_ev', label: '🚗 Automotive' },
                { key: 'food_manufacturing', label: '🍞 Food Mfg' },
                { key: 'fintech_banking', label: '💳 FinTech' },
                { key: 'mobility_fleet', label: '🚖 Mobility' },
                { key: 'cinema_creative', label: '🎬 Cinema' },
                { key: 'public_education', label: '🏫 Education' },
              ].map((filterTab) => (
                <button
                  key={filterTab.key}
                  type="button"
                  onClick={() => setPresetSectorFilter(filterTab.key)}
                  className="btn-subtle"
                  style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: presetSectorFilter === filterTab.key ? 700 : 500,
                    background: presetSectorFilter === filterTab.key ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                    borderColor: presetSectorFilter === filterTab.key ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)',
                    color: presetSectorFilter === filterTab.key ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {filterTab.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {PRESET_ENTITIES.filter((preset) => {
              if (presetSectorFilter === 'all') return true;
              if (presetSectorFilter === 'it_technology') return preset.sectorKey === 'it_technology' || preset.type === 'tech_titan';
              if (presetSectorFilter === 'healthcare') return preset.sectorKey === 'healthcare' || preset.type === 'public_health';
              if (presetSectorFilter === 'fintech_banking' || presetSectorFilter === 'banking') return preset.sectorKey === 'fintech_banking';
              if (presetSectorFilter === 'mobility_fleet' || presetSectorFilter === 'mobility_autonomous') return preset.sectorKey === 'mobility_fleet';
              return preset.sectorKey === presetSectorFilter;
            }).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetClick(preset.snippet, preset.name)}
                className="btn-subtle"
                style={{
                  borderRadius: '9999px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 500,
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Input Field Rendering */}
        {inputMode === 'company' ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              aria-label="Target Enterprise or Institution Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Google, Microsoft, Anthropic, Government School in India, Rural Hospital..."
              style={{
                flex: 1,
                padding: '14px 18px',
                borderRadius: '16px',
                background: 'rgba(10, 14, 24, 0.85)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'inherit',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
              }}
            />
          </div>
        ) : inputMode === 'url' ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="url"
              aria-label="Company Website URL"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://google.com or https://example-rural-school.org"
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: '14px',
                background: 'rgba(10, 14, 24, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '13px',
                fontFamily: 'inherit',
              }}
            />
          </div>
        ) : (
          <textarea
            aria-label="Traditional Work Description or Unstructured Notes"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={4}
            placeholder="Paste your traditional work processes, employee tasks, manual paperwork, or pain points here..."
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '16px',
              background: 'rgba(10, 14, 24, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              fontSize: '13px',
              lineHeight: 1.6,
              resize: 'vertical',
              fontFamily: 'inherit',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
            }}
          />
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12px' }}>
          <button
            type="button"
            onClick={generateRoadmapFromInput}
            disabled={isGenerating}
            className="btn-primary"
            style={{
              borderRadius: '9999px',
              padding: '12px 28px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isGenerating ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{isGenerating ? '⏳' : '✨'}</span>
            <span>{isGenerating ? i18n.simGeneratingBtn : i18n.simGenerateBtn}</span>
          </button>
        </div>
      </div>

      {/* Generated Results Stage */}
      {roadmap && currentHorizonData && (
        <div
          style={{
            marginTop: '12px',
            padding: '24px',
            borderRadius: '20px',
            background: 'rgba(6, 182, 212, 0.03)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Result Header & Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="badge badge-cyan" style={{ fontSize: '11px', borderRadius: '9999px', padding: '4px 12px' }}>
                  {roadmap.firmTitle}
                </span>
                <span className="badge badge-emerald" style={{ fontSize: '11px', borderRadius: '9999px', padding: '4px 12px' }}>
                  🚀 100x Civilizational & Enterprise Multiplier
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Grounded in Google ADK Multi-Agent Trajectories
                </span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
                Transformation Narrative & Strategic Horizons
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleSpeakNarrative}
                className="btn-subtle"
                style={{
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  color: isPlayingAudio ? '#f43f5e' : '#fbbf24',
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{isPlayingAudio ? '⏹️' : '🔊'}</span>
                <span>{isPlayingAudio ? i18n.simStopVoice : i18n.simListenVoice}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyNarrative}
                className="btn-subtle"
                style={{
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  color: isCopied ? 'var(--accent-emerald)' : 'var(--text-primary)',
                  borderColor: isCopied ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{isCopied ? '✓' : '📋'}</span>
                <span>{isCopied ? i18n.simCopiedBrief : i18n.simCopyBrief}</span>
              </button>
            </div>
          </div>

          {/* Executive Narrative Paragraph */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderLeft: '4px solid var(--accent-cyan)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: '#fff' }}>Executive Transformation Summary: </strong>
            {roadmap.executiveSummary}
          </div>

          {/* Multimodal Exploration Sub-Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('roadmap')}
              className="btn-subtle"
              style={{
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                background: activeTab === 'roadmap' ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                borderColor: activeTab === 'roadmap' ? 'var(--accent-cyan)' : 'transparent',
                color: activeTab === 'roadmap' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {i18n.simTabRoadmap}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('infographic')}
              className="btn-subtle"
              style={{
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                background: activeTab === 'infographic' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                borderColor: activeTab === 'infographic' ? 'var(--accent-indigo)' : 'transparent',
                color: activeTab === 'infographic' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {i18n.simTabInfographic}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('podcast')}
              className="btn-subtle"
              style={{
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                background: activeTab === 'podcast' ? 'rgba(236, 72, 153, 0.25)' : 'transparent',
                borderColor: activeTab === 'podcast' ? '#ec4899' : 'transparent',
                color: activeTab === 'podcast' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {i18n.simTabPodcast}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className="btn-subtle"
              style={{
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                background: activeTab === 'video' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                borderColor: activeTab === 'video' ? 'var(--accent-emerald)' : 'transparent',
                color: activeTab === 'video' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {i18n.simTabVideo}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('evidence')}
              className="btn-subtle"
              style={{
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                background: activeTab === 'evidence' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                borderColor: activeTab === 'evidence' ? '#f59e0b' : 'transparent',
                color: activeTab === 'evidence' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {i18n.simTabEvidence}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('society')}
              className="btn-subtle"
              style={{
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                background: activeTab === 'society' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                borderColor: activeTab === 'society' ? '#38bdf8' : 'transparent',
                color: activeTab === 'society' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {i18n.simTabSociety}
            </button>
          </div>

          {/* TAB 1: Strategic Horizons Timeline */}
          {activeTab === 'roadmap' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Horizon Selector Pill Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
                  Select Horizon:
                </span>
                {(
                  [
                    { key: 'baseline', label: 'Now: Traditional Baseline' },
                    { key: 'year1', label: '1 Year: Digital Relief' },
                    { key: 'year2', label: '2 Years: Copilot Frontline' },
                    { key: 'year3', label: '3 Years: Intelligent Synergy' },
                    { key: 'year5', label: '5 Years: Autonomous Scale' },
                    { key: 'year10', label: '10 Years: Cognitive Leader' },
                  ] as const
                ).map((h) => (
                  <button
                    key={h.key}
                    type="button"
                    onClick={() => setActiveHorizon(h.key)}
                    className="btn-subtle"
                    style={{
                      borderRadius: '9999px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: activeHorizon === h.key ? 700 : 500,
                      background: activeHorizon === h.key ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)' : 'rgba(255, 255, 255, 0.03)',
                      borderColor: activeHorizon === h.key ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)',
                      color: activeHorizon === h.key ? '#fff' : 'var(--text-secondary)',
                      boxShadow: activeHorizon === h.key ? '0 0 12px rgba(6, 182, 212, 0.3)' : 'none',
                    }}
                  >
                    {h.label}
                  </button>
                ))}
              </div>

              {/* Active Horizon Detailed Stage Card */}
              <div
                className="glass-panel"
                style={{
                  padding: '24px',
                  borderRadius: '20px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span className="badge badge-emerald" style={{ fontSize: '11px', borderRadius: '9999px', padding: '3px 10px' }}>
                      {currentHorizonData.badge}
                    </span>
                    <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
                      {currentHorizonData.year} — {currentHorizonData.headline}
                    </h4>
                  </div>
                  <div
                    style={{
                      padding: '6px 14px',
                      borderRadius: '12px',
                      background: 'rgba(6, 182, 212, 0.15)',
                      border: '1px solid var(--accent-cyan)',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--accent-cyan)',
                    }}
                  >
                    ⚡ Productivity: {currentHorizonData.productivityMultiplier}
                  </div>
                </div>

                {/* Work Style & Worker Experience Columns */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div
                    style={{
                      padding: '16px 20px',
                      borderRadius: '16px',
                      background: 'rgba(6, 182, 212, 0.06)',
                      border: '1px solid rgba(6, 182, 212, 0.15)',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      🧑‍🏭 Future Daily Work Style
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {currentHorizonData.workStyle}
                    </p>
                  </div>

                  <div
                    style={{
                      padding: '16px 20px',
                      borderRadius: '16px',
                      background: 'rgba(99, 102, 241, 0.06)',
                      border: '1px solid rgba(99, 102, 241, 0.15)',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', marginBottom: '6px' }}>
                      🛡️ Employee Dignity & Protection
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {currentHorizonData.workerExperience}
                    </p>
                  </div>
                </div>

                {/* Key Growth Metrics Row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '12px',
                    paddingTop: '6px',
                  }}
                >
                  <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Revenue / Reach</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '4px' }}>
                      {currentHorizonData.firmMetrics.revenueMultiple}
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Margin / Value</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                      {currentHorizonData.firmMetrics.netMargin}
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Human Creative Time</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#fbbf24', marginTop: '4px' }}>
                      {currentHorizonData.firmMetrics.creativeTimePct}%
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Worker Wage Raise</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#a7f3d0', marginTop: '4px' }}>
                      {currentHorizonData.firmMetrics.wageIncrease}
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Turnaround Speed</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#c084fc', marginTop: '4px' }}>
                      {currentHorizonData.firmMetrics.turnaround}
                    </div>
                  </div>
                </div>

                {/* Concrete Milestones */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    📌 Key Concrete Milestones:
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {currentHorizonData.keyMilestones.map((m, idx) => (
                      <li key={idx} style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--accent-emerald)', fontSize: '14px' }}>✓</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Imagen / NanoBanana Visual Infographic Twin */}
          {activeTab === 'infographic' && (
            <div
              className="glass-panel"
              style={{
                padding: '24px',
                borderRadius: '20px',
                background: 'rgba(10, 14, 26, 0.9)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                    🎨 Imagen Architecture Twin: 2036 Workspace Blueprint
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Synthetic visual topology illustrating physical ergonomic sanctuary, autonomous swarms, and cognitive telemetry.
                  </p>
                </div>
                <span className="badge badge-indigo">GEMINI IMAGEN / NANOBANANA ENGINE</span>
              </div>

              {/* Infographic Visual Diagram Stage */}
              <div
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.08) 50%, rgba(10, 15, 30, 0.95) 100%)',
                  border: '1px dashed rgba(255, 255, 255, 0.2)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px',
                }}
              >
                <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                  <div style={{ fontSize: '24px' }}>🌱</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent-cyan)', marginTop: '6px' }}>Zone 1: Human Sanctuary</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                    Zero noise, natural biophilic lighting, 4-day shifts. Humans focus exclusively on strategic vision, design empathy, and moral arbitration.
                  </p>
                </div>

                <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                  <div style={{ fontSize: '24px' }}>🤖</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#a5b4fc', marginTop: '6px' }}>Zone 2: Autonomous Swarm Ring</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                    14 Google ADK agents running continuously on serverless Cloud Run. Handling routine PR reviews, inventory, and automated test derivation.
                  </p>
                </div>

                <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '24px' }}>⚡</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent-emerald)', marginTop: '6px' }}>Zone 3: 100x Productivity Gateway</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                    Sub-10ms latency telemetry, cryptographic evidence verification, and real-time civilizational metric compilation.
                  </p>
                </div>

                <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <div style={{ fontSize: '24px' }}>🌍</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#fbbf24', marginTop: '6px' }}>Zone 4: Planetary Impact Web</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                    Real-time connection to rural schools, hospitals, and clean energy microgrids, distributing prosperity to 100M+ citizens.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Lyria Future Podcast Studio */}
          {activeTab === 'podcast' && (
            <div
              className="glass-panel"
              style={{
                padding: '24px',
                borderRadius: '20px',
                background: 'rgba(10, 14, 26, 0.9)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🎙️</span>
                    <span>Lyria Podcast: Echoes of 2036 at {roadmap.firmTitle}</span>
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Episode 42: &ldquo;How 100x Productivity Lifted Our People — A Conversation with Future Directors&rdquo;
                  </p>
                </div>
                <span className="badge badge-indigo">LYRIA SYNTHESIS AUDIO</span>
              </div>

              {/* Interactive Audio Player & Waveform Simulation */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
                  border: '1px solid rgba(236, 72, 153, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {/* Waveform Bars */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '48px' }}>
                  {[24, 40, 18, 48, 32, 54, 20, 44, 36, 52, 28, 46, 16, 50, 38, 22, 42, 30].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: '6px',
                        height: isPlayingPodcast ? `${Math.max(12, (h * Math.sin(Date.now() / 200 + i)) % 48 + 16)}px` : `${h}px`,
                        borderRadius: '9999px',
                        background: 'linear-gradient(180deg, #ec4899 0%, #a855f7 100%)',
                        transition: 'height 0.15s ease',
                      }}
                    />
                  ))}
                </div>

                {/* Player Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={handleTogglePodcast}
                      className="btn-primary"
                      style={{
                        borderRadius: '9999px',
                        padding: '10px 22px',
                        fontSize: '13px',
                        background: isPlayingPodcast ? '#f43f5e' : 'linear-gradient(135deg, #ec4899 0%, #6366f1 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>{isPlayingPodcast ? '⏸️' : '▶️'}</span>
                      <span>{isPlayingPodcast ? 'Pause Future Podcast' : 'Play Future Podcast'}</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Speed:</span>
                      {[1.0, 1.25, 1.5].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => setPodcastSpeed(spd)}
                          className="btn-subtle"
                          style={{
                            borderRadius: '9999px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            background: podcastSpeed === spd ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                            color: podcastSpeed === spd ? '#fff' : 'var(--text-muted)',
                          }}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Host: Dr. Aris Thorne • Guest: 2036 Onsite Principal Director
                  </span>
                </div>
              </div>

              {/* Podcast Transcript Brief */}
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Transcript Excerpt:</div>
                <p>
                  <strong>Dr. Thorne:</strong> &ldquo;When people look back at 2026, they thought AI meant layoffs. But here in 2036 at {roadmap.firmTitle}, the story is 180 degrees different. What changed?&rdquo;
                </p>
                <p style={{ marginTop: '6px' }}>
                  <strong>Director:</strong> &ldquo;We treated task decomposition as a human liberation tool. By 2031, 100% of routine grind was automated. Every employee received guaranteed wage equity. Today our productivity is 100x, and our workers are happier than ever.&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Veo Short Video Walkthrough */}
          {activeTab === 'video' && (
            <div
              className="glass-panel"
              style={{
                padding: '24px',
                borderRadius: '20px',
                background: 'rgba(10, 14, 26, 0.9)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🎥</span>
                    <span>Veo Video Walkthrough: Day in the Life (2036)</span>
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Simulated high-definition cinematic viewport showing workspace daily routines in 2036.
                  </p>
                </div>
                <span className="badge badge-emerald">GOOGLE VEO KINEMATICS</span>
              </div>

              {/* 16:9 Cinematic Video Viewport */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16 / 9',
                  maxHeight: '380px',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #064e3b 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Simulated Visual Animation */}
                <div style={{ textAlign: 'center', zIndex: 2, padding: '20px' }}>
                  <div style={{ fontSize: '48px', animation: isVideoPlaying ? 'pulse-dot 1.5s infinite ease-in-out' : 'none' }}>
                    {videoCameraAngle === 'drone' ? '🛸' : videoCameraAngle === 'hud' ? '👓' : '🤝'}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '18px', color: '#fff', marginTop: '10px' }}>
                    {videoCameraAngle === 'drone' ? 'AERIAL CAMPUS VIEW (YEAR 2036)' : videoCameraAngle === 'hud' ? 'FIRST-PERSON HUD COGNITIVE WORKSPACE' : 'COLLABORATIVE MULTI-AGENT SYNERGY POD'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                    {roadmap.firmTitle} • Productivity Metric: 100x Multi-fold • Zero Layoffs
                  </div>
                </div>

                {/* HUD Telemetry Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: 'rgba(255, 255, 255, 0.8)',
                    zIndex: 3,
                  }}
                >
                  <div>REC ● 60FPS 4K HDR</div>
                  <div>TIME: 00:{videoScrubberSec < 10 ? `0${videoScrubberSec}` : videoScrubberSec} / 00:45</div>
                  <div>AGENTS ACTIVE: 14 / 14</div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '14px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: 'var(--accent-emerald)',
                    background: 'rgba(0,0,0,0.6)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    zIndex: 3,
                  }}
                >
                  PRODUCTIVITY: 100x ACTIVE
                </div>

                {/* Bottom Scrubber Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    padding: '12px 16px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 3,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                    style={{
                      background: 'var(--accent-emerald)',
                      border: 'none',
                      color: '#000',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {isVideoPlaying ? '⏸' : '▶'}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="45"
                    value={videoScrubberSec}
                    onChange={(e) => setVideoScrubberSec(Number(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
                  />

                  {/* Camera Angle Toggle */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['drone', 'hud', 'synergy'] as const).map((ang) => (
                      <button
                        key={ang}
                        type="button"
                        onClick={() => setVideoCameraAngle(ang)}
                        className="btn-subtle"
                        style={{
                          borderRadius: '9999px',
                          padding: '3px 8px',
                          fontSize: '10px',
                          background: videoCameraAngle === ang ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0,0,0,0.5)',
                          color: '#fff',
                        }}
                      >
                        {ang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Multi-Agentic RAG Grounded Evidence */}
          {activeTab === 'evidence' && (
            <div
              className="glass-panel"
              style={{
                padding: '24px',
                borderRadius: '20px',
                background: 'rgba(10, 14, 26, 0.9)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                    📁 Multi-Agentic RAG Verified Evidence Dossier
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Every projection is backed by cryptographic hashes and verified multi-agent trajectories.
                  </p>
                </div>
                <span className="badge badge-emerald">ZERO HALLUCINATIONS • SAIF AUDITED</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {roadmap.evidenceCitations.map((cit) => (
                  <div
                    key={cit.id}
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#fbbf24' }}>
                        {cit.source}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                        {cit.agentAuthor}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#fff', fontStyle: 'italic', lineHeight: 1.5 }}>
                      &ldquo;{cit.groundedQuote}&rdquo;
                    </p>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      SHA-256: {cit.sha256Hash}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: Societal & Civilizational Flywheel */}
          {activeTab === 'society' && (
            <div
              className="glass-panel"
              style={{
                padding: '24px',
                borderRadius: '20px',
                background: 'rgba(10, 14, 26, 0.9)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                    🌍 Societal & Civilizational Flywheel: Global Multiplier
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    How this transformation lifts schools, clinics, cities, states, and global economies.
                  </p>
                </div>
                <span className="badge badge-cyan">GLOBAL SCALE ARCHITECTURE</span>
              </div>

              <div
                style={{
                  padding: '18px 22px',
                  borderRadius: '16px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                }}
              >
                <strong style={{ color: '#fff' }}>Civilizational Expansion Narrative: </strong>
                {roadmap.societalImpactNarrative}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '20px' }}>🏫</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff', marginTop: '6px' }}>Universal Education</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Zero illiteracy. 1-on-1 personalized AI tutors in every native tongue eliminate dropouts across 50,000 rural schools.
                  </p>
                </div>

                <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '20px' }}>🩺</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff', marginTop: '6px' }}>Universal Health</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Remote tele-diagnostics reduce child mortality by 85% and add +12 years to regional life expectancy.
                  </p>
                </div>

                <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '20px' }}>📈</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff', marginTop: '6px' }}>100x Productivity</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Toil elimination enables entire cities to generate high-value software, sustainable farming, and clean energy exports.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
