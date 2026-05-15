import { Icon, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class AutodeskVaultDataOAuth2Api implements ICredentialType {
	name = 'autodeskVaultDataOAuth2Api';
	displayName = 'Autodesk Vault Data OAuth2 API';
	documentationUrl = 'https://aps.autodesk.com/en/docs/vaultdataapi/v2/developers_guide/basics/authentication/';
	icon: Icon = 'file:AutodeskVaultDataApi.svg';
	extends = ['oAuth2Api'];
	properties: INodeProperties[] = [
		{
			displayName: 'Vault Server URL',
			name: 'vaultServerUrl',
			type: 'string',
			default: '',
			placeholder: 'e.g. https://vault.yourdomain.com',
			required: true,
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
			hint: 'Create an App in Autodesk Developer Portal to get your Client ID. https://aps.autodesk.com/en/docs/oauth/v2/tutorials/create-app/',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			hint: 'Create an App in Autodesk Developer Portal to get your Client Secret. https://aps.autodesk.com/en/docs/oauth/v2/tutorials/create-app/',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'string',
			default: 'data:read data:write',
			placeholder: 'e.g. data:read data:write',
			description: 'Space-separated OAuth2 scopes. Use "data:read" for read-only access.',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
			options: [
				{
					name: 'Body',
					value: 'body',
					description: 'Send credentials in body',
				},
				{
					name: 'Header',
					value: 'header',
					description: 'Send credentials as Basic Auth header',
				},
			],
		},
		{
			displayName: 'Authorize URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://developer.api.autodesk.com/authentication/v2/authorize',
			required: true,
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://developer.api.autodesk.com/authentication/v2/token',
			required: true,
		},
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			options: [
				{
					name: 'Authorization Code',
					value: 'authorizationCode',
				},
				{
					name: 'Client Credentials',
					value: 'clientCredentials',
				},
				{
					name: 'PKCE',
					value: 'pkce',
				},
			],
			default: 'authorizationCode',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			displayOptions: {
				show: {
					grantType: ['authorizationCode', 'pkce'],
				},
			},
			default: '',
			description:
				'For some services additional query parameters have to be set which can be defined here',
			placeholder: 'access_type=offline',
		},
	];
	oAuth2 = {
		authUrl: 'https://developer.api.autodesk.com/authentication/v2/authorize',
		accessTokenUrl: 'https://developer.api.autodesk.com/authentication/v2/token',
		authType: 'BODY',
		tokenType: 'Bearer',
		grantType: 'authorizationCode',
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.vaultServerUrl}}',
			url: '/AutodeskDM/Services/api/vault/v2/server',
			method: 'GET',
		},
	};
}
