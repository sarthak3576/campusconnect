'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const LINKS = [
  { href: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'STAFF', 'STUDENT'] },
  { href: '/dashboard/complaints', label: 'Complaints', roles: ['ADMIN', 'STAFF', 'STUDENT'] },
  { href: '/dashboard/resources', label: 'Resources', roles: ['ADMIN', 'STAFF', 'STUDENT'] },
  { href: '/dashboard/bookings', label: 'Bookings', roles: ['ADMIN', 'STAFF', 'STUDENT'] },
  { href: '/dashboard/admin', label: 'Admin Panel', roles: ['ADMIN'] },
];

export default function Sidebar({ name, role }: { name: string; role: string }) {
  const pathname = usePathname();
  const links = LINKS.filter((l) => l.roles.includes(role));
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="sidebar">
      <div className="brand">CampusConnect</div>
      {links.map((l) => (
        <Link key={l.href} href={l.href} className={pathname === l.href ? 'active' : ''}>
          {l.label}
        </Link>
      ))}
      <div className="logout">
        <div className="user-chip" style={{ marginBottom: 12 }}>
          <div className="avatar">{initials}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{name}</div>
            <span className={`badge ${role}`}>{role}</span>
          </div>
        </div>
        <button className="btn ghost sm" style={{ width: '100%' }} onClick={() => signOut({ callbackUrl: '/' })}>
          Logout
        </button>
      </div>
    </aside>
  );
}
