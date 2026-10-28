'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Stats = {
  complaintCount: number;
  openComplaints: number;
  resolvedComplaints: number;
  resourceCount: number;
  availableResources: number;
  bookingCount: number;
  myComplaints: number;
  myBookings: number;
  recentComplaints: any[];
  complaintStats: any[];
  role: string;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!stats) return <div className="muted">Loading dashboard…</div>;

  return (
    <div>
      <div className="topbar">
        <h1>Dashboard</h1>
        <span className="badge">{stats.role}</span>
      </div>

      <div className="cards">
        <div className="card">
          <h3>Total Complaints</h3>
          <div className="value">{stats.complaintCount}</div>
        </div>
        <div className="card">
          <h3>Open</h3>
          <div className="value">{stats.openComplaints}</div>
        </div>
        <div className="card">
          <h3>Resolved</h3>
          <div className="value">{stats.resolvedComplaints}</div>
        </div>
        <div className="card">
          <h3>Resources</h3>
          <div className="value">{stats.resourceCount}</div>
        </div>
        <div className="card">
          <h3>Bookings</h3>
          <div className="value">{stats.bookingCount}</div>
        </div>
        <div className="card">
          <h3>My Complaints</h3>
          <div className="value">{stats.myComplaints}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h2>Recent Complaints</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentComplaints.map((c: any) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/dashboard/complaints/${c.id}`}>{c.title}</Link>
                    </td>
                    <td>{c.category.name}</td>
                    <td>
                      <span className={`badge ${c.status}`}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h2>Complaints by Status</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Urgent</th>
                </tr>
              </thead>
              <tbody>
                {stats.complaintStats.map((s: any) => (
                  <tr key={s.status}>
                    <td>
                      <span className={`badge ${s.status}`}>{s.status}</span>
                    </td>
                    <td>{s.total}</td>
                    <td>{s.urgent_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
