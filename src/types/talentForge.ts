export type PipelineStatus =
  | 'DISCOVERED'
  | 'VALIDATED'
  | 'SIGNALS_ANALYZED'
  | 'RESEARCHED'
  | 'QUALIFIED_FOR_CONTACT'
  | 'APOLLO_ENRICHED'
  | 'CONTACT_ENRICHED'
  | 'EMAIL_VERIFIED'
  | 'DEDUPLICATED'
  | 'SCORED'
  | 'OUTREACH_GENERATED'
  | 'QC_PASSED'
  | 'READY_FOR_SALESHANDY'
  | 'EXPORTED'
  | 'SENT'
  | 'REJECTED'
  | 'VALIDATION_FAILED'
  | 'RESEARCH_FAILED'
  | 'CONTACT_NOT_FOUND'
  | 'EMAIL_VERIFICATION_FAILED'
  | 'DUPLICATE'
  | 'QUALIFICATION_REJECTED'
  | 'QC_FAILED'
  | 'SEND_FAILED';

export type JobFreshness = 'FRESH' | 'RECENT' | 'AGING' | 'OLD' | 'UNKNOWN';

export type RecruitingCapacity = 'SMALL' | 'MEDIUM' | 'LARGE' | 'UNKNOWN';

export type QualificationRating = 'STRONG' | 'REVIEW' | 'WEAK' | 'REJECT';

