import { NextRequest, NextResponse } from 'next/server';
import { analyzeContent, type AnalyzeContentInput, type AnalyzeContentOutput } from '@/ai/flows/analyzeContentFlow';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { doc, setDoc, getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase Admin SDK
// if (!getApps().length) {
//   try {
//     // This requires a service account key to be set in environment variables
//     // For now, this is commented out to prevent server startup errors if the key is not present.
//     const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
//     initializeApp({
//       credential: cert(serviceAccount),
//     });
//   } catch (error) {
//     console.error('Firebase Admin Initialization Error:', error);
//   }
// }

// const db = getFirestore();

async function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    // This part will fail if Firebase Admin is not initialized.
    // const decodedToken = await getAuth().verifyIdToken(idToken);
    // return decodedToken;
    return { uid: 'mock-uid', location: 'mock-location' }; // Mocking for now
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

    // Temporarily disable Firestore write until Admin SDK is configured
    // if (escalate) {
    //   const reportId = uuidv4();
    //   const location = decodedToken.location || 'unknown_agency';

    //   const reportRef = doc(db, 'reports', reportId);

    //   await setDoc(reportRef, {
    //     reportId: reportId,
    //     submittedBy: uid,
    //     contentType: contentType,
    //     contentData: contentData,
    //     location: location,
    //     notes: notes || '',
    //     aiVerdict: analysisResult.verdict,
    //     aiConfidenceScore: analysisResult.confidenceScore,
    //     sources: analysisResult.sources,
    //     justification: analysisResult.justification,
    //     status: 'Queued',
    //     createdAt: Date.now(),
    //   });
      
    //   return NextResponse.json({ ...analysisResult, caseId: reportId });
    // }


    return NextResponse.json(analysisResult);

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}
