# Admin operations

See [ADMIN_DOCUMENTATION.md](ADMIN_DOCUMENTATION.md) for the maintained admin operations guide.

The dashboard now supports persisted active/inactive and maintenance switches, server input-character limits, and supported AI/network timeouts. Configuration writes require admin authentication, same-origin JSON requests, validated values, and an audit-intent insert before mutation. MongoDB outages fail closed for public availability when a database is configured.

The audit collection records intent, not guaranteed successful changes. Request throttling remains process-local. Client-only tools cannot be revoked after their JavaScript has loaded, and dashboard settings do not enforce browser-side file budgets or execution quotas. Roles, daily quotas, paid tiers, provider-secret editing, SEO/ad editing, audit browsing, and transactional audit completion remain pending. Live MongoDB persistence and deployment credentials have not been verified by isolated regression tests.
