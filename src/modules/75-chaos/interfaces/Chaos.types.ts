import type React from 'react'
import type { ConnectorReferenceFieldProps } from '@connectors/components/ConnectorReferenceField/ConnectorReferenceField'

export interface ChaosCustomMicroFrontendProps {
  customComponents: {
    ConnectorReferenceField: React.ComponentType<ConnectorReferenceFieldProps>
  }
}
