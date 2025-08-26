'use client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GovtAdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="container py-12">
      <Card>
        <CardHeader>
          <CardTitle>Government Admin Dashboard</CardTitle>
          <CardDescription>System administration and oversight panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg">Hello, <span className="font-semibold">{user?.name}</span>!</p>
          <p className="text-muted-foreground">Your assigned role is: {user?.role}</p>
        </CardContent>
      </Card>
    </div>
  );
}
