import { decryptKasumiBlock, encryptKasumiBlock } from '../kasumi/kasumi.ts'
import { decryptMisty1Block, encryptMisty1Block } from '../misty1/misty1.ts'
import { bytesToHex, hexToBytes } from '../shared/bytes.ts'
import { verifyKasumiKnownAnswers, verifyMisty1KnownAnswers } from '../verification.ts'

type Operation = 'encrypt' | 'decrypt'

const DEFAULT_KEY = '00112233445566778899aabbccddeeff'
const DEFAULT_BLOCK = '0123456789abcdef'

function isHex(value: string, bytes: number): boolean {
  return new RegExp(`^[0-9a-fA-F]{${bytes * 2}}$`).test(value)
}

function katBadge(name: string, passed: number, total: number, allPassed: boolean): string {
  const state = allPassed ? 'pass' : 'fail'
  const mark = allPassed ? '+' : '!'
  return `<span class="status-chip status-${state}" data-kat="${name.toLowerCase()}"><span class="status-mark" aria-hidden="true">${mark}</span>${passed}/${total} KATs ${allPassed ? 'match' : 'fail'}</span>`
}

export function renderCipherPane(root: HTMLElement): void {
  const mistyKat = verifyMisty1KnownAnswers()
  const kasumiKat = verifyKasumiKnownAnswers()

  root.innerHTML = `
    <div class="panel-intro">
      <p class="eyebrow">REAL 64-BIT BLOCK CIPHERS</p>
      <h2>Give both designs the same bytes</h2>
      <p>Both ciphers use a 128-bit key and eight rounds, but equal dimensions do not make equal designs. Enter one block once; each result below comes from its own FI, FO, FL, and key schedule implementation.</p>
    </div>

    <form class="lab-controls" id="cipher-controls" novalidate>
      <fieldset class="segment-field">
        <legend>Operation</legend>
        <div class="segment-control">
          <label><input type="radio" name="operation" value="encrypt" checked /><span>Encrypt</span></label>
          <label><input type="radio" name="operation" value="decrypt" /><span>Decrypt</span></label>
        </div>
      </fieldset>
      <div class="input-grid">
        <label class="control-field" for="cipher-key">
          <span>128-bit key</span>
          <input id="cipher-key" class="mono-input" value="${DEFAULT_KEY}" maxlength="32" inputmode="text" autocomplete="off" spellcheck="false" aria-describedby="key-help" />
          <small id="key-help">32 hexadecimal characters</small>
        </label>
        <label class="control-field" for="cipher-block">
          <span id="block-label">Plaintext block</span>
          <input id="cipher-block" class="mono-input" value="${DEFAULT_BLOCK}" maxlength="16" inputmode="text" autocomplete="off" spellcheck="false" aria-describedby="block-help" />
          <small id="block-help">16 hexadecimal characters</small>
        </label>
      </div>
      <div class="control-actions">
        <button class="action-btn action-primary" type="submit">Compare ciphers</button>
        <button class="action-btn" id="load-rfc-vector" type="button">Load RFC 2994 block</button>
      </div>
      <p class="input-error" id="cipher-error" role="status" aria-live="polite"></p>
    </form>

    <div class="cipher-grid" id="cipher-results" role="status" aria-live="polite" aria-atomic="true">
      <article class="cipher-result misty-result">
        <div class="result-heading">
          <div><p class="result-kicker">ORIGINAL DESIGN</p><h3>MISTY1</h3></div>
          ${katBadge('MISTY1', mistyKat.passed, mistyKat.total, mistyKat.allPassed)}
        </div>
        <dl class="result-data">
          <div><dt id="misty-result-label">Ciphertext</dt><dd id="misty-result" data-testid="misty-output"></dd></div>
          <div><dt>Round-trip check</dt><dd id="misty-roundtrip"></dd></div>
        </dl>
        <p class="inline-verdict" id="misty-verdict"></p>
      </article>

      <article class="cipher-result kasumi-result">
        <div class="result-heading">
          <div><p class="result-kicker">CELLULAR VARIANT</p><h3>KASUMI</h3></div>
          ${katBadge('KASUMI', kasumiKat.passed, kasumiKat.total, kasumiKat.allPassed)}
        </div>
        <dl class="result-data">
          <div><dt id="kasumi-result-label">Ciphertext</dt><dd id="kasumi-result" data-testid="kasumi-output"></dd></div>
          <div><dt>Round-trip check</dt><dd id="kasumi-roundtrip"></dd></div>
        </dl>
        <p class="inline-verdict" id="kasumi-verdict"></p>
      </article>
    </div>

    <div class="comparison-verdict" id="comparison-verdict" data-testid="same-block-verdict"></div>

    <section class="real-world" aria-labelledby="real-world-title">
      <div>
        <p class="eyebrow">REAL-WORLD LINEAGE</p>
        <h3 id="real-world-title">Where KASUMI was used</h3>
      </div>
      <ul role="list">
        <li role="listitem"><strong>A5/3</strong><span>GSM confidentiality</span></li>
        <li role="listitem"><strong>GEA3</strong><span>GPRS confidentiality</span></li>
        <li role="listitem"><strong>f8</strong><span>UMTS confidentiality</span></li>
        <li role="listitem"><strong>f9</strong><span>UMTS integrity</span></li>
      </ul>
    </section>

    <details class="source-note">
      <summary>Fixture provenance</summary>
      <p>MISTY1 is checked against both ECB blocks in RFC 2994 Appendix A. KASUMI is checked against the four core-cipher sets in 3GPP TS 35.203, including test set 4's 50 repeated encryptions.</p>
    </details>
  `

  const form = root.querySelector<HTMLFormElement>('#cipher-controls')!
  const keyInput = root.querySelector<HTMLInputElement>('#cipher-key')!
  const blockInput = root.querySelector<HTMLInputElement>('#cipher-block')!
  const error = root.querySelector<HTMLElement>('#cipher-error')!

  const update = (): void => {
    const keyHex = keyInput.value.trim()
    const blockHex = blockInput.value.trim()
    keyInput.setAttribute('aria-invalid', String(!isHex(keyHex, 16)))
    blockInput.setAttribute('aria-invalid', String(!isHex(blockHex, 8)))

    if (!isHex(keyHex, 16) || !isHex(blockHex, 8)) {
      error.textContent = 'Enter exactly 32 hex characters for the key and 16 for the block.'
      return
    }

    error.textContent = ''
    const operation = form.elements.namedItem('operation') as RadioNodeList
    const mode = operation.value as Operation
    const key = hexToBytes(keyHex)
    const block = hexToBytes(blockHex)
    const mistyResult = mode === 'encrypt' ? encryptMisty1Block(block, key) : decryptMisty1Block(block, key)
    const kasumiResult = mode === 'encrypt' ? encryptKasumiBlock(block, key) : decryptKasumiBlock(block, key)
    const mistyRoundTrip = mode === 'encrypt' ? decryptMisty1Block(mistyResult, key) : encryptMisty1Block(mistyResult, key)
    const kasumiRoundTrip = mode === 'encrypt' ? decryptKasumiBlock(kasumiResult, key) : encryptKasumiBlock(kasumiResult, key)
    const outputLabel = mode === 'encrypt' ? 'Ciphertext' : 'Plaintext'
    const expected = bytesToHex(block)

    root.querySelector('#block-label')!.textContent = mode === 'encrypt' ? 'Plaintext block' : 'Ciphertext block'
    root.querySelector('#misty-result-label')!.textContent = outputLabel
    root.querySelector('#kasumi-result-label')!.textContent = outputLabel
    root.querySelector('#misty-result')!.textContent = bytesToHex(mistyResult)
    root.querySelector('#kasumi-result')!.textContent = bytesToHex(kasumiResult)
    root.querySelector('#misty-roundtrip')!.textContent = bytesToHex(mistyRoundTrip)
    root.querySelector('#kasumi-roundtrip')!.textContent = bytesToHex(kasumiRoundTrip)

    const mistyPass = bytesToHex(mistyRoundTrip) === expected
    const kasumiPass = bytesToHex(kasumiRoundTrip) === expected
    const mistyVerdict = root.querySelector<HTMLElement>('#misty-verdict')!
    const kasumiVerdict = root.querySelector<HTMLElement>('#kasumi-verdict')!
    mistyVerdict.className = `inline-verdict verdict-${mistyPass ? 'pass' : 'fail'}`
    kasumiVerdict.className = `inline-verdict verdict-${kasumiPass ? 'pass' : 'fail'}`
    mistyVerdict.textContent = `${mistyPass ? '+' : '!'} ${mistyPass ? 'Round trip returns the input' : 'Round trip failed'}`
    kasumiVerdict.textContent = `${kasumiPass ? '+' : '!'} ${kasumiPass ? 'Round trip returns the input' : 'Round trip failed'}`

    const same = bytesToHex(mistyResult) === bytesToHex(kasumiResult)
    const comparison = root.querySelector<HTMLElement>('#comparison-verdict')!
    comparison.className = `comparison-verdict ${same ? 'verdict-note' : 'verdict-pass'}`
    comparison.textContent = same
      ? '= The outputs happen to match for this input; independent KATs still determine correctness.'
      : '+ Same key and block, different result: the changed design is executing, not being narrated.'
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    update()
  })
  form.addEventListener('input', update)
  root.querySelector('#load-rfc-vector')!.addEventListener('click', () => {
    keyInput.value = DEFAULT_KEY
    blockInput.value = DEFAULT_BLOCK
    const encryptRadio = form.querySelector<HTMLInputElement>('input[value="encrypt"]')!
    encryptRadio.checked = true
    update()
  })

  update()
}