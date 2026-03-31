import type { App } from 'vue'
import ContentTabs from './ContentTabs.vue'
import ContentTab from './ContentTab.vue'
import { provideTabsSharedState } from './useTabsSelectedState'

export const enhanceAppWithTabs = (app: App) => {
  provideTabsSharedState(app)
  app.component('ContentTabs', ContentTabs)
  app.component('ContentTab', ContentTab)
}
