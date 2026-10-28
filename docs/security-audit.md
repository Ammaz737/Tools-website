# Security audit and remediation queue

Reviewed 2026-10-11 against the current working tree. Implemented controls and deterministic regression coverage are distinct from verification of a deployed system. See [SECURITY_REPORT.md](SECURITY_REPORT.md) for the boundaries of this review.

| ID | Severity | Evidence / impact | State |
|---|---|---|---|
| SEC-01 | Critical | Previous insecure default admin signing secret allowed forged sessions | Fixed: authentication fails closed without a distinct secret of at least 32 characters; strict token shape, signature and age checks; HTTP-only cookie with production Secure flag |
| SEC-02 | High | Private IP/DNS targets, redirect traversal and DNS rebinding in network tools | Implemented: HTTP(S)-only URLs, credentials/unsafe-port rejection, reserved IPv4/IPv6 rejection, all-answer DNS validation, approved-IP connection pinning, per-hop redirect checks and link-request validation. SSL pins its target too. Deterministic regressions pass; deployed egress remains unverified |
| SEC-03 | High | API abuse and resource exhaustion | Partial: login 5/minute, AI 10/minute, network tools 30/minute; bounded request/provider bodies and deadlines; bounded safe HTTP/SSL concurrency and four concurrent crawler links. Limits are process-local; shared ingress/store and broader document processing budgets remain pending |
| SEC-04 | High | Public tools restored as active on database failure; processing APIs ignored disabled state | Implemented: public reads fail closed on database errors; shared API guard enforces disabled/maintenance/input settings; network and AI calls consume configured deadlines. Browser-only processing settings are a user-interface boundary, not a server sandbox |
| SEC-05 | High | Gemini credentials in URL and raw provider error logs | Implemented: Gemini key is an HTTP header, external AI redirects are refused, errors are sanitized, provider responses are bounded and validated. Credentialed live integration remains unverified |
| SEC-06 | Medium | Missing same-origin checks and persistent configuration history | Implemented: admin login/logout/configuration mutations require matching Origin; configuration patches are validated and audit intent is stored before mutation. Audit and update are separate database operations, so an intent can exist without a successful update; production MongoDB verification remains pending |
| SEC-07 | Medium | Archive expansion, image pixels, document pages and memory budgets across tools | Open: selected input/file limits exist, but uniform parser/archive/pixel/page/memory enforcement and adversarial document coverage are incomplete |
| SEC-08 | High | npm dependency advisory scan | Previous saved snapshot: 0 critical, 13 high, 4 moderate. Next.js and matching ESLint config are 16.4.0. Remaining dependency findings need supported upgrades/replacements and reachability assessment |

The advisory counts above come from the saved [dependency-audit.json](dependency-audit.json), not a fresh registry audit in this documentation step. Findings are dependency-tree advisories, not 17 reproduced exploits. Do not apply forced dependency downgrades without verifying compatibility.

Deployment still requires independent strong admin credentials, a secret store, trusted proxy configuration, shared abuse protection, restricted egress, and production verification of MongoDB and external providers. Local deterministic tests do not certify these deployment properties.


## 2026-10-18 checkpoint
Production dependency audit now has zero vulnerabilities; full tree has five high development-tool findings. Native Office adapter adds bounded upload/output/deadline/concurrency and rejects redirects; dedicated Copyleaks adds consent, authenticated webhook and hashed random polling tokens, with 24-hour Atlas TTL records and no stored input text. Mocked contracts pass; user confirms live credentials are not set. Process-local rate limits still require distributed production enforcement before paid-provider exposure.


2026-10-18 additional hardening: removed process-wide DNS mutation and manual Atlas SRV rewriting; bounded native driver connections and sanitized diagnostics. Added atomic shared Atlas global daily request caps for AI/plagiarism, with production fail-closed behavior, majority writes, TTL cleanup and UTC reset. Added same-origin enforcement for valid AI submissions. Deterministic quota/DNS/origin contracts pass; live Atlas concurrency/failover remains unverified. Other ingress controls still require hosting acceptance. See PROVIDER_QUOTAS.md.


2026-10-22 installation/live checkpoint: authenticated local native Office worker installed; four actual conversion fixtures pass with independent rendered-page review. Fixed stale spreadsheet cache via reviewed OOXML recalculation setting and cold startup via warm renderer initialization. Blank admin secrets initialized privately; actual HTTP authentication5/5 passes. OpenAI private configuration is now present and ten synthetic provider calls returnedHTTP200; see AI_LIVE_REPORT.md for semantic review and limits. Atlas/Copyleaks and public production acceptance remain pending.

## 2026-10-22 remaining-test continuation

See CROSS_BROWSER_REPORT.md. A reproduced pre-hydration lost-input defect was repaired in the shared dispatcher with native disabled controls until handlers commit. WebKit latest166 scenario outcomes pass (165 full-run passes plus1 targeted actual-byte transport recheck). Firefox164 pre-fix outcomes and16 current focused regressions pass; Chromium16 current focused regressions pass. Earlier interrupted/failed logs remain preserved. Actual Fyp Atlas dashboard confirms active cluster/current IP allowance and matching configuration, but system DNS fails and all three direct database-port TCP probes time out. Actual production-mode AI route fails closed503 with zero provider calls. No Atlas writes or new paid AI calls occurred. Next acceptance requires a working Atlas network path, then persistence/quota/failover tests, plus Copyleaks/public HTTPS and deployed acceptance.
