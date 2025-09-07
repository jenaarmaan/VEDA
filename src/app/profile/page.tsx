
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/shared/Spinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { deleteUser, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State for editable fields
  const [fullName, setFullName] = useState(user?.details.fullName || '');
  const [phone, setPhone] = useState(user?.details.phone || '');

  if (loading) {
    return <div className="flex h-[calc(100vh-56px)] items-center justify-center"><Spinner /></div>;
  }

  if (!user) {
    return <div className="container py-12 text-center">Please log in to view your profile.</div>;
  }

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        'details.fullName': fullName,
        'details.phone': phone,
      });
      toast({
        title: 'Profile Updated',
        description: 'Your information has been successfully saved.',
      });
      setIsEditing(false);
      // Note: A full refresh or context update would be needed to see changes immediately.
      // For simplicity, we'll rely on the user to see the updated values on next load.
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not save your changes.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || firebaseUser.uid !== user.uid) {
        throw new Error("Authentication error. Please log in again.");
      }
      
      // Delete Firestore document first
      await deleteDoc(doc(db, 'users', user.uid));
      
      // Then delete the auth user
      await deleteUser(firebaseUser);
      
      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently removed.',
      });
      
      await signOut(auth);
      router.push('/');

    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: error.message || 'Could not delete your account. Please contact support.',
      });
       setIsDeleting(false);
    }
  };

  const profileDetails = [
    { label: 'Email Address', value: user.email, editable: false },
    { label: 'Role', value: user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), editable: false },
    { label: 'City/State', value: user.details.city || 'Not specified', editable: false },
    { label: 'Age Group', value: user.details.ageGroup || 'Not specified', editable: false },
  ];

  return (
    <div className="container py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">My Profile</CardTitle>
          <CardDescription>View and manage your account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={!isEditing} />
            </div>
             <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!isEditing} />
            </div>
            {profileDetails.map(detail => (
                 <div key={detail.label}>
                    <Label>{detail.label}</Label>
                    <Input value={detail.value} disabled />
                </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {isEditing ? (
              <>
                <Button onClick={handleSaveChanges} className="flex-1" disabled={isSaving}>
                  {isSaving ? <Spinner /> : null} Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">Cancel</Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="flex-1">Edit Profile</Button>
            )}
           
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex-1">Delete Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting}>
                    {isDeleting ? <Spinner /> : null} Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
