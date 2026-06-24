import { INodeType, INodeTypeDescription } from 'n8n-workflow';
import { searchFileMasters, searchFileVersions, searchFolders, searchItemMasters, searchItemVersions, searchMarkups } from './methods/listSearch';
export declare class AutodeskVaultDataApi implements INodeType {
    methods: {
        listSearch: {
            searchFolders: typeof searchFolders;
            searchFileMasters: typeof searchFileMasters;
            searchFileVersions: typeof searchFileVersions;
            searchItemMasters: typeof searchItemMasters;
            searchItemVersions: typeof searchItemVersions;
            searchMarkups: typeof searchMarkups;
        };
    };
    description: INodeTypeDescription;
}
