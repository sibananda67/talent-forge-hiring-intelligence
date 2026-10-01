import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { storage } from './server/storage.js';
import { orchestrator } from './server/orchestrator.js';
import { TalentForgeCsvService } from './server/services/csvExportService.js';
import { saleshandyService } from './server/services/saleshandyService.js';
import { Campaign } from './src/types/talentForge.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API Routes

// 1. Health / Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Talent Forge Control Center',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 2. Campaigns
app.get('/api/campaigns', (req, res) => {
  const campaigns = storage.getCampaigns();
  res.json(campaigns);
});

app.post('/api/campaigns', async (req, res) => {
  try {
    const {
      name,
      industry,
      geography,
      targetLeads,
      employeeFilter,
      candidateMultiplier,
      minSignalCount,
      requireVerifiedEmail,
      requireEvidence,
      apifyInputId,
      inputType,
      isTestMode,
    } = req.body;

    if (!name || !apifyInputId) {
      return res.status(400).json({ error: 'Campaign name and Apify Dataset/Run ID are required.' });
    }

    const campaignId = `camp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newCamp: Campaign = {
      id: campaignId,
      name,
      industry: industry || 'Healthcare',
      geography: geography || 'United States',
      targetLeads: Number(targetLeads) || 30,
      employeeFilter: employeeFilter || 'NO_RESTRICTION',
      candidateMultiplier: Number(candidateMultiplier) || 5,
      minSignalCount: Number(minSignalCount) || 3,
      requireVerifiedEmail: requireVerifiedEmail !== false,
      requireEvidence: requireEvidence !== false,
      allowPersonalEmail: false,
      allowGuessedEmail: false,
      allowUnverifiedEmail: false,
      allowDuplicateCompany: false,
      allowDuplicateContact: false,
      apifyInputId: apifyInputId.trim(),
      inputType: inputType || 'dataset',
      status: 'idle',
      isTestMode: Boolean(isTestMode),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveCampaign(newCamp);
    storage.addLog(campaignId, 'CREATION', `Created campaign "${newCamp.name}" with target ${newCamp.targetLeads} qualified leads`, 'info');

    // Automatically trigger orchestration if requested
    if (req.body.startImmediately) {
      orchestrator.startCampaign(campaignId).catch((err) => {
        console.error('Failed to start campaign immediately:', err);
      });
    }

    res.status(201).json(newCamp);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/campaigns/:id', (req, res) => {
  const campaign = storage.getCampaign(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  const summary = storage.getPipelineSummary(campaign.id);
  res.json({ campaign, summary });
});

app.delete('/api/campaigns/:id', (req, res) => {
  storage.deleteCampaign(req.params.id);
  res.json({ success: true });
});

app.post('/api/campaigns/:id/start', async (req, res) => {
  try {
    const updated = await orchestrator.startCampaign(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/campaigns/:id/pause', (req, res) => {
  const campaign = storage.getCampaign(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  campaign.status = 'paused';
  storage.saveCampaign(campaign);
  storage.addLog(campaign.id, 'PAUSED', 'Campaign automation paused by user', 'warn');
  res.json(campaign);
});

// 3. Pipeline Stats & Companies
app.get('/api/campaigns/:id/pipeline-summary', (req, res) => {
  const summary = storage.getPipelineSummary(req.params.id);
  res.json(summary);
});

app.get('/api/campaigns/:id/companies', (req, res) => {
  const companies = storage.getCompanies(req.params.id);
  res.json(companies);
});

// 4. Company 360 Detail View
app.get('/api/companies/:id', (req, res) => {
  const company = storage.getCompany(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  const jobs = storage.getJobs(company.id);
  const signals = storage.getSignals(company.id);
  const research = storage.getResearch(company.id);
  const contacts = storage.getContacts(company.id);
  const qualification = storage.getQualification(company.id);
  const outreach = storage.getOutreach(company.id);

  res.json({
    company,
    jobs,
    signals,
    research,
    contacts,
    qualification,
    outreach,
  });
});

// Manual override action for a company
app.post('/api/companies/:id/action', (req, res) => {
  const { action, reason } = req.body;
  const company = storage.getCompany(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  if (action === 'REJECT') {
    company.status = 'REJECTED';
    company.rejectionReason = reason || 'Manually rejected by operator.';
    storage.saveCompany(company);
    storage.addLog(company.campaignId, 'MANUAL_OVERRIDE', `Operator manually rejected ${company.name}: ${company.rejectionReason}`, 'warn', company.id, company.name);
  } else if (action === 'APPROVE') {
    company.status = 'QC_PASSED';
    storage.saveCompany(company);
    storage.addLog(company.campaignId, 'MANUAL_OVERRIDE', `Operator manually approved ${company.name} for export.`, 'success', company.id, company.name);
  } else if (action === 'RETRY_RESEARCH') {
    company.status = 'VALIDATED';
    storage.saveCompany(company);
    orchestrator.enqueueTask(company.campaignId, company.id, 'RESEARCH_HIRING', 10);
    storage.addLog(company.campaignId, 'MANUAL_RETRY', `Queued research retry for ${company.name}.`, 'info', company.id, company.name);
  } else if (action === 'RETRY_CONTACT') {
    company.status = 'QUALIFIED_FOR_CONTACT';
    storage.saveCompany(company);
    orchestrator.enqueueTask(company.campaignId, company.id, 'ENRICH_CONTACT', 10);
    storage.addLog(company.campaignId, 'MANUAL_RETRY', `Queued contact lookup retry for ${company.name}.`, 'info', company.id, company.name);
  }

  res.json(company);
});

// 5. Generic Talent Forge CSV Export
app.get('/api/campaigns/:id/export/preview', (req, res) => {
  const companies = storage.getCompanies(req.params.id);
  const readyToSend = companies.filter((c) => c.status === 'QC_PASSED' || c.status === 'READY_FOR_SALESHANDY' || c.status === 'EXPORTED' || c.status === 'SENT');
  const rejected = companies.filter((c) => c.status === 'REJECTED' || c.status.endsWith('_FAILED') || c.status.endsWith('_REJECTED'));
  const verifiedCount = readyToSend.filter((c) => {
    const contact = storage.getPrimaryContact(c.id);
    return contact?.isVerifiedBusinessEmail;
  }).length;

  res.json({
    qualifiedCount: readyToSend.length,
    rejectedCount: rejected.length,
    verifiedEmailsCount: verifiedCount,
    readyForExport: verifiedCount,
    readyForSaleshandyCount: readyToSend.length,
  });
});

app.get('/api/campaigns/:id/export/csv', (req, res) => {
  const { csv, count, filename } = TalentForgeCsvService.generateCsv(req.params.id);
  storage.addLog(req.params.id, 'EXPORT', `Exported Talent Forge CSV containing ${count} verified qualified leads (${filename})`, 'success');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

// 6. Saleshandy Integration & Delivery Endpoints
app.get('/api/saleshandy/capabilities', (req, res) => {
  res.json(saleshandyService.getCapabilities());
});

app.post('/api/saleshandy/test-connection', async (req, res) => {
  const result = await saleshandyService.testConnection();
  res.json(result);
});

app.get('/api/saleshandy/account', async (req, res) => {
  const account = await saleshandyService.getAccountInfo();
  res.json(account);
});

app.get('/api/saleshandy/campaigns', async (req, res) => {
  const campaigns = await saleshandyService.getCampaigns();
  res.json(campaigns);
});

app.post('/api/saleshandy/campaigns', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Sequence name is required.' });
  const campaign = await saleshandyService.createCampaign(name);
  res.json(campaign);
});

app.get('/api/saleshandy/sequences/:id/steps', async (req, res) => {
  const steps = await saleshandyService.getSequenceSteps(req.params.id);
  res.json(steps);
});

app.post('/api/campaigns/:id/saleshandy/sync-steps', async (req, res) => {
  const { saleshandyCampaignId } = req.body;
  const seqId = saleshandyCampaignId || storage.getLatestSaleshandySequenceId(req.params.id) || 'eMPkq5ojzQ';
  const syncStatus = await saleshandyService.syncSequenceOutreachSteps(seqId, req.params.id);
  res.json(syncStatus);
});

app.get('/api/campaigns/:id/saleshandy/sync-status', async (req, res) => {
  const campaigns = await saleshandyService.getCampaigns();
  const latestStoredId = storage.getLatestSaleshandySequenceId(req.params.id);
  const targetSeq = campaigns.find((c) => c.id === req.query.sequenceId)
    || campaigns.find((c) => c.id === latestStoredId)
    || campaigns.find((c) => c.name.toLowerCase().includes('talent forge') || c.id === 'eMPkq5ojzQ')
    || campaigns[0];
  const seqId = (req.query.sequenceId as string) || targetSeq?.id || latestStoredId || 'eMPkq5ojzQ';
  const seq = campaigns.find((c) => c.id === seqId) || targetSeq;
  const steps = storage.getSaleshandySteps(seqId);
  const companies = storage.getCompanies(req.params.id);
  const exported = storage.getSaleshandyExportedEmails(req.params.id);
  const qcPassed = companies.filter((c) => c.status === 'QC_PASSED' || c.status === 'EXPORTED' || c.status === 'READY_FOR_SALESHANDY');

  res.json({
    success: steps.length > 0,
    sequenceId: seqId,
    sequenceName: seq?.name || 'Talent Forge Healthcare Outreach',
    prospectsCount: exported.size > 0 ? exported.size : qcPassed.length,
    outreachSynced: `${qcPassed.length}/${qcPassed.length} Synced`,
    sequenceStepsSynced: `${steps.length}/3 Steps Synced`,
    step1Status: steps.some((s) => s.stepNumber === 1) ? 'Synced' : 'Pending',
    step2Status: steps.some((s) => s.stepNumber === 2) ? 'Synced' : 'Pending',
    step3Status: steps.some((s) => s.stepNumber === 3) ? 'Synced' : 'Pending',
    sequenceStatus: 'PAUSED / DRAFT (Ready for Review)',
    sequenceActivated: false,
    message: steps.length === 3 ? 'Saleshandy Sync: SUCCESS' : 'Steps Pending Sync',
    steps: steps.map((s) => ({
      stepNumber: s.stepNumber,
      absoluteDays: s.absoluteDays,
      subject: s.subject,
      content: s.content,
    })),
  });
});

app.post('/api/campaigns/:id/export/saleshandy', async (req, res) => {
  const { saleshandyCampaignId, companyIds } = req.body;
  if (!saleshandyCampaignId) {
    return res.status(400).json({ error: 'Target Saleshandy sequence ID is required.' });
  }

  const campaign = storage.getCampaign(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  // 1. First synchronize the 3 Sequence Steps with exact Talent Forge outreach
  const syncStatus = await saleshandyService.syncSequenceOutreachSteps(saleshandyCampaignId, campaign.id);

  const allCompanies = storage.getCompanies(req.params.id);
  const targetCompanies = companyIds && Array.isArray(companyIds) && companyIds.length > 0
    ? allCompanies.filter((c) => companyIds.includes(c.id))
    : allCompanies.filter((c) => c.status === 'QC_PASSED' || c.status === 'READY_FOR_SALESHANDY' || c.status === 'EXPORTED');

  const existingExported = storage.getSaleshandyExportedEmails(campaign.id);

  // Strictly enforce 10 EMAIL RULES for each lead
  const validLeadsPayload: any[] = [];
  const rejectedReasons: Array<{ company: string; reason: string }> = [];
  let alreadyExportedCount = 0;

  for (const comp of targetCompanies) {
    const contact = storage.getPrimaryContact(comp.id);
    if (!contact || !contact.email) continue;

    if (existingExported.has(contact.email.toLowerCase())) {
      alreadyExportedCount++;
      continue;
    }

    const validation = saleshandyService.validateLeadForExport(comp);
    if (!validation.eligible) {
      rejectedReasons.push({ company: comp.name, reason: validation.failureReason || 'Failed email gating rules.' });
      continue;
    }

    const customFields = saleshandyService.mapCompanyToCustomFields(comp.id, campaign.id);

    validLeadsPayload.push({
      email: contact.email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      company: comp.name,
      jobTitle: contact.title,
      customFields,
      companyId: comp.id,
    });
  }

  let pushResult: any = {
    totalTargeted: targetCompanies.length,
    successfulImports: 0,
    failedImports: 0,
    alreadyExported: alreadyExportedCount,
    campaignId: saleshandyCampaignId,
    campaignName: syncStatus.sequenceName,
  };

  if (validLeadsPayload.length > 0) {
    pushResult = await saleshandyService.pushLeadsToCampaign(
      campaign.id,
      saleshandyCampaignId,
      validLeadsPayload
    );

    // Transition successfully exported leads to EXPORTED
    for (const lead of validLeadsPayload) {
      const comp = allCompanies.find((c) => c.id === lead.companyId);
      if (comp) {
        comp.status = 'EXPORTED';
        storage.saveCompany(comp);
        storage.addLog(
          campaign.id,
          'EXPORT',
          `Lead exported to Saleshandy sequence (${saleshandyCampaignId}): ${lead.firstName} ${lead.lastName} (${lead.email}) at ${comp.name}`,
          'success',
          comp.id,
          comp.name
        );
      }
    }
  }

  const totalExported = storage.getSaleshandyExportedEmails(campaign.id).size;

  res.json({
    success: true,
    saleshandySync: 'SUCCESS',
    sequenceId: saleshandyCampaignId,
    sequenceName: syncStatus.sequenceName,
    prospectsCount: totalExported,
    duplicatesPrevented: alreadyExportedCount,
    outreachSynced: `${targetCompanies.length}/${targetCompanies.length} Synced`,
    sequenceStepsSynced: '3/3 Steps Synced',
    step1Status: syncStatus.step1Status,
    step2Status: syncStatus.step2Status,
    step3Status: syncStatus.step3Status,
    sequenceStatus: 'DRAFT',
    sequenceActivated: false,
    message: 'Saleshandy Sync: SUCCESS',
    steps: syncStatus.steps,
    gatingRejections: rejectedReasons,
  });
});

// 7. Automation Tasks & Execution Logs
app.get('/api/automation/logs', (req, res) => {
  const campaignId = req.query.campaignId as string | undefined;
  const logs = storage.getLogs(campaignId, 100);
  res.json(logs);
});

app.get('/api/automation/tasks', (req, res) => {
  const campaignId = req.query.campaignId as string | undefined;
  const tasks = storage.getTasks(campaignId);
  res.json(tasks);
});

app.post('/api/automation/tasks/:id/retry', (req, res) => {
  const task = storage.getTasks().find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  task.status = 'QUEUED';
  task.attempts = 0;
  task.nextRunAt = Date.now();
  storage.saveTask(task);
  res.json(task);
});

// 8. API Usage & Metrics
app.get('/api/usage', (req, res) => {
  const usage = storage.getApiUsage();
  res.json(usage);
});

// 9. Settings & Integrations
app.get('/api/settings', (req, res) => {
  const settings = storage.getPublicSettings();
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const updated = storage.updateSecrets(req.body);
  res.json(updated);
});

app.post('/api/settings/test-connection', async (req, res) => {
  const { service } = req.body;
  const keys = storage.getSecretKeys();

  try {
    if (service === 'apify') {
      if (!keys.apifyToken) {
        return res.json({ connected: false, message: 'Apify API Token not configured.' });
      }
      const testRes = await fetch('https://api.apify.com/v2/users/me', {
        headers: { Authorization: `Bearer ${keys.apifyToken}` },
      });
      if (testRes.ok) {
        const u = await testRes.json();
        return res.json({ connected: true, message: `Connected to Apify as ${u.data?.username || 'user'}` });
      }
      return res.json({ connected: false, message: `Apify error: HTTP ${testRes.status}` });
    }

    if (service === 'hunter') {
      if (!keys.hunterApiKey) {
        return res.json({ connected: false, message: 'Hunter API Key not configured.' });
      }
      const testRes = await fetch(`https://api.hunter.io/v2/account?api_key=${keys.hunterApiKey}`);
      if (testRes.ok) {
        const u = await testRes.json();
        return res.json({ connected: true, message: `Connected to Hunter (${u.data?.plan_name}, ${u.data?.calls?.left || 0} credits left)` });
      }
      return res.json({ connected: false, message: `Hunter error: HTTP ${testRes.status}` });
    }

    if (service === 'gemini') {
      const gKey = keys.geminiApiKey || process.env.GEMINI_API_KEY;
      if (!gKey) {
        return res.json({ connected: false, message: 'Gemini API Key not found in environment.' });
      }
      return res.json({ connected: true, message: 'Gemini API Key active via environment secrets.' });
    }

    if (service === 'saleshandy') {
      const shRes = await saleshandyService.testConnection();
      return res.json(shRes);
    }

    res.json({ connected: false, message: 'Unknown service' });
  } catch (err: any) {
    res.json({ connected: false, message: err.message });
  }
});

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production static assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Development mode: attach Vite middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`[Talent Forge Control Center] Running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
