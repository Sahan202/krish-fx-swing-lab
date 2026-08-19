import Link from 'next/link';

const results = [
  ['Structured learning', 'Students follow a clear day-by-day trading process.'],
  ['Better discipline', 'Build a repeatable plan around risk and execution.'],
  ['Trackable progress', 'Every completed lesson is saved to your student record.'],
];

export default function StudentResultsPage() {
  return <main className="min-h-screen bg-[#07111f] px-6 py-16 text-white lg:px-8"><div className="mx-auto max-w-6xl"><Link href="/" className="text-sm text-amber-400">← Krish FX Swing Lab</Link><p className="mt-20 text-sm font-semibold uppercase tracking-[.2em] text-amber-400">Student results</p><h1 className="mt-4 max-w-3xl text-5xl font-bold">Progress you can see. Skills you can use.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Our students build stronger market understanding through a structured learning path, practical lessons, and consistent review.</p><div className="mt-12 grid gap-5 md:grid-cols-3">{results.map(([title, text]) => <article key={title} className="rounded-3xl border border-white/10 bg-white/[.05] p-7"><p className="text-3xl font-bold text-amber-400">✓</p><h2 className="mt-6 text-xl font-semibold">{title}</h2><p className="mt-3 leading-7 text-slate-400">{text}</p></article>)}</div><Link href="/signup" className="mt-10 inline-flex rounded-xl bg-amber-400 px-6 py-3 font-semibold text-[#07111f]">Start your journey</Link></div></main>;
}
