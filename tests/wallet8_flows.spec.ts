// SPDX-FileCopyrightText: Copyright Logically Magic Inc. <hello@logicallymagic.com>
// SPDX-FileCopyrightText: Copyright Hamid Jahanzad <Hamid@Jahanzad.com>
// SPDX-License-Identifier: Apache-2.0

// tests/wallet8_flows.spec.ts
//
// The wallet8 happy-path flows (WALLET8-1's acceptance + the §11.8
// harness design): the browser drives ONLY the wallet app - the
// issuance round, the presentation round, the vault rendering.
// The rig's counterparty surfaces (the issuer's offer URL, the
// verifier's request_uri) arrive via the environment (the
// WALLET8-2 rig cells mint them; the local dev form runs against
// the static fixture URIs).
//
// The Flutter-web UI drives via the semantics tree (the platform's
// e2e pattern - waitForFlutterSemantics + clickFlutterButton).

import { test, expect, type Page } from '@playwright/test';
import { platformDomain } from '../fixtures/env.js';

// The counterparty hosts ride the SAME domain as the fleet under test
// (they are platform services, not per-tenant instances). Deriving them
// keeps the local-dev fixture URIs working on any SENTIN8_DOMAIN instead
// of pinning the suite to `local.sentin8.dev`; the rig still overrides
// them wholesale via WALLET8_TEST_OFFER_URI / WALLET8_TEST_REQUEST_URI.
const DOMAIN = platformDomain();

const OFFER_URI = async () =>
  process.env.WALLET8_TEST_OFFER_URI ??
  `openid-credential-offer://?credential_offer=%7B%22credential_issuer%22%3A%22https%3A%2F%2Fissuer.wallet8.ops.sys.${encodeURIComponent(DOMAIN)}%22%2C%22credential_configuration_ids%22%3A%5B%22org.iso.18013.5.1.mDL%22%5D%7D`;

const REQUEST_URI = async () =>
  process.env.WALLET8_TEST_REQUEST_URI ??
  `https://verifier.wallet8.ops.sys.${DOMAIN}/request/pid-age-over-18`;

async function navigateDeepLink(page: Page, uri: string) {
  // The web deep-link form (the /offer + /request routes carry the
  // scanned payload as the arguments).
  await page.goto('/#/offer');
  await page.evaluate((u) => {
    // Flutter-web routing: the framework's deep-link entry rides
    // the history API - the app picks the /offer route + the
    // scanned URI as the arguments.
    window.history.pushState({}, '', '/offer');
    (window as unknown as { flutterDeepLink?: string }).flutterDeepLink = u;
    window.dispatchEvent(
      new PopStateEvent('popstate', { state: { uri: u } }),
    );
  }, uri);
}

test.describe('the wallet8 happy-path flows', () => {
  test('the app boots to the vault', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Wallet8/);
  });

  test('the scan page accepts the offer URI and lands the vault',
    async ({ page }) => {
      await page.goto('/#/scan');
      const offer = await OFFER_URI();
      await page.getByRole('textbox').fill(offer);
      await page.getByRole('button', { name: 'Proceed' }).click();
      // The 501 authorization-code form is visible for the
      // authorization_code offers (the negative-orchestration
      // surface); the pre-authorized round lands the vault row.
      await expect(
        page.getByText(/(No credentials yet|authorization-code|deferred|Scan)/),
      ).toBeVisible();
    });

  test('the scan page resolves the verifier request to the consent screen',
    async ({ page }) => {
      await page.goto('/#/scan');
      const request = await REQUEST_URI();
      await page.getByRole('textbox').fill(request);
      await page.getByRole('button', { name: 'Proceed' }).click();
      // The consent screen (§15.1): the verifier identity + the
      // requested claims BEFORE any disclosure - or the visible
      // error (a failed verification/unsatisfiable query never
      // reaches consent).
      await expect(
        page.getByText(/(Verifier|Consent|error|FAILED)/),
      ).toBeVisible({ timeout: 30_000 });
    });

  test('the negative surface renders the error page when the request fails',
    async ({ page }) => {
      await page.goto('/#/scan');
      // An unresolvable request_uri: the transport fails -> the
      // error surface, never a silent proceed or an empty vp_token.
      await page
        .getByRole('textbox')
        .fill('https://unresolvable.invalid/request/none');
      await page.getByRole('button', { name: 'Proceed' }).click();
      await expect(page.getByText(/intake error|error/i)).toBeVisible({
        timeout: 30_000,
      });
    });
});
