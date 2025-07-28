// app/api/payments/set-grace-period/route.js
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const { installmentId, gracePeriodDate } = await request.json();

    await db.query(`
      UPDATE installments 
      SET grace_period_until = ?, updated_at = NOW() 
      WHERE id = ?
    `, [format(new Date(gracePeriodDate), 'yyyy-MM-dd'), installmentId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error setting grace period:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
