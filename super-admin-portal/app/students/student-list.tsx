'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';
import StudentActions from './student-actions';

type Student = { id: string; full_name: string | null; phone: string | null; badge: number | null; approval_status: string | null };

export default function StudentList({ students }: { students: Student[] }) {
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();
  const filtered = students.filter((student) => [student.full_name, student.phone].some((value) => (value ?? '').toLowerCase().includes(term)));
  return <><div className="mt-6"><div className="relative w-full sm:max-w-md"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="search" aria-label="Search students by name or phone" placeholder="Search name or phone" value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-cyan-400" /></div>{term && <p role="status" className="mt-2 text-xs text-slate-400">{filtered.length} results</p>}</div><div className="mt-8 space-y-3">{filtered.map((student) => <div key={student.id} className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#081322] p-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-semibold text-white">{student.full_name ?? 'Student'}</p><p className="mt-1 text-sm text-slate-400">{student.phone ?? 'No WhatsApp'} · Batch {student.badge ?? '-'} · {student.approval_status}</p></div><StudentActions id={student.id} /></div>)}{!filtered.length && <p className="rounded-2xl border border-slate-800 bg-[#081322] p-8 text-center text-slate-500">{term ? 'No matching students found.' : 'No students yet.'}</p>}</div></>;
}

