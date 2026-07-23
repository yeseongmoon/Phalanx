import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import App from '../src/App'
import { Architecture } from '../src/components/Architecture'
import { runOne } from '../src/engine/algorithm'
import threats from '../src/data/threats.json'
import type { Threat } from '../src/engine/types'

/** Smoke test: the whole component tree renders without throwing. */
describe('App renders', () => {
  it('renders the shell + architecture (Threat Model view)', () => {
    const html = renderToStaticMarkup(<App initialView="model" />)
    expect(html).toContain('Threat-Flow Builder')
    expect(html).toContain('id="seg-Space"')
    expect(html).toContain('SPACE / AIR SEGMENT')
  })

  it('lands on the Home page by default, with the three view tabs', () => {
    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('role="tablist"')            // Home · Method Guide · Threat Model
    expect(html).toContain('The gap it closes')          // Home landing content
    expect(html).not.toContain('id="seg-Space"')         // the scene is behind the Threat Model tab
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
