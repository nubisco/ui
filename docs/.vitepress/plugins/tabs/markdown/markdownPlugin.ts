import type MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token'
import container from 'markdown-it-container'
import { ruleBlockTab } from './ruleBlockTab'

type Params = {
  shareStateKey: string | undefined
}

const parseTabsParams = (input: string): Params => {
  const match = input.match(/key:(\S+)/)
  return {
    shareStateKey: match?.[1],
  }
}

export const tabsPlugin = (md: MarkdownIt) => {
  md.use(container, 'tabs', {
    render(tokens: Token[], index: number) {
      const token = tokens[index]
      if (token.nesting === 1) {
        const params = parseTabsParams(token.info)
        const shareStateKeyProp = params.shareStateKey
          ? `sharedStateKey="${md.utils.escapeHtml(params.shareStateKey)}"`
          : ''
        return `<ContentTabs ${shareStateKeyProp}>\n`
      } else {
        return `</ContentTabs>\n`
      }
    },
  })

  md.block.ruler.after('container_tabs', 'tab', ruleBlockTab)
  const renderTab = (tokens: Token[], index: number): string => {
    const token = tokens[index]
    if (token.nesting === 1) {
      const label = token.info
      const labelProp = `label="${md.utils.escapeHtml(label)}"`
      return `<ContentTab ${labelProp}>\n`
    } else {
      return `</ContentTab>\n`
    }
  }
  md.renderer.rules['tab_open'] = renderTab
  md.renderer.rules['tab_close'] = renderTab
}
