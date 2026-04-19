import type { App } from 'vue'
import NbBarChart from './BarChart.vue'
import NbLineChart from './LineChart.vue'
import NbPieChart from './PieChart.vue'
import NbSparkline from './Sparkline.vue'

const chartComponents = {
  NbBarChart,
  NbLineChart,
  NbPieChart,
  NbSparkline,
}

export default {
  install(app: App) {
    Object.entries(chartComponents).forEach(([name, component]) => {
      app.component(name, component)
    })
  },
}

export { NbBarChart, NbLineChart, NbPieChart, NbSparkline }
