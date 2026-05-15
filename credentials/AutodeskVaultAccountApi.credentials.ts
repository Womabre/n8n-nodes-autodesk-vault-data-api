import {
	IAuthenticateGeneric,
	Icon,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestHelper,
	INodeProperties,
} from 'n8n-workflow';

export class AutodeskVaultAccountApi implements ICredentialType {
	name = 'autodeskVaultAccountApi';
	displayName = 'Vault Account API';
	documentationUrl = 'https://aps.autodesk.com/en/docs/vaultdataapi/v2/developers_guide/basics/authentication/';
	icon: Icon = 'file:AutodeskVaultDataApi.svg';
	properties: INodeProperties[] = [
		{
			displayName: 'Vault Name',
			name: 'vault',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Username',
			name: 'userName',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
		{
			displayName: 'App Code',
			name: 'appCode',
			type: 'string',
			default: 'n8n',
		},
		{
			displayName: 'Vault Server URL',
			name: 'vaultServerUrl',
			type: 'string',
			default: '',
			placeholder: 'e.g. https://vault.yourdomain.com',
			required: true,
		},
		{
			displayName: 'Session Token',
			name: 'accessToken',
			type: 'hidden',
			typeOptions: {
				expirable: true,
			},
			default: '',
		},
	];

	async preAuthentication(
		this: IHttpRequestHelper,
		credentials: ICredentialDataDecryptedObject,
	): Promise<{ accessToken: string }> {
		const { vaultServerUrl, vault, userName, password, appCode } = credentials;

		const loginResponse = await this.helpers.httpRequest({
			method: 'POST',
			url: `${vaultServerUrl}/AutodeskDM/Services/api/vault/v2/sessions`,
			body: {
				input: {
					vault: vault,
					userName: userName,
					password: password,
					appCode: appCode || 'n8n',
				},
			},
			json: true,
		});

		if (!loginResponse.accessToken) {
			throw new Error('Login failed: no accessToken returned.');
		}

		return {
			accessToken: loginResponse.accessToken,
		};
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			url: '={{$credentials.vaultServerUrl}}/AutodeskDM/Services/api/vault/v2/sessions/@current',
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};
}
