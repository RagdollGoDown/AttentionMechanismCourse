import type { Logger } from '@/lib/log';

export function downloadLog(logger: Logger): void {
  const blob = new Blob([logger.toJSON()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attention-log-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
