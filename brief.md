# BUILD BRIEF — crypto-lab-misty-lens

Binding spec: ./CRYPTO-LAB-TEMPLATE.md (gitignored copy of _MASTER-TEMPLATE.md).
Catalog root CLAUDE.md wins where they touch.
Lifecycle: Build → Teach → Look → Accessibility → README → Deploy.

## KEY FACTS PINNED (verify each before it enters shipped copy)

- MISTY1 (Matsui, 1996; RFC 2994) is a 64-bit block cipher DESIGNED with provable
  lower bounds on resistance to linear and differential cryptanalysis — the
  provability is the point, not a footnote. Nested FI/FO/FL structure.
- KASUMI is 3GPP's modified MISTY1, used as f8/f9 in UMTS/3G and as A5/3 (GSM) /
  GEA3 (GPRS). The modifications (simpler key schedule, altered FL/FI) were made
  for hardware efficiency — and they are what the attack below exploits.
- THE BREAK: Dunkelman, Keller, Shamir (CRYPTO 2010), "A Practical-Time Related-
  Key Attack on the KASUMI Cryptosystem" — a related-key sandwich (boomerang)
  attack recovering the full key with roughly 2^26 data and 2^32 time, runnable
  on a PC. MISTY1 is NOT broken by this attack; the KASUMI simplifications enabled
  it. Confirm the complexity figures before pinning.
- THE HONESTY PANEL (highest-risk claim in this lab): the attack is RELATED-KEY —
  it needs encryptions under keys with a chosen relation, which deployed A5/3 does
  not hand an attacker. So it is a devastating result about KASUMI's design margin
  and NOT a practical break of live GSM calls. State exactly this; do not overclaim.
- Later, Todo (CRYPTO 2015) broke FULL MISTY1 with integral cryptanalysis via the
  division property at ~2^63.6 chosen plaintexts / ~2^121 time — theoretical, not
  practical. Include as "even the provable-bounds cipher fell, but only in theory."

## NEW DEMO BRIEF

repo name      : crypto-lab-misty-lens
short name (H1): Misty Lens
subtitle       : MISTY1 · KASUMI · Related-Key
one-liner      : MISTY1 was built with provable bounds; the cellular
                 simplification into KASUMI threw them away — see exactly which
                 change opened the door.
concept        : "Provably resistant" is a property of a specific design. Simplify
                 the design for hardware and you can delete the proof without
                 touching the round count.
primitives/spec: MISTY1 (RFC 2994, Matsui), KASUMI (3GPP TS 35.202), the
                 Dunkelman-Keller-Shamir related-key attack (CRYPTO 2010).
--accent       : #9f88ff   (assigned centrally — do not change here)
favicon        : 🌫️
in scope       : Real MISTY1 and real KASUMI encrypt/decrypt, both KAT-verified
                 and side by side; a diff of the two designs highlighting the
                 changed components; the related-key distinguisher shown on
                 reduced rounds; the "needs related keys" honesty panel.
non-goals      : No live A5/3 / GSM interception. No claim that the attack breaks
                 deployed calls. No full boomerang key recovery in-browser (show
                 the distinguisher on reduced rounds; describe the full attack).
                 No MISTY2. Not a claim that MISTY1 is broken in practice.

## §1.1 SCOPE

Three panes.
1. THE TWO CIPHERS — MISTY1 and KASUMI encrypt/decrypt the same block, both
   KAT-verified. The core comparison surface.
2. THE DIFF (HEADLINE) — the two designs overlaid, the modified components
   (key schedule, FL, FI) highlighted, each annotated with what property it cost.
3. THE ATTACK — the related-key distinguisher on reduced-round KASUMI that MISTY1
   does not exhibit, plus the "requires related keys" honesty panel and the Todo
   theoretical-break footnote.

## §1.2 SECURITY / CORRECTNESS INVARIANTS (beat features on conflict)

