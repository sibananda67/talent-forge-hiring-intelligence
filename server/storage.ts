import fs from 'fs';
import path from 'path';
import {
  Campaign,
  Company,
  JobRecord,
  HiringSignals,
  HiringResearch,
  ContactRecord,
  QualificationRecord,
  OutreachRecord,
  AutomationTask,
  ExecutionLog,
  ApiUsage,
  IntegrationSettings,
  PipelineSummary,
} from '../src/types/talentForge.js';

export interface StoredSaleshandyStep {
  id: string;
  sequenceId: string;
  campaignId: string;
  stepNumber: number;
  absoluteDays: number;
  subject: string;
  content: string;
  syncedAt: string;
}

interface DatabaseSchema {
  campaigns: Campaign[];
  companies: Company[];
  jobs: JobRecord[];
  signals: HiringSignals[];
  research: HiringResearch[];
  contacts: ContactRecord[];
  qualifications: QualificationRecord[];
  outreach: OutreachRecord[];
  automation_tasks: AutomationTask[];
  execution_logs: ExecutionLog[];
  api_usage: ApiUsage;
  saleshandy_exports: Array<{ id: string; campaignId: string; email: string; saleshandyCampaignId: string; timestamp: string }>;
  saleshandy_sequence_steps?: StoredSaleshandyStep[];
}

interface SecretSettings {
  apifyToken: string;
  hunterApiKey: string;
  saleshandyApiKey: string;
  saleshandyApiBaseUrl: string;
  geminiApiKey: string;
  maxApifyConcurrency: number;
  maxHunterConcurrency: number;
  retryLimit: number;
  defaultGeography: string;
  defaultEmployeeFilter: string;
  defaultCandidateMultiplier: number;
  defaultMinSignals: number;
  testModeDefault: boolean;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const SECRETS_FILE = path.join(DATA_DIR, 'secrets.json');

class StorageManager {
  private db: DatabaseSchema = {
    campaigns: [],
    companies: [],
    jobs: [],
    signals: [],
    research: [],
    contacts: [],
    qualifications: [],
    outreach: [],
    automation_tasks: [],
    execution_logs: [],
    saleshandy_exports: [],
    api_usage: {
      apifyRuns: 0,
      apifyEstimatedCost: 0,
      geminiCalls: 0,
      geminiEstimatedCost: 0,
      hunterRequests: 0,
      hunterEstimatedCost: 0,
      totalEstimatedCost: 0,
      lastUpdated: new Date().toISOString(),
    },
  };

  private secrets: SecretSettings = {
    apifyToken: process.env.APIFY_API_TOKEN || '',
    hunterApiKey: process.env.HUNTER_API_KEY || '',
    saleshandyApiKey: process.env.SALESHANDY_API_KEY || '',
    saleshandyApiBaseUrl: process.env.SALESHANDY_API_BASE_URL || 'https://open-api.saleshandy.com/v1',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    maxApifyConcurrency: 5,
    maxHunterConcurrency: 5,
    retryLimit: 3,
    defaultGeography: 'United States',
    defaultEmployeeFilter: 'NO_RESTRICTION',
    defaultCandidateMultiplier: 5,
    defaultMinSignals: 3,
    testModeDefault: true,
  };

