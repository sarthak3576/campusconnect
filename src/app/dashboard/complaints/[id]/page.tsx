'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'];

export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params.id as string;

  const [complaint, setComplaint] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('');
  const [deptId, setDeptId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const role = session?.user?.role;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/complaints/${id}`);
      if (!res.ok) throw new Error('Failed to load');
      const c = await res.json();
      setComplaint(c);
      setStatus(c.status);
      setDeptId(c.departmentId ? String(c.departmentId) : '');
    } catch (e: any) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch('/api/departments').then((r) => r.json()).then(setDepartments).catch(() => {});
  }, []);

  async function handleUpdate() {
    setBusy(true);
    setError('');
    const body: any = { status, comment: comment || undefined };
    if (role !== 'STUDENT' && deptId) body.departmentId = Number(deptId);
    const res = await fetch(`/api/complaints/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Update failed');
      return;
    }
    setComment('');
    load();
  }

  async function handleResolve() {
    if (!comment.trim()) {
      setError('Please add a comment before resolving');
      return;
    }
    setBusy(true);
    setError('');
    const res = await fetch(`/api/complaints/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Resolve failed');
      return;
    }
    setComment('');
    load();
  }

  async function handleDelete() {
    if (!confirm('Delete this complaint?')) return;
    const res = await fetch(`/api/complaints/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/dashboard/complaints');
    else setError('Delete failed');
  }

  if (error && !complaint) return <div className="alert error">{error}</div>;
  if (!complaint) return <div className="muted">Loading…</div>;

  const canManage = role === 'ADMIN' || role === 'STAFF';

  return (
    <div>
      <div className="topbar">
        <h1>{complaint.title}</h1>
        <div>
          {canManage && (
            <button className="btn danger sm" onClick={handleDelete}>
              Delete
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="grid-2">
        <div>
          <div className="panel">
            <h2>Details</h2>
            <div className="detail-row">
              <span className="label">Status</span>
              <span className={`badge ${complaint.status}`}>{complaint.status}</span>
            </div>
            <div className="detail-row">
              <span className="label">Priority</span>
              <span className={`badge ${complaint.priority}`}>{complaint.priority}</span>
            </div>
            <div className="detail-row">
              <span className="label">Category</span>
              <span>{complaint.category?.name}</span>
            </div>
            <div className="detail-row">
              <span className="label">Department</span>
              <span>{complaint.department?.name ?? 'Unassigned'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Filed By</span>
              <span>{complaint.user?.name}</span>
            </div>
            <div className="detail-row">
              <span className="label">Filed On</span>
              <span>{new Date(complaint.createdAt).toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="label">Description</span>
              <span style={{ textAlign: 'right' }}>{complaint.description}</span>
            </div>
          </div>

          {canManage && (
            <div className="panel">
              <h2>Manage Complaint</h2>
              <div className="field">
                <label>Update Status</label>
                <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Assign Department</label>
                <select className="input" value={deptId} onChange={(e) => setDeptId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Add Comment</label>
                <textarea className="input" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a status update comment…" />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" onClick={handleUpdate} disabled={busy}>
                  Update
                </button>
                <button className="btn secondary" onClick={handleResolve} disabled={busy || complaint.status === 'RESOLVED'}>
                  Resolve (Stored Procedure)
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="panel">
          <h2>Update History</h2>
          {complaint.updates?.length === 0 ? (
            <div className="muted">No updates yet</div>
          ) : (
            <ul className="timeline">
              {complaint.updates?.map((u: any) => (
                <li key={u.id}>
                  <div style={{ fontWeight: 600 }}>{u.user.name}</div>
                  <div className="muted">{new Date(u.createdAt).toLocaleString()}</div>
                  <p style={{ margin: '6px 0 0' }}>{u.comment}</p>
                  {u.statusFrom && u.statusTo && (
                    <div style={{ marginTop: 6 }}>
                      <span className={`badge ${u.statusFrom}`}>{u.statusFrom}</span>
                      <span className="muted"> → </span>
                      <span className={`badge ${u.statusTo}`}>{u.statusTo}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
