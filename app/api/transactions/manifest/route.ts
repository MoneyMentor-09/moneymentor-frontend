import { NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { TRANSACTION_BATCH_BUCKET } from '@/lib/constants';

export const POST = async (req: Request) => {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

    const { filename, insertedIds, rowCount } = body || {};
    if (!Array.isArray(insertedIds)) {
      return NextResponse.json({ error: 'insertedIds must be an array' }, { status: 400 });
    }

    const batchId = uuid();
    const manifest = {
      batchId,
      filename: filename ?? 'upload.csv',
      insertedIds,
      rowCount: Number(rowCount ?? insertedIds.length ?? 0),
      insertedAtISO: new Date().toISOString(),
    };

    const json = JSON.stringify(manifest);
    const path = `${user.id}/${batchId}.json`;

    // Buffer works on all Node versions
    const { error } = await supabase
      .storage
      .from(TRANSACTION_BATCH_BUCKET)
      .upload(path, Buffer.from(json), {
        contentType: 'application/json',
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, batchId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
};
