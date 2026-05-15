# n8n-nodes-autodesk-vault-data-api

This is an n8n community node for interacting with the [Autodesk Vault Data API](https://aps.autodesk.com/en/docs/vaultdataapi/v2/). It lets you access, search, and manage data stored in Autodesk Vault directly from your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Resources](#resources)  

---

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

---

## Operations

### Change Order

| Operation                    | Description                                         |
| ---------------------------- | --------------------------------------------------- |
| Get Change Order             | Retrieve a change order by ID                       |
| Get Many Change Orders       | List change orders with optional filters            |
| Get Many Associated Entities | List files and items associated with a change order |
| Get Many Comment Attachments | List attachments on a change order comment          |
| Get Many Comments            | List comments on a change order                     |
| Get Many Related Files       | List files related to a change order                |

### File

| Operation                                       | Description                                                                         |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| Get File                                        | Retrieve a file by master ID, optionally returning the latest released version only |
| Get File Version                                | Retrieve a specific file version by ID                                              |
| Get File Version Content                        | Download the binary content of a file version                                       |
| Get File Version LMV Bubble JSON                | Retrieve the bubble.json metadata for Large Model Viewer (DWF/DWFx files)           |
| Get File Version Markup                         | Retrieve a specific markup on a file version                                        |
| Get File Version Metadata                       | Retrieve content headers without downloading the file                               |
| Get File Version Signed URL                     | Generate a time-limited signed download URL                                         |
| Get File Version Thumbnail                      | Retrieve the thumbnail image for a file version                                     |
| Get File Version Uses                           | List dependencies and attachments of a file version                                 |
| Get File Version Where Used                     | List parent files that reference a file version                                     |
| Get File Version History                        | Retrieve the version history of a file                                              |
| Get Many File Version Associated Change Orders  | List change orders driving a file                                                   |
| Get Many File Version Associated Item Versions  | List item versions assigned to a file version                                       |
| Get Many File Version Markups                   | List all markups on a file version                                                  |
| Get Many File Version Visualization Attachments | List visualization attachments for a file version                                   |
| Get Many File Versions                          | List file versions with optional filters                                            |

### Folder

| Operation                | Description                        |
| ------------------------ | ---------------------------------- |
| Get Folder               | Retrieve a folder by ID            |
| Get Many Folder Contents | List files and items in a folder   |
| Get Many Subfolders      | List direct subfolders of a folder |

### Group

| Operation                      | Description                                                   |
| ------------------------------ | ------------------------------------------------------------- |
| Get Group                      | Retrieve a group by ID                                        |
| Get Group Account by Auth Type | Retrieve the group account for a specific authentication type |
| Get Many Groups                | List all groups on the server                                 |

### Item

| Operation                                      | Description                                        |
| ---------------------------------------------- | -------------------------------------------------- |
| Get Item                                       | Retrieve an item by master ID                      |
| Get Item History                               | Retrieve the version history of an item            |
| Get Item Version                               | Retrieve a specific item version by ID             |
| Get Item Version BOM                           | Retrieve the Bill of Materials for an item version |
| Get Item Version Thumbnail                     | Retrieve the thumbnail image for an item version   |
| Get Item Version Where Used                    | List parent items that reference an item version   |
| Get Many Item Version Associated Change Orders | List change orders associated with an item         |
| Get Many Item Version Associated Files         | List files assigned to an item version             |
| Get Many Item Versions                         | List item versions with optional filters           |
| Get Many Items                                 | List all items in a vault                          |

### Job

| Operation            | Description                                        |
| -------------------- | -------------------------------------------------- |
| Create Job           | Add a new job to the job queue                     |
| Get Job              | Retrieve a job by ID                               |
| Get Job Queue Status | Check whether the job queue is enabled for a vault |

### Link

| Operation      | Description               |
| -------------- | ------------------------- |
| Get Link       | Retrieve a link by ID     |
| Get Many Links | List all links in a vault |

### Option

| Operation               | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| Create System Option    | Create a new system-level option                       |
| Create Vault Option     | Create a new vault-level option                        |
| Delete System Option    | Delete a system option by ID                           |
| Delete Vault Option     | Delete a vault option by ID                            |
| Get System Option       | Retrieve a system option by ID                         |
| Get Many System Options | List system options, optionally filtered by name       |
| Get Vault Option        | Retrieve a vault option by ID                          |
| Get Many Vault Options  | List vault options, optionally filtered by name prefix |
| Update System Option    | Update the value of a system option                    |
| Update Vault Option     | Update the value of a vault option                     |

### Profile

| Operation                              | Description                                   |
| -------------------------------------- | --------------------------------------------- |
| Get Profile Attribute Definition       | Retrieve a profile attribute definition by ID |
| Get Many Profile Attribute Definitions | List profile attribute definitions            |

### Property

| Operation                     | Description                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------- |
| Get Property Definition       | Retrieve a property definition by ID                                          |
| Get Many Property Definitions | List property definitions, optionally filtered by entity class or system name |

### Role

| Operation      | Description                  |
| -------------- | ---------------------------- |
| Get Role       | Retrieve a role by ID        |
| Get Many Roles | List all roles on the server |

### Search

| Operation       | Description                                                      |
| --------------- | ---------------------------------------------------------------- |
| Search          | Find entities by query string across properties or content       |
| Advanced Search | Search with structured criteria, folder scoping, and custom sort |

### Server

| Operation       | Description                                      |
| --------------- | ------------------------------------------------ |
| Get Server Info | Retrieve server metadata such as product version |

### Session

| Operation      | Description                                                      |
| -------------- | ---------------------------------------------------------------- |
| Get Session    | Retrieve a session by ID (use `@current` for the active session) |
| Delete Session | Delete a session (logs out)                                      |

### User

| Operation                     | Description                                             |
| ----------------------------- | ------------------------------------------------------- |
| Get User                      | Retrieve a user by ID                                   |
| Get User Account by Auth Type | Retrieve the account for a user and authentication type |
| Get Many Users                | List all users on the server                            |
| Get Many User Accounts        | List accounts associated with a user                    |

### Vault

| Operation       | Description                             |
| --------------- | --------------------------------------- |
| Get Vault       | Retrieve a knowledge vault by ID        |
| Get Many Vaults | List all knowledge vaults on the server |

---

## Credentials

The node supports two authentication methods. Select one when adding the node to your workflow.

### Vault Account

Authenticates using a Vault username and password. The node logs in automatically and manages the session token.

Required fields:

- **Vault Server URL** — base URL of your Vault server (e.g. `https://vault.yourdomain.com`)
- **Vault Name** — the name of the Vault database to log into
- **Username** — your Vault username
- **Password** — your Vault password
- **App Code** _(optional)_ — application identifier sent with the login request, defaults to `n8n`

### Autodesk ID (3-Legged OAuth2)

Authenticates via Autodesk Platform Services using OAuth2 authorization code flow. Requires an app registered in the [Autodesk Developer Portal](https://aps.autodesk.com/en/docs/oauth/v2/tutorials/create-app/).

Required fields:

- **Vault Server URL** — base URL of your Vault server
- **Client ID** — from your APS application
- **Client Secret** — from your APS application
- **Scope** — OAuth2 scopes (default: `data:read data:write`)

---

## Compatibility

- **Minimum n8n version:** requires `n8n-workflow ^2.0.0`
- **Node.js:** `>=20.15`
- Tested against Autodesk Vault Data API v2

---

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Autodesk Vault Data API reference](https://aps.autodesk.com/en/docs/vaultdataapi/v2/)
- [Autodesk Platform Services OAuth2 guide](https://aps.autodesk.com/en/docs/oauth/v2/developers_guide/overview/)
