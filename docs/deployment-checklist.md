# Deployment checklist

Deployment was not requested or performed. Do not treat a passing local build as release approval.

Run `npm run check:release` before considering deployment. It refreshes source-aware evidence and fails on missing production configuration, incomplete tool verification, failed/skipped full browser scenarios, missing lint/build evidence or critical/high dependency findings. Passing this local gate still requires live staging acceptance; the command never deploys anything.

- [x] Production build and current regression batch pass locally.
- [x] Admin session configuration fails closed; unsafe fallback removed.
- [x] Critical dependency findings removed by framework update; retain advisory report.
- [ ] Resolve remaining high/moderate dependency findings with compatibility tests.
- [x] Implement SSRF destination pinning, redirect validation and bounded AI/network transport; deterministic tests pass.
- [x] Repair inherited lint errors.
- [ ] Run CI successfully on GitHub and verify live staging transport/persistence.
- [ ] Validate remaining tool operations, invalid/large input, mobile and keyboard flows.
- [ ] Configure strong admin password/independent secret, protected MongoDB and required providers; verify real integrations without exposing credentials.
- [ ] Configure trusted ingress/shared throttling before multiple application instances.
- [x] Implement and locally test public origin, canonical/robots/sitemap/noindex policy and privacy disclosures.
- [ ] Configure real public origin and validate deployed crawling/indexing behavior.
- [ ] Complete operational monitoring, backups, restore checks and admin audit/limits enforcement.
- [ ] Obtain explicit authorization before publishing or deploying.
