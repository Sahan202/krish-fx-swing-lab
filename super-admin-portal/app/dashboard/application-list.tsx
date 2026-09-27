'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import ApplicationActions from './application-actions';

type Application = {
  id: string;
  full_name: string;
  email: string;
  whatsapp_number: string | null;
  badge: number;
  status: string;
  created_at: string;
};

export default function ApplicationList({ items }: { items: Application[] }) {
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();
  const filtered = items.filter((item) =>
    [item.full_name, item.email, item.whatsapp_number].some((value) =>
      (value ?? '').toLowerCase().includes(term)
    )
  );

  return <>
    <div className="border-b border-slate-800 px-5 py-4">
      <div className="relative w-full sm:max-w-md">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input type="search" aria-label="Search students by name, email or WhatsApp number" placeholder="Search name, email or WhatsApp"
          value={query} onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-cyan-400" />
      </div>
      {term && <p role="status" className="mt-2 text-xs text-slate-400">{filtered.length} results</p>}
    </div>
    <div className="divide-y divide-slate-800/90">{filtered.map((application) => <div key={application.id} className="grid gap-4 px-5 py-5 transition hover:bg-white/[.025] lg:grid-cols-[1.1fr_1.4fr_.6fr_auto] lg:items-center"><div><p className="font-bold text-white">{application.full_name}</p><p className="mt-1 text-xs text-slate-500">{application.whatsapp_number || 'No WhatsApp number'}</p></div><div><p className="text-sm font-medium text-slate-200">{application.email}</p><p className="mt-1 text-xs text-slate-500">Batch {application.badge} · {new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(application.created_at))}</p></div><div><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${application.status === 'approved' ? 'bg-emerald-400/10 text-emerald-300' : application.status === 'rejected' ? 'bg-rose-400/10 text-rose-300' : 'bg-amber-400/10 text-amber-300'}`}>{application.status}</span></div><ApplicationActions id={application.id} status={application.status} /></div>)}{!filtered.length && <p className="p-8 text-center text-sm text-slate-500">{query.trim() ? 'No matching students found.' : 'No applications yet.'}</p>}</div>
  </>;
}

