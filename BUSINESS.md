# Wallet8 E2E - Business Requirements & Functionality

> Audience: product owners, QA leads, and anyone evaluating what the
> **Wallet8 e2e harness** proves about the business. For the vertical's
> standards baseline read the `wallet8` repository's `BUSINESS.md`.

## 1. Business Purpose

A wallet's promises are only credible if something proves them on every
change. This harness is that proof: it drives the real browser UI the way
a user would and asserts the outcomes the business cares about.

It exists so that:

- **"The wallet works" is a measured statement.** The happy path and the
  failure paths are executed on every run, not asserted in a document.
- **The consent guarantee is tested, not trusted.** The harness verifies
  that the claim set is shown before disclosure and that a decline is a
  decline.
- **The failure surfaces are real.** A wallet that fails silently is worse
  than one that fails loudly; the negative specs prove each failure
  reaches a screen.
- **Users are never simulated by bypassing the product.** Every setup step
  goes through the UI or the platform BFF proxy - no direct database
  writes, no direct backend calls. A passing run describes what a customer
  would experience.

## 2. Business Scope (What the Harness Provides)

| # | Capability | What the business gets |
|---|---|---|
| 1 | Boot check | Confirms the app reaches the vault - the product's front door |
| 2 | Issuance round | Scans an offer URI and confirms the credential lands in the vault |
| 3 | Presentation round | Scans a verifier request and confirms it resolves to the consent screen |
| 4 | Negative: bad signature | Confirms a forged request reaches the error screen |
| 5 | Negative: missing nonce | Confirms a replayed request reaches the error screen |
| 6 | Negative: unsatisfiable query | Confirms an impossible request reaches the error screen |
| 7 | Negative: decline | Confirms a decline answers `access_denied`, never an empty presentation |

**What the harness does NOT own (business boundary):**

| Out of scope | Owned by |
|---|---|
| Protocol implementation | `wallet8-sdk`, `wallet8-flutter` |
| The product itself | `Wallet8:Holder`, `Wallet8:Wallet` |
| Platform-level E2E coverage | the platform's own `sentin8-e2e` |
| Load or performance testing | not yet owned |

## 3. Business Capabilities

| Capability | Business rule |
|---|---|
| Exercise the real product | The harness interacts through the browser UI and the BFF proxy only |
| Test outcomes, not internals | Assertions target what the user sees and the result the protocol produced |
| Cover failures | Every negative path in the business rules has a spec |
| Stay honest | No fixture writes a database row or calls a backend directly |

## 4. Business Events (Outbound)

None. The harness consumes the product; it emits no domain events.

## 5. Business Rules & Invariants

1. **No direct database access** in any spec, fixture, or helper.
2. **No direct backend calls** other than the BFF proxy.
3. **No privilege bypass**: a test user acquires permissions through real
   flows only.
4. **Every business-critical negative path has a spec.**
5. **A green run means the user-visible product works** - not that an
   internal shortcut passed.

## 6. Target-User Roles & Use Cases

| Persona | Use case |
|---|---|
| QA / release engineer | Confirms a change did not break issuance, presentation, or consent |
| Developer | Runs the suite locally before pushing |
| Product owner | Reads the spec names as the definition of what the product promises |
| Compliance reviewer | Sees the negative paths - the ones that matter in audits - actively tested |

## 7. KPIs / Success Criteria

| KPI | Signal |
|---|---|
| Coverage of business rules | Every rule in the wallet's business rules has at least one spec |
| Signal quality | Failures point at a user-visible defect, not a flaky fixture |
| Integrity | Zero direct database or backend access in the harness |
| Speed | The suite completes fast enough to gate every change |

## 8. Dependencies & Reliance on Other Services

| Dependency | Why |
|---|---|
| `Wallet8:Wallet` | The app under test |
| `Wallet8:Holder` | The backend the app drives |
| Sentin8:Auth | The issuer and verifier the flows exercise |
| Sentin8:BFF | The proxy the harness uses for any API-level setup |
| Playwright | The browser automation |

## 9. Acceptance Criteria

1. The boot spec passes: the app reaches the vault.
2. The issuance spec passes: an offer URI lands a credential in the vault.
3. The presentation spec passes: a verifier request reaches the consent
   screen.
4. All four negative specs pass with their prescribed outcomes.
5. The suite runs against a real environment with no direct database or
   backend access.
6. The suite is runnable locally and in CI.

## 10. Open Business Questions

- Whether the harness should grow performance assertions (issuance and
  presentation latency budgets) as a separate lane.
- Whether the OIDF conformance runs should be triggered from the same lane
  as the Playwright suite.
