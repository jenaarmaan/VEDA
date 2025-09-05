import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight, User, Shield, Landmark, Building } from "lucide-react";
import Link from "next/link";

const roleDashboards = [
  {
    role: "Civic User",
    description: "Submit reports and verify information.",
    href: "/dashboard/user",
    icon: <User className="h-6 w-6 text-primary" />,
  },
  {
    role: "Sentinel",
    description: "Manage and investigate cases.",
    href: "/dashboard/sentinel",
    icon: <Shield className="h-6 w-6 text-primary" />,
  },
  {
    role: "Ground Sentinel",
    description: "Handle on-ground tasks and report findings.",
    href: "/dashboard/ground-sentinel",
    icon: <Building className="h-6 w-6 text-primary" />,
  },
  {
    role: "Council",
    description: "Oversee system-wide analytics and logs.",
    href: "/dashboard/council",
    icon: <Landmark className="h-6 w-6 text-primary" />,
  },
];


export default function AboutPage() {
  return (
    <div className="container py-12">
      <Card>
        <CardHeader>
          <CardTitle>About VEDA</CardTitle>
          <CardDescription>
            Welcome to the official documentation for the VEDA application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <section>
            <h2 className="text-xl font-semibold mb-2">Introduction</h2>
            <p>
             VEDA is a robust application designed to manage user authentication and role-based access control for reporting and verifying information. It provides a seamless experience for different user types by redirecting them to their respective dashboards upon login.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">User Roles</h2>
            <p>The application defines four distinct user roles:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Civic User:</strong> Standard user with basic access to create reports.</li>
              <li><strong>Sentinel:</strong> Investigator with privileges to manage cases.</li>
              <li><strong>Ground Sentinel:</strong> Field agent responsible for on-ground verification.</li>
              <li><strong>Council:</strong> Administrator with high-level privileges to oversee the system.</li>
            </ul>
          </section>
           <section>
            <h2 className="text-xl font-semibold mb-2">Authentication</h2>
            <p>
             Users can sign up and log in using their email and password. During signup, users provide necessary personal information which is securely stored.
            </p>
          </section>
        </CardContent>
      </Card>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-6 text-center">Development Dashboards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roleDashboards.map((item) => (
                <Link href={item.href} key={item.role} className="group">
                    <Card className="h-full hover:bg-accent/50 transition-colors">
                        <CardHeader>
                           <div className="flex items-center justify-between">
                             <CardTitle className="text-lg">{item.role}</CardTitle>
                             {item.icon}
                           </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <div className="flex items-center text-sm font-medium text-primary mt-4">
                                Go to Dashboard
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
      </section>

    </div>
  );
}
