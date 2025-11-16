'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

type Batch = {
  batchId: string;
  filename: string;
  rowCount: number;
  insertedAtISO: string;
};

type Props = {
  onChange?: () => void;
};

// small helper: safely parse JSON (returns null on failure)
function safeJson(text: string | null | undefined) {
  try {
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function UploadHistoryButton({ onChange }: Props) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [batches, setBatches] = React.useState<Batch[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transactions/batches', { cache: 'no-store' });
      const ct = res.headers.get('content-type') || '';
      let body: any = null;

      if (ct.includes('application/json')) {
        body = await res.json().catch(() => null);
      } else {
        const txt = await res.text().catch(() => '');
        body = safeJson(txt); // try to parse, else null
      }

      if (!res.ok) {
        const msg = body?.error || `Failed (${res.status})`;
        throw new Error(msg);
      }

      const list: Batch[] = body?.batches ?? [];
      setBatches(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setBatches([]);
      toast.error(e?.message || 'Failed to load upload history');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { if (open) load(); }, [open]);

  const handleDelete = async (batchId: string) => {
    if (!confirm('Delete this upload and all its transactions?')) return;
    try {
      const res = await fetch(`/api/transactions/batch/${batchId}`, { method: 'DELETE' });
      const ct = res.headers.get('content-type') || '';
      const body = ct.includes('application/json')
        ? await res.json().catch(() => ({}))
        : {};

      if (!res.ok) throw new Error(body?.error || 'Delete failed');

      toast.success(`Deleted ${body?.deleted ?? 0} transactions`);
      setBatches(prev => prev.filter(b => b.batchId !== batchId));
      onChange?.();
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Upload history</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>CSV upload history</DialogTitle>
          <DialogDescription>Delete an entire CSV upload as a batch.</DialogDescription>
        </DialogHeader>

        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filename</TableHead>
                <TableHead>Rows</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow>
              )}
              {!loading && batches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">No uploads yet.</TableCell>
                </TableRow>
              )}
              {batches.map(b => (
                <TableRow key={b.batchId}>
                  <TableCell className="font-medium">{b.filename}</TableCell>
                  <TableCell>{b.rowCount}</TableCell>
                  <TableCell>{new Date(b.insertedAtISO).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(b.batchId)}>
                      Delete batch
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
