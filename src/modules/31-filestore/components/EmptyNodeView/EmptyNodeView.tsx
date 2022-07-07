/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext } from 'react'
import { Container, Layout, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import filestoreIllustration from '@filestore/images/no-files-state.svg'
import { NewFileButton } from '@filestore/common/NewFile/NewFile'
import { FileStoreContext } from '@filestore/components/FileStoreContext/FileStoreContext'

import css from './EmptyNodeView.module.scss'

export interface EmptyNodeViewProps {
  onUpload?: () => void
  title?: string
  description?: string
  customImgSrc?: string
}

export default function EmptyNodeView({ title, description = '' }: EmptyNodeViewProps): React.ReactElement {
  const { currentNode, isModalView } = useContext(FileStoreContext)

  const NewButton = React.useMemo(() => {
    return <NewFileButton parentIdentifier={currentNode.identifier} />
  }, [currentNode])
  return (
    <Container className={isModalView ? css.noViewContainerModal : css.noViewContainer}>
      <Layout.Vertical spacing={'xxlarge'} height={'100%'} flex={{ align: 'center-center' }}>
        <img src={filestoreIllustration} width={'220px'} />
        <Container>
          <Text font={{ weight: 'bold', size: 'medium', align: 'center' }} color={Color.GREY_600}>
            {title}
          </Text>
          <Container className={css.descriptions}>
            {description && (
              <Text font={{ size: 'normal', align: 'center' }} color={Color.GREY_600}>
                {description}
              </Text>
            )}
          </Container>
        </Container>
        {NewButton}
      </Layout.Vertical>
    </Container>
  )
}
