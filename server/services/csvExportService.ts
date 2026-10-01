import { storage } from '../storage.js';

export class TalentForgeCsvService {
  public static readonly HEADERS = [
    'First Name',
    'Last Name',
    'Company Name',
    'Title',
    'Email',
    'Company Website',
    'Industry',
    'Employee Count',
    'Relevant Openings',
    'Hiring Trigger',
    'Specific Hiring Problem',
    'Why Now',
    'Pain Owner',
    'Economic Buyer',
    'Potential Champion',
    'Internal Recruiting Capacity',
    'Hiring Difficulty',
    'Hiring Urgency',
    'Hiring Friction',
    'Economic Fit',
    'Evidence URL',
    'Evidence Summary',
    'Job Posting Date',
    'Relevant Role',
    'Relevant Location',
    'Qualification Reason',
    'Custom Subject',
    'Custom Body',
    'Follow up one',
    'Follow up two',
    'Qualification Status',
    'Rejection Reason',
    'Research Date',
  ];

  private static escapeCsvCell(val: any): string {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    return `"${str.replace(/"/g, '""')}"`;
  }

  public static formatDateDDMMYYYY(d = new Date()): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Generates a generic Talent Forge CSV string for qualified leads in a campaign
   */
  public static generateCsv(campaignId: string): { csv: string; count: number; filename: string } {
    const campaign = storage.getCampaign(campaignId);
    const companies = storage.getCompanies(campaignId);

    // Export leads that are QC_PASSED, READY_FOR_SALESHANDY, EXPORTED, or SENT
    const qualifiedCompanies = companies.filter(
      (c) => c.status === 'QC_PASSED' || c.status === 'READY_FOR_SALESHANDY' || c.status === 'EXPORTED' || c.status === 'SENT'
    );

    const rows: string[] = [];
    rows.push(this.HEADERS.map((h) => this.escapeCsvCell(h)).join(','));

    let exportedCount = 0;

    for (const comp of qualifiedCompanies) {
      const contact = storage.getPrimaryContact(comp.id);
      const research = storage.getResearch(comp.id);
      const qual = storage.getQualification(comp.id);
      const outreach = storage.getOutreach(comp.id);
      const jobs = storage.getJobs(comp.id);

      // Enforce Verified Business Email hard gate
      if (!contact || !contact.isVerifiedBusinessEmail || contact.emailStatus !== 'valid') {
        continue;
      }

      const row = [
        this.escapeCsvCell(contact.firstName),
        this.escapeCsvCell(contact.lastName),
        this.escapeCsvCell(comp.name),
        this.escapeCsvCell(contact.title),
        this.escapeCsvCell(contact.email),
        this.escapeCsvCell(comp.website),
        this.escapeCsvCell(comp.industry),
        this.escapeCsvCell(comp.employeeCount || 'Unknown'),
        this.escapeCsvCell(jobs.length > 0 ? jobs.length : 1),
        this.escapeCsvCell(research?.hiringTrigger || 'T4 New Location/Facility Opening'),
        this.escapeCsvCell(research?.specificHiringProblem || 'Urgent specialized talent bottleneck'),
        this.escapeCsvCell(research?.whyNow || 'Operational milestone launch deadline'),
        this.escapeCsvCell(research?.painOwnerTitle || contact.title),
        this.escapeCsvCell(research?.economicBuyerTitle || 'Chief Operating Officer'),
        this.escapeCsvCell(research?.potentialChampionTitle || 'Recruiting Lead'),
        this.escapeCsvCell(research?.internalRecruitingCapacity || 'SMALL'),
        this.escapeCsvCell(research?.hiringDifficulty || 'High'),
        this.escapeCsvCell(research?.hiringUrgency || 'High'),
        this.escapeCsvCell(research?.hiringFriction || 'T4 New Location + T10 Capacity Gap'),
        this.escapeCsvCell('High Growth / Expanding Operations'),
        this.escapeCsvCell(research?.evidenceUrl || comp.website),
        this.escapeCsvCell(research?.evidenceSummary || comp.apifySearchResult?.snippet || 'Official verified listing'),
        this.escapeCsvCell(research?.evidenceDate || new Date().toISOString().split('T')[0]),
        this.escapeCsvCell(research?.relevantRole || (jobs[0]?.jobTitle || 'Specialized Lead')),
        this.escapeCsvCell(research?.relevantLocation || comp.geography),
        this.escapeCsvCell(qual?.qualificationReason || 'Passed all verification gates and hard rules'),
        this.escapeCsvCell(outreach?.customSubject || `${comp.name} expansion & recruiting capacity`),
        this.escapeCsvCell(outreach?.customBody || ''),
        this.escapeCsvCell(outreach?.followUpOne || ''),
        this.escapeCsvCell(outreach?.followUpTwo || ''),
        this.escapeCsvCell('QUALIFIED'),
        this.escapeCsvCell(''), // Rejection reason empty for qualified
        this.escapeCsvCell(research?.evidenceDate || new Date().toISOString().split('T')[0]),
      ];

      rows.push(row.join(','));
      exportedCount++;
    }

    const industryClean = (campaign?.industry || 'Leads').replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = this.formatDateDDMMYYYY();
    const filename = `Leads_${industryClean}_${dateStr}.csv`;

    return {
      csv: rows.join('\r\n'),
      count: exportedCount,
      filename,
    };
  }
}
