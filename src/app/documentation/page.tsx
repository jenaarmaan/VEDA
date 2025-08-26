import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function DocumentationPage() {
  return (
    <div className="container py-12">
      <Card>
        <CardHeader>
          <CardTitle>VEDHA Documentation</CardTitle>
          <CardDescription>
            Welcome to the official documentation for the VEDHA application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <section>
            <h2 className="text-xl font-semibold mb-2">Introduction</h2>
            <p>
             VEDHA is a robust application designed to manage user authentication and role-based access control for reporting and verifying information. It provides a seamless experience for different user types by redirecting them to their respective dashboards upon login.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">User Roles</h2>
            <p>The application defines four distinct user roles:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>General User:</strong> Standard user with basic access to create reports.</li>
              <li><strong>Government Admin:</strong> Administrator with high-level privileges to oversee the system.</li>
              <li><strong>Agency Head:</strong> Manages an entire agency within the platform and assigns tasks.</li>
              <li><strong>Agency Employee:</strong> Staff member of an agency with permissions to investigate tasks.</li>
            </ul>
          </section>
           <section>
            <h2 className="text-xl font-semibold mb-2">Authentication</h2>
            <p>
             Users can sign up and log in using either their email and password or their Google account. During signup, users provide necessary personal information which is securely stored.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
