'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function NewComplaintPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', categoryId: '' });
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/categories').then((r) => r.json()).then(setCategories).catch(() => {});
  }, []);

  function validate() {
    const errs: string[] = [];
    if (form.title.trim().length < 5) errs.push('Title must be at least 5 characters');
    if (form.description.trim().length < 10) errs.push('Description must be at least 10 characters');
    if (!form.categoryId) errs.push('Please select a category');
    return errs;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (errs.length) return;
    setSubmitting(true);
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, categoryId: Number(form.categoryId) }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrors([data.error || 'Failed to create complaint']);
      return;
    }
    router.push('/dashboard/complaints');
    router.refresh();
  }

  return (
    <div>
      <div className="topbar">
        <h1>New Complaint</h1>
      </div>
      <div className="panel" style={{ maxWidth: 640 }}>
        {errors.length > 0 && (
          <div className="alert error">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Short summary of the issue" />
          </div>
          <div className="field">
            <label>Category</label>
            <select className="input" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Priority</label>
            <select className="input" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea className="input" rows={5} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe the problem in detail…" />
          </div>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Complaint'}
          </button>
        </form>
      </div>
    </div>
  );
}
