import {
  createPaperKeyQuartet,
  RIGHT_QUARTET_FIXTURE_HEX,
  runRelatedKeyDistinguisher,
  type RelatedKeyQuartet,
} from '../attack/relatedKey.ts'
import { bytesToHex, hexToBytes } from '../shared/bytes.ts'

const BASE_KEY = hexToBytes('00112233445566778899aabbccddeeff')

function setText(root: HTMLElement, selector: string, value: string): void {
  root.querySelector<HTMLElement>(selector)!.textContent = value
}

function relationKeys(mode: 'paper' | 'perturbed'): RelatedKeyQuartet {
  const keys = createPaperKeyQuartet(BASE_KEY)
  if (mode === 'perturbed') {
    const changed = keys.d.slice()
    changed[15] ^= 1
    return { ...keys, d: changed }
  }
  return keys
}

export function renderAttackPane(root: HTMLElement): void {
  root.innerHTML = `
    <div class="panel-intro">
      <p class="eyebrow">CRYPTO 2010 &middot; ROUNDS 1-7</p>
      <h2>Build the related-key sandwich quartet</h2>
      <p>The page runs the paper's adaptive boomerang procedure with its own cipher code. The pinned values below are only plaintexts known to form right quartets; every key, encryption, decryption, and final difference is recomputed here.</p>
    </div>

    <form class="attack-controls" id="attack-controls">
      <label class="select-field" for="attack-fixture">
        <span>Right-quartet fixture</span>
        <span class="select-wrap">
          <select id="attack-fixture">
            ${RIGHT_QUARTET_FIXTURE_HEX.map((fixture, index) => `<option value="${fixture}">Fixture ${index + 1} &middot; ${fixture}</option>`).join('')}
          </select>
        </span>
      </label>
      <fieldset class="segment-field relation-field">
        <legend>Key relation</legend>
        <div class="segment-control relation-control">
          <label><input type="radio" name="relation" value="paper" checked /><span>Paper relation</span></label>
          <label><input type="radio" name="relation" value="perturbed" /><span>Break one bit</span></label>
        </div>
      </fieldset>
      <div class="attack-actions">
        <button class="action-btn action-primary" type="submit">Run seven rounds</button>
        <button class="action-btn" id="advance-attack" type="button">Advance stage</button>
        <span class="stage-count" id="stage-count">Stage 1 of 5</span>
      </div>
      <p class="relation-error" id="relation-error" role="status" aria-live="polite"></p>
    </form>

    <section class="related-keys" aria-labelledby="related-keys-title">
      <div class="section-heading-row">
        <div><p class="eyebrow">FOUR ORACLES</p><h3 id="related-keys-title">Chosen key relation</h3></div>
        <code>&Delta;K3 = 8000 &middot; &Delta;K7 = 8000</code>
      </div>
      <dl>
        <div><dt>Ka</dt><dd id="attack-key-a"></dd></div>
        <div><dt>Kb = Ka xor &Delta;K3</dt><dd id="attack-key-b"></dd></div>
        <div><dt>Kc = Ka xor &Delta;K7</dt><dd id="attack-key-c"></dd></div>
        <div><dt>Kd = Ka xor both</dt><dd id="attack-key-d"></dd></div>
      </dl>
    </section>

    <ol class="quartet-flow" id="quartet-flow" role="list" aria-label="Related-key distinguisher stages">
      <li role="listitem" data-step="0">
        <span class="step-number">01</span><strong>Pair inputs</strong>
        <code id="flow-pa"></code><code id="flow-pb"></code>
        <small>Pb = Pa xor &alpha;</small>
      </li>
      <li role="listitem" data-step="1">
        <span class="step-number">02</span><strong>Encrypt</strong>
        <code id="flow-ca"></code><code id="flow-cb"></code>
        <small>Ka and Kb &middot; 7 rounds</small>
      </li>
      <li role="listitem" data-step="2">
        <span class="step-number">03</span><strong>Boomerang</strong>
        <code id="flow-cc"></code><code id="flow-cd"></code>
        <small>Add &delta; = 00100000</small>
      </li>
      <li role="listitem" data-step="3">
        <span class="step-number">04</span><strong>Decrypt</strong>
        <code id="flow-pc"></code><code id="flow-pd"></code>
        <small>Kc and Kd &middot; 7 rounds</small>
      </li>
      <li role="listitem" data-step="4">
        <span class="step-number">05</span><strong>Compare</strong>
        <code id="flow-difference"></code>
        <small>Does Pc xor Pd equal &alpha;?</small>
      </li>
    </ol>

    <div class="attack-conclusion">
      <section class="attack-results" id="attack-results" aria-labelledby="attack-results-title" role="status" aria-live="polite" aria-atomic="true">
        <p class="eyebrow">COMPUTED OUTCOME</p>
        <h3 id="attack-results-title">Same quartet, different design</h3>
        <article class="attack-result alarm-result" data-testid="kasumi-distinguisher">
          <div><strong>KASUMI</strong><span>7 rounds</span></div>
          <code id="kasumi-observed"></code>
          <p id="kasumi-attack-verdict"></p>
        </article>
        <article class="attack-result safe-result" data-testid="misty-distinguisher">
          <div><strong>MISTY1 control</strong><span>7-round core, no terminal FL</span></div>
          <code id="misty-observed"></code>
          <p id="misty-attack-verdict"></p>
        </article>
      </section>

      <aside class="honesty-panel" id="negative-claim" aria-labelledby="honesty-title">
        <p class="eyebrow">THE MODEL MATTERS</p>
        <h3 id="honesty-title">Related keys are required</h3>
        <p>The attack needs encryption and decryption under four keys with differences chosen by the attacker. Deployed A5/3 does not expose that related-key oracle, so this result does not recover a live call's session key.</p>
        <p class="honesty-verdict"><span aria-hidden="true">!</span> KASUMI: broken in the related-key model &mdash; NOT a live GSM-call break.</p>
      </aside>
    </div>

    <dl class="attack-stats" aria-label="Full eight-round attack complexity">
      <div><dt>Related keys</dt><dd>4</dd></div>
      <div><dt>Total data</dt><dd>2<sup>26</sup></dd></div>
      <div><dt>Time</dt><dd>2<sup>32</sup></dd></div>
      <div><dt>Memory</dt><dd>2<sup>30</sup> bytes</dd></div>
    </dl>
    <p class="complexity-note">These are the reported full eight-round key-recovery costs. This browser runs only the seven-round distinguisher above, not the full recovery.</p>

    <section class="later-result" aria-labelledby="later-result-title">
      <p class="eyebrow">LATER RESULT &middot; CRYPTO 2015</p>
      <h3 id="later-result-title">Full MISTY1 also fell, but only in theory</h3>
      <p>Yosuke Todo used the division property in an integral attack requiring 2<sup>63.58</sup> chosen plaintexts and about 2<sup>121</sup> work. It breaks the full cipher academically; it is not a practical attack.</p>
    </section>

    <details class="source-note attack-sources">
      <summary>Primary sources and scope</summary>
      <ul>
        <li><a href="https://www.rfc-editor.org/rfc/rfc2994" target="_blank" rel="noopener">RFC 2994</a>: MISTY1 algorithm and Appendix A vectors.</li>
        <li><a href="https://www.3gpp.org/ftp/Specs/archive/35_series/35.202/" target="_blank" rel="noopener">3GPP TS 35.202</a> and <a href="https://www.3gpp.org/ftp/Specs/archive/35_series/35.203/" target="_blank" rel="noopener">TS 35.203</a>: KASUMI and implementors' test data.</li>
        <li><a href="https://doi.org/10.1007/978-3-642-14623-7_21" target="_blank" rel="noopener">Dunkelman, Keller, Shamir, CRYPTO 2010</a>: seven-round probability 2<sup>-14</sup> and full key recovery.</li>
        <li><a href="https://doi.org/10.1007/978-3-662-47989-6_20" target="_blank" rel="noopener">Todo, CRYPTO 2015</a>: integral cryptanalysis of full MISTY1.</li>
      </ul>
    </details>
  `

  const form = root.querySelector<HTMLFormElement>('#attack-controls')!
  const fixture = root.querySelector<HTMLSelectElement>('#attack-fixture')!
  const flow = root.querySelector<HTMLElement>('#quartet-flow')!
  const results = root.querySelector<HTMLElement>('#attack-results')!
  const error = root.querySelector<HTMLElement>('#relation-error')!
  const advance = root.querySelector<HTMLButtonElement>('#advance-attack')!
  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'))
  let activeStep = 0

  const showStage = (step: number): void => {
    activeStep = step
    steps.forEach((item, index) => {
      item.classList.toggle('active', index === activeStep)
      item.classList.toggle('complete', index < activeStep)
    })
    setText(root, '#stage-count', `Stage ${activeStep + 1} of ${steps.length}`)
    advance.textContent = activeStep === steps.length - 1 ? 'Review from stage 1' : 'Advance stage'
  }

  const run = (): void => {
    const relation = (form.elements.namedItem('relation') as RadioNodeList).value as 'paper' | 'perturbed'
    const keys = relationKeys(relation)
    setText(root, '#attack-key-a', bytesToHex(keys.a))
    setText(root, '#attack-key-b', bytesToHex(keys.b))
    setText(root, '#attack-key-c', bytesToHex(keys.c))
    setText(root, '#attack-key-d', bytesToHex(keys.d))

    try {
      const plaintext = hexToBytes(fixture.value)
      const kasumi = runRelatedKeyDistinguisher('kasumi', plaintext, keys)
      const misty = runRelatedKeyDistinguisher('misty1', plaintext, keys)
      error.textContent = ''
      flow.hidden = false
      results.hidden = false
      advance.disabled = false

      setText(root, '#flow-pa', `Pa ${bytesToHex(kasumi.plaintextA)}`)
      setText(root, '#flow-pb', `Pb ${bytesToHex(kasumi.plaintextB)}`)
      setText(root, '#flow-ca', `Ca ${bytesToHex(kasumi.ciphertextA)}`)
      setText(root, '#flow-cb', `Cb ${bytesToHex(kasumi.ciphertextB)}`)
      setText(root, '#flow-cc', `Cc ${bytesToHex(kasumi.ciphertextC)}`)
      setText(root, '#flow-cd', `Cd ${bytesToHex(kasumi.ciphertextD)}`)
      setText(root, '#flow-pc', `Pc ${bytesToHex(kasumi.plaintextC)}`)
      setText(root, '#flow-pd', `Pd ${bytesToHex(kasumi.plaintextD)}`)
      setText(root, '#flow-difference', bytesToHex(kasumi.observedDifference))
      setText(root, '#kasumi-observed', `Pc xor Pd = ${bytesToHex(kasumi.observedDifference)}`)
      setText(root, '#misty-observed', `Pc xor Pd = ${bytesToHex(misty.observedDifference)}`)

      const kasumiVerdict = root.querySelector<HTMLElement>('#kasumi-attack-verdict')!
      const mistyVerdict = root.querySelector<HTMLElement>('#misty-attack-verdict')!
      kasumiVerdict.textContent = `${kasumi.matches ? '!' : '?'} ${kasumi.matches ? 'MATCH: distinguisher present' : 'Unexpected miss'} `
      mistyVerdict.textContent = `${misty.matches ? '!' : '+'} ${misty.matches ? 'Unexpected match' : 'MISS: paper property absent'} `
      kasumiVerdict.dataset.matches = String(kasumi.matches)
      mistyVerdict.dataset.matches = String(misty.matches)
      showStage(0)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Invalid related-key inputs'
      error.textContent = `Rejected: ${message}. No distinguisher verdict was produced.`
      flow.hidden = true
      results.hidden = true
      advance.disabled = true
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    run()
  })
  fixture.addEventListener('change', run)
  form.addEventListener('change', (event) => {
    if ((event.target as HTMLInputElement).name === 'relation') run()
  })
  advance.addEventListener('click', () => showStage((activeStep + 1) % steps.length))
  run()
}