INV-1  MISTY1 matches the RFC 2994 test vectors; KASUMI matches the 3GPP TS 35.203
       (implementers' test data) vectors. Both fixture-pinned; confirm each
       vector's document/section before pinning.
INV-2  Same-block comparison is executed: identical plaintext+key through both
       ciphers yields two different ciphertexts, each self-checked against its KAT.
INV-3  The related-key property is executed on reduced rounds: two keys in the
       chosen relation produce the predicted differential behaviour in KASUMI and
       NOT in MISTY1, computed from the page's own cipher, not asserted.
INV-4  MUTATION GATE (§4.1c/§4.1d): perturbing either cipher's round function must
       make its KAT FAIL; perturbing the key relation must break INV-3.
INV-5  NEGATIVE CLAIM (§4.1d, the load-bearing one): the page states, tied to a
       reachable fixture, that the KASUMI attack is related-key and therefore does
       NOT recover a deployed A5/3 session key — with the distinguisher visibly
       working AND the "not a live-call break" limitation on screen together.

## §1.3 ARCHITECTURE

ALGORITHM SOURCE (normative):
Hand-roll both ciphers (they are small, and the internals ARE the teaching
subject). MISTY1 from RFC 2994; KASUMI from 3GPP TS 35.202. Keep FI/FO/FL and the
two key schedules in separate, diffable modules so the highlight in pane 2 maps to
real code. INV-1 byte equality on both KAT sets is the acceptance test — do not
hand-transcribe the vectors; port them from the spec/reference.

Modules: src/misty1/, src/kasumi/ (shared structure, divergent components broken
out), src/attack/relatedkey.ts (reduced-round distinguisher, isolated), src/ui/.
Client-side, no backend.

## §1.4 UI

PANE 1 — The Two Ciphers
  One plaintext+key row; both ciphers encrypt live with per-cipher KAT badges.
  Plain-language intro ("what provable resistance means, why a cellular variant
  exists") before any hex.
PANE 2 — The Diff (HEADLINE)
  MISTY1 and KASUMI round structures side by side; the changed components glow;
  clicking one explains, in one line, which cryptanalytic property that change
  cost. SHOW the structural difference; don't narrate it.
PANE 3 — The Attack + Honesty
  a. Reduced-round related-key distinguisher: set the key relation, watch the
     predicted difference appear in KASUMI and fail to appear in MISTY1, computed
     from the page's own ciphers.
  b. Honesty panel: full-attack complexity (~2^26 data / 2^32 time) as reported;
     then the plain statement that related keys are required and deployed A5/3
     does not provide them — verdict reads "KASUMI: broken in the related-key
     model — NOT a live GSM-call break."
  c. Todo 2015 footnote: full MISTY1 fell to integral cryptanalysis, theoretically.

REAL-WORLD box: A5/3 (GSM), GEA3 (GPRS), f8/f9 (UMTS) all use KASUMI (add H1 to
REAL_WORLD_TITLES). Siblings: matsui-line (linear) and biham-lens (differential) —
grep to confirm both exist before linking; MISTY1 was designed against exactly
those two attacks.

HERO — three roles distinct:
  subtitle    : spec label only
  description : MISTY1 vs KASUMI, the changed parts, and the attack the change let in
  why it matters: a proof of security belongs to one design, not to its round count

## §1.5 VISUAL SEMANTICS

green = KAT matches / distinguisher absent (MISTY1).  alarm = distinguisher
present in KASUMI (the flaw is the finding, not a success).  highlight = the
changed component under inspection.  Icon+text+color; no decorative motion; never
draw MISTY1's proof as covering KASUMI.

## §1.6 EDGE CASES

- 64-bit block halves / subkey ordering differ subtly between the two — the top
  KAT-failure source.
- The FI/FO nesting depth and FL placement are where KASUMI diverges; get the
  diff mapping right or pane 2 lies.
- Reduced-round count for the distinguisher: label it; do not imply the full-round
  full-key recovery ran in the browser.
- Related-key inputs that don't satisfy the relation: reject, explain, don't show
  a bogus distinguisher.

## §1.7 EXTENSION SEAMS

- The full sandwich/boomerang key recovery as an offline/WASM extension. Mark
  // [extension].
- A Todo division-property integral view as a second attack pane.
- A "provable bound vs actual best attack" margin chart across both ciphers.

## VERIFY BEFORE WRITING COPY — do not assert, grep

- grep CATEGORIES; propose from {ATTACKS | ENCRYPTION}. Do not state a category
  is new.
- grep the catalog for existing MISTY / KASUMI / related-key / boomerang coverage
  and report overlaps before any "first"/"only" phrasing.
- grep for crypto-lab-misty-* / crypto-lab-kasumi-* collisions before creating.
- Confirm the RFC 2994 and TS 35.203 vectors, the CRYPTO 2010 complexity figures,
  and the Todo 2015 figures against the primary sources before they ship.

## CI GATES (existing mechanisms — reference, do not reinvent)

- e2e/claims.spec.ts — §4.1b cross-checks (both KATs; the distinguisher recomputed
  from page ciphers), §4.1c mutation discipline, §4.1d the related-key/not-a-
  live-break negative claim.
- §4 axe/WCAG gate. §5 README. §6.1/6.2 dependabot + deploy dispatch.
- §4.1d: no CLAIMS.yaml / THREAT-MODEL.md / second-language verifier.

## CITATIONS (verify each against the primary source before it ships)

- Matsui, "New Block Encryption Algorithm MISTY," FSE 1997; RFC 2994 (MISTY1).
- 3GPP TS 35.202 (KASUMI spec), TS 35.203 (implementers' test data).
- Dunkelman, Keller, Shamir, "A Practical-Time Related-Key Attack on the KASUMI
  Cryptosystem Used in GSM and 3G Telephony," CRYPTO 2010.
- Todo, "Structural Evaluation by Generalized Integral Property," EUROCRYPT 2015
  / the full-MISTY1 division-property result, CRYPTO 2015.