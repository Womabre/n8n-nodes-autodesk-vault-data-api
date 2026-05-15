import { Icon, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';
export declare class AutodeskVaultDataOAuth2Api implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    icon: Icon;
    extends: string[];
    properties: INodeProperties[];
    oAuth2: {
        authUrl: string;
        accessTokenUrl: string;
        authType: string;
        tokenType: string;
        grantType: string;
    };
    test: ICredentialTestRequest;
}
