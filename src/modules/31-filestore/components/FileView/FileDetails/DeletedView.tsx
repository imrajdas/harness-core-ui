/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext } from 'react'
import { Container, Layout, Text, Icon } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { FileStoreContext } from '@filestore/components/FileStoreContext/FileStoreContext'
import { FSErrosType } from '@filestore/utils/constants'

interface DeletedViewProps {
  error: string
}

export default function DeletedView({ error }: DeletedViewProps): React.ReactElement {
  const { getString } = useStrings()
  const { isModalView } = useContext(FileStoreContext)

  const getError = (): string => {
    switch (error) {
      case FSErrosType.DELETED_NODE:
        return getString('errorTitle')
      default:
        return getString('errorTitle')
    }
  }

  return (
    <Container
      width={'100%'}
      style={{ height: isModalView ? '100%' : 'calc(100% + 145px)' }}
      background={Color.GREY_100}
    >
      <Layout.Vertical spacing={'xxlarge'} height={'100%'} flex={{ align: 'center-center' }}>
        <Container>
          <Icon name="main-delete" size={64} />
        </Container>
        <Container>
          <Text font={{ weight: 'bold', size: 'medium', align: 'center' }} color={Color.GREY_600}>
            {getError()}
          </Text>
        </Container>
      </Layout.Vertical>
    </Container>
  )
}
