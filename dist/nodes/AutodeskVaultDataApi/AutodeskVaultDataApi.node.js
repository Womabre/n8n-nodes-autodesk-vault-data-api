"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutodeskVaultDataApi = void 0;
const listSearch_1 = require("./methods/listSearch");
const changeOrders = __importStar(require("./operations/changeOrder"));
const files = __importStar(require("./operations/file"));
const folders = __importStar(require("./operations/folder"));
const group = __importStar(require("./operations/group"));
const items = __importStar(require("./operations/item"));
const jobs = __importStar(require("./operations/job"));
const links = __importStar(require("./operations/links"));
const options = __importStar(require("./operations/option"));
const profile = __importStar(require("./operations/profile"));
const property = __importStar(require("./operations/property"));
const role = __importStar(require("./operations/role"));
const search = __importStar(require("./operations/search"));
const server = __importStar(require("./operations/server"));
const session = __importStar(require("./operations/session"));
const user = __importStar(require("./operations/user"));
const vault = __importStar(require("./operations/vault"));
const shared = __importStar(require("./parameters/shared-parameters"));
class AutodeskVaultDataApi {
    constructor() {
        this.methods = {
            listSearch: {
                searchFolders: listSearch_1.searchFolders,
                searchFileMasters: listSearch_1.searchFileMasters,
                searchFileVersions: listSearch_1.searchFileVersions,
                searchItemMasters: listSearch_1.searchItemMasters,
                searchItemVersions: listSearch_1.searchItemVersions,
                searchMarkups: listSearch_1.searchMarkups,
            },
        };
        this.description = {
            displayName: 'Autodesk Vault Data API',
            name: 'autodeskVaultDataApi',
            usableAsTool: true,
            version: 1,
            group: ['transform'],
            icon: 'file:AutodeskVaultDataApi.svg',
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Interact with the Autodesk Vault Data API',
            defaults: {
                name: 'Autodesk Vault Data API',
            },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [
                {
                    name: 'autodeskVaultDataOAuth2Api',
                    required: true,
                    displayOptions: {
                        show: {
                            authentication: ['OAuth2'],
                        },
                    },
                },
                {
                    name: 'autodeskVaultAccountApi',
                    required: true,
                    displayOptions: {
                        show: {
                            authentication: ['VaultLogin'],
                        },
                    },
                },
            ],
            requestDefaults: {
                baseURL: '={{$credentials.vaultServerUrl}}',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            },
            properties: [
                {
                    displayName: 'Authentication Method',
                    name: 'authentication',
                    type: 'options',
                    options: [
                        { name: 'Autodesk ID (3-Legged OAuth2)', value: 'OAuth2' },
                        { name: 'Vault Account', value: 'VaultLogin' },
                    ],
                    default: 'VaultLogin',
                    description: 'Choose the authentication method',
                },
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        { name: 'Change Order', value: 'changeOrders' },
                        { name: 'File', value: 'files' },
                        { name: 'Folder', value: 'folders' },
                        { name: 'Group', value: 'group' },
                        { name: 'Item', value: 'items' },
                        { name: 'Job', value: 'jobs' },
                        { name: 'Link', value: 'links' },
                        { name: 'Option', value: 'options' },
                        { name: 'Profile', value: 'profile' },
                        { name: 'Property', value: 'property' },
                        { name: 'Role', value: 'role' },
                        { name: 'Search', value: 'search' },
                        { name: 'Server', value: 'server' },
                        { name: 'Session', value: 'session' },
                        { name: 'User', value: 'user' },
                        { name: 'Vault', value: 'vault' },
                    ],
                    default: 'server',
                },
                ...changeOrders.operations,
                ...files.operations,
                ...folders.operations,
                ...group.operations,
                ...items.operations,
                ...jobs.operations,
                ...links.operations,
                ...options.operations,
                ...profile.operations,
                ...property.operations,
                ...role.operations,
                ...search.operations,
                ...server.operations,
                ...session.operations,
                ...user.operations,
                ...vault.operations,
                ...shared.parameters,
            ],
        };
    }
}
exports.AutodeskVaultDataApi = AutodeskVaultDataApi;
//# sourceMappingURL=AutodeskVaultDataApi.node.js.map