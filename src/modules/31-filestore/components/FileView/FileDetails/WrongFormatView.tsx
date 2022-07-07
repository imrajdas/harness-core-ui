/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext } from 'react'
import { Container, Layout, Text, Button, ButtonVariation } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { FileStoreContext } from '@filestore/components/FileStoreContext/FileStoreContext'
import useUploadFile, { UPLOAD_EVENTS } from '@filestore/common/useUpload/useUpload'

export default function WrongFormatView(): React.ReactElement {
  const { getString } = useStrings()
  const { currentNode, isModalView } = useContext(FileStoreContext)

  const uploadNewFile = useUploadFile({
    isBtn: true,
    eventMethod: UPLOAD_EVENTS.REPLACE
  })

  return (
    <Container
      width={'100%'}
      style={{ height: isModalView ? '100%' : 'calc(100% + 145px)' }}
      background={Color.GREY_100}
    >
      <Layout.Vertical spacing={'xxlarge'} height={'100%'} flex={{ align: 'center-center' }}>
        <Container
          style={{ width: isModalView ? '110px' : '220px', position: 'relative', minHeight: isModalView ? 150 : 300 }}
        >
          <img
            style={{ position: 'absolute', width: isModalView ? '110px' : '220px', top: 0, left: 0 }}
            src={currentNode?.content ? currentNode.content : ''}
            alt={getString('filestore.view.noPreview')}
          />
        </Container>
        <Container />
        <Container>
          <Text font={{ weight: 'bold', size: 'medium', align: 'center' }} color={Color.GREY_600}>
            {getString('filestore.view.noPreview')}
          </Text>
          <Container margin={{ top: 'medium' }}>
            <Text font={{ size: 'normal' }} color={Color.GREY_600}>
              {getString('filestore.errors.cannotRender')}
            </Text>
          </Container>
        </Container>
        <Button
          variation={ButtonVariation.SECONDARY}
          icon="syncing"
          onClick={uploadNewFile.onClick}
          title={uploadNewFile.label}
          text={uploadNewFile.label}
        />
      </Layout.Vertical>
    </Container>
  )
}
