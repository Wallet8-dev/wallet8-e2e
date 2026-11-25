// SPDX-FileCopyrightText: Copyright Logically Magic Inc. <hello@logicallymagic.com>
// SPDX-FileCopyrightText: Copyright Hamid Jahanzad <Hamid@Jahanzad.com>
// SPDX-License-Identifier: Apache-2.0

// fixtures/env.ts - tree-root `.env` loader (the fleet's own configuration).
//
// Mirrors the bank8/openfin8/email8/platform suites' fixtures/env.ts: same
// contract, resolved from this repo's location (fixtures/ -> wallet8-e2e/
// -> wallet8/ group -> tree root). The suite tests the deployment the
// operator actually booted, so its target configuration is read from the
// SAME `.env` the fleet is booted from.
//
// NO fallback literal: when nothing defines `SENTIN8_DOMAIN` the run fails
// here at configuration load - never mid-test with URLs pointed at a domain
// nothing serves (e2e DESIGN §4 invariant 5).
//
// wallet8 had no loader at all: `playwright.config.ts` carried a hardcoded
// `https://wallet8.wallet8.ops.sys.local.sentin8.dev`, so the suite could
// only ever run against the compiled default - a fleet booted on any other
// domain was unreachable, and the failure looked like a dead app rather
// than a misconfigured test target.

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** Variables read from the tree root `.env` by this suite. */
const DOTENV_VARS = [
  'SENTIN8_DOMAIN',
  'SENTIN8_REPO_ROOT',
  'SENTIN8_CLI_BIN',
  // Fleet TLS posture (the platform suite's DESIGN §4 invariant 7): the
  // CLI is a rustls client whose key-exchange offer is keyed off
  // SENTIN8_TLS_PQ_MODE (defaulting to `exclusive`, X25519MLKEM768-only,
  // when unset) - a fleet booted `classical` rejects that offer with a
  // silent TLS HandshakeFailure, so the posture must reach every CLI
  // child this suite spawns.
  'SENTIN8_TLS_PQ_MODE',
  'SENTIN8_TLS_CIPHER_PROFILE',
  'SENTIN8_TLS_CLIENT_AUTH',
  'SENTIN8_MTLS_CLIENT_AUTH',
] as const;

function repoRoot(): string {
  // Explicit operator override wins.
  if (process.env.SENTIN8_REPO_ROOT) return resolve(process.env.SENTIN8_REPO_ROOT);
  // fixtures/env.ts -> fixtures/ -> wallet8-e2e/ -> wallet8/ (group) -> tree root.
  return resolve(import.meta.dirname ?? '.', '..', '..', '..');
}

/**
 * Load the tree-root `.env` into `process.env` for the suite's own
 * variables. Idempotent, import-time safe (module-level). A variable
 * present in the real environment is never overwritten.
 */
function loadTreeEnv(): void {
  const path = join(repoRoot(), '.env');
  if (!existsSync(path)) return; // environment-only runs are fine.
  let raw: string;
  try {
    raw = readFileSync(path, 'utf-8');
  } catch {
    return;
  }
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!(DOTENV_VARS as readonly string[]).includes(key)) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value.length === 0) continue;
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadTreeEnv();

/**
 * The platform root domain the suite (and the fleet) targets.
 *
 * Resolution: the real environment first, then the tree-root `.env` - and
 * a hard error when NEITHER defines it. There is deliberately no fallback
 * literal: a guessed domain points the whole suite at hostnames nothing
 * serves and turns the run into noise.
 */
export function platformDomain(): string {
  const domain = process.env.SENTIN8_DOMAIN;
  if (!domain || domain.trim().length === 0) {
    throw new Error(
      'SENTIN8_DOMAIN is not set - the wallet8 e2e suite derives every target URL ' +
      'from it. Export it or define it in the tree-root .env ' +
      `(searched: ${join(repoRoot(), '.env')}); there is no fallback domain.`,
    );
  }
  return domain;
}

/** The resolved tree root, as this module resolved it. */
export function treeRoot(): string {
  return repoRoot();
}
