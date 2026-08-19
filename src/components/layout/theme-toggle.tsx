'use client';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
export default function ThemeToggle() { const [dark, setDark] = useState(false); useEffect(() => { const saved = localStorage.getItem('krish-theme') === 'dark'; setDark(saved); document.documentElement.classList.toggle('theme-dark', saved); }, []); function toggle() { const next = !dark; setDark(next); localStorage.setItem('krish-theme', next ? 'dark' : 'light'); document.documentElement.classList.toggle('theme-dark', next); } return <button type="button" onClick={toggle} aria-label="Toggle theme" className="grid size-9 place-items-center rounded-full border border-blue-200 bg-blue-50 text-[#0d62c7]">{dark ? <Sun className="size-4" /> : <Moon className="size-4" />}</button>; }
