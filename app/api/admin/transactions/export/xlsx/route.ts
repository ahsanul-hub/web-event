import { NextResponse } from 'next/server';
import { utils, write } from 'xlsx';
import { getLoggedInAdminId } from '@/lib/auth';
import { getTransactions } from '@/lib/registrations';

export async function GET() {
  const adminId = await getLoggedInAdminId();
  if (!adminId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const transactions = await getTransactions();
  const data = transactions.map((tx) => ({
    id: tx.id,
    registration_code: tx.registration_code,
    payer_name: tx.payer_name,
    payer_email: tx.payer_email,
    amount: tx.amount,
    payment_method: tx.payment_method,
    status: tx.status,
    paid_at: tx.paid_at
  }));

  const ws = utils.json_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Transactions');
  const buffer = write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="transactions.xlsx"'
    }
  });
}
