import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { TRANSACTION_BATCH_BUCKET } from '@/lib/constants';

type Manifest = {
  batchId: string;
  filename: string;
  insertedIds: string[];
  rowCount: number;
  insertedAtISO: string;
};

export const DELETE = async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const supabase = await getSupabaseServerClient(); // <-- FIXED
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const manifestPath = `${user.id}/${params.id}.json`;
  const dl = await supabase.storage.from(TRANSACTION_BATCH_BUCKET).download(manifestPath);
  if (dl.error) return NextResponse.json({ error: 'Batch manifest not found' }, { status: 404 });

  const manifest: Manifest = JSON.parse(await dl.data.text());
  const ids = manifest.insertedIds ?? [];
  const CHUNK = 1000;

  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const { error } = await supabase.from('transactions').delete().in('id', chunk);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.storage.from(TRANSACTION_BATCH_BUCKET).remove([manifestPath]);

  return NextResponse.json({ success: true, deleted: ids.length });
};