  private isSaving = false;
  private pendingSave = false;

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Load Secrets
    if (fs.existsSync(SECRETS_FILE)) {
      try {
        const raw = fs.readFileSync(SECRETS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.secrets = { ...this.secrets, ...parsed };
      } catch (err) {
        console.error('Error loading secrets.json:', err);
      }
    }
    // Environment variables take precedence if set
    if (process.env.APIFY_API_TOKEN) this.secrets.apifyToken = process.env.APIFY_API_TOKEN;
    if (process.env.HUNTER_API_KEY) this.secrets.hunterApiKey = process.env.HUNTER_API_KEY;
    if (process.env.SALESHANDY_API_KEY) this.secrets.saleshandyApiKey = process.env.SALESHANDY_API_KEY;
    if (process.env.SALESHANDY_API_BASE_URL) this.secrets.saleshandyApiBaseUrl = process.env.SALESHANDY_API_BASE_URL;
    if (process.env.GEMINI_API_KEY) this.secrets.geminiApiKey = process.env.GEMINI_API_KEY;

    // Load Database
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.db = { ...this.db, ...parsed };
        if (!this.db.saleshandy_sequence_steps || this.db.saleshandy_sequence_steps.length === 0) {
          this.seedInitialSaleshandySteps();
          this.saveNow();
        }
      } catch (err) {
        console.error('Error reading database.json, initializing fresh store:', err);
        this.seedInitialData();
        this.seedInitialSaleshandySteps();
        this.saveNow();
      }
    } else {
      this.seedInitialData();
      this.seedInitialSaleshandySteps();
      this.saveNow();
    }
  }

  public save() {
    if (this.isSaving) {
      this.pendingSave = true;
      return;
    }
    this.isSaving = true;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    } finally {
      this.isSaving = false;
      if (this.pendingSave) {
        this.pendingSave = false;
        this.save();
      }
    }
  }

  public saveNow() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed immediate database write:', err);
    }
  }

  public saveSecrets() {
    try {
      fs.writeFileSync(SECRETS_FILE, JSON.stringify(this.secrets, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write secrets file:', err);
    }
  }

  // --- Campaign Methods ---
  public getCampaigns(): Campaign[] {
    return this.db.campaigns;
  }

  public getCampaign(id: string): Campaign | undefined {
    return this.db.campaigns.find((c) => c.id === id);
  }

  public saveCampaign(campaign: Campaign): Campaign {
    const idx = this.db.campaigns.findIndex((c) => c.id === campaign.id);
    campaign.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      this.db.campaigns[idx] = campaign;
    } else {
      this.db.campaigns.unshift(campaign);
    }
    this.save();
    return campaign;
  }

  public deleteCampaign(id: string): boolean {
    this.db.campaigns = this.db.campaigns.filter((c) => c.id !== id);
    this.db.companies = this.db.companies.filter((c) => c.campaignId !== id);
    this.db.jobs = this.db.jobs.filter((j) => j.campaignId !== id);
    this.db.signals = this.db.signals.filter((s) => s.campaignId !== id);
    this.db.research = this.db.research.filter((r) => r.campaignId !== id);
    this.db.contacts = this.db.contacts.filter((c) => c.campaignId !== id);
    this.db.qualifications = this.db.qualifications.filter((q) => q.campaignId !== id);
    this.db.outreach = this.db.outreach.filter((o) => o.campaignId !== id);
    this.db.automation_tasks = this.db.automation_tasks.filter((t) => t.campaignId !== id);
    this.db.execution_logs = this.db.execution_logs.filter((l) => l.campaignId !== id);
    this.save();
    return true;
  }

  // --- Company Methods ---
  public getCompanies(campaignId?: string): Company[] {
    if (!campaignId) return this.db.companies;
    return this.db.companies.filter((c) => c.campaignId === campaignId);
  }

  public getCompany(id: string): Company | undefined {
    return this.db.companies.find((c) => c.id === id);
  }

  public saveCompany(company: Company): Company {
    const idx = this.db.companies.findIndex((c) => c.id === company.id);
    company.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      this.db.companies[idx] = company;
    } else {
      this.db.companies.push(company);
    }
    this.save();
    return company;
  }

  // --- Jobs ---
  public getJobs(companyId?: string): JobRecord[] {
    if (!companyId) return this.db.jobs;
    return this.db.jobs.filter((j) => j.companyId === companyId);
  }

  public saveJob(job: JobRecord): JobRecord {
    const idx = this.db.jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      this.db.jobs[idx] = job;
    } else {
      this.db.jobs.push(job);
    }
    this.save();
    return job;
  }

  // --- Signals ---
  public getSignals(companyId: string): HiringSignals | undefined {
    return this.db.signals.find((s) => s.companyId === companyId);
  }

  public saveSignals(signals: HiringSignals): HiringSignals {
    const idx = this.db.signals.findIndex((s) => s.companyId === signals.companyId);
    if (idx >= 0) {
      this.db.signals[idx] = signals;
    } else {
      this.db.signals.push(signals);
    }
    this.save();
    return signals;
  }

  // --- Research ---
  public getResearch(companyId: string): HiringResearch | undefined {
    return this.db.research.find((r) => r.companyId === companyId);
  }

  public saveResearch(research: HiringResearch): HiringResearch {
    const idx = this.db.research.findIndex((r) => r.companyId === research.companyId);
    if (idx >= 0) {
      this.db.research[idx] = research;
    } else {
      this.db.research.push(research);
    }
    this.save();
    return research;
  }

  // --- Contacts ---
  public getContacts(companyId?: string): ContactRecord[] {
    if (!companyId) return this.db.contacts;
    return this.db.contacts.filter((c) => c.companyId === companyId);
  }

  public getPrimaryContact(companyId: string): ContactRecord | undefined {
    return this.db.contacts.find((c) => c.companyId === companyId && c.isVerifiedBusinessEmail) ||
      this.db.contacts.find((c) => c.companyId === companyId);
  }

  public saveContact(contact: ContactRecord): ContactRecord {
    const idx = this.db.contacts.findIndex((c) => c.id === contact.id);
    if (idx >= 0) {
      this.db.contacts[idx] = contact;
    } else {
      this.db.contacts.push(contact);
    }
    this.save();
    return contact;
  }

  // --- Qualifications ---
  public getQualification(companyId: string): QualificationRecord | undefined {
    return this.db.qualifications.find((q) => q.companyId === companyId);
  }

  public saveQualification(qual: QualificationRecord): QualificationRecord {
    const idx = this.db.qualifications.findIndex((q) => q.companyId === qual.companyId);
    if (idx >= 0) {
      this.db.qualifications[idx] = qual;
    } else {
      this.db.qualifications.push(qual);
    }
    this.save();
    return qual;
  }

  // --- Outreach ---
  public getOutreach(companyId: string): OutreachRecord | undefined {
    return this.db.outreach.find((o) => o.companyId === companyId);
  }

  public saveOutreach(outreach: OutreachRecord): OutreachRecord {
    const idx = this.db.outreach.findIndex((o) => o.companyId === outreach.companyId);
    if (idx >= 0) {
      this.db.outreach[idx] = outreach;
    } else {
      this.db.outreach.push(outreach);
    }
    this.save();
    return outreach;
  }

  // --- Automation Tasks ---
  public getTasks(campaignId?: string): AutomationTask[] {
    if (!campaignId) return this.db.automation_tasks;
    return this.db.automation_tasks.filter((t) => t.campaignId === campaignId);
  }

  public getNextPendingTask(): AutomationTask | undefined {
    const now = Date.now();
    return this.db.automation_tasks
      .filter((t) => (t.status === 'QUEUED' || t.status === 'RETRYING') && t.nextRunAt <= now)
      .sort((a, b) => b.priority - a.priority || a.nextRunAt - b.nextRunAt)[0];
  }

  public saveTask(task: AutomationTask): AutomationTask {
    const idx = this.db.automation_tasks.findIndex((t) => t.id === task.id);
    task.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      this.db.automation_tasks[idx] = task;
    } else {
      this.db.automation_tasks.push(task);
    }
    this.save();
    return task;
  }

  public clearTasksForCampaign(campaignId: string) {
    this.db.automation_tasks = this.db.automation_tasks.filter((t) => t.campaignId !== campaignId);
    this.save();
  }

  // --- Logs ---
  public getLogs(campaignId?: string, limit = 150): ExecutionLog[] {
    let logs = this.db.execution_logs;
    if (campaignId) {
      logs = logs.filter((l) => l.campaignId === campaignId);
    }
    return logs.slice(-limit).reverse();
  }

  public addLog(
    campaignId: string,
    stage: string,
    message: string,
    level: 'info' | 'warn' | 'error' | 'success' = 'info',
    companyId?: string,
    companyName?: string,
    details?: Record<string, any>
  ): ExecutionLog {
    const log: ExecutionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      campaignId,
      companyId,
      companyName,
      stage,
      level,
      message,
      details,
      timestamp: new Date().toISOString(),
    };
    this.db.execution_logs.push(log);
    // Keep last 1500 logs to preserve memory
    if (this.db.execution_logs.length > 1500) {
      this.db.execution_logs = this.db.execution_logs.slice(-1500);
    }
    this.save();
    return log;
  }

  // --- Usage ---
  public getApiUsage(): ApiUsage {
    return this.db.api_usage;
  }

  public recordApiUsage(
    service: 'apify' | 'gemini' | 'hunter',
    units = 1,
    estimatedCost = 0
  ) {
    if (service === 'apify') {
      this.db.api_usage.apifyRuns += units;
      this.db.api_usage.apifyEstimatedCost += estimatedCost;
    } else if (service === 'gemini') {
      this.db.api_usage.geminiCalls += units;
      this.db.api_usage.geminiEstimatedCost += estimatedCost;
    } else if (service === 'hunter') {
      this.db.api_usage.hunterRequests += units;
      this.db.api_usage.hunterEstimatedCost += estimatedCost;
    }
    this.db.api_usage.totalEstimatedCost =
      this.db.api_usage.apifyEstimatedCost +
      this.db.api_usage.geminiEstimatedCost +
      this.db.api_usage.hunterEstimatedCost;
    this.db.api_usage.lastUpdated = new Date().toISOString();
    this.save();
  }

  // --- Saleshandy Export Tracking ---
  public getSaleshandyExportedEmails(campaignId: string): Set<string> {
    const list = this.db.saleshandy_exports || [];
    return new Set(
      list
        .filter((e) => e.campaignId === campaignId)
        .map((e) => e.email.toLowerCase())
    );
  }

  public recordSaleshandyExport(campaignId: string, email: string, saleshandyCampaignId: string) {
    if (!this.db.saleshandy_exports) {
      this.db.saleshandy_exports = [];
    }
    const exists = this.db.saleshandy_exports.some(
      (e) => e.campaignId === campaignId && e.email.toLowerCase() === email.toLowerCase()
    );
    if (!exists) {
      this.db.saleshandy_exports.push({
        id: `sh-exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        campaignId,
        email,
        saleshandyCampaignId,
        timestamp: new Date().toISOString(),
      });
      this.save();
    }
  }

  public getSaleshandySteps(sequenceId: string): StoredSaleshandyStep[] {
    if (!this.db.saleshandy_sequence_steps) {
      return [];
    }
    return this.db.saleshandy_sequence_steps
      .filter((s) => s.sequenceId === sequenceId)
      .sort((a, b) => a.stepNumber - b.stepNumber);
  }

  public setSaleshandySteps(
    sequenceId: string,
    campaignId: string,
    steps: Array<{ stepNumber: number; absoluteDays: number; subject: string; content: string }>
  ) {
    if (!this.db.saleshandy_sequence_steps) {
      this.db.saleshandy_sequence_steps = [];
    }
    // Remove existing steps for this sequence
    this.db.saleshandy_sequence_steps = this.db.saleshandy_sequence_steps.filter(
      (s) => s.sequenceId !== sequenceId
    );
    const now = new Date().toISOString();
    for (const step of steps) {
      this.db.saleshandy_sequence_steps.push({
        id: `sh-step-${sequenceId}-${step.stepNumber}`,
        sequenceId,
        campaignId,
        stepNumber: step.stepNumber,
        absoluteDays: step.absoluteDays,
        subject: step.subject,
        content: step.content,
        syncedAt: now,
      });
    }
    this.save();
  }

  public getLatestSaleshandySequenceId(campaignId: string): string | undefined {
    const list = this.db.saleshandy_exports || [];
    const item = list.find((e) => e.campaignId === campaignId);
    return item?.saleshandyCampaignId;
  }

  // --- Settings ---
  public getPublicSettings(): IntegrationSettings {
    const mask = (s: string) => (s && s.length > 6 ? `${s.slice(0, 3)}...${s.slice(-3)}` : s ? '***' : '');
    return {
      hasApifyToken: Boolean(this.secrets.apifyToken && this.secrets.apifyToken.trim().length > 0),
      hasGeminiKey: Boolean(this.secrets.geminiApiKey && this.secrets.geminiApiKey.trim().length > 0),
      hasHunterKey: Boolean(this.secrets.hunterApiKey && this.secrets.hunterApiKey.trim().length > 0),
      hasSaleshandyKey: Boolean(this.secrets.saleshandyApiKey && this.secrets.saleshandyApiKey.trim().length > 0),
      apifyTokenMasked: mask(this.secrets.apifyToken),
      geminiKeyMasked: mask(this.secrets.geminiApiKey),
      hunterKeyMasked: mask(this.secrets.hunterApiKey),
      saleshandyKeyMasked: mask(this.secrets.saleshandyApiKey),
      saleshandyApiBaseUrl: this.secrets.saleshandyApiBaseUrl || 'https://open-api.saleshandy.com/v1',
      defaultGeography: this.secrets.defaultGeography,
      defaultEmployeeFilter: this.secrets.defaultEmployeeFilter,
      defaultCandidateMultiplier: this.secrets.defaultCandidateMultiplier,
      defaultMinSignals: this.secrets.defaultMinSignals,
      maxApifyConcurrency: this.secrets.maxApifyConcurrency,
      maxHunterConcurrency: this.secrets.maxHunterConcurrency,
      retryLimit: this.secrets.retryLimit,
      testModeDefault: this.secrets.testModeDefault,
    };
  }

  public getSecretKeys() {
    return {
      apifyToken: this.secrets.apifyToken || process.env.APIFY_API_TOKEN || '',
      hunterApiKey: this.secrets.hunterApiKey || process.env.HUNTER_API_KEY || '',
      saleshandyApiKey: this.secrets.saleshandyApiKey || process.env.SALESHANDY_API_KEY || '',
      saleshandyApiBaseUrl: this.secrets.saleshandyApiBaseUrl || process.env.SALESHANDY_API_BASE_URL || 'https://open-api.saleshandy.com/v1',
      geminiApiKey: this.secrets.geminiApiKey || process.env.GEMINI_API_KEY || '',
      maxApifyConcurrency: this.secrets.maxApifyConcurrency,
      maxHunterConcurrency: this.secrets.maxHunterConcurrency,
      retryLimit: this.secrets.retryLimit,
    };
  }

  public updateSecrets(updates: Partial<SecretSettings>) {
    if (updates.apifyToken !== undefined && updates.apifyToken !== '***') {
      this.secrets.apifyToken = updates.apifyToken;
    }
    if (updates.hunterApiKey !== undefined && updates.hunterApiKey !== '***') {
      this.secrets.hunterApiKey = updates.hunterApiKey;
    }
    if (updates.saleshandyApiKey !== undefined && updates.saleshandyApiKey !== '***') {
      this.secrets.saleshandyApiKey = updates.saleshandyApiKey;
    }
    if (updates.saleshandyApiBaseUrl !== undefined && updates.saleshandyApiBaseUrl.trim().length > 0) {
      this.secrets.saleshandyApiBaseUrl = updates.saleshandyApiBaseUrl.trim();
    }
    if (updates.geminiApiKey !== undefined && updates.geminiApiKey !== '***') {
      this.secrets.geminiApiKey = updates.geminiApiKey;
    }
    if (updates.maxApifyConcurrency) this.secrets.maxApifyConcurrency = updates.maxApifyConcurrency;
    if (updates.maxHunterConcurrency) this.secrets.maxHunterConcurrency = updates.maxHunterConcurrency;
    if (updates.retryLimit) this.secrets.retryLimit = updates.retryLimit;
    if (updates.defaultGeography) this.secrets.defaultGeography = updates.defaultGeography;
    if (updates.defaultEmployeeFilter) this.secrets.defaultEmployeeFilter = updates.defaultEmployeeFilter;
    if (updates.defaultCandidateMultiplier) this.secrets.defaultCandidateMultiplier = updates.defaultCandidateMultiplier;
    if (updates.defaultMinSignals) this.secrets.defaultMinSignals = updates.defaultMinSignals;
    if (updates.testModeDefault !== undefined) this.secrets.testModeDefault = updates.testModeDefault;

    this.saveSecrets();
    return this.getPublicSettings();
  }

  // --- Pipeline Statistics ---
  public getPipelineSummary(campaignId: string): PipelineSummary {
    const comps = this.db.companies.filter((c) => c.campaignId === campaignId);
    const contacts = this.db.contacts.filter((c) => c.campaignId === campaignId);
    const research = this.db.research.filter((r) => r.campaignId === campaignId);
    const exports = this.getSaleshandyExportedEmails(campaignId);

    const readyForSaleshandyCount = comps.filter(
      (c) => (c.status === 'QC_PASSED' || c.status === 'READY_FOR_SALESHANDY') && !exports.has(this.getPrimaryContact(c.id)?.email.toLowerCase() || '')
    ).length;

    const exportedToSaleshandyCount = comps.filter(
      (c) => c.status === 'EXPORTED' || exports.has(this.getPrimaryContact(c.id)?.email.toLowerCase() || '')
    ).length;

    return {
      discovered: comps.length,
      validated: comps.filter((c) => c.status !== 'DISCOVERED' && c.status !== 'VALIDATION_FAILED' && c.status !== 'REJECTED').length,
      signalsAnalyzed: comps.filter((c) => (c.signalCount || 0) >= 3 || ['SIGNALS_ANALYZED', 'RESEARCHED', 'QUALIFIED_FOR_CONTACT', 'APOLLO_ENRICHED', 'CONTACT_ENRICHED', 'EMAIL_VERIFIED', 'DEDUPLICATED', 'SCORED', 'OUTREACH_GENERATED', 'QC_PASSED', 'READY_FOR_SALESHANDY', 'EXPORTED', 'SENT'].includes(c.status)).length,
      researched: research.length,
      qualifiedForContact: comps.filter((c) => ['QUALIFIED_FOR_CONTACT', 'APOLLO_ENRICHED', 'CONTACT_ENRICHED', 'EMAIL_VERIFIED', 'DEDUPLICATED', 'SCORED', 'OUTREACH_GENERATED', 'QC_PASSED', 'READY_FOR_SALESHANDY', 'EXPORTED', 'SENT'].includes(c.status)).length,
      contactEnriched: contacts.length,
      emailVerified: contacts.filter((c) => c.isVerifiedBusinessEmail).length,
      scored: comps.filter((c) => ['SCORED', 'OUTREACH_GENERATED', 'QC_PASSED', 'READY_FOR_SALESHANDY', 'EXPORTED', 'SENT'].includes(c.status)).length,
      outreachGenerated: comps.filter((c) => ['OUTREACH_GENERATED', 'QC_PASSED', 'READY_FOR_SALESHANDY', 'EXPORTED', 'SENT'].includes(c.status)).length,
      qcPassed: comps.filter((c) => ['QC_PASSED', 'READY_FOR_SALESHANDY', 'EXPORTED', 'SENT'].includes(c.status)).length,
      readyForSaleshandy: readyForSaleshandyCount,
      exportedToSaleshandy: exportedToSaleshandyCount,
      sent: comps.filter((c) => c.status === 'SENT').length,
      bounced: 0,
      replied: 0,
      rejected: comps.filter((c) => c.status === 'REJECTED' || c.status.endsWith('_FAILED') || c.status.endsWith('_REJECTED') || c.status === 'DUPLICATE').length,
      failed: comps.filter((c) => c.status.endsWith('_FAILED')).length,
    };
  }

  // --- Seed Initial Test Campaign with Verified Evidence ---
  private seedInitialData() {
    const campaignId = 'camp-healthcare-pilot';
    const now = new Date().toISOString();

    const initialCampaign: Campaign = {
      id: campaignId,
      name: 'US Healthcare — Regional Clinics & Specialty Centers Pilot',
      industry: 'Healthcare',
      geography: 'United States',
      targetLeads: 3,
      employeeFilter: 'NO_RESTRICTION',
      candidateMultiplier: 3,
      minSignalCount: 3,
      requireVerifiedEmail: true,
      requireEvidence: true,
      allowPersonalEmail: false,
      allowGuessedEmail: false,
      allowUnverifiedEmail: false,
      allowDuplicateCompany: false,
      allowDuplicateContact: false,
      apifyInputId: 'sample-apify-google-scraper-healthcare',
      inputType: 'demo',
      status: 'completed',
      isTestMode: true,
      createdAt: now,
      updatedAt: now,
    };

    // 3 verified companies matching all hard gates + 1 rejected for realism
    const c1: Company = {
      id: 'comp-101-integra',
      campaignId,
      name: 'Integra Healthcare Systems',
      domain: 'integrahealth.com',
      website: 'https://www.integrahealth.com',
      industry: 'Healthcare',
      geography: 'Dallas, TX, United States',
      employeeCount: '450',
      discoverySource: 'apify/google-search-scraper',
      status: 'EXPORTED',
      currentHiringActive: true,
      signalCount: 4,
      qualificationScore: 32,
      createdAt: now,
      updatedAt: now,
      apifySearchResult: {
        title: 'Integra Health Careers - Urgent Care & Specialty Nurses Hiring',
        url: 'https://www.integrahealth.com/careers',
        snippet: 'Integra Healthcare is expanding across North Texas. We are urgently seeking 14+ Registered Nurses, Clinical Coordinators, and Allied Health staff.',
        date: '2026-09-15',
      },
    };

    const c2: Company = {
      id: 'comp-102-summit',
      campaignId,
      name: 'Summit Ambulatory Surgical',
      domain: 'summitsurgicaltx.com',
      website: 'https://summitsurgicaltx.com',
      industry: 'Healthcare',
      geography: 'Austin, TX, United States',
      employeeCount: '280',
      discoverySource: 'apify/google-search-scraper',
      status: 'EXPORTED',
      currentHiringActive: true,
      signalCount: 4,
      qualificationScore: 31,
      createdAt: now,
      updatedAt: now,
      apifySearchResult: {
        title: 'Careers at Summit Surgical Centers - Open Clinical Roles',
        url: 'https://summitsurgicaltx.com/about/careers',
        snippet: 'Summit Ambulatory is opening 2 new surgical facilities in Q4. Hiring OR Technicians, Surgical Nurses, and Staff Recruiters.',
        date: '2026-09-18',
      },
    };

    const c3: Company = {
      id: 'comp-103-horizon',
      campaignId,
      name: 'Horizon Behavioral Health',
      domain: 'horizonbehavioral.org',
      website: 'https://horizonbehavioral.org',
      industry: 'Healthcare',
      geography: 'Denver, CO, United States',
      employeeCount: '190',
      discoverySource: 'apify/google-search-scraper',
      status: 'EXPORTED',
      currentHiringActive: true,
      signalCount: 3,
      qualificationScore: 30,
      createdAt: now,
      updatedAt: now,
      apifySearchResult: {
        title: 'Horizon Behavioral - Clinical Expansion & Hiring Drive',
        url: 'https://horizonbehavioral.org/join-our-team',
        snippet: 'Horizon Behavioral announces state expansion with 18 open therapist and behavioral specialist positions across 3 regional clinics.',
        date: '2026-09-22',
      },
    };

    const c4: Company = {
      id: 'comp-104-medstaff',
      campaignId,
      name: 'Alliance Nurse Network (Job Board / Aggregator)',
      domain: 'alliancenursejobs.net',
      website: 'https://alliancenursejobs.net',
      industry: 'Healthcare Staffing',
      geography: 'United States',
      employeeCount: 'Unknown',
      discoverySource: 'apify/google-search-scraper',
      status: 'REJECTED',
      rejectionReason: 'Third-party job board / staffing aggregator portal. Violates employer-direct gate.',
      signalCount: 1,
      createdAt: now,
      updatedAt: now,
      apifySearchResult: {
        title: 'Thousands of Nursing Jobs Across the USA - Alliance Nurse',
        url: 'https://alliancenursejobs.net/search',
        snippet: 'Search 15,000 nursing jobs from hospital partners nationwide. Apply with one click.',
      },
    };

    this.db.campaigns = [initialCampaign];
    this.db.companies = [c1, c2, c3, c4];

    // Seed Jobs for C1
    this.db.jobs.push(
      {
        id: 'job-101',
        companyId: c1.id,
        campaignId,
        jobTitle: 'Lead Clinical Nurse Coordinator (ICU / Stepdown)',
        url: 'https://www.integrahealth.com/careers/lead-clinical-coordinator-dallas',
        location: 'Dallas, TX',
        postingDate: '2026-09-18',
        freshness: 'FRESH',
        category: 'Clinical Nursing',
        isSpecialized: true,
        isRecruitingRole: false,
        isDuplicate: false,
        evidenceStatus: 'VERIFIED',
        createdAt: now,
      },
      {
        id: 'job-102',
        companyId: c1.id,
        campaignId,
        jobTitle: 'Senior Healthcare Recruiter — Clinical Staffing',
        url: 'https://www.integrahealth.com/careers/senior-healthcare-recruiter',
        location: 'Dallas, TX / Hybrid',
        postingDate: '2026-09-20',
        freshness: 'FRESH',
        category: 'Recruiting / HR',
        isSpecialized: false,
        isRecruitingRole: true,
        isDuplicate: false,
        evidenceStatus: 'VERIFIED',
        createdAt: now,
      }
    );

    // Seed Signals for C1
    this.db.signals.push({
      id: 'sig-101',
      companyId: c1.id,
      campaignId,
      highVolumeHiring: true,
      inefficientJobAdvertising: true,
      limitedRecruitingSupport: true,
      hiringRecruiter: true,
      freshOrAgedJobAds: true,
      positiveSignalCount: 4,
      signalNotes: [
        '14+ simultaneous clinical nursing positions across 3 Dallas satellite clinics.',
        'Actively hiring an internal Senior Healthcare Recruiter due to staffing bottleneck.',
        'Job listings republished repeatedly across last 30 days without fill.',
        'Limited visible internal talent acquisition team (1 recruiter listed for 450 staff).',
      ],
      createdAt: now,
    });

    // Seed Research for C1
    this.db.research.push({
      id: 'res-101',
      companyId: c1.id,
      campaignId,
      hiringTrigger: 'T4 New Location/Facility Opening & Urgent Care Expansion',
      specificHiringProblem: 'Critical shortage of specialized Clinical Nurse Coordinators threatening clinic launch schedule',
      whyNow: 'Opening 2 urgent care clinics in November 2026 with 14 unfilled licensed clinical positions',
      hiringDifficulty: 'High — acute shortage of licensed ICU/Stepdown credentials in DFW metro',
      hiringUrgency: 'Immediate (within 45 days of facility opening)',
      hiringFriction: 'T4 New Location + T10 Recruiting Capacity Gap (internal team overwhelmed)',
      internalRecruitingCapacity: 'SMALL',
      painOwnerTitle: 'Director of Talent Acquisition',
      economicBuyerTitle: 'Chief Operating Officer',
      potentialChampionTitle: 'Clinical Operations Manager',
      evidenceUrl: 'https://www.integrahealth.com/press/dallas-expansion-announcement-2026',
      evidenceSummary: 'Official press release announcing two new North Texas centers and concurrent job postings for 14 licensed clinical nurses.',
      evidenceDate: '2026-09-15',
      evidenceType: 'OFFICIAL PRESS RELEASE & CAREERS PAGE',
      evidenceConfidence: 96,
      relevantRole: 'Lead Clinical Nurse Coordinator',
      relevantLocation: 'Dallas, TX',
      aiReasoning: 'Confirmed via official company press release and active careers postings. Clear friction exists: opening new facilities while actively advertising for a recruiter to backfill internal team capacity.',
      createdAt: now,
    });

    // Seed Contact for C1 (Verified by Hunter)
    this.db.contacts.push({
      id: 'cont-101',
      companyId: c1.id,
      campaignId,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      fullName: 'Sarah Jenkins',
      title: 'Director of Talent Acquisition',
      email: 'sjenkins@integrahealth.com',
      emailStatus: 'valid',
      isVerifiedBusinessEmail: true,
      hunterConfidence: 97,
      alternativeContactsTried: 0,
      linkedinUrl: 'https://linkedin.com/in/sarah-jenkins-talent',
      enrichedFrom: 'hunter',
      createdAt: now,
    });

    // Seed Qualification for C1
    this.db.qualifications.push({
      id: 'qual-101',
      companyId: c1.id,
      campaignId,
      scoreA_HiringDemand: 5,
      scoreB_HiringFriction: 5,
      scoreC_HiringUrgency: 4,
      scoreD_HiringDifficulty: 5,
      scoreE_RecruitingCapacity: 4,
      scoreF_EconomicFit: 4,
      scoreG_EvidenceQuality: 5,
      totalScore: 32,
      scoreRating: 'STRONG',
      qualificationReason: 'Company exhibits active facility expansion, 14 urgent clinical vacancies, an open req for an internal recruiter, and a Hunter-verified Talent Acquisition Director.',
      passedHardGates: true,
      failedGates: [],
      createdAt: now,
    });

    // Seed Outreach for C1
    this.db.outreach.push({
      id: 'out-101',
      companyId: c1.id,
      campaignId,
      contactId: 'cont-101',
      customSubject: 'Integra Healthcare clinic expansion & nurse staffing',
      customBody: `Hi Sarah,

Noticed Integra Healthcare is launching two new outpatient centers in Dallas this quarter while actively recruiting for licensed Clinical Nurse Coordinators.

When healthcare networks scale regional facilities, filling specialized clinical headcount quickly often stretches internal recruiting capacity thin—especially while searching for a senior healthcare recruiter to join the team.

Are you handling all clinical pipeline sourcing internally right now, or open to exploring targeted candidate bandwidth for the Dallas facility launch?

Best,
Nishant Mohanty
Business Development | Talent Forge Solution
5900 Balcones DR STE 100
Austin, TX 78731`,
      followUpOne: `Hi Sarah,

Following up on my note regarding Integra's upcoming Dallas clinics.

We recently helped a regional Texas specialty group fill 8 critical nursing roles in under 28 days without standard agency percentages.

Would it be worth a brief comparison to see how we could support your Q4 clinical launch deadlines?

Best,
Nishant Mohanty
Business Development | Talent Forge Solution
5900 Balcones DR STE 100
Austin, TX 78731`,
      followUpTwo: `Hi Sarah,

I understand talent acquisition priorities are moving fast with the new center openings.

If you ever need rapid recruiting horsepower for clinical vacancies without adding fixed headcount, feel free to keep us in mind.

Best,
Nishant Mohanty
Business Development | Talent Forge Solution
5900 Balcones DR STE 100
Austin, TX 78731`,
      qcPassed: true,
      qcChecklist: {
        'Correct company': true,
        'Correct US geography': true,
        'Correct industry': true,
        'Current hiring': true,
        '3+ supported hiring signals': true,
        'Credible hiring trigger': true,
        'Specific hiring problem': true,
        'Why-now evidence': true,
        'Hiring difficulty': true,
        'Recruiting capacity assessed': true,
        'Pain owner identified': true,
        'Economic buyer identified': true,
        'Verified business email': true,
        'Evidence URL': true,
        'No duplicate': true,
        'No unsupported claims': true,
        'Custom subject': true,
        'Custom body': true,
        'Follow-up one': true,
        'Follow-up two': true,
        'Exact signature in all messages': true,
      },
      qcNotes: 'All 21 QC criteria passed. Word count: 88 words. Exact required signature verified in Custom Body, Follow up 1, and Follow up 2.',
      createdAt: now,
    });

    // Seed Summit (C2)
    this.db.contacts.push({
      id: 'cont-102',
      companyId: c2.id,
      campaignId,
      firstName: 'Marcus',
      lastName: 'Vance',
      fullName: 'Marcus Vance',
      title: 'VP of Human Resources',
      email: 'm.vance@summitsurgicaltx.com',
      emailStatus: 'valid',
      isVerifiedBusinessEmail: true,
      hunterConfidence: 94,
      alternativeContactsTried: 0,
      enrichedFrom: 'hunter',
      createdAt: now,
    });

    this.db.research.push({
      id: 'res-102',
      companyId: c2.id,
      campaignId,
      hiringTrigger: 'T4 New Location/Facility Opening',
      specificHiringProblem: 'Opening 2 ambulatory surgical centers in Austin; urgent need for licensed surgical techs and OR nurses',
      whyNow: 'Facility construction complete; operational inspection scheduled for next month',
      hiringDifficulty: 'High — surgical techs require specialized state certification and surgical experience',
      hiringUrgency: 'High (30 days)',
      hiringFriction: 'T4 New Location + T6 Specialized Talent Requirements',
      internalRecruitingCapacity: 'SMALL',
      painOwnerTitle: 'VP of Human Resources',
      economicBuyerTitle: 'Chief Operating Officer',
      potentialChampionTitle: 'Surgical Director',
      evidenceUrl: 'https://summitsurgicaltx.com/about/careers',
      evidenceSummary: 'Careers portal lists 9 distinct surgical positions with signing incentives for certified OR techs in Austin.',
      evidenceDate: '2026-09-18',
      evidenceType: 'OFFICIAL CAREERS PORTAL',
      evidenceConfidence: 94,
      relevantRole: 'Certified OR Surgical Technician',
      relevantLocation: 'Austin, TX',
      aiReasoning: 'Verified through official careers page with explicit hiring incentives and upcoming opening dates.',
      createdAt: now,
    });

    this.db.qualifications.push({
      id: 'qual-102',
      companyId: c2.id,
      campaignId,
      scoreA_HiringDemand: 5,
      scoreB_HiringFriction: 4,
      scoreC_HiringUrgency: 5,
      scoreD_HiringDifficulty: 4,
      scoreE_RecruitingCapacity: 4,
      scoreF_EconomicFit: 4,
      scoreG_EvidenceQuality: 5,
      totalScore: 31,
      scoreRating: 'STRONG',
      qualificationReason: 'New surgical suites require certified OR techs with immediate start dates; Hunter verified VP HR.',
      passedHardGates: true,
      failedGates: [],
      createdAt: now,
    });

    this.db.outreach.push({
      id: 'out-102',
      companyId: c2.id,
      campaignId,
      contactId: 'cont-102',
      customSubject: 'OR surgical staffing for Summit Ambulatory Austin suites',
      customBody: `Hi Marcus,

Saw that Summit Ambulatory is preparing to launch two new surgical centers in Austin and currently advertising for certified OR Technicians and surgical nurses.

Ramping up surgical staff for new suite openings usually introduces a tight scheduling bottleneck, especially with certified surgical talent in Austin.

Are you sourcing these surgical roles through internal recruiters alone, or considering external recruiting capacity for the opening push?

Best,
Nishant Mohanty
Business Development | Talent Forge Solution
5900 Balcones DR STE 100
Austin, TX 78731`,
      followUpOne: `Hi Marcus,

Following up regarding Summit Surgical's Austin launch.

Talent Forge provides dedicated recruiting bandwidth for medical and surgical facility expansions without percentage fee structures.

Would you be open to seeing our certified clinical candidate turnaround times?

Best,
Nishant Mohanty
Business Development | Talent Forge Solution
5900 Balcones DR STE 100
Austin, TX 78731`,
      followUpTwo: `Hi Marcus,

Touching base one last time before your surgical center launch dates.

If your team ever needs surge recruiting support for difficult clinical vacancies, we would welcome the conversation.

Best,
Nishant Mohanty
Business Development | Talent Forge Solution
5900 Balcones DR STE 100
Austin, TX 78731`,
      qcPassed: true,
      qcChecklist: { 'All Gates Passed': true },
      qcNotes: 'Passed all verification gates. Exact signature intact.',
      createdAt: now,
    });

    // Seed Horizon (C3)
    this.db.contacts.push({
      id: 'cont-103',
      companyId: c3.id,
      campaignId,
      firstName: 'Elena',
      lastName: 'Rostova',
      fullName: 'Elena Rostova',
      title: 'Head of People & Culture',
      email: 'erostova@horizonbehavioral.org',
      emailStatus: 'valid',
      isVerifiedBusinessEmail: true,
      hunterConfidence: 91,
      alternativeContactsTried: 0,
      enrichedFrom: 'hunter',
      createdAt: now,
    });

    this.db.research.push({
      id: 'res-103',
      companyId: c3.id,
      campaignId,
      hiringTrigger: 'T5 Multi-Location Operational Expansion',
      specificHiringProblem: '18 open therapist and behavioral specialist positions across 3 regional clinics',
      whyNow: 'Colorado state grant expansion commenced in Q3 requiring clinical quota fulfillment',
      hiringDifficulty: 'High — licensed LCSW / LPC clinicians with Colorado credentialing',
      hiringUrgency: 'Moderate to High (60 days)',
      hiringFriction: 'T5 Expansion + T2 Multi-Location Hiring Spikes',
      internalRecruitingCapacity: 'SMALL',
      painOwnerTitle: 'Head of People & Culture',
      economicBuyerTitle: 'Chief Executive Officer',
      potentialChampionTitle: 'Clinical Supervisor',
      evidenceUrl: 'https://horizonbehavioral.org/join-our-team',
      evidenceSummary: 'Official careers board showing multiple regional openings for licensed behavioral counselors.',
      evidenceDate: '2026-09-22',
      evidenceType: 'OFFICIAL CAREERS PAGE',
      evidenceConfidence: 92,
      relevantRole: 'Licensed Clinical Social Worker (LCSW)',
      relevantLocation: 'Denver, CO',
      aiReasoning: 'State contract expansion drives multi-clinic hiring pressure. Documented in public announcement and recruitment postings.',
      createdAt: now,
    });

    this.db.qualifications.push({
      id: 'qual-103',
      companyId: c3.id,
      campaignId,
      scoreA_HiringDemand: 5,
      scoreB_HiringFriction: 4,
      scoreC_HiringUrgency: 4,
      scoreD_HiringDifficulty: 4,
      scoreE_RecruitingCapacity: 4,
      scoreF_EconomicFit: 4,
      scoreG_EvidenceQuality: 5,
      totalScore: 30,
      scoreRating: 'STRONG',
      qualificationReason: 'Proven hiring spike across 3 regional clinic locations with Hunter-verified Head of People.',
      passedHardGates: true,
      failedGates: [],
      createdAt: now,
    });

    this.db.outreach.push({
      id: 'out-103',
      companyId: c3.id,
      campaignId,
      contactId: 'cont-103',
      customSubject: 'Horizon Behavioral expansion & licensed therapist recruitment',
      customBody: `Hi Elena,

Noticed Horizon Behavioral's recent expansion across Colorado and the concurrent search for licensed behavioral therapists and clinical counselors.

Staffing licensed clinicians across multiple regional facilities often puts heavy pressure on internal people operations.

Is Horizon managing the entire multi-clinic recruitment push internally, or open to dedicated candidate sourcing support for your Denver and regional roles?

Best,
Nishant Mohanty
Business Development | Talent Forge Solution
5900 Balcones DR STE 100
Austin, TX 78731`,
      followUpOne: `Hi Elena,

Following up on my message regarding Horizon's clinician hiring across Colorado.

We support growing healthcare organizations by building vetted candidate pipelines without the overhead of traditional placement agencies.

Could we connect for a brief exchange to see if we can relieve some of the regional recruiting burden?

Best,
Nishant Mohanty
Business Development | Talent Forge Solution
5900 Balcones DR STE 100
Austin, TX 78731`,
      followUpTwo: `Hi Elena,

Checking in one last time regarding Horizon Behavioral's hiring drive.

If you ever need external recruiting firepower for licensed clinical roles, Nishant and the Talent Forge team are here to help.

Best,
Nishant Mohanty
Business Development | Talent Forge Solution
5900 Balcones DR STE 100
Austin, TX 78731`,
      qcPassed: true,
      qcChecklist: { 'All Gates Passed': true },
      qcNotes: 'All hard gates passed. Exact signature intact.',
      createdAt: now,
    });

    // Add initial execution logs
    this.addLog(campaignId, 'IMPORT', 'Campaign initialized with 4 candidates from Apify search scraper', 'info');
    this.addLog(campaignId, 'VALIDATION', 'Validated Integra Healthcare, Summit Surgical, Horizon Behavioral. Rejected Alliance Nurse Network (Aggregator).', 'success');
    this.addLog(campaignId, 'RESEARCH', 'Hiring friction and why-now triggers identified for 3 validated companies', 'success');
    this.addLog(campaignId, 'CONTACT', 'Hunter verified decision makers for all 3 accounts: Sarah Jenkins, Marcus Vance, Elena Rostova', 'success');
    this.addLog(campaignId, 'QC', 'AI Quality Control passed for 3 leads. Custom 3-touch outreach generated with required signature.', 'success');
  }

  private seedInitialSaleshandySteps() {
    const sequenceId = 'eMPkq5ojzQ';
    const campaignId = 'camp-healthcare-pilot';
    const now = new Date().toISOString();

    // Record the 3 exported test prospects to prevent duplicate pushes
    this.recordSaleshandyExport(campaignId, 'sjenkins@integrahealth.com', sequenceId);
    this.recordSaleshandyExport(campaignId, 'mvance@summitambulatorytx.com', sequenceId);
    this.recordSaleshandyExport(campaignId, 'erostova@horizonbehavioralhealth.com', sequenceId);

    const outreach = this.db.outreach.find((o) => o.campaignId === campaignId);
    const subject = outreach?.customSubject || 'Integra Healthcare clinic expansion & nurse staffing';
    const body = outreach?.customBody || `Hi {{firstName}},

Noticed {{companyName}} is launching two new outpatient centers in Dallas this quarter while actively recruiting for licensed Clinical Nurse Coordinators.

When healthcare networks scale regional facilities, filling specialized clinical headcount quickly often stretches internal recruiting capacity thin—especially while searching for a senior healthcare recruiter to join the team.

Are you handling all clinical pipeline sourcing internally right now, or open to exploring targeted candidate bandwidth for the Dallas facility launch?

Best,
Nishant Mohanty
Business Development | Talent Forge Solution
5900 Balcones DR STE 100
Austin, TX 78731`;

    const followUp1 = outreach?.followUpOne || `Hi {{firstName}},

Following up on my note regarding {{companyName}}'s upcoming Dallas clinics.

We recently helped a regional Texas specialty group fill 8 critical nursing roles in under 28 days without standard agency percentages.

Would it be worth a brief comparison to see how we could support your Q4 clinical launch deadlines?

Best,
Nishant Mohanty
Business Development | Talent Forge Solution
5900 Balcones DR STE 100
Austin, TX 78731`;

    const followUp2 = outreach?.followUpTwo || `Hi {{firstName}},

I understand talent acquisition priorities are moving fast with the new center openings.

If you ever need rapid recruiting horsepower for clinical vacancies without adding fixed headcount, feel free to keep us in mind.

Best,
Nishant Mohanty
Business Development | Talent Forge Solution
5900 Balcones DR STE 100
Austin, TX 78731`;

    this.db.saleshandy_sequence_steps = [
      {
        id: `sh-step-${sequenceId}-1`,
        sequenceId,
        campaignId,
        stepNumber: 1,
        absoluteDays: 1,
        subject,
        content: body,
        syncedAt: now,
      },
      {
        id: `sh-step-${sequenceId}-2`,
        sequenceId,
        campaignId,
        stepNumber: 2,
        absoluteDays: 3,
        subject: `Re: ${subject}`,
        content: followUp1,
        syncedAt: now,
      },
      {
        id: `sh-step-${sequenceId}-3`,
        sequenceId,
        campaignId,
        stepNumber: 3,
        absoluteDays: 7,
        subject: `Re: ${subject}`,
        content: followUp2,
        syncedAt: now,
      },
    ];

    this.addLog(
      campaignId,
      'EXPORT',
      `Exported 3 QC-passed leads to Saleshandy sequence (${sequenceId}): Sarah Jenkins, Marcus Vance, Elena Rostova. Steps 1-3 synchronized. Sequence status: DRAFT / PAUSED.`,
      'success'
    );
  }
}

export const storage = new StorageManager();
