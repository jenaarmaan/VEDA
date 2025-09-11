// Monitors case lifecycle, escalations, and generates reports for oversight
import { CaseManager } from './caseManagementAgent';

export function generateOversightReport(caseManager: CaseManager) {
  const allCases = caseManager.getCases();
  const summary = allCases.map(c => ({
    id: c.id,
    status: c.status,
    lastUpdate: c.updates[c.updates.length - 1] || ""
  }));
  return summary;
}
