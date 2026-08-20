'use client';
import { useEffect } from 'react';

export default function ThemeInitializer() {
  useEffect(() => { document.documentElement.classList.toggle('theme-dark', localStorage.getItem('krish-theme') === 'dark'); }, []);
  return null;
}
