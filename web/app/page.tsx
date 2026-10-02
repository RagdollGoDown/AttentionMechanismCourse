import { Lesson } from '@/components/Lesson';
import { parseCondition, parseDebug } from '@/lib/condition';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <Lesson initialCondition={parseCondition(params.condition)} debug={parseDebug(params.debug)} />;
}
