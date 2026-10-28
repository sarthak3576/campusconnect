'use client';

import { useEffect, useState, useCallback } from 'react';

const ROLES = ['ADMIN', 'STAFF', 'STUDENT'];

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [showUser, setShowUser] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'STUDENT', departmentId: '' });
  const [newDept, setNewDept] = useState({ code: '', name: '', description: '' });
  const [newCat, setNewCat] = useState({ name: '', description: '' });

  const load = useCallback(async () => {
    try {
      const [u, d, c, l] = await Promise.all([
        fetch('/api/users').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/departments').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/categories').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/audit').then((r) => (r.ok ? r.json() : [])),
      ]);
      setUsers(u);
      setDepartments(d);
      setCategories(c);
      setLogs(l);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const body: any = {
      name: userForm.name,
      email: userForm.email,
      password: userForm.password,
      role: userForm.role,
    };
    if (userForm.departmentId) body.departmentId = Number(userForm.departmentId);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Failed to create user');
      return;
    }
    setShowUser(false);
    setUserForm({ name: '', email: '', password: '', role: 'STUDENT', departmentId: '' });
    load();
  }

  async function changeRole(id: number, role: string) {
    await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    load();
  }

  async function deleteUser(id: number) {
    if (!confirm('Delete this user?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    load();
  }

  async function createDept(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDept),
    });
    if (res.ok) {
      setNewDept({ code: '', name: '', description: '' });
      load();
    }
  }

  async function createCat(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCat),
    });
    if (res.ok) {
      setNewCat({ name: '', description: '' });
      load();
    }
  }

  return (
    <div>
      <div className="topbar">
        <h1>Admin Panel</h1>
        <button className="btn" onClick={() => setShowUser(true)}>
          + Add User
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="panel">
        <h2>Users (Single table with role-based access)</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Change Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role}`}>{u.role}</span>
                  </td>
                  <td>{u.department?.name ?? '—'}</td>
                  <td>
                    <select className="input" value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} style={{ width: 120 }}>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button className="btn danger sm" onClick={() => deleteUser(u.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h2>Departments</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Users</th>
                  <th>Complaints</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.id}>
                    <td>{d.code}</td>
                    <td>{d.name}</td>
                    <td>{d._count.users}</td>
                    <td>{d._count.complaints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form onSubmit={createDept} style={{ marginTop: 16 }}>
            <div className="field">
              <label>New Department</label>
              <input className="input" placeholder="Code" value={newDept.code} onChange={(e) => setNewDept((d) => ({ ...d, code: e.target.value }))} required />
            </div>
            <div className="field">
              <input className="input" placeholder="Name" value={newDept.name} onChange={(e) => setNewDept((d) => ({ ...d, name: e.target.value }))} required />
            </div>
            <button className="btn sm" type="submit">
              Add Department
            </button>
          </form>
        </div>

        <div className="panel">
          <h2>Categories</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Complaints</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c._count.complaints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form onSubmit={createCat} style={{ marginTop: 16 }}>
            <div className="field">
              <label>New Category</label>
              <input className="input" placeholder="Name" value={newCat.name} onChange={(e) => setNewCat((c) => ({ ...c, name: e.target.value }))} required />
            </div>
            <button className="btn sm" type="submit">
              Add Category
            </button>
          </form>
        </div>
      </div>

      <div className="panel">
        <h2>Audit Log</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Entity ID</th>
                <th>IP</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{l.user?.name ?? '—'}</td>
                  <td>{l.action}</td>
                  <td>{l.entity}</td>
                  <td>{l.entityId ?? '—'}</td>
                  <td>{l.ipAddress ?? '—'}</td>
                  <td className="muted">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showUser && (
        <div className="modal-backdrop" onClick={() => setShowUser(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add User</h2>
            <form onSubmit={createUser}>
              <div className="field">
                <label>Name</label>
                <input className="input" value={userForm.name} onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="field">
                <label>Email</label>
                <input className="input" type="email" value={userForm.email} onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="field">
                <label>Password</label>
                <input className="input" type="password" value={userForm.password} onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))} required />
              </div>
              <div className="field">
                <label>Role</label>
                <select className="input" value={userForm.role} onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Department</label>
                <select className="input" value={userForm.departmentId} onChange={(e) => setUserForm((f) => ({ ...f, departmentId: e.target.value }))}>
                  <option value="">None</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" type="submit">
                  Create
                </button>
                <button className="btn ghost" type="button" onClick={() => setShowUser(false)}>
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
