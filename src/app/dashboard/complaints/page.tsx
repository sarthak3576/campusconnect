'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function ComplaintsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', categoryId: '' });
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    params.set('page', String(page));
    params.set('pageSize', '10');
    try {
      const res = await fetch(`/api/complaints?${params}`);
      if (!res.ok) throw new Error('Failed to load complaints');
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    }
  }, [filters, page]);

  useEffect(() => {
    fetch('/api/categories').then((r) => r.json()).then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="topbar">
        <h1>Complaints</h1>
        <Link className="btn" href="/dashboard/complaints/new">
          + New Complaint
        </Link>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search title or description…"
          value={filters.search}
          onChange={(e) => {
            setFilters((f) => ({ ...f, search: e.target.value }));
            setPage(1);
          }}
        />
        <select
          className="input"
          value={filters.status}
          onChange={(e) => {
            setFilters((f) => ({ ...f, status: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={filters.priority}
          onChange={(e) => {
            setFilters((f) => ({ ...f, priority: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={filters.categoryId}
          onChange={(e) => {
            setFilters((f) => ({ ...f, categoryId: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="btn secondary" onClick={() => setFilters({ search: '', status: '', priority: '', categoryId: '' })}>
          Reset
        </button>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Department</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Filed By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((c: any) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/dashboard/complaints/${c.id}`}>{c.title}</Link>
                  </td>
                  <td>{c.category.name}</td>
                  <td>{c.department?.name ?? '—'}</td>
                  <td>
                    <span className={`badge ${c.priority}`}>{c.priority}</span>
                  </td>
                  <td>
                    <span className={`badge ${c.status}`}>{c.status}</span>
                  </td>
                  <td>{c.user.name}</td>
                  <td className="muted">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {data?.data?.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted" style={{ textAlign: 'center' }}>
                    No complaints found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span className="muted">
              Page {page} of {data.totalPages}
            </span>
            <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
