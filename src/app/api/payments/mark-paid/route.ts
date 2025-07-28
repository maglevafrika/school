// app/api/payments/mark-paid/route.js
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const { installmentId, paymentMethod } = await request.json();
    
    const paymentDate = format(new Date(), 'yyyy-MM-dd');
    const invoiceNumber = `INV-${Date.now()}`;

    await db.query(`
      UPDATE installments 
      SET status = 'paid', 
          payment_date = ?, 
          payment_method = ?, 
          invoice_number = ?,
          updated_at = NOW()
      WHERE id = ?
    `, [paymentDate, paymentMethod, invoiceNumber, installmentId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking as paid:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}