
'use server';

import { orchestrationAgent } from '@/ai/orchestration';
import { doc, setDoc, serverTimestamp, updateDoc, arrayUnion, collection, addDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { VerificationReport, ChatMessage, AnalyzeContentOutput } from '@/lib/types';
import { analyzeContent } from './analyzeContentFlow';

function mapVerdict(verdict: string): VerificationReport['verdict'] {
    switch (verdict.toLowerCase()) {
        case 'verified_true':
        case 'true':
        case 'verified':
            return 'True';
        case 'verified_false':
        case 'false':
            return 'False';
        case 'misleading':
        case 'suspicious':
            return 'Suspicious';
        default:
            return 'Unverifiable';
    }
}


export async function verifyUrlAndRecord({ userId, url, chatId: existingChatId }: {
    userId: string;
    url: string;
    chatId?: string;
}): Promise<{ chatId: string, report: AnalyzeContentOutput | null }> {
    let newChatId = existingChatId;
    let chatDocRef;

    // Create a new chat document if no ID is provided
    if (!newChatId) {
        const historyCollectionRef = collection(db, 'users', userId, 'verificationHistory');
        const newDoc = await addDoc(historyCollectionRef, {
            title: url.length > 50 ? url.substring(0, 50) + '...' : url,
            query: url,
            timestamp: serverTimestamp(),
            messages: [],
        });
        newChatId = newDoc.id;
        chatDocRef = newDoc;
    } else {
        chatDocRef = doc(db, 'users', userId, 'verificationHistory', newChatId);
    }
    
    const userMessage: ChatMessage = {
        role: 'user',
        content: url,
    };
    
    await updateDoc(chatDocRef, {
        messages: arrayUnion(userMessage),
    });


    try {
        // Directly call the URL analysis flow which now returns random data
        const result = await analyzeContent({ url });
        
        const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: result,
        };

        await updateDoc(chatDocRef, {
            messages: arrayUnion(assistantMessage),
        });

        return { chatId: newChatId, report: result };

    } catch (error: any) {
        console.error('Error during URL verification and recording:', error);
        const errorMessage: ChatMessage = {
            role: 'assistant',
            content: { error: error.message || 'An unknown error occurred during analysis.' },
        };
        await updateDoc(chatDocRef, {
            messages: arrayUnion(errorMessage),
        });
        throw error;
    }
}


export async function verifyContentAndRecord({ userId, content, contentType, metadata, chatId: existingChatId }: {
    userId: string;
    content: string;
    contentType: 'unknown';
    metadata?: any;
    chatId?: string;
}): Promise<{ chatId: string, report: AnalyzeContentOutput | null }> {
    
    // Reroute this call to the URL verification flow to ensure dummy data is used.
    // This simplifies logic and ensures consistent behavior for all inputs.
    const result = await verifyUrlAndRecord({
        userId,
        url: content, // Treat content as a URL/query string
        chatId: existingChatId,
    });
    
    return result;
}
