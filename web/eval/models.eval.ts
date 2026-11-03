/** Lists the model ids each configured key can call: `npm run compare:models`. Free ids change often. */
import { it } from 'vitest';
import { PROVIDERS } from '@/lib/tutor/getFeedback';

it('lists models per provider', async () => {
  for (const [name, { baseURL, keyVar }] of Object.entries(PROVIDERS)) {
    const key = process.env[keyVar];
    if (!key) { console.log(`\n${name}: ${keyVar} not set`); continue; }
    try {
      const res = await fetch(`${baseURL}/models`, { headers: { Authorization: `Bearer ${key}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ids: string[] = ((await res.json()).data ?? []).map((m: { id: string }) => m.id.replace(/^models\//, ''));
      // OpenRouter lists every model; only the `:free` ones cost nothing.
      const shown = name === 'openrouter' ? ids.filter((id) => id.endsWith(':free')) : ids;
      console.log(`\n${name} (${shown.length}):\n${shown.sort().map((id) => `  ${name}:${id}`).join('\n')}`);
    } catch (err) {
      console.log(`\n${name}: ${String(err)}`);
    }
  }
});
