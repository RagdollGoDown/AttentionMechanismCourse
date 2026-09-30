import { Lesson } from '@/components/Lesson';
import { parseCondition } from '@/lib/condition';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <Lesson initialCondition={parseCondition(params.condition)} />;
}
