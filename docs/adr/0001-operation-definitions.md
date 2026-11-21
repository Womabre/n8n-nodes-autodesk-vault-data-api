---
status: accepted
---

# Generate the node description from operation definitions

The node's 92 operations used to be split across hand-written routing in `operations/<resource>.ts` and hand-kept operation lists (`displayOptions`, `PAGINATED_OPERATIONS`) in a 2,372-line parameter file, joined only by parameter-name strings; that split let fields be referenced but not shown, collections that could not paginate, and wrong path IDs ship (PR #15). We decided that each operation gets one operation definition (path, fields, query mapping, body builder, response kind), and that the n8n `properties` are generated from those definitions by a builder that refuses to build an inconsistent node, even though every n8n example writes the description as literals.

## Considered Options

- **Keep literals, guard with `wiring.test.ts`.** Catches drift after the fact, cannot see fields read inside `preSend`, and leaves every new operation touching several distant lists.
- **Only move single-use fields next to their operation.** Improves locality, but the string links between routing and fields stay.

## Consequences

- The n8n lint rules and the community package scanner read the source's shape, not the built node, so they skip anything built at runtime. Field definitions are therefore passed to the builder as complete literals, and a runtime test runs the checks the generated operation options lose (option sorting, duplicates, `action` casing, Get Many naming).
- Helper-built objects that look like a parameter but lack `default` fail `node-param-default-missing`, and the scanner ignores `eslint-disable` comments; see commit 213f9a4.
- An operation whose response does not fit a response kind (the LMV bubble poll) keeps raw `routing` as an explicit escape hatch.
