import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import App from '../src/App'
import { Architecture } from '../src/components/Architecture'
import { runOne } from '../src/engine/algorithm'
import threats from '../src/data/threats.json'
import type { Threat } from '../src/engine/types'

/** Smoke test: the whole component tree renders without throwing. */
describe('App renders', () => {
  it('renders the shell + architecture', () => {
    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('Threat-Flow Builder')
    expect(html).toContain('id="seg-Space"')
    expect(html).toContain('SPACE / AIR SEGMENT')
  })

  it('renders a selected threat with the right segments glowing', () => {
    const jamming = (threats as Threat[]).find((t) => t.name === 'Jamming')!
    const html = renderToStaticMarkup(<Architecture threat={jamming} result={runOne(jamming)} />)
    // Jamming affects {User, Ground, Space} -> those bands active, HR not
    expect(html).toMatch(/id="seg-User" class="seg-band active"/)
    expect(html).toMatch(/id="seg-Space" class="seg-band active"/)
    expect(html).toMatch(/id="seg-HR" class="seg-band"(?! active)/)
    // matched assets glow (TT&C, VSAT); unrelated Ground boxes do not
    expect(html).toContain('crosses 3 trust boundaries (R9)')
  })
})
