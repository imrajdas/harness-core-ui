/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type React from 'react'
import type { Diagnostic } from 'vscode-languageserver-types'
import type { ConnectorReferenceFieldProps } from '@connectors/components/ConnectorReferenceField/ConnectorReferenceField'
import type { OverviewChartsWithToggleProps } from '@common/components/OverviewChartsWithToggle/OverviewChartsWithToggle'

export interface ChaosCustomMicroFrontendProps {
  customComponents: {
    ConnectorReferenceField: React.ComponentType<ConnectorReferenceFieldProps>
    OverviewChartsWithToggle: React.ComponentType<OverviewChartsWithToggleProps>
    validateYAMLWithSchema: (yamlString: string, schema: Record<string, any>) => Promise<Diagnostic[]>
  }
}
