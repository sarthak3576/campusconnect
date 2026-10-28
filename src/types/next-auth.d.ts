import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    departmentId?: number | null;
  }

  interface Session {
    user: {
      id: number;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      departmentId?: number | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: number;
    role?: string;
    departmentId?: number | null;
  }
}
