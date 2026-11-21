# Autodesk Vault Data API node

An n8n community node that exposes the Autodesk Vault Data API v2 as resources and operations a workflow can call.

## Language

### Node structure

**Resource**:
A kind of Vault entity or service the node groups operations under, such as File, Item or Change Order.
_Avoid_: entity type, category

**Operation**:
One call a user can pick for a resource, mapping to exactly one Vault Data API endpoint.
_Avoid_: action, endpoint (the endpoint is what an operation calls, not the operation)

**Operation definition**:
The single description of an operation: the endpoint it calls, the fields it shows, how fields map onto the request, and its response kind.
_Avoid_: routing entry, operation option

**Field**:
One input an operation shows in the node's UI, such as Vault Name or Released Only.
_Avoid_: parameter, property (both collide with n8n's internal terms and with Vault job params)

**Shared field**:
A field more than one operation declares with the same name and the same shape, so it appears once per operation but is defined once.
_Avoid_: common parameter, global parameter

### Responses

**Response kind**:
What an operation's response is, which decides how it becomes workflow items: single, collection, empty, binary or headers.
_Avoid_: output type, response format

**Collection**:
A response that lists results under `results` and can continue on further pages; every result becomes its own workflow item.
_Avoid_: list, page, Get Many result

**Legacy wrapper**:
The node version 1 output of two collection operations, which returned the whole response as one item instead of one item per result.
_Avoid_: v1 format, raw response
