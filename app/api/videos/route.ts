import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.VIMEO_ACCESS_TOKEN;
  const userId = process.env.VIMEO_USER_ID;

  if (!token || !userId) {
    return NextResponse.json({ videos: [], configured: false, message: 'Vimeo is not configured yet.' });
  }

  const response = await fetch(`https://api.vimeo.com/users/${userId}/videos?per_page=50&sort=date&direction=desc`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.vimeo.*+json;version=3.4' },
    next: { revalidate: 300 },
  });

  if (!response.ok) return NextResponse.json({ error: 'Unable to load Vimeo videos.' }, { status: response.status });
  const data = await response.json();
  return NextResponse.json({ configured: true, videos: data.data ?? [] });
}
