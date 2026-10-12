import type { FunctionType, Source } from './types.ts';

const nasscomSkillsReport: Source = {
  name: 'NASSCOM',
  reportTitle: 'State of Tech Talent in India 2023-2024',
  year: 2023,
  url: 'https://nasscom.in/knowledge-center/publications/state-tech-talent-india-2023',
};

const michaelPageGCCReport: Source = {
  name: 'Michael Page India',
  reportTitle: 'India GCC Salary Benchmark Report 2024',
  year: 2024,
  url: 'https://www.michaelpage.co.in/salary-guide/gcc-technology',
};

const aonSalarySurvey: Source = {
  name: 'Aon India',
  reportTitle: 'Annual Salary Increase and Turnover Survey 2023-24',
  year: 2024,
  url: 'https://www.aon.com/india/insights/annual-salary-increase-survey.jsp',
};

export const gccFunctions: FunctionType[] = [
  {
    id: 'software-engineering',
    name: 'Software Engineering',
    category: 'Engineering & Tech',
    description: 'Core product engineering, full-stack web/mobile development, cloud architecture, and DevOps/SRE teams powering parent company global digital platforms.',
    typicalSubRoles: [
      'Backend Engineer (Java/Go/Node)',
      'Frontend / Fullstack Developer',
      'Cloud & DevOps Architect',
      'QA & Automation Engineer',
      'Staff Software Engineer',
    ],
    nationalMedianSalaryLpa: {
      junior: 11.5, // 0-3 yrs: realistic ₹8-15 LPA range
      mid: 18.5,    // 3-7 yrs
      senior: 32.0, // 7-12 yrs: realistic ₹20-40 LPA range
      lead: 52.0,   // 12+ yrs
    },
    sources: [nasscomSkillsReport, michaelPageGCCReport],
  },
  {
    id: 'data-ai',
    name: 'Data & Artificial Intelligence',
    category: 'Data & Analytics',
    description: 'Data platform engineering, predictive modeling, generative AI engineering, business intelligence, and machine learning operations (MLOps).',
    typicalSubRoles: [
      'Data Engineer (Spark/Snowflake/dbt)',
      'Machine Learning Engineer',
      'Data Scientist',
      'BI & Analytics Specialist',
      'AI Research / GenAI Engineer',
    ],
    nationalMedianSalaryLpa: {
      junior: 13.0,
      mid: 22.0,
      senior: 36.5,
      lead: 58.0,
    },
    sources: [michaelPageGCCReport, aonSalarySurvey],
  },
  {
    id: 'finance-accounting',
    name: 'Finance & Accounting',
    category: 'Corporate Functions',
    description: 'Corporate financial planning & analysis (FP&A), statutory reporting, tax structuring, global payroll processing, and internal audit.',
    typicalSubRoles: [
      'FP&A Analyst',
      'Chartered Accountant / Controller',
      'Statutory & Tax Reporting Specialist',
      'Treasury & Liquidity Analyst',
      'Internal Controls & Audit Manager',
    ],
    nationalMedianSalaryLpa: {
      junior: 8.5,
      mid: 14.5,
      senior: 24.0,
      lead: 38.0,
    },
    sources: [michaelPageGCCReport, aonSalarySurvey],
  },
  {
    id: 'customer-ops',
    name: 'Customer Operations & Support',
    category: 'Business Operations',
    description: 'High-touch global customer success, Tier 2/3 technical support, trust & safety operations, and vendor management.',
    typicalSubRoles: [
      'Technical Customer Support Engineer',
      'Customer Success Specialist',
      'Operations Team Lead',
      'Trust & Safety Policy Analyst',
      'Workflow Optimization Specialist',
    ],
    nationalMedianSalaryLpa: {
      junior: 6.5,
      mid: 11.0,
      senior: 18.0,
      lead: 28.0,
    },
    sources: [aonSalarySurvey],
  },
  {
    id: 'legal-compliance',
    name: 'Legal, Risk & Compliance',
    category: 'Corporate Functions',
    description: 'Global commercial contract lifecycle management, international regulatory compliance (GDPR/HIPAA/SOX), IP filing, and legal operations.',
    typicalSubRoles: [
      'Contract Lifecycle Specialist',
      'Regulatory Compliance Analyst (SOX/GDPR)',
      'Intellectual Property Counsel',
      'Risk Governance Associate',
      'Legal Operations Manager',
    ],
    nationalMedianSalaryLpa: {
      junior: 9.0,
      mid: 15.5,
      senior: 26.0,
      lead: 42.0,
    },
    sources: [michaelPageGCCReport],
  },
];
