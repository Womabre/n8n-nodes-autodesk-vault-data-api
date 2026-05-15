# n8n-nodes-autodesk-vault-data-api

This is an n8n community node. It lets you use Vault Data API in your n8n workflows.

Vault Data API provides a comprehensive set of RESTful endpoints that allow developers to interact with Vault data stored on the Vault server. This API is designed to facilitate the access, analysis, and manipulation of Vault data. The Vault APIs allow customers and partners to develop extensions on top of Vault, extending connectivity to Vault data to other tools and applications.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)
[Compatibility](#compatibility)  
[Usage](#usage) <!-- delete if not using this section -->  
[Resources](#resources)  
[Version history](#version-history) <!-- delete if not using this section -->

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

### Account

- Get All Groups
- Get All Users
- Get Group Account by Auth Type
- Get Group By ID
- Get Profile Attribute Definition by ID
- Get Profile Attribute Definitions
- Get Role by ID
- Get Roles
- Get User Account by Auth Type
- Get User Accounts
- Get User by ID

### Auth

- Create Session
- Delete Current Session
- Get Current Session

### Change Order

- Get All Change Orders
- Get All Related Files
- Get Associated Entities
- Get Change Order by ID
- Get Comment Attachments
- Get Comments

### File

- Download File Version Content
- Get Associated Change Orders
- Get Associated Item Versions
- Get File by ID
- Get File Version by ID
- Get File Version Content Metadata
- Get File Version History
- Get File Version Markup by ID
- Get File Version Markups
- Get File Version Signed URL
- Get File Version Thumbnail
- Get File Version Uses
- Get File Version Where Used
- Get File Versions
- Get LMV Root (bubble.json)
- Get Visualization Attachments

### Folder

- Get Folder by ID
- Get Folder Contents
- Get Subfolders

### Informational

- Get All Knowledge Vaults
- Get OpenAPI Specification
- Get Server Info
- Get Vault By ID

### Items

- Get Associated Files
- Get Item
- Get Item Associated Change Orders
- Get Item History
- Get Item Version BOM
- Get Item Version by ID
- Get Item Version Thumbnail
- Get Item Version Where Used
- Get Item Versions
- Get Items

### Job

- Add Job
- Get Job by ID
- Get Job Queue Enabled

### Link

- Get Link by ID
- Get Links

### Option

- Create System Option
- Create Vault Option
- Delete System Option
- Delete Vault Option
- Get All Vault Options
- Get System Option
- Get System Options
- Get Vault Option
- Update System Option
- Update Vault Option

### Property

- Get All Property Definitions
- Get Property Definition by ID

### Search

- Advanced Search
- Basic Search

---

Here is your **full CRUD-compliant operation list**, renamed to strictly follow **n8n's node structure and naming conventions**, based on:

- ✅ Operation types: `Create`, `Get`, `Get Many`, `Update`, `Delete`, `Upsert`
- ✅ Object-based naming (e.g., `Get File`, `Get Many Files`)
- ✅ Entity-specific naming for sub-resources (e.g., `Get Many Comments`)
- ❌ Avoids verbs like "List", "Download", "Generate" in operation names

---

## ✅ **Account**

### Create

_(No Create operations listed in original)_

### Get

- Get Group
- Get Group Account by Auth Type
- Get Profile Attribute Definition
- Get Role
- Get User
- Get User Account by Auth Type

### Get Many

- Get Many Groups
- Get Many Users
- Get Many Profile Attribute Definitions
- Get Many Roles
- Get Many User Accounts

---

## ✅ **Auth**

### Create

- Create Session

### Get

- Get Session

### Delete

- Delete Session

---

## ✅ **Change Order**

### Get

- Get Change Order
- Get Many Change Order Comments
- Get Many Change Order Attachments

### Get Many

- Get Many Change Orders
- Get Many Related Files
- Get Many Associated Entities

---

## ✅ **File**

### Get

- Get File
- Get File Version
- Get File Version Content
- Get File Version Metadata
- Get File Version History
- Get File Version Markup
- Get File Version Thumbnail
- Get File Version Signed URL
- Get File Version Uses
- Get File Version Where Used
- Get LMV Bubble JSON

### Get Many

- Get Many File Versions
- Get Many File Version Markups
- Get Many Visualization Attachments
- Get Many Associated Change Orders
- Get Many Associated Item Versions

---

## ✅ **Folder**

### Get

- Get Folder

### Get Many

- Get Folder Contents
- Get Subfolders

---

## ✅ **Informational**

### Get

- Get OpenAPI Specification
- Get Server Info
- Get Vault

### Get Many

- Get Many Knowledge Vaults

---

## ✅ **Item**

### Get

- Get Item
- Get Item Version
- Get Item Version BOM
- Get Item Version Thumbnail
- Get Item Version Where Used
- Get Item History

### Get Many

- Get Many Items
- Get Many Item Versions
- Get Many Associated Files
- Get Many Associated Change Orders

---

## ✅ **Job**

### Create

- Create Job

### Get

- Get Job
- Get Job Queue Status

---

## ✅ **Link**

### Get

- Get Link

### Get Many

- Get Many Links

---

## ✅ **Option**

### Create

- Create System Option
- Create Vault Option

### Get

- Get System Option
- Get Vault Option

### Get Many

- Get Many System Options
- Get Many Vault Options

### Update

- Update System Option
- Update Vault Option

### Delete

- Delete System Option
- Delete Vault Option

---

## ✅ **Property**

### Get

- Get Property Definition

### Get Many

- Get Many Property Definitions

---

This list now **fully adheres to n8n's node operation guidelines**.

Would you like this exported as a JSON `options[]` structure for use in a custom node? Or split by node file structure (`resources/account/operations.ts`, etc.)?

---

## Credentials

_If users need to authenticate with the app/service, provide details here. You should include prerequisites (such as signing up with the service), available authentication methods, and how to set them up._

## Compatibility

_State the minimum n8n version, as well as which versions you test against. You can also include any known version incompatibility issues._

## Usage

_This is an optional section. Use it to help users with any difficult or confusing aspects of the node._

_By the time users are looking for community nodes, they probably already know n8n basics. But if you expect new users, you can link to the [Try it out](https://docs.n8n.io/try-it-out/) documentation to help them get started._

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- _Link to app/service documentation._

## Version history

_This is another optional section. If your node has multiple versions, include a short description of available versions and what changed, as well as any compatibility impact._
