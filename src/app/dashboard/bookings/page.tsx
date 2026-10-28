'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'];

export default function BookingsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [data, setData] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ resourceId: '', startTime: '', endTime: '', purpose: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    params.set('page', String(page));
    params.set('pageSize', '10');
    try {
      const res = await fetch(`/api/bookings?${params}`);
      if (!res.ok) throw new Error('Failed to load bookings');
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch('/api/resources?pageSize=50').then((r) => r.json()).then((d) => setResources(d.data)).catch(() => {});
  }, []);

  async function createBooking(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.resourceId || !form.startTime || !form.endTime) {
      setError('Please fill all required fields');
      return;
    }
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, resourceId: Number(form.resourceId) }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Failed to create booking');
      return;
    }
    setShowModal(false);
    setForm({ resourceId: '', startTime: '', endTime: '', purpose: '' });
    load();
  }

  async function updateStatus(id: number, status: string) {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Update failed');
      return;
    }
    load();
  }

  return (
    <div>
      <div className="topbar">
        <h1>Bookings</h1>
        <button className="btn" onClick={() => setShowModal(true)}>
          + New Booking
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="toolbar">
        <select className="input" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Resource</th>
                <th>Booked By</th>
                <th>Start</th>
                <th>End</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((b: any) => (
                <tr key={b.id}>
                  <td>{b.resource.name}</td>
                  <td>{b.user.name}</td>
                  <td className="muted">{new Date(b.startTime).toLocaleString()}</td>
                  <td className="muted">{new Date(b.endTime).toLocaleString()}</td>
                  <td>{b.purpose ?? '—'}</td>
                  <td>
                    <span className={`badge ${b.status}`}>{b.status}</span>
                  </td>
                  <td>
                    {(role === 'ADMIN' || role === 'STAFF') && b.status === 'PENDING' && (
                      <>
                        <button className="btn sm" style={{ marginRight: 6 }} onClick={() => updateStatus(b.id, 'APPROVED')}>
                          Approve
                        </button>
                        <button className="btn danger sm" style={{ marginRight: 6 }} onClick={() => updateStatus(b.id, 'REJECTED')}>
                          Reject
                        </button>
                      </>
                    )}
                    {b.status === 'PENDING' && (
                      <button className="btn ghost sm" onClick={() => updateStatus(b.id, 'CANCELLED')}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {data?.data?.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted" style={{ textAlign: 'center' }}>
                    No bookings found
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

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>New Booking</h2>
            <form onSubmit={createBooking}>
              <div className="field">
                <label>Resource</label>
                <select className="input" value={form.resourceId} onChange={(e) => setForm((f) => ({ ...f, resourceId: e.target.value }))} required>
                  <option value="">Select resource…</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Start Time</label>
                <input className="input" type="datetime-local" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} required />
              </div>
              <div className="field">
                <label>End Time</label>
                <input className="input" type="datetime-local" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} required />
              </div>
              <div className="field">
                <label>Purpose</label>
                <input className="input" value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" type="submit">
                  Book
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
