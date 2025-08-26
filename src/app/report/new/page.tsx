'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { analyzeContent, type AnalyzeContentInput, type AnalyzeContentOutput } from '@/ai/flows/analyzeContentFlow';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import Spinner from '@/components/shared/Spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Info, Lightbulb, XCircle } from 'lucide-react';

const formSchema = z.object({
  contentType: z.enum(['text', 'link', 'image', 'video', 'document']),
  contentData: z.string().min(1, 'Content data cannot be empty.'),
  notes: z.string().optional(),
});

export default function NewReportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeContentOutput | null>(null);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contentType: 'text',
      contentData: '',
      notes: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to submit a report.',
      });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    setSubmittedReportId(null);

    try {
      const input: AnalyzeContentInput = {
        contentType: values.contentType,
        contentData: values.contentData,
      };

      const result = await analyzeContent(input);
      setAnalysisResult(result);

      const reportId = uuidv4();
      const reportRef = doc(db, 'reports', reportId);

      await setDoc(reportRef, {
        reportId: reportId,
        submittedBy: user.uid,
        contentType: values.contentType,
        contentData: values.contentData,
        location: user.location, // Save user's location/agency
        notes: values.notes || '',
        aiVerdict: result.verdict,
        aiConfidenceScore: result.confidenceScore,
        sources: result.sources,
        justification: result.justification,
        status: 'Submitted',
        createdAt: Date.now(),
      });
      
      setSubmittedReportId(reportId);

      toast({
        title: 'Report Submitted Successfully',
        description: `Your report (ID: ${reportId.substring(0,8)}) has been registered.`,
      });

      // Placeholder for email notification
      console.log("--- EMAIL NOTIFICATION TO BE SENT ---");
      console.log(`To: agency-head@${user.location}.gov`);
      console.log(`CC: govt-admin@gov.in, official@vedha.in`);
      console.log(`Subject: New Report Submitted - Case ID: ${reportId}`);
      console.log(`Body: AI Verdict: ${result.verdict}. Case ID: ${reportId}. Original Content: ${values.contentData}`);
      console.log("--------------------------------------");


    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'True':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Fake':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'Unverifiable':
        return <Info className="h-5 w-5 text-yellow-500" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };


  return (
    <div className="container py-12">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Submit Content for Verification</CardTitle>
          <CardDescription>
            Submit suspicious news or content for AI-powered authenticity analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!analysisResult ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="contentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the type of content" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="link">Link/URL</SelectItem>
                          <SelectItem value="image">Image (URL)</SelectItem>
                          <SelectItem value="video">Video (URL)</SelectItem>
                          <SelectItem value="document">Document (Text content)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contentData"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content / URL</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste the content, URL, or text from the document here..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        For images or videos, please provide a direct URL.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Optional Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Add any extra context or notes here..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <><Spinner /> Analyzing...</> : 'Analyze and Submit Report'}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-6">
              <Alert>
                <AlertTitle className="flex items-center gap-2">
                  {getVerdictIcon(analysisResult.verdict)}
                  Analysis Complete
                </AlertTitle>
                <AlertDescription>
                  Your report has been submitted with Case ID: <strong>{submittedReportId?.substring(0, 8)}</strong>
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                    <CardTitle className="text-xl">AI Verification Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                    <span className="font-semibold">Verdict:</span>
                     <span className={`font-bold text-lg ${
                       analysisResult.verdict === 'Fake' ? 'text-red-600' : 
                       analysisResult.verdict === 'True' ? 'text-green-600' :
                       'text-yellow-600'
                     }`}>
                      {analysisResult.verdict}
                     </span>
                  </div>
                   <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                    <span className="font-semibold">Confidence Score:</span>
                    <span className="font-bold text-lg">{analysisResult.confidenceScore}%</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Justification:</h3>
                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">{analysisResult.justification}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Sources:</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      {analysisResult.sources.map((source, index) => (
                        <li key={index}><a href={source} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{source}</a></li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button onClick={() => {
                  setAnalysisResult(null);
                  setSubmittedReportId(null);
                  form.reset();
                }} className="w-full">
                  Submit Another Report
                </Button>
                 <Button onClick={() => router.push('/dashboard/user')} variant="outline" className="w-full">
                  Back to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
