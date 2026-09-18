import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Select, Surface, useToast } from '../../components/ui';

type Payload = {
  courseBound: boolean;
  outcomes: Array<{ coCode: string; statement?: string | null }>;
  questions: Array<{ id: number; prompt: string; questionType: string; coCodes: string[]; approved: boolean }>;
};

export function SurveyIndirectMappingPanel({ surveyId }: { surveyId: number }) {
  const { toast } = useToast();
  const [data, setData] = useState<Payload | null>(null);
  const [map, setMap] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Payload>(`/api/attainment/surveys/${surveyId}/co-links`)
      .then((p) => {
        setData(p);
        const next: Record<number, string> = {};
        for (const q of p.questions) next[q.id] = q.coCodes[0] || '';
        setMap(next);
      })
      .catch(() => undefined);
  }, [surveyId]);

  if (!data) return null;

  const save = async () => {
    setBusy(true);
    try {
      const links = Object.entries(map)
        .filter(([, co]) => co)
        .map(([questionId, coCode]) => ({ questionId: Number(questionId), coCode, approved: true }));
      const saved = await api<Payload>(`/api/attainment/surveys/${surveyId}/co-links`, {
        method: 'PUT',
        body: JSON.stringify({ links }),
      });
      setData(saved);
      toast('Approved survey questions will now contribute to indirect CO attainment.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save CO links', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Surface className="space-y-3">
      <div>
        <h2 className="font-semibold">Indirect CO evidence</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Only approved, CO-linked questions feed indirect attainment. Unmapped questions are ignored.
        </p>
      </div>
      {!data.courseBound ? (
        <p className="text-sm text-warning">
          Attach this survey to a course in settings, then map questions to COs.{' '}
          <Link to="/attainment" className="text-accent">
            Attainment
          </Link>
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {data.questions.map((q) => (
              <div key={q.id} className="grid gap-2 sm:grid-cols-[1fr_160px]">
                <p className="text-sm">{q.prompt}</p>
                <Select value={map[q.id] || ''} onChange={(e) => setMap((m) => ({ ...m, [q.id]: e.target.value }))}>
                  <option value="">Not used for CO attainment</option>
                  {data.outcomes.map((o) => (
                    <option key={o.coCode} value={o.coCode}>
                      {o.coCode}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
          <Button disabled={busy} onClick={save}>
            Approve mapped questions
          </Button>
        </>
      )}
    </Surface>
  );
}
