<script setup lang="ts">
const users = new Intl.NumberFormat('en-GB')
const formatUsers = (value) => `${users.format(value)} users`

const trendSeries = [
  {
    name: 'DAU',
    data: [
      { x: 'D1', y: 1240 },
      { x: 'D2', y: 1380 },
      { x: 'D3', y: 1410 },
      { x: 'D4', y: 1620 },
      { x: 'D5', y: 1530 },
      { x: 'D6', y: 1180 },
      { x: 'D7', y: 1090 },
      { x: 'D8', y: 1310 },
      { x: 'D9', y: 1490 },
      { x: 'D10', y: 1640 },
      { x: 'D11', y: 1720 },
      { x: 'D12', y: 1680 },
      { x: 'D13', y: 1390 },
      { x: 'D14', y: 1240 },
    ],
  },
]

const multiSeries = [
  {
    name: 'EU',
    data: [
      { x: 'Mon', y: 120 },
      { x: 'Tue', y: 138 },
      { x: 'Wed', y: 145 },
      { x: 'Thu', y: 162 },
      { x: 'Fri', y: 153 },
      { x: 'Sat', y: 118 },
      { x: 'Sun', y: 109 },
    ],
  },
  {
    name: 'NA',
    data: [
      { x: 'Mon', y: 95 },
      { x: 'Tue', y: 102 },
      { x: 'Wed', y: 117 },
      { x: 'Thu', y: 130 },
      { x: 'Fri', y: 140 },
      { x: 'Sat', y: 110 },
      { x: 'Sun', y: 98 },
    ],
  },
  {
    name: 'APAC',
    data: [
      { x: 'Mon', y: 168 },
      { x: 'Tue', y: 175 },
      { x: 'Wed', y: 182 },
      { x: 'Thu', y: 195 },
      { x: 'Fri', y: 203 },
      { x: 'Sat', y: 188 },
      { x: 'Sun', y: 174 },
    ],
  },
]

const cumulativeSeries = [
  {
    name: 'Total',
    data: [
      { x: 'W1', y: 120 },
      { x: 'W2', y: 280 },
      { x: 'W3', y: 410 },
      { x: 'W4', y: 530 },
      { x: 'W5', y: 690 },
      { x: 'W6', y: 880 },
      { x: 'W7', y: 1020 },
      { x: 'W8', y: 1240 },
    ],
  },
]
</script>
