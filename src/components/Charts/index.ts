import type { App } from 'vue'
import NbBarChart from './BarChart.vue'
import NbLineChart from './LineChart.vue'
import NbPieChart from './PieChart.vue'

const chartComponents = {
  NbBarChart,
  NbLineChart,
  NbPieChart,
}

export default {
  install(app: App) {
    Object.entries(chartComponents).forEach(([name, component]) => {
      app.component(name, component)
    })
  },
}

export { NbBarChart, NbLineChart, NbPieChart }
