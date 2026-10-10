import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { UserMenu } from "./UserMenu";

export default async function Navbar() {
  const session = await auth();

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          EventHub
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/events" className="text-sm font-medium hover:text-primary transition-colors">
            Events
          </Link>
          
          <div className="flex items-center gap-2">
            {session?.user ? (
              <UserMenu user={session.user} />
            ) : (
              <>
                <Button variant="ghost" render={<Link href="/login" />} nativeButton={false}>
                  Log in
                </Button>
                <Button render={<Link href="/signup" />} nativeButton={false}>
                  Sign up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
