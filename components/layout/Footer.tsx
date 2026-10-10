import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} EventHub. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
