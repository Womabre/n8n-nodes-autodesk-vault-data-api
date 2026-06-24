import { describe, it, expect, vi } from 'vitest';
import { formatJobBody } from '../job';
import { IExecuteSingleFunctions, IHttpRequestOptions } from 'n8n-workflow';

function makeCtx(params: Record<string, unknown>): IExecuteSingleFunctions {
  return {
    getNodeParameter: vi.fn((name: string) => params[name]),
  } as unknown as IExecuteSingleFunctions;
}

function baseOptions(): IHttpRequestOptions {
  return { url: '/jobs', method: 'POST' } as IHttpRequestOptions;
}

describe('formatJobBody', () => {
  it('assembles a full body from all parameters', async () => {
    const ctx = makeCtx({
      jobType: 'Autodesk.Vault.SyncProperties',
      priority: 5,
      description: 'Sync properties',
      params: { parameter: [{ key: 'EntityId', value: '123' }] },
    });

    const result = await formatJobBody.call(ctx, baseOptions());

    expect(result.body).toEqual({
      jobType: 'Autodesk.Vault.SyncProperties',
      priority: 5,
      description: 'Sync properties',
      params: [{ key: 'EntityId', value: '123' }],
    });
  });

  it('omits empty optional fields', async () => {
    const ctx = makeCtx({
      jobType: 'MyJob',
      priority: '',
      description: '',
      params: {},
    });

    const result = await formatJobBody.call(ctx, baseOptions());

    expect(result.body).toEqual({ jobType: 'MyJob' });
  });

  it('keeps a priority of 0 only when explicitly set, dropping empty string', async () => {
    const ctx = makeCtx({ jobType: 'MyJob', priority: 0, description: '', params: {} });

    const result = await formatJobBody.call(ctx, baseOptions());

    expect((result.body as Record<string, unknown>).priority).toBe(0);
  });

  it('does not set params when the collection is empty', async () => {
    const ctx = makeCtx({
      jobType: 'MyJob',
      priority: 1,
      description: '',
      params: { parameter: [] },
    });

    const result = await formatJobBody.call(ctx, baseOptions());

    expect(result.body).not.toHaveProperty('params');
  });
});
