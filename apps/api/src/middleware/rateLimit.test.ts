import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { publicWriteKey } from './rateLimit.js';

function req(ip: string, code: string, body: Record<string, unknown>): Request {
  return { ip, params: { code }, body } as unknown as Request;
}

describe('publicWriteKey (classroom-safe rate limiting)', () => {
  it('gives 100 different students on the SAME IP their own buckets', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i += 1) {
      keys.add(publicWriteKey(req('203.0.113.7', 'ABC123', { usn: `4VV22IS${i.toString().padStart(3, '0')}` })));
    }
    assert.equal(keys.size, 100); // a whole class is never a single bucket
  });

  it('buckets the same identity together regardless of USN formatting', () => {
    const a = publicWriteKey(req('203.0.113.7', 'ABC123', { usn: '4vv22is001' }));
    const b = publicWriteKey(req('203.0.113.7', 'ABC123', { usn: '  4VV22IS001 ' }));
    assert.equal(a, b); // one identity → one bucket → spam is caught
  });

  it('separates the same identity across different surveys', () => {
    const a = publicWriteKey(req('203.0.113.7', 'ABC123', { usn: '4VV22IS001' }));
    const b = publicWriteKey(req('203.0.113.7', 'XYZ999', { usn: '4VV22IS001' }));
    assert.notEqual(a, b);
  });

  it('keys /submit by submission id when no USN is present', () => {
    const a = publicWriteKey(req('203.0.113.7', 'ABC123', { submissionId: 42 }));
    const b = publicWriteKey(req('203.0.113.7', 'ABC123', { submissionId: 42 }));
    const c = publicWriteKey(req('203.0.113.7', 'ABC123', { submissionId: 43 }));
    assert.equal(a, b);
    assert.notEqual(a, c);
  });

  it('keys quiz writes by attempt token so a classroom NAT is not one bucket', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 50; i += 1) {
      keys.add(
        publicWriteKey(req('203.0.113.7', 'QZ9K2M1P', { attemptToken: `TOKEN${i.toString().padStart(3, '0')}` })),
      );
    }
    assert.equal(keys.size, 50);
  });
});
