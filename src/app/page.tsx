import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      {/* Logo / Title */}
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
        Union Herald Press
      </h1>

      {/* Subheading */}
      <p className="text-neutral-400 text-center max-w-xl mb-10">
        The internet’s #1 parody news generator.
        Create fake articles with custom preview cards and prank your friends.
      </p>

      {/* Button */}
      <Link
        href="/create"
        className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-neutral-200 transition"
      >
        Create an Article
      </Link>

      {/* Footer */}
      <div className="mt-16 text-neutral-600 text-sm">
        © {new Date().getFullYear()} Union Herald Press — Just for fun.
      </div>
    </main>
  );
}
