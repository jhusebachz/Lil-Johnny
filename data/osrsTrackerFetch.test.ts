import assert from 'node:assert/strict';
import test from 'node:test';

import { fetchRawRunescapeData } from './osrsTrackerFetch.ts';

const originalFetch = globalThis.fetch;

test('OSRS tracker fetch falls back to alternate sources when the primary URL fails', async () => {
  const calls: string[] = [];

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    calls.push(url);

    if (calls.length === 1) {
      throw new Error('Primary source unavailable');
    }

    return {
      ok: true,
      json: async () => ({
        jhusebachz: {
          overall: {
            metric: 'overall',
            experience: 123,
            rank: 1,
            level: 1,
            ehp: 0,
          },
        },
      }),
    } as Response;
  }) as typeof fetch;

  try {
    const payload = await fetchRawRunescapeData();
    const player = payload.jhusebachz as { overall: { experience: number } };

    assert.equal(calls.length, 2);
    assert.ok(calls[0].includes('raw.githubusercontent.com'));
    assert.ok(calls[1].includes('github.com/jhusebachz/OSRS-Daily-Tracker/raw'));
    assert.equal(player.overall.experience, 123);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('OSRS tracker fetch throws after all sources fail', async () => {
  globalThis.fetch = (async () => {
    throw new Error('Network down');
  }) as typeof fetch;

  try {
    await assert.rejects(() => fetchRawRunescapeData(), /Network down/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
