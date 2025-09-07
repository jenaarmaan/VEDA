
'use server';
/**
 * @fileOverview A Genkit flow to orchestrate content verification and record history.
 *
 * - verifyContentAndRecord - A function that calls the orchestration agent and saves the result.
 * - OrchestrationFlowInput - The input type for the verification function.
 * - OrchestrationFlowOutput - The return type for the verification function (UnifiedReport).
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, setDoc, serverTimestamp, getDoc, addDoc, collection, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  chatId: z.string().optional().describe('The ID of the existing chat session, if any.'),
});

export type OrchestrationFlowInput = z.infer<typeof OrchestrationFlowInputSchema>;

const VerificationResponseSchema = z.object({
  verdict: z.enum(['True', 'False', 'Suspicious', 'Unverifiable']).describe("The final verdict on the content's authenticity."),
  explanation: z.string().describe("A detailed explanation for the verdict."),
  sources: z.array(z.string().url()).describe("A list of URLs to reliable sources that support the verdict."),
});

export type OrchestrationFlowOutput = z.infer<typeof VerificationResponseSchema> & { chatId: string };

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

const placeholderVerificationPrompt = ai.definePrompt({
    name: 'placeholderVerificationPrompt',
    input: { schema: z.string() },
    output: { schema: VerificationResponseSchema },
    prompt: `You are an AI assistant named VEDA. The user has submitted the following content for verification:

"{{{input}}}"

Acknowledge the user's query. State that the full analysis agent is currently being integrated and will be available soon. For now, provide a placeholder response.

Produce the output in the required JSON format with a verdict of 'Unverifiable' and a placeholder explanation.
`,
});


const orchestrationFlow = ai.defineFlow(
  {
    name: 'orchestrationFlow',
    inputSchema: OrchestrationFlowInputSchema,
    outputSchema: z.any(),
  },
  async (input): Promise<OrchestrationFlowOutput> => {
    const { userId, content } = input;
    let { chatId } = input;

    // 1. If no chatId is provided, create a new chat history document first.
    if (!chatId) {
        const titleResult = await summarizeTitlePrompt(content);
        const title = titleResult || 'Untitled Verification';
        const historyCollectionRef = collection(db, 'users', userId, 'verificationHistory');
        const newDocRef = await addDoc(historyCollectionRef, {
            title: title,
            query: content,
            report: null, // Start with no report
            timestamp: serverTimestamp(),
            messages: [
                { role: 'user', content: content }
            ],
        });
        chatId = newDocRef.id;
    } else {
        // If it's an existing chat, just add the user message
        const historyRef = doc(db, 'users', userId, 'verificationHistory', chatId);
        await updateDoc(historyRef, {
            messages: arrayUnion({ role: 'user', content: content }),
        });
    }

    // 2. Call the placeholder verification AI
    const result = await placeholderVerificationPrompt(content);
    if (!result) {
        throw new Error("Verification failed to produce a report.");
    }
    
    // 3. Save the AI's response to the chat history
    const historyRef = doc(db, 'users', userId, 'verificationHistory', chatId);
    await updateDoc(historyRef, {
        report: JSON.parse(JSON.stringify(result)), // Save the latest report
        messages: arrayUnion({ role: 'assistant', content: JSON.parse(JSON.stringify(result)) }),
    });

    return { ...result, chatId };
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
