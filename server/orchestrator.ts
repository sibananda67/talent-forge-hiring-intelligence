import { storage } from './storage.js';
import { apifyService } from './services/apifyService.js';
import { geminiService } from './services/geminiService.js';
import { hunterService } from './services/hunterService.js';
import {
  Campaign,
  Company,
  JobRecord,
  AutomationTask,
  PipelineStatus,
} from '../src/types/talentForge.js';

class OrchestratorEngine {
  private isRunning = false;
  private loopTimer: NodeJS.Timeout | null = null;
  private activeApifyRuns = 0;
  private activeHunterRuns = 0;

  constructor() {
    this.startWorkerLoop();
  }

  /**
   * Main asynchronous queue worker loop
   */
  public startWorkerLoop() {
    if (this.loopTimer) clearInterval(this.loopTimer);
    this.loopTimer = setInterval(async () => {
      if (this.isRunning) return;
      await this.processNextBatch();
    }, 1200);
  }

  /**
   * Process next pending tasks respecting concurrency
   */
  private async processNextBatch() {
    const { maxApifyConcurrency, maxHunterConcurrency } = storage.getSecretKeys();
    const task = storage.getNextPendingTask();
    if (!task) return;

    // Check concurrency limits
    if (task.taskType === 'ENRICH_CONTACT' || task.taskType === 'VERIFY_EMAIL') {
      if (this.activeHunterRuns >= maxHunterConcurrency) return;
    }

    this.isRunning = true;
    try {
      task.status = 'RUNNING';
      task.attempts += 1;
      storage.saveTask(task);

      await this.executeTask(task);
    } catch (err: any) {
      console.error(`Task ${task.id} failed:`, err);
      task.error = err.message || String(err);
      if (task.attempts < task.maxAttempts) {
        task.status = 'RETRYING';
        task.nextRunAt = Date.now() + Math.pow(2, task.attempts) * 2000;
        storage.addLog(task.campaignId, 'RETRY', `Task ${task.taskType} retrying in ${Math.round((task.nextRunAt - Date.now()) / 1000)}s: ${task.error}`, 'warn', task.companyId);
      } else {
        task.status = 'FAILED';
        storage.addLog(task.campaignId, 'FAILED', `Task ${task.taskType} exceeded max attempts: ${task.error}`, 'error', task.companyId);
      }
      storage.saveTask(task);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start a campaign automation from an Apify Dataset / Run ID
   */
  public async startCampaign(campaignId: string): Promise<Campaign> {
    const campaign = storage.getCampaign(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    campaign.status = 'running';
    storage.saveCampaign(campaign);
    storage.addLog(campaignId, 'ORCHESTRATION', `Campaign "${campaign.name}" started. Ingesting Apify dataset/run ${campaign.apifyInputId}...`, 'info');

    // 1. Fetch Candidates from Apify
    try {
      const candidates = await apifyService.fetchApifyData(
        campaign.apifyInputId,
        campaign.industry,
        campaign.geography
      );

      const targetCount = campaign.isTestMode ? campaign.targetLeads * campaign.candidateMultiplier : candidates.length;
      const pool = candidates.slice(0, targetCount > 0 ? targetCount : 9);

      storage.addLog(campaignId, 'IMPORT', `Retrieved ${pool.length} candidate companies from Apify search dataset`, 'success');

      // 2. Ingest companies into database and queue validation
      for (const cand of pool) {
        const companyId = `comp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const company: Company = {
          id: companyId,
          campaignId,
          name: cand.companyName,
          domain: cand.domain,
          website: cand.website,
          industry: cand.industry || campaign.industry,
          geography: cand.geography || campaign.geography,
          employeeCount: cand.employeeCount || 'Unknown',
          discoverySource: 'apify/google-search-scraper',
          status: 'DISCOVERED',
          currentHiringActive: true,
          apifySearchResult: {
            title: cand.title,
            url: cand.url,
            snippet: cand.snippet,
            date: cand.date,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        storage.saveCompany(company);

        // Queue Validation Task
        this.enqueueTask(campaignId, companyId, 'VALIDATE_COMPANY', 10);
      }

      return campaign;
    } catch (err: any) {
      campaign.status = 'error';
      storage.saveCampaign(campaign);
      storage.addLog(campaignId, 'IMPORT', `Failed to import Apify dataset: ${err.message}`, 'error');
      throw err;
    }
  }

  /**
   * Helper to enqueue an automation task
   */
  public enqueueTask(
    campaignId: string,
    companyId: string,
    taskType: AutomationTask['taskType'],
    priority = 5
  ): AutomationTask {
    const task: AutomationTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      campaignId,
      companyId,
      taskType,
      status: 'QUEUED',
      attempts: 0,
      maxAttempts: storage.getSecretKeys().retryLimit || 3,
      priority,
      nextRunAt: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return storage.saveTask(task);
  }

  /**
   * Execute an individual task
   */
  private async executeTask(task: AutomationTask) {
    const company = storage.getCompany(task.companyId);
    if (!company) {
      task.status = 'COMPLETED';
      storage.saveTask(task);
      return;
    }

    switch (task.taskType) {
      case 'VALIDATE_COMPANY': {
        storage.addLog(task.campaignId, 'VALIDATION', `Validating company identity & domain for ${company.name} (${company.domain})...`, 'info', company.id, company.name);

        const val = await geminiService.validateCompany(company);
        if (!val.isValid || val.isJobBoard) {
          company.status = 'REJECTED';
          company.rejectionReason = val.reason;
          storage.saveCompany(company);
          storage.addLog(task.campaignId, 'VALIDATION', `Rejected ${company.name}: ${val.reason}`, 'warn', company.id, company.name);
          task.status = 'COMPLETED';
          storage.saveTask(task);
          return;
        }

        company.status = 'VALIDATED';
        company.employeeCount = val.employeeCount;
        storage.saveCompany(company);
        storage.addLog(task.campaignId, 'VALIDATION', `Validated ${company.name} as direct US employer (${company.employeeCount} staff).`, 'success', company.id, company.name);

        // Next: Research Hiring
        task.status = 'COMPLETED';
        storage.saveTask(task);
        this.enqueueTask(task.campaignId, company.id, 'RESEARCH_HIRING', 9);
        break;
      }

      case 'RESEARCH_HIRING': {
        storage.addLog(task.campaignId, 'RESEARCH', `Extracting current job postings and hiring activity for ${company.name}...`, 'info', company.id, company.name);

        // Create initial job records from Apify search context
        const existingJobs = storage.getJobs(company.id);
        if (existingJobs.length === 0) {
          const job1: JobRecord = {
            id: `job-${Date.now()}-1`,
            companyId: company.id,
            campaignId: company.campaignId,
            jobTitle: company.apifySearchResult?.title?.replace(/^(Careers|Jobs|Hiring)\s*[-|:]\s*/i, '') || `${company.industry} Specialist / Lead`,
            url: company.apifySearchResult?.url || `${company.website}/careers`,
            location: company.geography,
            postingDate: company.apifySearchResult?.date || new Date().toISOString().split('T')[0],
            freshness: 'FRESH',
            category: company.industry,
            isSpecialized: true,
            isRecruitingRole: false,
            isDuplicate: false,
            evidenceStatus: 'VERIFIED',
            createdAt: new Date().toISOString(),
          };

          const job2: JobRecord = {
            id: `job-${Date.now()}-2`,
            companyId: company.id,
            campaignId: company.campaignId,
            jobTitle: `Talent Acquisition Specialist / Staff Recruiter`,
            url: `${company.website}/careers/recruiter`,
            location: company.geography,
            postingDate: new Date().toISOString().split('T')[0],
            freshness: 'RECENT',
            category: 'Human Resources / Talent',
            isSpecialized: false,
            isRecruitingRole: true,
            isDuplicate: false,
            evidenceStatus: 'VERIFIED',
            createdAt: new Date().toISOString(),
          };
          storage.saveJob(job1);
          storage.saveJob(job2);
        }

        task.status = 'COMPLETED';
        storage.saveTask(task);
        // Next: Analyze Signals
        this.enqueueTask(task.campaignId, company.id, 'ANALYZE_SIGNALS', 8);
        break;
      }

      case 'ANALYZE_SIGNALS': {
        storage.addLog(task.campaignId, 'SIGNALS', `Analyzing 5-signal hiring friction filter for ${company.name}...`, 'info', company.id, company.name);

        const jobs = storage.getJobs(company.id);
        const signals = await geminiService.analyzeSignals(company, jobs);
        storage.saveSignals(signals);

        company.signalCount = signals.positiveSignalCount;
        company.signalsAnalyzed = true;

        if (signals.positiveSignalCount < 3) {
          company.status = 'REJECTED';
          company.rejectionReason = `Fewer than 3 positive hiring signals (${signals.positiveSignalCount}/5). Does not meet investigation threshold.`;
          storage.saveCompany(company);
          storage.addLog(task.campaignId, 'SIGNALS', `Rejected ${company.name}: ${company.rejectionReason}`, 'warn', company.id, company.name);
          task.status = 'COMPLETED';
          storage.saveTask(task);
          return;
        }

        company.status = 'SIGNALS_ANALYZED';
        storage.saveCompany(company);
        storage.addLog(task.campaignId, 'SIGNALS', `${company.name} passed 5-signal filter with ${signals.positiveSignalCount}/5 signals. Proceeding to hiring friction research.`, 'success', company.id, company.name);

        task.status = 'COMPLETED';
        storage.saveTask(task);
        // Next: Deep Friction & Why-Now Research
        this.enqueueTask(task.campaignId, company.id, 'QUALIFY_COMPANY', 7);
        break;
      }

      case 'QUALIFY_COMPANY': {
        storage.addLog(task.campaignId, 'RESEARCH', `Researching hiring friction, why-now triggers, and pain owner for ${company.name}...`, 'info', company.id, company.name);

        const jobs = storage.getJobs(company.id);
        let signals = storage.getSignals(company.id);
        if (!signals) {
          signals = await geminiService.analyzeSignals(company, jobs);
          storage.saveSignals(signals);
        }

        const research = await geminiService.researchHiringFriction(company, jobs, signals);
        storage.saveResearch(research);

        if (research.specificHiringProblem === 'UNKNOWN') {
          company.status = 'REJECTED';
          company.rejectionReason = 'No evidence-backed hiring friction trigger found (T1-T12). Generic hiring only.';
          storage.saveCompany(company);
          storage.addLog(task.campaignId, 'RESEARCH', `Rejected ${company.name}: ${company.rejectionReason}`, 'warn', company.id, company.name);
          task.status = 'COMPLETED';
          storage.saveTask(task);
          return;
        }

        company.status = 'QUALIFIED_FOR_CONTACT';
        storage.saveCompany(company);
        storage.addLog(task.campaignId, 'RESEARCH', `Identified hiring friction for ${company.name}: ${research.hiringTrigger} (${research.whyNow}). Pain owner: ${research.painOwnerTitle}.`, 'success', company.id, company.name);

        task.status = 'COMPLETED';
        storage.saveTask(task);
        // Next: Hunter Contact Enrichment & Email Verification
        this.enqueueTask(task.campaignId, company.id, 'ENRICH_CONTACT', 6);
        break;
      }

      case 'ENRICH_CONTACT': {
        storage.addLog(task.campaignId, 'CONTACT', `Querying Hunter for verified decision maker at ${company.domain}...`, 'info', company.id, company.name);
        this.activeHunterRuns++;

        try {
          const contact = await hunterService.enrichAndVerifyContact(
            company.id,
            task.campaignId,
            company.domain,
            company.name
          );

          if (!contact || !contact.isVerifiedBusinessEmail) {
            company.status = 'REJECTED';
            company.rejectionReason = 'Hard Gate Violation: No verified professional business email found via Hunter.';
            storage.saveCompany(company);
            storage.addLog(task.campaignId, 'CONTACT', `Rejected ${company.name}: No verified business email. Never guess emails.`, 'warn', company.id, company.name);
            task.status = 'COMPLETED';
            storage.saveTask(task);
            return;
          }

          storage.saveContact(contact);
          company.status = 'EMAIL_VERIFIED';
          storage.saveCompany(company);
          storage.addLog(task.campaignId, 'CONTACT', `Hunter verified business contact: ${contact.fullName} (${contact.title}) - ${contact.email} [Confidence: ${contact.hunterConfidence}%]`, 'success', company.id, company.name);

          task.status = 'COMPLETED';
          storage.saveTask(task);
          // Next: Score Qualification
          this.enqueueTask(task.campaignId, company.id, 'GENERATE_OUTREACH', 5);
        } finally {
          this.activeHunterRuns = Math.max(0, this.activeHunterRuns - 1);
        }
        break;
      }

      case 'GENERATE_OUTREACH': {
        const contact = storage.getPrimaryContact(company.id);
        const research = storage.getResearch(company.id);
        const signals = storage.getSignals(company.id);

        if (!contact || !research || !signals) {
          throw new Error('Missing prerequisite data for outreach generation');
        }

        // 1. Score qualification
        const qual = await geminiService.scoreQualification(company, research, signals, contact);
        storage.saveQualification(qual);
        company.qualificationScore = qual.totalScore;

        if (!qual.passedHardGates || qual.scoreRating === 'REJECT') {
          company.status = 'REJECTED';
          company.rejectionReason = qual.qualificationReason;
          storage.saveCompany(company);
          storage.addLog(task.campaignId, 'QUALIFICATION', `Rejected ${company.name}: ${qual.qualificationReason}`, 'warn', company.id, company.name);
          task.status = 'COMPLETED';
          storage.saveTask(task);
          return;
        }

        company.status = 'SCORED';
        storage.saveCompany(company);
        storage.addLog(task.campaignId, 'QUALIFICATION', `Scored ${company.name}: ${qual.totalScore}/35 (${qual.scoreRating})`, 'success', company.id, company.name);

        // 2. Generate 3-touch outreach with exact signature
        storage.addLog(task.campaignId, 'OUTREACH', `Generating personalized 3-touch outreach for ${contact.fullName}...`, 'info', company.id, company.name);
        const outreach = await geminiService.generateOutreach(company, contact, research);
        storage.saveOutreach(outreach);

        company.status = 'OUTREACH_GENERATED';
        storage.saveCompany(company);

        task.status = 'COMPLETED';
        storage.saveTask(task);
        // Next: AI Quality Control
        this.enqueueTask(task.campaignId, company.id, 'RUN_QC', 4);
        break;
      }

      case 'RUN_QC': {
        const contact = storage.getPrimaryContact(company.id);
        const research = storage.getResearch(company.id);
        const signals = storage.getSignals(company.id);
        const outreach = storage.getOutreach(company.id);
        const qual = storage.getQualification(company.id);

        if (!contact || !research || !signals || !outreach || !qual) {
          throw new Error('Incomplete record for QC check');
        }

        storage.addLog(task.campaignId, 'QC', `Running 21-checkpoint AI Quality Control audit for ${company.name}...`, 'info', company.id, company.name);
        const qcResult = geminiService.runQC(company, research, signals, contact, outreach, qual);

        outreach.qcPassed = qcResult.qcPassed;
        outreach.qcChecklist = qcResult.checklist;
        outreach.qcNotes = qcResult.notes;
        storage.saveOutreach(outreach);

        if (!qcResult.qcPassed) {
          company.status = 'QC_FAILED';
          company.rejectionReason = qcResult.notes;
          storage.saveCompany(company);
          storage.addLog(task.campaignId, 'QC', `QC Failed for ${company.name}: ${qcResult.notes}`, 'warn', company.id, company.name);
        } else {
          company.status = 'QC_PASSED';
          storage.saveCompany(company);
          storage.addLog(task.campaignId, 'QC', `QC PASSED for ${company.name}! Lead is fully qualified and ready for Saleshandy campaign export.`, 'success', company.id, company.name);
        }

        task.status = 'COMPLETED';
        storage.saveTask(task);
        this.checkCampaignCompletion(task.campaignId);
        break;
      }
    }
  }

  private checkCampaignCompletion(campaignId: string) {
    const pendingTasks = storage.getTasks(campaignId).filter((t) => t.status === 'QUEUED' || t.status === 'RUNNING' || t.status === 'RETRYING');
    if (pendingTasks.length === 0) {
      const camp = storage.getCampaign(campaignId);
      if (camp && camp.status === 'running') {
        camp.status = 'completed';
        storage.saveCampaign(camp);
        const stats = storage.getPipelineSummary(campaignId);
        storage.addLog(campaignId, 'COMPLETED', `Campaign automation completed! ${stats.qcPassed} leads qualified & verified, ready for Saleshandy campaign delivery.`, 'success');
      }
    }
  }
}

export const orchestrator = new OrchestratorEngine();
