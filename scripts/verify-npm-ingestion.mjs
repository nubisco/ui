/**
 * Post-publish gate: confirm a published version actually reached the registry.
 *
 * `npm publish` returning 0 means npm ACCEPTED the tarball, not that the version
 * is installable. npm says so itself on publish: "Your package is being
 * processed and may take a few minutes to become available." When that
 * processing stalls, the release job stays green while `npm install` still
 * resolves the previous version, and nobody finds out until someone checks by
 * hand. That happened on 1.60.1 and again on 2.0.0.
 *
 *   node scripts/verify-npm-ingestion.mjs <version> [--timeout-minutes 30]
 *
 * Exits 0 once the version resolves and its tarball is fetchable, non-zero if it
 * has not appeared before the deadline. Queries the registry over HTTP rather
 * than through the npm CLI, because the CLI serves a cached packument and would
 * happily report success from a stale document.
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'))

const version = process.argv[2]
if (!version) {
  console.error(
    'usage: verify-npm-ingestion.mjs <version> [--timeout-minutes N]',
  )
  process.exit(2)
}

const timeoutIndex = process.argv.indexOf('--timeout-minutes')
// 2.0.0 published at 16:44:13Z and the registry served it at 16:59:30Z: 15m17s.
// A 15 minute deadline would have failed that release for being 17 seconds slow,
// and a gate that cries wolf gets ignored. 30 gives real headroom over the
// slowest ingestion actually observed for this package while still catching a
// genuine stall long before anyone notices by hand.
const TIMEOUT_MINUTES =
  timeoutIndex !== -1 ? Number(process.argv[timeoutIndex + 1]) : 30
const POLL_SECONDS = 15

const REGISTRY = 'https://registry.npmjs.org'
const encoded = pkg.name.replace('/', '%2F')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** The packument, cache-busted. A stale read here is the whole failure mode. */
async function packument() {
  const res = await fetch(`${REGISTRY}/${encoded}`, {
    headers: { accept: 'application/json', 'cache-control': 'no-cache' },
  })
  if (!res.ok) throw new Error(`registry responded ${res.status}`)
  return res.json()
}

async function tarballReachable(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

const deadline = Date.now() + TIMEOUT_MINUTES * 60_000
let attempt = 0

console.log(`Waiting for ${pkg.name}@${version} to become installable`)
console.log(`Registry: ${REGISTRY}, timeout ${TIMEOUT_MINUTES}m\n`)

while (Date.now() < deadline) {
  attempt++
  let doc
  try {
    doc = await packument()
  } catch (error) {
    // A transient registry error is not a failed release. Keep waiting.
    console.log(`  attempt ${attempt}: ${error.message}, retrying`)
    await sleep(POLL_SECONDS * 1000)
    continue
  }

  const entry = doc.versions?.[version]
  const latest = doc['dist-tags']?.latest

  if (entry) {
    // Present in the packument is necessary but not sufficient: the tarball has
    // to be fetchable before an install can succeed.
    const ok = await tarballReachable(entry.dist?.tarball)
    if (ok) {
      console.log(`\n${pkg.name}@${version} is installable.`)
      console.log(`  dist-tag latest: ${latest}`)
      console.log(`  tarball: ${entry.dist.tarball}`)
      if (latest !== version) {
        console.log(
          `\nNote: dist-tag latest is ${latest}, not ${version}. That is expected` +
            ` for a prerelease or a backport, and wrong for a normal release.`,
        )
      }
      process.exit(0)
    }
    console.log(`  attempt ${attempt}: version listed, tarball not served yet`)
  } else {
    const remaining = Math.round((deadline - Date.now()) / 1000)
    console.log(
      `  attempt ${attempt}: not in registry yet (latest is ${latest}), ${remaining}s left`,
    )
  }

  await sleep(POLL_SECONDS * 1000)
}

console.error(`
${pkg.name}@${version} did not reach the registry within ${TIMEOUT_MINUTES} minutes.

The publish was accepted (this step only runs after semantic-release reported
success) but npm has not made the version installable. Anyone running
"npm install ${pkg.name}" right now still gets the previous version.

This has happened before, on 1.60.1 and 2.0.0. 2.0.0 took 15m17s to become
installable, so slow is normal for this package; ${TIMEOUT_MINUTES} minutes of
silence is not.

What to do:
  1. Check https://status.npmjs.org for an incident.
  2. Re-check in a few minutes:
       curl -s ${REGISTRY}/${encoded} | grep -o '"${version}"' | head -1
  3. If it is genuinely stuck, the version number is spent: npm reserves it even
     when ingestion fails, so ${version} can never be republished. Cut the next
     patch instead, which is what was done for 1.60.2:
       git commit --allow-empty -m "fix(release): republish after stuck npm ingestion"
       git push origin master
`)
process.exit(1)
