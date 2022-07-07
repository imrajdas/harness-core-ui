/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { IDrawerProps, Position } from '@blueprintjs/core'
import type { TextAreaProps } from '@wings-software/uicore/dist/components/FormikForm/FormikForm'
import type { TimeSeriesSampleDTO } from 'services/cv'
import type { RecordsProps } from '../Records/types'

export interface QueryContentProps {
  handleFetchRecords: () => void
  query?: string
  loading?: boolean
  isDialogOpen?: boolean
  onEditQuery?: () => void
  textAreaProps?: TextAreaProps['textArea']
  textAreaName?: string
  onClickExpand?: (isOpen: boolean) => void
  isAutoFetch?: boolean
  mandatoryFields?: any[]
  staleRecordsWarning?: string
  textAreaPlaceholder?: string
}

export interface QueryViewerProps {
  isManualQuery?: boolean
  className?: string
  records?: TimeSeriesSampleDTO[]
  loading: boolean
  error: any
  query: string
  isQueryExecuted?: boolean
  postFetchingRecords?: () => void
  fetchRecords: () => void
  queryNotExecutedMessage?: string
  queryTextAreaProps?: TextAreaProps['textArea']
  staleRecordsWarning?: string
  isAutoFetch?: boolean
  queryContentMandatoryProps?: any[]
  queryLabel?: string
  recordsClassName?: string
  fetchEntityName?: string
  dataTooltipId?: string
  isTemplate?: boolean
  expressions?: string[]
  isConnectorRuntimeOrExpression?: boolean
}

export interface QueryViewDialogProps extends RecordsProps {
  onHide: () => void
  isManualQuery?: boolean
  query?: string
  fetchRecords: () => void
  isOpen: boolean
}

export const DrawerProps: IDrawerProps = {
  autoFocus: true,
  canEscapeKeyClose: true,
  canOutsideClickClose: true,
  enforceFocus: true,
  isOpen: false,
  hasBackdrop: true,
  position: Position.RIGHT,
  usePortal: true,
  size: '50%'
}
