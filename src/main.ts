import './lab.css'
import { renderCipherPane } from './ui/cipherPane.ts'
import { renderDiffPane } from './ui/diffPane.ts'
import { renderAttackPane } from './ui/attackPane.ts'

type PanelKey = 'ciphers' | 'diff' | 'attack'

const panel = (key: PanelKey): HTMLElement => document.getElementById(`panel-${key}`)!

renderCipherPane(panel('ciphers'))
renderDiffPane(panel('diff'))
renderAttackPane(panel('attack'))

const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.tab-btn'))

function selectTab(key: PanelKey): void {
  for (const tab of tabs) {
    const selected = tab.dataset.panel === key
    tab.classList.toggle('active', selected)
    tab.setAttribute('aria-selected', String(selected))
    tab.tabIndex = selected ? 0 : -1
    panel(tab.dataset.panel as PanelKey).hidden = !selected
  }
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab.dataset.panel as PanelKey))
  tab.addEventListener('keydown', (event) => {
    let next = -1
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = tabs.length - 1
    if (next >= 0) {
      event.preventDefault()
      tabs[next]!.focus()
      selectTab(tabs[next]!.dataset.panel as PanelKey)
    }
  })
})