export interface Campaign {
  id: string;
  name: string;
  industry: string;
  geography: string;
  targetLeads: number;
  employeeFilter: string; // 'NO_RESTRICTION' or range
  candidateMultiplier: number;
  minSignalCount: number;
  requireVerifiedEmail: boolean;
  requireEvidence: boolean;
  allowPersonalEmail: boolean;
  allowGuessedEmail: boolean;
  allowUnverifiedEmail: boolean;
  allowDuplicateCompany: boolean;
  allowDuplicateContact: boolean;
  apifyInputId: string;
  inputType: 'dataset' | 'run' | 'direct_search' | 'demo';
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  isTestMode?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  campaignId: string;
  name: string;
  domain: string;
  website: string;
  industry: string;
  geography: string;
  employeeCount: string;
  discoverySource: string;
  status: PipelineStatus;
  rejectionReason?: string;
  signalsAnalyzed?: boolean;
  signalCount?: number;
  qualificationScore?: number;
  currentHiringActive?: boolean;
  apifySearchResult?: {
    title: string;
    url: string;
    snippet: string;
    date?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface JobRecord {
  id: string;
  companyId: string;
  campaignId: string;
  jobTitle: string;
  url: string;
  location: string;
  postingDate: string; // YYYY-MM-DD or UNKNOWN
  freshness: JobFreshness;
  category: string;
  isSpecialized: boolean;
  isRecruitingRole: boolean;
  isDuplicate: boolean;
  evidenceStatus: 'VERIFIED' | 'UNVERIFIED' | 'LANDING_PAGE_ONLY';
  sourceSnippet?: string;
  createdAt: string;
}

export interface HiringSignals {
  id: string;
  companyId: string;
  campaignId: string;
  highVolumeHiring: boolean;
  inefficientJobAdvertising: boolean;
  limitedRecruitingSupport: boolean;
  hiringRecruiter: boolean;
  freshOrAgedJobAds: boolean;
  positiveSignalCount: number; // 0 to 5
  signalNotes: string[];
  createdAt: string;
}

export interface HiringResearch {
  id: string;
  companyId: string;
  campaignId: string;
  hiringTrigger: string;
  specificHiringProblem: string;
  whyNow: string;
  hiringDifficulty: string;
  hiringUrgency: string;
  hiringFriction: string;
  internalRecruitingCapacity: RecruitingCapacity;
  painOwnerTitle: string;
  economicBuyerTitle: string;
  potentialChampionTitle: string;
  evidenceUrl: string;
  evidenceSummary: string;
  evidenceDate: string;
  evidenceType: string;
  evidenceConfidence: number; // 0 - 100
  relevantRole: string;
  relevantLocation: string;
  aiReasoning: string;
  createdAt: string;
}

export interface ContactRecord {
  id: string;
  companyId: string;
  campaignId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  title: string;
  email: string;
  emailStatus: 'valid' | 'invalid' | 'accept_all' | 'unknown';
  isVerifiedBusinessEmail: boolean;
  hunterConfidence: number; // 0 - 100
  alternativeContactsTried: number;
  linkedinUrl?: string;
  phone?: string;
  enrichedFrom: 'hunter' | 'manual' | 'simulated';
  createdAt: string;
}

export interface QualificationRecord {
  id: string;
  companyId: string;
  campaignId: string;
  scoreA_HiringDemand: number; // 0 - 5
  scoreB_HiringFriction: number; // 0 - 5
  scoreC_HiringUrgency: number; // 0 - 5
  scoreD_HiringDifficulty: number; // 0 - 5
  scoreE_RecruitingCapacity: number; // 0 - 5
  scoreF_EconomicFit: number; // 0 - 5
  scoreG_EvidenceQuality: number; // 0 - 5
  totalScore: number; // 0 - 35
  scoreRating: QualificationRating;
  qualificationReason: string;
  passedHardGates: boolean;
  failedGates: string[];
  createdAt: string;
}

export interface OutreachRecord {
  id: string;
  companyId: string;
  campaignId: string;
  contactId?: string;
  customSubject: string;
  customBody: string;
  followUpOne: string;
  followUpTwo: string;
  qcPassed: boolean;
  qcChecklist: Record<string, boolean>;
  qcNotes: string;
  createdAt: string;
}

export interface AutomationTask {
  id: string;
  campaignId: string;
  companyId: string;
  taskType:
    | 'VALIDATE_COMPANY'
    | 'RESEARCH_HIRING'
    | 'ANALYZE_SIGNALS'
    | 'QUALIFY_COMPANY'
    | 'ENRICH_CONTACT'
    | 'VERIFY_EMAIL'
    | 'GENERATE_OUTREACH'
    | 'RUN_QC';
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRYING' | 'REJECTED';
  attempts: number;
  maxAttempts: number;
  priority: number;
  nextRunAt: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionLog {
  id: string;
  campaignId: string;
  companyId?: string;
  companyName?: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  stage: string;
  message: string;
  details?: Record<string, any>;
}

export interface ApiUsage {
  apifyRuns: number;
  apifyEstimatedCost: number; // in USD
  geminiCalls: number;
  geminiEstimatedCost: number;
  hunterRequests: number;
  hunterEstimatedCost: number;
  totalEstimatedCost: number;
  lastUpdated: string;
}

export type SaleshandyErrorCode =
  | 'SALESHANDY_AUTH_ERROR'
  | 'SALESHANDY_RATE_LIMIT'
  | 'SALESHANDY_INVALID_REQUEST'
  | 'SALESHANDY_DUPLICATE_LEAD'
  | 'SALESHANDY_CAMPAIGN_ERROR'
  | 'SALESHANDY_SEND_ERROR'
  | 'SALESHANDY_NETWORK_ERROR';

export interface SaleshandyCampaign {
  id: string;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | string;
  leadsCount?: number;
  sentCount?: number;
  openRate?: number;
  replyRate?: number;
  bounceRate?: number;
  createdAt?: string;
}

export interface SaleshandyLeadPayload {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  customFields: Record<string, string>;
}

export interface SaleshandyStepVariant {
  id?: string;
  payload: {
    subject: string;
    content: string;
  };
}

export interface SaleshandyStep {
  id: string;
  sequenceId?: string;
  type: string; // 'Email'
  order?: number;
  absoluteDays: number;
  variants: SaleshandyStepVariant[];
  status?: string;
  createdAt?: string;
}

export interface SaleshandySyncStatus {
  success: boolean;
  sequenceId: string;
  sequenceName: string;
  prospectsCount: number;
  outreachSynced: string;
  sequenceStepsSynced: string;
  step1Status: 'Synced' | 'Pending' | 'Failed';
  step2Status: 'Synced' | 'Pending' | 'Failed';
  step3Status: 'Synced' | 'Pending' | 'Failed';
  sequenceStatus: 'DRAFT' | 'PAUSED' | 'ACTIVE' | 'PAUSED / DRAFT (Ready for Review)' | string;
  message: string;
  duplicatesPrevented?: number;
  steps: Array<{
    stepNumber: number;
    absoluteDays: number;
    subject: string;
    content: string;
  }>;
}

export interface SaleshandyExportResult {
  totalTargeted: number;
  successfulImports: number;
  failedImports: number;
  alreadyExported: number;
  campaignId: string;
  campaignName: string;
  syncStatus?: SaleshandySyncStatus;
  errors?: Array<{ email: string; company: string; error: string; code?: SaleshandyErrorCode }>;
}

export interface IntegrationSettings {
  hasApifyToken: boolean;
  hasGeminiKey: boolean;
  hasHunterKey: boolean;
  hasSaleshandyKey: boolean;
  apifyTokenMasked?: string;
  geminiKeyMasked?: string;
  hunterKeyMasked?: string;
  saleshandyKeyMasked?: string;
  saleshandyApiBaseUrl?: string;
  defaultGeography: string;
  defaultEmployeeFilter: string;
  defaultCandidateMultiplier: number;
  defaultMinSignals: number;
  maxApifyConcurrency: number;
  maxHunterConcurrency: number;
  retryLimit: number;
  testModeDefault: boolean;
}

export interface PipelineSummary {
  discovered: number;
  validated: number;
  signalsAnalyzed: number;
  researched: number;
  qualifiedForContact: number;
  contactEnriched: number;
  emailVerified: number;
  scored: number;
  outreachGenerated: number;
  qcPassed: number;
  readyForSaleshandy: number;
  exportedToSaleshandy: number;
  sent: number;
  bounced: number;
  replied: number;
  rejected: number;
  failed: number;
}
