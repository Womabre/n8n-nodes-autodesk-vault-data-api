import { defineOperation, defineResource } from '../definition/defineOperation';

export const resource = defineResource({
	value: 'server',
	defaultOperation: 'getServerInfo',
	operations: [
		defineOperation({
			name: 'Get Server Info',
			value: 'getServerInfo',
			action: 'Get server info',
			description: 'Get some metadata information about server such as product version, etc',
			method: 'GET',
			path: '/server-info',
			fields: [],
			response: 'single',
		}),
	],
});
