'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const LINKS = [
  { href: '/', label: 'Guide' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/practice', label: 'Practice' },
  { href: '/essays', label: 'Essays' },
  { href: '/essay-feedback', label: 'Essay Feedback' },
  { href: '/interview', label: 'Interview' },
  { href: '/video-interview', label: 'Video Interview' },
  { href: '/simulator', label: 'Simulator' },
  { href: '/resources', label: 'Resources' },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <nav aria-label="Main navigation">
      <div className="nav-inner">
        <Link href="/" className="nav-brand" onClick={() => setOpen(false)}>
          Minerva <span>Companion</span>
        </Link>
        <button
          type="button"
          className="nav-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="nav-menu"
          onClick={() => setOpen(o => !o)}
        >
          <span aria-hidden="true">{open ? '✕' : '☰'}</span>
        </button>
        <div id="nav-menu" className={`nav-links${open ? ' open' : ''}`}>
          {LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={active ? 'active' : ''}
                aria-current={active ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
