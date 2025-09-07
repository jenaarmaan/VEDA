
'use server';
/**
 * @fileOverview A Genkit flow to orchestrate content verification and record history.
 *
 * - verifyContentAndRecord - A function that calls the orchestration agent and saves the result.
 * - OrchestrationFlowInput - The input type for the verification function.
 * - OrchestrationFlowOutput - The return type for the verification function (UnifiedReport).
 */

import { ai } from '@/ai/genkit';
import { orchestrationAgent } from '@/ai/orchestration';
import { VerificationRequest, UnifiedReport } from '@/ai/orchestration/types';
import { z } from 'zod';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

// Define Zod schema for the input, mirroring VerificationRequest but simplified for the flow
const OrchestrationFlowInputSchema = z.object({
  userId: z.string().describe('The UID of the user making the request.'),
  content: z.string().describe('The content to be verified.'),
  contentType: z.enum([
    'news_article',
    'social_media_post',
    'video_content',
    'image_with_text',
    'academic_paper',
    'government_document',
    'educational_content',
    'multimedia_content',
    'unknown',
  ]),
  metadata: z.record(z.any()).optional().describe('Associated metadata for the content.'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
});

export type OrchestrationFlowInput = z.infer<typeof OrchestrationFlowInputSchema>;

// The output is the UnifiedReport, which doesn't need a separate Zod schema here
// as we'll be returning the object directly and can type it.
export type OrchestrationFlowOutput = UnifiedReport;

const summarizeTitlePrompt = ai.definePrompt({
    name: 'summarizeTitlePrompt',
    input: { schema: z.string() },
    output: { schema: z.string() },
    prompt: `Generate a very short, concise title (5-7 words max) for the following user query. The title should capture the main subject of the query.

Query:
"{{{input}}}"

Title:
`,
});


const orchestrationFlow = ai.defineFlow(
  {
    name: 'orchestrationFlow',
    inputSchema: OrchestrationFlowInputSchema,
    // We can't easily represent the complex UnifiedReport as a Zod schema without duplication,
    // so we'll use z.any() and rely on TypeScript for type safety.
    outputSchema: z.any(), 
  },
  async (input): Promise<OrchestrationFlowOutput> => {
    const { userId, content, contentType, metadata, priority } = input;

    // 1. Call the orchestration agent
    const result = await orchestrationAgent.verifyContent(content, contentType, metadata, priority);

    if (!result.success || !result.report) {
      throw new Error(result.error || "Verification failed to produce a report.");
    }

    // 2. Generate a title for the history
    const title = await summarizeTitlePrompt(content);
    
    // 3. Save the result to Firestore for the user's history
    const historyId = uuidv4();
    const historyRef = doc(db, 'users', userId, 'verificationHistory', historyId);

    // Add original content to metadata for the report
    result.report.metadata.content = content;

    await setDoc(historyRef, {
      id: historyId,
      title: title || 'Untitled Verification',
      query: content,
      report: JSON.parse(JSON.stringify(result.report)), // Store a serializable version of the report
      timestamp: serverTimestamp(),
    });

    return result.report;
  }
);

/**
 * Public-facing function to be called from the client.
 * This wraps the Genkit flow, providing a clean async interface.
 * @param input The verification request details.
 * @returns A promise that resolves to the UnifiedReport.
 */
export async function verifyContentAndRecord(input: OrchestrationFlowInput): Promise<OrchestrationFlowOutput> {
  return orchestrationFlow(input);
}
