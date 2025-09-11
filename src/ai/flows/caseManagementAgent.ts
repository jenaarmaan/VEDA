// Manages investigation tasks, notifications, and dashboard data
type CaseStatus = "pending" | "in_progress" | "completed" | "escalated";

export class CaseManager {
  private cases: { id: string; status: CaseStatus; updates: string[] }[] = [];

  createCase(id: string) {
    const newCase = { id, status: "pending" as CaseStatus, updates: [] };
    this.cases.push(newCase);
    return newCase;
  }

  updateCase(id: string, status: CaseStatus, update: string) {
    const caseEntry = this.cases.find(c => c.id === id);
    if (caseEntry) {
      caseEntry.status = status;
      caseEntry.updates.push(update);
    }
    return caseEntry;
  }

  getCases() {
    return this.cases;
  }
}
