import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="landing">
      <header>
        <div className="brand">CampusConnect</div>
        <div>
          {session ? (
            <Link className="btn secondary" href="/dashboard">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link className="btn ghost" href="/login" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}>
                Login
              </Link>
              <Link className="btn" href="/register" style={{ marginLeft: 8, background: '#fff', color: '#4f46e5' }}>
                Register
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="hero">
        <h1>Smart Campus Complaint &amp; Resource Management System</h1>
        <p>
          Report campus issues, track them to resolution, and book shared resources like rooms,
          labs, and equipment — all in one place.
        </p>
        <div className="features">
          <div className="feature">
            <h3>📋 Complaint Tracking</h3>
            <span className="muted" style={{ color: 'rgba(255,255,255,0.85)' }}>
              File and track complaints with status updates and priorities.
            </span>
          </div>
          <div className="feature">
            <h3>🗓️ Resource Booking</h3>
            <span className="muted" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Book rooms, labs, equipment and vehicles with conflict detection.
            </span>
          </div>
          <div className="feature">
            <h3>🔐 Role-Based Access</h3>
            <span className="muted" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Admin, Staff and Student roles with secure authentication.
            </span>
          </div>
        </div>
        <Link className="btn" href={session ? '/dashboard' : '/login'} style={{ background: '#fff', color: '#4f46e5', fontSize: '1.05rem', padding: '14px 28px' }}>
          {session ? 'Open Dashboard' : 'Get Started'}
        </Link>
      </div>
    </div>
  );
}
