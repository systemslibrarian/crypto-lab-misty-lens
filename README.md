# Misty Lens

**MISTY1 · KASUMI · Related-Key**

A browser-only lab that runs real MISTY1 and KASUMI side by side, maps the design changes between them, and executes the seven-round related-key sandwich distinguisher from Dunkelman, Keller, and Shamir.

> **Not production cryptography — a teaching demo.** The ciphers are hand-rolled for inspection and conformance-tested against their specifications. The browser executes the reduced-round distinguisher, not the full key-recovery attack.

## What It Is

MISTY1 is a 64-bit block cipher with a 128-bit key, designed with provable lower bounds against linear and differential cryptanalysis. KASUMI is the modified MISTY1 design standardized for 3G cellular systems. Its simpler linear key schedule, altered FI, and changed FL placement made hardware implementation easier, but also enabled a practical-time attack in the related-key model.

The security model matters: the 2010 attack requires access to encryptions and decryptions under four keys whose differences are chosen by the attacker. Deployed A5/3 does not expose that oracle, so this is a result about KASUMI's design margin, not a method for decrypting live GSM calls.

## Exhibits

1. **The Two Ciphers** — Encrypt or decrypt one 64-bit block under one 128-bit key with both real implementations. Runtime badges execute 2 RFC 2994 MISTY1 vectors and 4 TS 35.203 KASUMI vectors, including the 50-iteration set.
2. **The Diff** — Inspect aligned MISTY1 and KASUMI structures. Selecting the key schedule, FI, or FL highlights both versions and explains what changed and how it contributes to the lost security argument.
3. **The Attack** — Run the CRYPTO 2010 adaptive quartet over rounds 1–7 with four related keys. KASUMI produces the predicted difference while the MISTY1 control does not. Breaking one bit of the key relation rejects the input and retires the verdict.
4. **Honesty panel** — Keeps the successful distinguisher beside the limitation: related keys are required, and this is not a live-call break.
5. **Later result** — Records Todo's CRYPTO 2015 integral attack on full MISTY1 as a theoretical result requiring nearly the full codebook.

## When to Use It

- Use it to study how small structural edits can invalidate a proof tied to an exact cipher design.
- Use it to inspect FI, FO, FL, key expansion, and Feistel round ordering against real outputs.
- Use it to teach related-key and sandwich/boomerang attacks without claiming a deployed-network exploit.
- Do **not** use this code to protect data or implement A5/3, GEA3, f8, or f9 in production.

## Live Demo

**https://systemslibrarian.github.io/crypto-lab-misty-lens/**

Compare a shared block, select each changed component, and run a right quartet entirely in the browser.

## What Can Go Wrong

- **Confusing equal dimensions with equal security** — both designs have eight rounds, 64-bit blocks, and 128-bit keys, but the MISTY1 bounds do not transfer to KASUMI.
- **Overclaiming the attack** — the full result uses four related keys and adaptive chosen data; a passive GSM listener does not receive that capability.
- **Mistaking the browser exhibit for full recovery** — this lab executes the seven-round distinguisher. It reports, but does not run, the full eight-round key-recovery work.
- **Using educational implementations operationally** — the code prioritizes transparency and is not constant-time or independently audited.

## Real-World Usage

KASUMI was used by A5/3 for GSM confidentiality, GEA3 for GPRS confidentiality, and the f8/f9 confidentiality and integrity algorithms in UMTS. The lab implements the KASUMI block cipher itself, not those surrounding modes or a radio interception system.

## How to Run Locally

```bash
npm install
npm run dev
npm test
npm run build
npx playwright install chromium
npm run test:a11y
```

The Vite development URL includes the project base path: `http://localhost:5173/crypto-lab-misty-lens/` when that port is available.

## Related Demos

- [Matsui Line](https://systemslibrarian.github.io/crypto-lab-matsui-line/) — linear cryptanalysis, one of the attacks MISTY1 was designed to bound.
- [Biham Lens](https://systemslibrarian.github.io/crypto-lab-biham-lens/) — differential cryptanalysis, the other half of that design goal.

## Build & Verify

- **16 unit tests** exercise both cipher directions, strict input boundaries, all 6 specification KAT fixtures, runtime KAT summaries, the exact four-key relation, and four live right-quartet fixtures.
- [`src/misty1/vectors.ts`](src/misty1/vectors.ts) pins both ECB blocks from RFC 2994 Appendix A.
- [`src/kasumi/vectors.ts`](src/kasumi/vectors.ts) pins the four core-cipher sets from 3GPP TS 35.203.
- [`e2e/claims.spec.ts`](e2e/claims.spec.ts) independently recomputes the displayed quartet difference, tests retirement on an invalid relation, and requires the negative claim beside a successful fixture.
- [`e2e/a11y.spec.ts`](e2e/a11y.spec.ts) drives every meaningful state at desktop and 380px through axe WCAG 2.1 A/AA plus measured text, non-text, focus, scrolling, and reflow checks.

## Performance

Single-block encryption and the pinned seven-round quartet complete synchronously in the browser. The reported full attack costs roughly 2^26 total data, 2^32 time, and 2^30 bytes of memory; those costs are cited, not executed here.

---

*One of the browser demos in the [Crypto Lab](https://crypto-lab.systemslibrarian.dev/) suite.*

*"So whether you eat or drink or whatever you do, do it all for the glory of God." — 1 Corinthians 10:31*