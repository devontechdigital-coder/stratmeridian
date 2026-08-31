import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/authOptions';
import { hasModulePermission } from '@/lib/permissions';

export async function requireModulePermission(module, type = 'view') {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      ok: false,
      session: null,
      response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!hasModulePermission(session.user, module, type)) {
    return {
      ok: false,
      session,
      response: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ok: true, session, response: null };
}
