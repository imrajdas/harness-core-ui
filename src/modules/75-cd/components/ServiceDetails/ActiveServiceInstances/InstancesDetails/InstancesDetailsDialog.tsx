/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { Dispatch, SetStateAction } from 'react'
import cx from 'classnames'
import { Collapse, Container, Dialog, Layout, Text } from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import type { InstanceGroupedByArtifact } from 'services/cd-ng'
import { ActiveServiceInstancesContentV2, TableType } from '../ActiveServiceInstancesContentV2'
import css from './InstancesDetailsDialog.module.scss'

export interface InstancesDetailsDialogProps {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
  data?: InstanceGroupedByArtifact[]
}

export default function InstancesDetailsDialog(props: InstancesDetailsDialogProps): React.ReactElement {
  const { isOpen, setIsOpen, data } = props
  const { getString } = useStrings()

  const headers = React.useMemo(() => {
    const headersArray = [
      {
        label: ' ',
        flexGrow: 4
      },
      {
        label: getString('cd.serviceDashboard.headers.artifactVersion'),
        flexGrow: 18
      },
      {
        label: getString('cd.serviceDashboard.headers.environment'),
        flexGrow: 16
      },
      {
        label: getString('cd.serviceDashboard.headers.infrastructures'),
        flexGrow: 16
      },
      {
        label: getString('cd.serviceDashboard.headers.instances'),
        flexGrow: 32
      },
      {
        label: getString('cd.serviceDashboard.headers.pipelineExecution'),
        flexGrow: 24
      }
    ]

    return (
      <Layout.Horizontal flex padding={{ top: 'medium', bottom: 'medium' }}>
        {headersArray.map((header, index) => {
          return (
            <Text
              key={index}
              font={{ variation: FontVariation.TABLE_HEADERS }}
              style={{ flex: header.flexGrow, textTransform: 'uppercase' }}
            >
              {header.label}
            </Text>
          )
        })}
      </Layout.Horizontal>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const list = React.useMemo(() => {
    return (
      <Container style={{ overflowY: 'auto' }}>
        {data?.map((dataItem, index) => {
          return (
            <Collapse
              key={index}
              collapseClassName={css.collapse}
              collapseHeaderClassName={css.collapseHeader}
              heading={<ActiveServiceInstancesContentV2 tableType={TableType.SUMMARY} data={[dataItem]} />}
              expandedHeading={<>{/* empty element on purpose */}</>}
              collapsedIcon={'main-chevron-right'}
              expandedIcon={'main-chevron-down'}
            >
              <ActiveServiceInstancesContentV2 tableType={TableType.FULL} data={[dataItem]} />
            </Collapse>
          )
        })}
      </Container>
    )
  }, [data])

  return (
    <Dialog
      className={cx('padded-dialog', css.dialogBase)}
      title={getString('cd.serviceDashboard.instancesDetails')}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      enforceFocus={false}
    >
      <div className="separator" style={{ marginTop: '14px', borderTop: '1px solid var(--grey-100)' }} />
      {headers}
      {list}
    </Dialog>
  )
}
