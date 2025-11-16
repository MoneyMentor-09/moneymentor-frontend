import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { TRANSACTION_BATCH_BUCKET } from '@/lib/constants';

export const GET = async () => {
  const supabase = await getSupabaseServerClient(); // <-- FIXED
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: list, error: listErr } = await supabase.storage
    .from(TRANSACTION_BATCH_BUCKET)
    .list(user.id, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });

  const items = [];

  for (const obj of list ?? []) {
    if (!obj.name.endsWith('.json')) continue;
    const path = `${user.id}/${obj.name}`;
    const dl = await supabase.storage.from(TRANSACTION_BATCH_BUCKET).download(path);
    if (dl.error) continue;
    const manifest = JSON.parse(await dl.data.text());
    items.push({
      batchId: manifest.batchId,
      filename: manifest.filename,
      rowCount: manifest.rowCount,
      insertedAtISO: manifest.insertedAtISO,
    });
  }

  return NextResponse.json({ batches: items });
};
