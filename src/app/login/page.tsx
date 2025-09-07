
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, Building, Landmark } from 'lucide-react';
import { VedhaIcon } from '@/components/icons/VedhaIcon';

const portalOptions = [
  {
    icon: <User className="h-6 w-6 text-primary" />,
    title: 'Civic User',
    description: 'Submit reports, verify information, and engage with the truth-seeking community.',
    href: '/login/form',
  },
  {
    icon: <Shield className="h-6 w-6 text-primary" />,
    title: 'Sentinel',
    description: 'Investigate and manage cases, analyze evidence, and collaborate on fact-finding missions.',
    href: '/login/form',
  },
  {
    icon: <Building className="h-6 w-6 text-primary" />,
    title: 'Ground Sentinel',
    description: 'Conduct on-field verifications, gather local intelligence, and report findings.',
    href: '/login/form',
  },
  {
    icon: <Landmark className="h-6 w-6 text-primary" />,
    title: 'Council',
    description: 'Oversee system-wide analytics, monitor logs, and manage platform integrity.',
    href: '/login/form',
  },
];

export default function LoginPage() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-56px)] py-12">
      <div className="text-center mb-8">
        <div className="inline-block">
          <VedhaIcon />
        </div>
        <h1 className="text-4xl font-bold mt-2">VEDA</h1>
        <p className="text-muted-foreground">AI-Powered Misinformation Detection</p>
      </div>

      <Card className="w-full max-w-4xl shadow-lg bg-card/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Select Your Portal</CardTitle>
          <CardDescription>Choose your designated login to access the VEDA dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {portalOptions.map((portal) => (
              <Link href={portal.href} key={portal.title} passHref>
                <div className="p-6 border rounded-lg hover:bg-accent hover:shadow-md transition-all duration-200 cursor-pointer flex items-start space-x-4">
                  <div className="flex-shrink-0">{portal.icon}</div>
                  <div>
                    <h3 className="font-semibold text-lg">{portal.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{portal.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} VEDA. All rights reserved.</p>
      </footer>
    </div>
  );
}
