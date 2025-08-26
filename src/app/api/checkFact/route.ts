import { NextRequest, NextResponse } from 'next/server';
import { analyzeContent, type AnalyzeContentInput, type AnalyzeContentOutput } from '@/ai/flows/analyzeContentFlow';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { doc, setDoc, getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

const db = getFirestore();

async function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const decodedToken = await verifyToken(req);
  if (!decodedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const uid = decodedToken.uid;

  try {
    const body = await req.json();
    const { contentType, contentData, escalate, notes } = body;

    if (!contentType || !contentData) {
      return NextResponse.json({ error: 'Missing contentType or contentData' }, { status: 400 });
    }

    const analysisInput: AnalyzeContentInput = { contentType, contentData };
    const analysisResult = await analyzeContent(analysisInput);

    if (escalate) {
      const reportId = uuidv4();
      const userRecord = await getAuth().getUser(uid);
      // We need user's location from the 'users' collection, but firebase-admin auth doesn't have custom claims by default.
      // For this to work, user location would need to be a custom claim or fetched separately.
      // We will assume location is part of custom claims or default to 'unknown'.
      const location = decodedToken.location || 'unknown_agency';

      const reportRef = doc(db, 'reports', reportId);

      await setDoc(reportRef, {
        reportId: reportId,
        submittedBy: uid,
        contentType: contentType,
        contentData: contentData,
        location: location,
        notes: notes || '',
        aiVerdict: analysisResult.verdict,
        aiConfidenceScore: analysisResult.confidenceScore,
        sources: analysisResult.sources,
        justification: analysisResult.justification,
        status: 'Submitted',
        createdAt: Date.now(),
      });
      
      return NextResponse.json({ ...analysisResult, caseId: reportId });
    }


    return NextResponse.json(analysisResult);

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}
