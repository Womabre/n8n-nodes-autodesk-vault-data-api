import { describe, it, expect } from 'vitest';
import { listLoadOptions } from '../shared-parameters';

describe('listLoadOptions', () => {
  it('builds a GET routing block with a high page limit', () => {
    const result = listLoadOptions('/AutodeskDM/Services/api/vault/v2/roles');

    expect(result.routing?.request).toMatchObject({
      method: 'GET',
      url: '/AutodeskDM/Services/api/vault/v2/roles',
      qs: { limit: '1000' },
    });
  });

  it('maps results to sorted { name, value } options using the default name', () => {
    const postReceive = listLoadOptions('/x').routing?.output?.postReceive ?? [];

    expect(postReceive).toEqual([
      { type: 'rootProperty', properties: { property: 'results' } },
      {
        type: 'setKeyValue',
        properties: { name: '={{$responseItem.name}}', value: '={{$responseItem.id}}' },
      },
      { type: 'sort', properties: { key: 'name' } },
    ]);
  });

  it('uses a custom label expression when provided', () => {
    const postReceive = listLoadOptions('/x', '={{$responseItem.roleName}}').routing?.output
      ?.postReceive as Array<{ type: string; properties: Record<string, unknown> }>;
    const setKeyValue = postReceive.find((p) => p.type === 'setKeyValue');

    expect(setKeyValue?.properties.name).toBe('={{$responseItem.roleName}}');
    expect(setKeyValue?.properties.value).toBe('={{$responseItem.id}}');
  });
});
