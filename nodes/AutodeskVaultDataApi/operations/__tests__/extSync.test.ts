import { describe, it, expect, vi } from 'vitest';
import {
  formatExtSyncTaskBatchBody,
  formatExtSyncTaskBody,
  formatExtSyncTaskQueryBody,
  splitIds,
} from '../extSync';
import { IExecuteSingleFunctions, IHttpRequestOptions } from 'n8n-workflow';

function makeCtx(params: Record<string, unknown>): IExecuteSingleFunctions {
  return {
    getNodeParameter: vi.fn((name: string, fallback?: unknown) =>
      name in params ? params[name] : fallback,
    ),
    getNode: vi.fn(() => ({ name: 'Vault', type: 'autodeskVaultDataApi', typeVersion: 1 })),
  } as unknown as IExecuteSingleFunctions;
}

function baseOptions(): IHttpRequestOptions {
  return { url: '/ext-sync-tasks', method: 'POST' } as IHttpRequestOptions;
}

describe('splitIds', () => {
  it('accepts commas, newlines and stray whitespace', () => {
    expect(splitIds(' 127, 119 \n 121 ')).toEqual(['127', '119', '121']);
  });

  it('returns an empty list for blank input', () => {
    expect(splitIds('  \n , ')).toEqual([]);
  });
});

describe('formatExtSyncTaskBody', () => {
  it('assembles a full task and folds the parameter rows into a dictionary', async () => {
    const ctx = makeCtx({
      syncEntityId: '127',
      syncEntityClassId: 'ITEM',
      syncConfigId: 'Adsk.Vault.ExternalSyncTask.FusionManage',
      syncWorkflowType: 'Adsk.UploadItem',
      syncDescription: 'Sync to Fusion Manage (1000007)',
      syncParams: { parameter: [{ key: 'entityClassId', value: 'ITEM' }] },
      syncExecuteImmediately: true,
      syncPredecessorTaskId: '232',
    });

    const result = await formatExtSyncTaskBody.call(ctx, baseOptions());

    expect(result.body).toEqual({
      entityId: '127',
      entityClassId: 'ITEM',
      configId: 'Adsk.Vault.ExternalSyncTask.FusionManage',
      workflowType: 'Adsk.UploadItem',
      description: 'Sync to Fusion Manage (1000007)',
      params: { entityClassId: 'ITEM' },
      executeImmediately: true,
      predecessorTaskId: '232',
    });
  });

  it('leaves out the optional fields that were not filled in', async () => {
    const ctx = makeCtx({
      syncEntityId: '127',
      syncEntityClassId: 'FILE',
      syncConfigId: 'cfg',
      syncWorkflowType: 'Adsk.UploadItem',
      syncDescription: 'Sync',
      syncParams: {},
      syncExecuteImmediately: false,
      syncPredecessorTaskId: '',
    });

    const result = await formatExtSyncTaskBody.call(ctx, baseOptions());

    expect(result.body).not.toHaveProperty('params');
    expect(result.body).not.toHaveProperty('executeImmediately');
    expect(result.body).not.toHaveProperty('predecessorTaskId');
  });

  it('drops parameter rows that have no key', async () => {
    const ctx = makeCtx({
      syncEntityId: '127',
      syncEntityClassId: 'ITEM',
      syncConfigId: 'cfg',
      syncWorkflowType: 'wf',
      syncDescription: 'Sync',
      syncParams: { parameter: [{ key: '', value: 'ignored' }] },
    });

    const result = await formatExtSyncTaskBody.call(ctx, baseOptions());

    expect(result.body).not.toHaveProperty('params');
  });
});

describe('formatExtSyncTaskBatchBody', () => {
  it('sends a bare array of tasks', async () => {
    const ctx = makeCtx({
      syncTasks: {
        task: [
          {
            entityId: '127',
            entityClassId: 'ITEM',
            configId: 'cfg',
            workflowType: 'Adsk.UploadItem',
            description: 'first',
            paramsJson: '{"entityId": "127"}',
          },
          {
            entityId: '121',
            entityClassId: 'ITEM',
            configId: 'cfg',
            workflowType: 'Adsk.UploadItem',
            description: 'second',
          },
        ],
      },
    });

    const result = await formatExtSyncTaskBatchBody.call(ctx, baseOptions());

    expect(Array.isArray(result.body)).toBe(true);
    expect(result.body).toEqual([
      {
        entityId: '127',
        entityClassId: 'ITEM',
        configId: 'cfg',
        workflowType: 'Adsk.UploadItem',
        description: 'first',
        params: { entityId: '127' },
      },
      {
        entityId: '121',
        entityClassId: 'ITEM',
        configId: 'cfg',
        workflowType: 'Adsk.UploadItem',
        description: 'second',
      },
    ]);
  });

  it('skips incomplete rows', async () => {
    const ctx = makeCtx({
      syncTasks: {
        task: [
          { entityId: '127', entityClassId: 'ITEM', configId: 'cfg', workflowType: 'wf' },
          { entityId: '', entityClassId: 'ITEM', configId: 'cfg', workflowType: 'wf' },
        ],
      },
    });

    const result = await formatExtSyncTaskBatchBody.call(ctx, baseOptions());

    expect(result.body).toHaveLength(1);
  });

  it('reports the row number of an invalid parameters JSON value', async () => {
    const ctx = makeCtx({
      syncTasks: {
        task: [
          { entityId: '1', entityClassId: 'ITEM', configId: 'cfg', workflowType: 'wf' },
          {
            entityId: '2',
            entityClassId: 'ITEM',
            configId: 'cfg',
            workflowType: 'wf',
            paramsJson: '[1,2]',
          },
        ],
      },
    });

    await expect(formatExtSyncTaskBatchBody.call(ctx, baseOptions())).rejects.toThrow(/Task 2/);
  });

  it('throws when every row is incomplete', async () => {
    const ctx = makeCtx({ syncTasks: { task: [{ entityId: '127' }] } });

    await expect(formatExtSyncTaskBatchBody.call(ctx, baseOptions())).rejects.toThrow(
      /at least one task/,
    );
  });
});

describe('formatExtSyncTaskQueryBody', () => {
  it('splits the entity IDs and keeps the workflow type when set', async () => {
    const ctx = makeCtx({
      syncEntityIds: '127, 119',
      filterWorkflowType: 'Adsk.UploadItem',
    });

    const result = await formatExtSyncTaskQueryBody.call(ctx, baseOptions());

    expect(result.body).toEqual({
      entityIds: ['127', '119'],
      workflowType: 'Adsk.UploadItem',
    });
  });

  it('omits an empty workflow type', async () => {
    const ctx = makeCtx({ syncEntityIds: '127', filterWorkflowType: '' });

    const result = await formatExtSyncTaskQueryBody.call(ctx, baseOptions());

    expect(result.body).toEqual({ entityIds: ['127'] });
  });

  it('throws when no entity ID was entered', async () => {
    const ctx = makeCtx({ syncEntityIds: '  ' });

    await expect(formatExtSyncTaskQueryBody.call(ctx, baseOptions())).rejects.toThrow(
      /at least one entity ID/,
    );
  });
});
