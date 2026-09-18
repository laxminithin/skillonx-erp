import { useEffect, useState } from 'react';
import { labApi, type LabMeta, type Lab } from '../../lib/labApi';

export function useLabMeta() {
  const [meta, setMeta] = useState<LabMeta | null>(null);
  useEffect(() => { labApi.meta().then(setMeta).catch(() => setMeta(null)); }, []);
  return meta;
}

export function useLabs() {
  const [labs, setLabs] = useState<Lab[]>([]);
  useEffect(() => { labApi.labs().then(setLabs).catch(() => setLabs([])); }, []);
  return labs;
}

export function money(n: number | null | undefined) {
  if (n == null) return '—';
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

export function fmtDate(s: string | null | undefined) {
  if (!s) return '—';
  const d = String(s).slice(0, 10);
  return d;
}
