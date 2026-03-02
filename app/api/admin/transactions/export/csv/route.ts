import { NextResponse } from 'next/server';
import { getLoggedInAdminId } from '@/lib/auth';
import { getTransactions } from '@/lib/registrations';

export async function GET() {
  const adminId = await getLoggedInAdminId();
  if (!adminId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const transactions = await getTransactions();
  const header = ['id', 'registration_code', 'payer_name', 'payer_email', 'amount', 'payment_method', 'status', 'paid_at'];
  const rows = transactions.map((tx) => [
    tx.id,
    tx.registration_code,
    tx.payer_name,
    tx.payer_email,
    tx.amount,
    tx.payment_method,
    tx.status,
    tx.paid_at
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="transactions.csv"'
    }
  });
}
