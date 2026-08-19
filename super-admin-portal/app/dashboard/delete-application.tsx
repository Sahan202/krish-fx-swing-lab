'use client';
import { useState } from 'react';
export default function DeleteApplication({ id }: { id: string }) { const [busy, setBusy] = useState(false); async function remove() { if (!window.confirm('Delete this application record?')) return; setBusy(true); await fetch(`/api/applications/delete?id=${id}`, { method: 'DELETE' }); window.location.reload(); } return <button disabled={busy} onClick={() => void remove()} className="rounded-lg bg-red-500/15 px-3 py-2 text-xs font-bold text-red-300">{busy ? 'Deleting…' : 'Delete'}</button>; }
