
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
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { analyzeContent, type AnalyzeContentInput, type AnalyzeContentOutput } from '@/ai/flows/analyzeContentFlow';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import Spinner from '@/components/shared/Spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Info, Lightbulb, XCircle } from 'lucide-react';

const formSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL." }),
  notes: z.string().optional(),
});

export default function NewReportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeContentOutput | null>(null);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  const prefilledContent = searchParams.get('contentData');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: prefilledContent || '',
      notes: '',
    },
  });

  useEffect(() => {
    if (prefilledContent) {
      form.setValue('url', prefilledContent);
    }
  }, [prefilledContent, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to submit a report.',
      });
      router.push(`/login?redirect=/report/new&contentData=${encodeURIComponent(values.url)}`);
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    setSubmittedReportId(null);

    try {
      const input: AnalyzeContentInput = {
        url: values.url,
      };

      const result = await analyzeContent(input);
      setAnalysisResult(result);

      const reportId = uuidv4();
      const reportRef = doc(db, 'reports', reportId);

      await setDoc(reportRef, {
        reportId: reportId,
        submittedBy: user.uid,
        contentType: 'link',
        contentData: values.url,
        location: user.details.state,
        notes: values.notes || '',
        aiVerdict: result.status,
        aiConfidenceScore: result.confidence,
        sources: [], // This can be deprecated or extracted from explanation if needed
        justification: result.explanation,
        status: 'Queued',
        createdAt: Date.now(),
      });
      
      setSubmittedReportId(reportId);

      toast({
        title: 'Report Submitted Successfully',
        description: `Your report (ID: ${reportId.substring(0,8)}) has been registered.`,
      });

      // Placeholder for email notification using the drafted email
      console.log("--- EMAIL NOTIFICATION TO BE SENT ---");
      console.log(`To: agency-head@${user.details.state}.gov`);
      console.log(`CC: govt-admin@gov.in, official@veda.in`);
      console.log(`Subject: ${result.draftEmail.subject}`);
      console.log(`Body: ${result.draftEmail.body}`);
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
      case 'Verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'False':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'Questionable':
        return <Info className="h-5 w-5 text-orange-500" />;
      case 'Unverified':
        return <Info className="h-5 w-5 text-yellow-500" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };


  return (
    <div className="container py-12">
      <Card className="max-w-3xl mx-auto bg-card/50">
        <CardHeader>
          <CardTitle>Submit Content for Verification</CardTitle>
          <CardDescription>
            Submit a URL for AI-powered authenticity analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!analysisResult ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/news-article"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Paste the full URL of the content you want to verify.
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
                  {getVerdictIcon(analysisResult.status)}
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
                       analysisResult.status === 'False' ? 'text-red-600' : 
                       analysisResult.status === 'Verified' ? 'text-green-600' :
                       analysisResult.status === 'Questionable' ? 'text-orange-500' :
                       'text-yellow-600'
                     }`}>
                      {analysisResult.status}
                     </span>
                  </div>
                   <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                    <span className="font-semibold">Confidence Score:</span>
                    <span className="font-bold text-lg">{analysisResult.confidence}%</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Explanation:</h3>
                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">{analysisResult.explanation}</p>
                  </div>
                  <div>
                     <h3 className="font-semibold mb-2">Draft Email to Authorities:</h3>
                     <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md space-y-2">
                        <p><strong>Subject:</strong> {analysisResult.draftEmail.subject}</p>
                        <p className="whitespace-pre-wrap"><strong>Body:</strong> {analysisResult.draftEmail.body}</p>
                     </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button onClick={() => {
                  setAnalysisResult(null);
                  setSubmittedReportId(null);
                  form.reset({ url: '', notes: '' });
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
