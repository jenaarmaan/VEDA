import Link from 'next/link';
import SignupForm from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="container flex h-[calc(100vh-56px)] items-center justify-center py-12">
       <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-auto">
        <SignupForm />
        <p className="px-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="underline underline-offset-4 hover:text-primary"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
