// SPDX-FileCopyrightText: Copyright Logically Magic Inc. <hello@logicallymagic.com>
// SPDX-FileCopyrightText: Copyright Hamid Jahanzad <Hamid@Jahanzad.com>
// SPDX-License-Identifier: Apache-2.0

// playwright.config.ts - the wallet8 e2e (the bank8-e2e pattern: the
// webServer-less run against the deployed fleet).
//
// Every target derives from the fleet's own configuration: `SENTIN8_DOMAIN`
// comes from the tree-root `.env` through fixtures/env.ts (real env wins,
// no fallback literal). WALLET8_WALLET_URL stays as an explicit operator
// override for pointing the suite at one specific instance.

import { defineConfig } from '@playwright/test';
import { platformDomain } from './fixtures/env.js';

const DOMAIN = platformDomain();

const WALLET_BASE_URL =
  process.env.WALLET8_WALLET_URL ??
  `https://wallet8.wallet8.ops.sys.${DOMAIN}`;

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: WALLET_BASE_URL,
    ignoreHTTPSErrors: false,
    screenshot: 'only-on-failure',
  },
});
