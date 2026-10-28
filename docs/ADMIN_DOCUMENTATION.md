# Admin operations

The dashboard at `/admin` uses a shared administrator password and provides tool search/category filtering, page-open counters, active/inactive switches, maintenance switches, and server-tool input-character and timeout fields. Configuration persists in MongoDB. These controls do not establish customer accounts or paid entitlements.

## Authentication and setup

Set `ADMIN_PASSWORD` and a distinct, random `ADMIN_SESSION_SECRET` containing at least 32 characters. Missing, short, or reused secrets disable login and reject sessions. Generate the secret cryptographically and keep credentials in protected environment configuration. Rotating the secret invalidates existing cookies. Sessions otherwise last seven days; cookies use HttpOnly and SameSite=Lax, with Secure in production.

Configure `MONGODB_URI` for persistent settings and counters. When MongoDB is absent, local public tools retain their default active/non-maintenance state and counters are not persisted; dashboard writes are disabled. When a configured database fails, public tool lists/details fail closed and guarded execution returns 503 rather than assuming the tool is enabled. Restoring database connectivity is required to recover availability. Database failure can therefore make public tool routes unavailable.

No live MongoDB connection, persistent mutation, or login using deployment credentials is claimed by the deterministic regression tests. They use injected status readers, isolated credentials, or explicitly blank server configuration.

## Implemented settings

| Setting | Accepted value | Dashboard | Enforcement |
| --- | --- | --- | --- |
| `isActive` | Boolean | Active/inactive switch | Inactive tools are hidden publicly; guarded APIs return 403. |
| `maintenance` | Boolean | Maintenance switch | Maintenance tools are hidden publicly; guarded APIs return 503. |
| `maxInputChars` | Integer 1–1,000,000 | Server-tool field | Guarded handlers enforce measured input lengths; AI also retains its absolute 20,000-character limit. |
| `timeoutMs` | Integer 1,000–120,000 | Server-tool field labeled AI/network timeout | Supported AI/network operations consume the setting; network routes cap it at 30,000 ms. This is not a global job-duration guarantee. |
| `maxFileSizeMB` | Integer 1–100 | No field | API accepts/persists it; guard supports measured file bytes, but no active server upload handler currently supplies them. It is not an enforced browser-upload limit. |

Numeric dashboard edits save when leaving the field. Blank optional fields mean the setting has not been configured; clearing a field does not remove an existing database setting. Unsupported keys, noninteger numbers, and out-of-range values are rejected. Daily quota and premium fields are unsupported.

Authenticated configuration writes use `PATCH /api/admin/tools/:id`, require an exact same-origin `Origin` header, and accept a bounded JSON body. Unknown tools return 404, invalid configuration returns 400, and failed persistence returns 503. Admin reads require authentication.

## Execution coverage and client limits

`requireToolAccess` resolves the registered tool's database status and returns 404 for an unknown tool, 403 for disabled status, 503 for maintenance/database failure, and 413 when a supplied input measurement exceeds a configured limit. The AI endpoint validates task-to-tool mappings before using the guard. Crawl, DNS, WHOIS, SSL, IP, email validation, currency rates, and tool usage endpoints also check availability.

Most document/image and other tools process data in the browser. Hiding their page or blocking their usage-counter endpoint does not stop JavaScript already loaded in a visitor's browser. Server configuration does not provide revocation, execution timeouts, file-size enforcement, quotas, or successful-execution metering for these browser-only operations. Tool usage counts track page-open/usage requests, not verified successful conversions or downloads.

## Audit records

Configuration changes insert an intent record into the separate `tool_config_audit` collection before the tool status update. Records contain tool ID, the shared actor label `admin`, changed configuration fields, and timestamp. They do not contain provider secrets or uploaded file bytes. An audit-insert failure prevents the update; a later update failure can leave an intent record for a change that did not apply. There is no transaction, completion marker, before/after history, individual administrator identity, audit viewer, or audit-export endpoint yet. Inspect records through authorized database operations and verify current tool status before treating an intent as a completed change.

## Throttling

Login allows five attempts per minute, AI ten requests per minute, and guarded network scopes thirty requests per minute **per application process**. These are fixed request-rate limits, not configurable daily customer quotas. Without a trusted IP header, each scope uses a shared bucket. `RATE_LIMIT_IP_HEADER` may name one header only when the reverse proxy strips untrusted values and overwrites it with the client's IP. Forwarded chains are unsupported.

Restarting or scaling the application creates new buckets. A shared ingress limiter or durable counter store remains necessary for reliable multi-instance enforcement. There is no guest/customer daily budget, billing integration, premium tier, or user-level quota identity.

## Pending capabilities

Role-based/multi-user admin access, durable daily quotas, distributed throttling, paid entitlements, provider-secret management in the dashboard, SEO/ad/monetization editing, bulk operations, successful-execution analytics, browser-side quota enforcement, file-limit UI, configuration removal/reset, audit browsing/export, and transactional audit completion tracking remain unimplemented. Provider configuration is environment-based. Validate deployment credentials, proxy origin handling, and MongoDB persistence in an authorized staging environment before relying on those integrations.
