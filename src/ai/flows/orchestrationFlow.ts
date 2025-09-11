// Orchestrates agent workflows according to VEDA process
import { handleUserInput } from './userInteractionAgent';
import { draftReportEmail } from './reportingAgent';
import { CaseManager } from './caseManagementAgent';
import { generateOversightReport } from './monitoringAgent';

const caseManager = new CaseManager();

export async function runVedaWorkflow(userInput: { type: string; data: string }, userName: string) {
  // Step 1: Handle user input (multi-modal)
  const inputResult = await handleUserInput(userInput);

  // Step 2: Fact verification
  if (inputResult.verification.verdict === "Fake") {
    // Report case
    const report = await draftReportEmail({
      user: userName,
      content: inputResult.normalizedText,
      verification: inputResult.verification.verdict,
      explanation: inputResult.verification.explanation
    });
    // Case management
    const caseEntry = caseManager.createCase(userName + Date.now());
    caseManager.updateCase(caseEntry.id, "pending", "Case reported");

    // Monitoring
    const oversight = generateOversightReport(caseManager);

    return {
      result: "Misinformation reported",
      report,
      caseEntry,
      oversight
    };
  }
  return { result: "Information verified as true", details: inputResult.verification };
}
