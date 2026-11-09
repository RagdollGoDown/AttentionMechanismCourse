import { redirect } from 'next/navigation';
import { Lesson } from '@/components/Lesson';
import { parseCondition, parseDebug, parsePid, randomCondition } from '@/lib/condition';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const condition = parseCondition(params.condition);
  if (!condition) {
    // No valid ?condition=: draw one (50/50) and put it in the URL, so a reload keeps the same condition.
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === 'condition' || v === undefined) continue;
      for (const x of Array.isArray(v) ? v : [v]) query.append(k, x);
    }
    query.set('condition', randomCondition());
    redirect(`/?${query.toString()}`);
  }
  return <Lesson initialCondition={condition} debug={parseDebug(params.debug)} participantId={parsePid(params.pid)} />;
}
