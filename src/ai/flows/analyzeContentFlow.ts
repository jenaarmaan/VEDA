'use server';
/**
 * @fileOverview An AI flow to analyze and verify the authenticity of submitted content.
 *
 * - analyzeContent - A function that handles the content analysis process.
 * - AnalyzeContentInput - The input type for the analyzeContent function.
 * - AnalyzeContentOutput - The return type for the analyzeContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';


const AnalyzeContentInputSchema = z.object({
  contentType: z.enum(['text', 'link', 'image', 'video', 'document']),
  contentData: z.string().describe('The content to be analyzed. This could be plain text, a URL, or text extracted from a document.'),
});
export type AnalyzeContentInput = z.infer<typeof AnalyzeContentInputSchema>;

const AnalyzeContentOutputSchema = z.object({
  verdict: z.enum(['Fake', 'True', 'Unverifiable']).describe('The final verdict on the authenticity of the content.'),
  confidenceScore: z.number().min(0).max(100).describe('A percentage score representing the confidence in the verdict.'),
  justification: z.string().describe('A detailed explanation for the verdict, based on the analysis and sources found.'),
  sources: z.array(z.string().url()).describe('A list of URLs to reliable sources that support the verdict.'),
});
export type AnalyzeContentOutput = z.infer<typeof AnalyzeContentOutputSchema>;

const prompt = ai.definePrompt({
    name: 'analyzeContentPrompt',
    input: { schema: AnalyzeContentInputSchema },
    output: { schema: AnalyzeContentOutputSchema },
    prompt: `You are a highly advanced AI fact-checking expert for an organization named VEDA. Your task is to analyze the provided content and determine its authenticity.

You must provide a clear verdict, a confidence score, a detailed justification, and a list of credible sources.

Content Type: {{{contentType}}}
Content to Analyze:
{{{contentData}}}

Follow these steps for your analysis:
1.  **Analyze the Content**: Carefully examine the text, link, or description of the media provided. Identify the main claims being made.
2.  **Search for Evidence**: Search the web for credible sources (major news organizations, scientific journals, official government websites, fact-checking organizations) to verify or debunk the claims.
3.  **Formulate Verdict**: Based on your research, determine if the content is 'True', 'Fake', or 'Unverifiable'.
    *   'True': The main claims are accurate and supported by strong evidence from multiple reliable sources.
    *   'Fake': The main claims are demonstrably false, misleading, or fabricated, with evidence from reliable sources to prove it.
    *   'Unverifiable': There is not enough credible information available to make a confident determination. This could be due to lack of sources, conflicting reports from reliable sources, or the claim being an opinion.
4.  **Determine Confidence Score**: Assign a confidence score from 0 to 100 on how certain you are about your verdict.
5.  **Write Justification**: Provide a clear, unbiased, step-by-step explanation of your findings. Summarize the evidence you found and explain how it leads to your verdict.
6.  **List Sources**: Provide at least 2-3 direct URLs to the most credible sources you used for your analysis.

Produce the output in the required JSON format.
`,
});


const analyzeContentFlow = ai.defineFlow(
  {
    name: 'analyzeContentFlow',
    inputSchema: AnalyzeContentInputSchema,
    outputSchema: AnalyzeContentOutputSchema,
  },
  async (input) => {
    const response = await prompt(input);
    const output = response.output;
    if (!output) {
        throw new Error("AI analysis failed to produce a valid output.");
    }
    return output;
  }
);


export async function analyzeContent(input: AnalyzeContentInput): Promise<AnalyzeContentOutput> {
  return analyzeContentFlow(input);
}
