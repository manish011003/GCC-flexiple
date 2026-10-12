import type { RiskFactor, Source } from './types.ts';

const nasscomLegalRiskStudy: Source = {
  name: 'NASSCOM Legal Working Group',
  reportTitle: 'Regulatory, Transfer Pricing & Compliance Guide for GCCs in India',
  year: 2023,
  url: 'https://nasscom.in/knowledge-center/publications/regulatory-guide-gccs-2023',
};

const pwcIndiaRiskReport: Source = {
  name: 'PwC India',
  reportTitle: 'Tax and Transfer Pricing Landscape for Global In-House Centers',
  year: 2023,
  url: 'https://www.pwc.in/research-insights/gcc-transfer-pricing-landscape.html',
};

const aonTalentTurnoverStudy: Source = {
  name: 'Aon India',
  reportTitle: 'Tech Talent Attrition & Counter-Offer Dynamics in Tier 1 India',
  year: 2024,
  url: 'https://www.aon.com/india/insights/tech-talent-turnover-2024.jsp',
};

const khaitanLegalIpReport: Source = {
  name: 'Khaitan & Co',
  reportTitle: 'Cross-Border Intellectual Property Assignment and Work-for-Hire Enforceability in India',
  year: 2023,
  url: 'https://www.khaitanco.com/thought-leadership/ip-assignment-gcc-india',
};

export const riskFactors: RiskFactor[] = [
  {
    id: 'transfer-pricing-scrutiny',
    category: 'Regulatory & Compliance',
    title: 'Transfer Pricing & Arm’s Length Markup Audits',
    severity: 'High',
    description: 'Indian Income Tax Department conducts rigorous audits on cost-plus markups charged by Indian GCC subsidiaries to foreign parent entities, frequently challenging contract R&D status as high-value entrepreneurship.',
    impactOnGCC: 'Risk of aggressive retrospective tax assessments, prolonged APA (Advance Pricing Agreement) negotiations, and double-taxation disputes.',
    mitigationTactics: [
      'Enter into Bilateral or Unilateral Advance Pricing Agreements (APA) with CBDT.',
      'Maintain exhaustive Functional, Assets, and Risk (FAR) analysis documentation annually.',
      'Calibrate cost-plus margins within safe harbor thresholds (typically 17-24% depending on IP ownership).',
    ],
    applicableCities: ['all'],
    sources: [nasscomLegalRiskStudy, pwcIndiaRiskReport],
  },
  {
    id: 'poaching-talent-inflation',
    category: 'Talent War & Wage Inflation',
    title: 'Tier-1 Hyper-Competition & Wage Creep',
    severity: 'High',
    description: 'Concentration of 1,600+ GCCs in Bengaluru, Hyderabad, and NCR triggers aggressive bidding wars for niche skills (e.g. Distributed Systems, GenAI, MLOps, Cybersecurity).',
    impactOnGCC: 'Unplanned budget overruns, 18-25% salary inflation for senior ICs, and inflated onboarding drop-out rates (30%+ offer shopping).',
    mitigationTactics: [
      'Implement multi-tier hiring: build core leadership in Tier-1 and leverage hub-and-spoke models in Tier-2 (Pune, Kochi, Ahmedabad).',
      'Deploy retention bonuses, long-term incentive plans (LTIP), and phantom stock options.',
      'Shorten notice period buyouts and enforce structured pre-boarding engagement.',
    ],
    applicableCities: ['bengaluru', 'hyderabad', 'ncr'],
    sources: [aonTalentTurnoverStudy],
  },
  {
    id: 'attrition-knowledge-drain',
    category: 'Attrition & Poaching',
    title: 'Elevated Mid-Level Engineer Turnover',
    severity: 'Medium',
    description: 'Mid-level engineers (3-7 years experience) experience 18-22% annual voluntary attrition in core tech hubs, seeking title upgrades and fast-track compensation jumps.',
    impactOnGCC: 'Loss of institutional system knowledge, slowed sprint velocity, and elevated recruiter replenishment expenses.',
    mitigationTactics: [
      'Institute transparent global mobility pathways and lateral project rotations.',
      'Provide structured upskilling programs tied to global product certifications.',
      'Implement dual-track technical vs management career ladders.',
    ],
    applicableCities: ['bengaluru', 'hyderabad', 'ncr', 'pune'],
    sources: [aonTalentTurnoverStudy],
  },
  {
    id: 'ip-work-for-hire',
    category: 'IP & Data Protection',
    title: 'Enforceability of Cross-Border IP Assignment',
    severity: 'Medium',
    description: 'Under Indian Copyright Act Section 17, employment contracts must explicitly specify comprehensive, irrevocable, worldwide assignment of copyright and patentable inventions in exchange for valid consideration.',
    impactOnGCC: 'Ambiguity in employee invention assignment agreements could leave patent or source code ownership vulnerable during parent corporate transactions or M&A.',
    mitigationTactics: [
      'Execute ironclad proprietary information and inventions assignment agreements (PIIA) prior to Day 1.',
      'Explicitly waive moral rights to the fullest extent permitted under Indian law.',
      'Establish segregated cloud sandbox development environments preventing local repo exfiltration.',
    ],
    applicableCities: ['all'],
    sources: [khaitanLegalIpReport, nasscomLegalRiskStudy],
  },
  {
    id: 'dpdp-act-compliance',
    category: 'Regulatory & Compliance',
    title: 'Digital Personal Data Protection Act (DPDP Act 2023)',
    severity: 'Medium',
    description: 'India’s enacted DPDP Act establishes stringent consent requirements, data principal rights, cross-border data transfer rules, and penalties reaching up to ₹250 Crores per breach.',
    impactOnGCC: 'Significant compliance overhead for GCCs handling employee HR data, customer telemetry, or global end-user PII on Indian infrastructure.',
    mitigationTactics: [
      'Appoint an India-based Data Protection Officer (DPO) and run periodic data inventory audits.',
      'Establish enterprise Data Subject Access Request (DSAR) workflows.',
      'Audit vendor software, EOR providers, and IT infrastructure for strict data segregation.',
    ],
    applicableCities: ['all'],
    sources: [nasscomLegalRiskStudy],
  },
  {
    id: 'urban-infra-commute-stress',
    category: 'Infrastructure & Mobility',
    title: 'Municipal Grid & Commute Infrastructure Friction',
    severity: 'Low',
    description: 'Heavy traffic congestion in corridor arteries (Outer Ring Road in Bengaluru, Hinjewadi in Pune) causes employee burnout and resistance to 5-day return-to-office mandates.',
    impactOnGCC: 'Decreased on-site collaboration, extended daily commutes (90-120 mins), and location-specific attrition.',
    mitigationTactics: [
      'Locate offices adjacent to operational Metro lines or dedicated arterial expressway nodes.',
      'Adopt structured hybrid work models (2-3 days office presence).',
      'Provide dedicated company-managed EV shuttle transit for employees.',
    ],
    applicableCities: ['bengaluru', 'pune', 'mumbai'],
    sources: [nasscomLegalRiskStudy],
  },
];
