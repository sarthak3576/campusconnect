'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const TYPES = ['ROOM', 'EQUIPMENT', 'LAB', 'VEHICLE', 'SPORT'];
const STATUSES = ['AVAILABLE', 'MAINTENANCE', 'UNAVAILABLE'];

const EMPTY = { name: '', type: 'ROOM', location: '', capacity: '', status: 'AVAILABLE', description: '' };

export default function ResourcesPage() {
  const { data: session } = useSession();
  const canManage = session?.user?.role === 'ADMIN' || session?.user?.role === 'STAFF';

  const [data, setData] = useState<any>(null);
  const [filters, setFilters] = useState({ search: '', type: '', status: '' });
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.type) params.set('type', filters.type);
    if (filters.status) params.set('status', filters.status);
    params.set('page', String(page));
    params.set('pageSize', '10');
    try {
      const res = await fetch(`/api/resources?${params}`);
      if (!res.ok) throw new Error('Failed to load');
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function createResource(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const body: any = {
      name: form.name,
      type: form.type,
      status: form.status,
      location: form.location || null,
      description: form.description || null,
    };
    if (form.capacity) body.capacity = Number(form.capacity);
    const res = await fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Failed to create resource');
      return;
    }
    setShowModal(false);
    setForm(EMPTY);
    load();
  }

  async function deleteResource(id: number) {
    if (!confirm('Delete this resource?')) return;
    const res = await fetch(`/api/resources/${id}`, { method: 'DELETE' });
    if (res.ok) load();
  }

  return (
    <div>
      <div className="topbar">
        <h1>Resources</h1>
        {canManage && (
          <button className="btn" onClick={() => setShowModal(true)}>
            + Add Resource
          </button>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search resources…"
          value={filters.search}
          onChange={(e) => {
            setFilters((f) => ({ ...f, search: e.target.value }));
            setPage(1);
          }}
        />
        <select
          className="input"
          value={filters.type}
          onChange={(e) => {
            setFilters((f) => ({ ...f, type: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">All Types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
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
      </div>

      <div className="cards">
        {data?.data?.map((r: any) => (
          <div className="card" key={r.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ color: 'var(--text)', fontSize: '1rem' }}>{r.name}</h3>
              <span className={`badge ${r.status}`}>{r.status}</span>
            </div>
            <div className="muted" style={{ marginTop: 4 }}>
              {r.type} · {r.location ?? 'No location'}
            </div>
            <div className="muted">Capacity: {r.capacity ?? 'N/A'} · Bookings: {r._count.bookings}</div>
            {canManage && (
              <button className="btn danger sm" style={{ marginTop: 12 }} onClick={() => deleteResource(r.id)}>
                Delete
              </button>
            )}
          </div>
        ))}
        {data?.data?.length === 0 && <div className="muted">No resources found</div>}
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

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Resource</h2>
            <form onSubmit={createResource}>
              <div className="field">
                <label>Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="field">
                <label>Type</label>
                <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Location</label>
                <input className="input" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="field">
                <label>Capacity</label>
                <input className="input" type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />
              </div>
              <div className="field">
                <label>Status</label>
                <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Description</label>
                <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" type="submit">
                  Create
                </button>
                <button className="btn ghost" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
