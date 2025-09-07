
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

Acknowledge the user's query. State that the full analysis agent is currently being integrated and will be available soon. For now, provide a placeholder response with a verdict of 'Unverifiable'.

Produce the output in the required JSON format.
`,
});


const orchestrationFlow = ai.defineFlow(
  {
    name: 'orchestrationFlow',
    inputSchema: OrchestrationFlowInputSchema,
    outputSchema: z.any(),
  },
  async (input): Promise<OrchestrationFlowOutput> => {
    const { userId, content, chatId: existingChatId } = input;
    let chatId = existingChatId;

    // 1. If no chatId, create a new chat session
    if (!chatId) {
        const historyCollectionRef = collection(db, 'users', userId, 'verificationHistory');
        const newDocRef = await addDoc(historyCollectionRef, {
            title: "New Query...", // Fast placeholder title
            query: content,
            report: null,
            timestamp: serverTimestamp(),
            messages: [{ role: 'user', content: content }],
        });
        chatId = newDocRef.id;
    } else {
        // If chat exists, just add the user message
        const historyRef = doc(db, 'users', userId, 'verificationHistory', chatId);
        await updateDoc(historyRef, {
            messages: arrayUnion({ role: 'user', content: content }),
        });
    }
    
    // 2. If it's the first real message, generate and update the title in the background.
    const historyRef = doc(db, 'users', userId, 'verificationHistory', chatId);
    const chatDoc = await getDoc(historyRef);
    const chatData = chatDoc.data();
    if (chatData?.messages.length === 1) { 
        // Don't wait for the title to be generated to make the UI feel faster
        summarizeTitlePrompt(content).then(titleResult => {
            const title = titleResult || 'Untitled Verification';
            updateDoc(historyRef, { title: title });
        }).catch(err => console.error("Error generating title:", err));
    }

    // 3. Call the placeholder verification AI
    const result = await placeholderVerificationPrompt(content);
    if (!result) {
        throw new Error("Verification failed to produce a report.");
    }
    
    // 4. Save the AI's response to the chat history
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
