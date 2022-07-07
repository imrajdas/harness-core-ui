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
import type { EnvBuildIdAndInstanceCountInfo } from 'services/cd-ng'
import { ActiveServiceInstancesContent } from '../ActiveServiceInstancesContent'
import css from './InstancesDetailsDialog.module.scss'

export interface InstancesDetailsDialogProps {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
  data?: EnvBuildIdAndInstanceCountInfo[]
}

export default function InstancesDetailsDialog(props: InstancesDetailsDialogProps): React.ReactElement {
  const { isOpen, setIsOpen, data } = props
  const { getString } = useStrings()

  const headers = React.useMemo(() => {
    const headersArray = [
      {
        label: ' ',
        flexGrow: 5
      },
      {
        label: getString('environment'),
        flexGrow: 25
      },
      {
        label: getString('cd.artifactVersion'),
        flexGrow: 25
      },
      {
        label: getString('common.instanceLabel'),
        flexGrow: 55
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
              heading={
                <ActiveServiceInstancesContent
                  data={[dataItem]}
                  columnsWidth={['25%', '25%', '5%', '45%']}
                  hideHeaders={true}
                  shortTable={true}
                />
              }
              expandedHeading={<>{/* empty element on purpose */}</>}
              collapsedIcon={'main-chevron-right'}
              expandedIcon={'main-chevron-down'}
            >
              <ActiveServiceInstancesContent
                data={[dataItem]}
                columnsWidth={['25%', '25%', '5%', '45%']}
                hideHeaders={true}
              />
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
