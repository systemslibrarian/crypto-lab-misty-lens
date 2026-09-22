type ComponentKey = 'key' | 'fi' | 'fl'

interface ComponentExplanation {
  readonly title: string
  readonly summary: string
  readonly cost: string
}

const EXPLANATIONS: Record<ComponentKey, ComponentExplanation> = {
  key: {
    title: 'A nonlinear schedule became a linear map',
    summary: 'MISTY1 derives new key words through FI. KASUMI uses XOR constants, word selection, and fixed rotations instead.',
    cost: 'The 2010 attack can aim single-bit differences at key words K3 and K7 and predict which round subkeys change. That relation is not available through MISTY1\'s FI-based schedule.',
  },
  fi: {
    title: 'FI is not the same nonlinear function',
    summary: 'KASUMI adds a final S7 lookup after the second S9 stage, changing the 16-bit mapping inside every FO call.',
    cost: 'The published MISTY1 bounds are statements about MISTY1\'s exact nested functions. Once FI changes, those bounds do not automatically cover the variant.',
  },
  fl: {
    title: 'FL moved and gained one-bit rotations',
    summary: 'MISTY1 places FL around paired FO rounds. KASUMI alternates FL-then-FO and FO-then-FL, with rotated AND/OR branches.',
    cost: 'In round 4 of the paper\'s trail, FL uses no related-key difference and acts linearly on the quartet. That helps the sandwich middle survive with probability 2^-6 instead of the naive 2^-32.',
  },
}

function componentButton(
  cipher: 'misty' | 'kasumi',
  component: ComponentKey,
  name: string,
  formula: string,
): string {
  const changed = cipher === 'kasumi' ? ' changed' : ''
  return `
    <button class="component-block${changed}" type="button" data-component="${component}" aria-pressed="${component === 'key'}">
      <span class="component-name">${name}</span>
      <code>${formula}</code>
      ${cipher === 'kasumi' ? '<span class="changed-label">CHANGED</span>' : '<span class="reference-label">REFERENCE</span>'}
    </button>
  `
}

export function renderDiffPane(root: HTMLElement): void {
  root.innerHTML = `
    <div class="panel-intro">
      <p class="eyebrow">THE HEADLINE DIFF</p>
      <h2>Eight rounds stayed. The proof boundary did not.</h2>
      <p>Select a paired component. The highlighted blocks map directly to the separate modules used by the live ciphers in Pane 1.</p>
    </div>

    <div class="round-overview" role="group" aria-label="Both designs use eight rounds">
      <span>64-bit block</span>
      <div class="round-cells" aria-hidden="true">
        <i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i><i>7</i><i>8</i>
      </div>
      <span>128-bit key</span>
    </div>

    <div class="design-overlay">
      <section class="design-lane misty-lane" aria-labelledby="misty-design-title">
        <header class="lane-heading">
          <div><p class="result-kicker">PROOF APPLIES HERE</p><h3 id="misty-design-title">MISTY1</h3></div>
          <span class="proof-chip"><span aria-hidden="true">+</span> Original</span>
        </header>
        <div class="round-order" role="group" aria-label="MISTY1 round placement">
          <span>FL</span><b aria-hidden="true">&rarr;</b><span>FO</span><b aria-hidden="true">&rarr;</b><span>FO</span><b aria-hidden="true">&rarr;</b><span>FL</span>
        </div>
        <div class="component-stack">
          ${componentButton('misty', 'key', 'Key schedule', 'FI(Ki, Ki+1)')}
          ${componentButton('misty', 'fi', 'FI', 'S9 > S7 > key > S9')}
          ${componentButton('misty', 'fl', 'FL', 'AND / OR expanded words')}
        </div>
      </section>

      <section class="design-lane kasumi-lane" aria-labelledby="kasumi-design-title">
        <header class="lane-heading">
          <div><p class="result-kicker">CELLULAR REDESIGN</p><h3 id="kasumi-design-title">KASUMI</h3></div>
          <span class="change-chip"><span aria-hidden="true">!</span> Modified</span>
        </header>
        <div class="round-order" role="group" aria-label="KASUMI alternating round placement">
          <span>FL</span><b aria-hidden="true">&rarr;</b><span>FO</span><b class="flip" aria-hidden="true">/</b><span>FO</span><b aria-hidden="true">&rarr;</b><span>FL</span>
        </div>
        <div class="component-stack">
          ${componentButton('kasumi', 'key', 'Key schedule', "K' = K xor C; rotate")}
          ${componentButton('kasumi', 'fi', 'FI', 'S9 > S7 > key > S9 > S7')}
          ${componentButton('kasumi', 'fl', 'FL', 'AND > ROL1 / OR > ROL1')}
        </div>
      </section>
    </div>

    <section class="diff-inspector" aria-labelledby="diff-inspector-title" role="status" aria-live="polite" aria-atomic="true">
      <div class="inspector-index" aria-hidden="true">01</div>
      <div>
        <p class="eyebrow" id="diff-inspector-label">KEY SCHEDULE</p>
        <h3 id="diff-inspector-title"></h3>
        <p id="diff-inspector-summary"></p>
      </div>
      <div class="cost-column">
        <p class="cost-label">WHAT IT COST</p>
        <p id="diff-inspector-cost"></p>
      </div>
    </section>

    <p class="diff-caveat"><strong>No single edited box is "the bug."</strong> The attack uses an alignment of the linear key schedule, changed inner functions, and round placement. The MISTY1 proof covers the original whole design, not any eight-round descendant.</p>
  `

  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-component]'))
  const title = root.querySelector<HTMLElement>('#diff-inspector-title')!
  const label = root.querySelector<HTMLElement>('#diff-inspector-label')!
  const summary = root.querySelector<HTMLElement>('#diff-inspector-summary')!
  const cost = root.querySelector<HTMLElement>('#diff-inspector-cost')!
  const index = root.querySelector<HTMLElement>('.inspector-index')!

  const select = (component: ComponentKey): void => {
    const explanation = EXPLANATIONS[component]
    const componentIndex = (['key', 'fi', 'fl'] as const).indexOf(component) + 1
    for (const button of buttons) {
      const selected = button.dataset.component === component
      button.setAttribute('aria-pressed', String(selected))
      button.classList.toggle('selected', selected)
    }
    index.textContent = String(componentIndex).padStart(2, '0')
    label.textContent = component === 'key' ? 'KEY SCHEDULE' : component.toUpperCase()
    title.textContent = explanation.title
    summary.textContent = explanation.summary
    cost.textContent = explanation.cost
  }

  for (const button of buttons) {
    button.addEventListener('click', () => select(button.dataset.component as ComponentKey))
  }
  select('key')
}