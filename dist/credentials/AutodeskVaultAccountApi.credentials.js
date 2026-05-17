"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutodeskVaultAccountApi = void 0;
class AutodeskVaultAccountApi {
    constructor() {
        this.name = 'autodeskVaultAccountApi';
        this.displayName = 'Vault Account API';
        this.documentationUrl = 'https://aps.autodesk.com/en/docs/vaultdataapi/v2/developers_guide/basics/authentication/';
        this.icon = 'file:AutodeskVaultDataApi.svg';
        this.properties = [
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
                    password: true,
                },
                default: '',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '=Bearer {{$credentials.accessToken}}',
                },
            },
        };
        this.test = {
            request: {
                method: 'GET',
                url: '={{$credentials.vaultServerUrl}}/AutodeskDM/Services/api/vault/v2/sessions/@current',
                headers: {
                    Authorization: '=Bearer {{$credentials.accessToken}}',
                },
            },
        };
    }
    async preAuthentication(credentials) {
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
            throw new Error(`Login failed: no accessToken returned. Response: ${JSON.stringify(loginResponse)}`);
        }
        return {
            accessToken: loginResponse.accessToken,
        };
    }
}
exports.AutodeskVaultAccountApi = AutodeskVaultAccountApi;
//# sourceMappingURL=AutodeskVaultAccountApi.credentials.js.map