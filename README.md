# Wallet8 E2E

The wallet8 vertical's end-to-end harness (the sentin8-e2e pattern):
Playwright against the browser UI, every setup step through the UI/BFF
proxy - no direct DB or backend access.

The flows (WALLET8-1's acceptance):
1. The issuance round: scan the offer QR (the deep-link form on web),
   complete the OID4VCI authorization, the credential lands in the
   vault.
2. The presentation round: scan the verifier request, the consent
   screen shows the requested claims, the presentation completes.
3. The vault: the list renders the stored credential.

The negative surfaces the OIDF wallet-role suites demand are exercised
here too (the visible error screens: a bad-signature request object, a
missing nonce, an unsatisfiable DCQL query - never an empty or partial
vp_token).

The harness lands with the wallet app's driver wiring (the OIDF-ISO-1
rig cells drive the exact protocol shapes against the platform
first; the wallet-side flows follow).
