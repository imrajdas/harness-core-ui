export const conditions = [
  {
    id: 'd093a4f2-2055-4760-8c6f-633ee7977366',
    condition: {
      label: 'Change Impact',
      value: 'ChangeImpact'
    },
    changeType: [
      {
        label: 'Deployment',
        value: 'Deployment'
      },
      {
        label: 'Infrastructure',
        value: 'Infrastructure'
      }
    ],
    threshold: '10',
    duration: '10'
  },
  {
    id: 'e163c48d-4a1e-4025-924e-5366f61153b9',
    condition: null
  }
]

export const updatedConditions = [
  {
    type: 'ChangeImpact',
    spec: {
      threshold: '10',
      period: '10m',
      changeEventTypes: ['Deployment', 'Infrastructure']
    }
  }
]
