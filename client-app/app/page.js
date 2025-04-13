// page.js (server component)
import Link from 'next/link';

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <Link href="/landing" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Get started
      </Link>
    </div>
  );
}