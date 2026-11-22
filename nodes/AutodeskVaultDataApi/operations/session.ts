import { INodeProperties } from 'n8n-workflow';
import { defineOperation, defineResource } from '../definition/defineOperation';

const sessionId: INodeProperties = {
	displayName: 'Session ID',
	name: 'sessionId',
	type: 'string',
	required: true,
	default: '@current',
	description: 'The ID of the session. Use @current for current session.',
};

export const resource = defineResource({
	value: 'session',
	defaultOperation: 'getSessionById',
	operations: [
		defineOperation({
			name: 'Get Current Session',
			value: 'getSessionById',
			action: 'Get current session',
			description:
				'Get user session tied to Bearer token. Use @current to retrieve current user session.',
			method: 'GET',
			path: '/sessions/{sessionId}',
			fields: [sessionId],
			response: 'single',
		}),
		defineOperation({
			name: 'Delete Current Session',
			value: 'deleteSession',
			action: 'Delete current session',
			description:
				'Delete user session tied to Bearer token. Use @current to delete current user session.',
			method: 'DELETE',
			path: '/sessions/{sessionId}',
			fields: [sessionId],
			response: 'empty',
		}),
	],
});
