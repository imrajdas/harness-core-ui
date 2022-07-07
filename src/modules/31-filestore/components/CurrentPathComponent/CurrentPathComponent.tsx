/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import React, { useContext } from 'react'
import { Container, Text } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { FileStoreContext } from '@filestore/components/FileStoreContext/FileStoreContext'
import { SEARCH_FILES } from '@filestore/utils/constants'

export default function StoreView(): React.ReactElement {
  const { getString } = useStrings()
  const { currentNode } = useContext(FileStoreContext)

  if (currentNode.identifier === SEARCH_FILES) {
    return (
      <Container padding={'medium'}>
        <Text font={{ size: 'medium', weight: 'bold' }} color={Color.GREY_900}>
          {getString('filestore.searchResult', { count: currentNode?.children?.length || 0 })}
        </Text>
      </Container>
    )
  }

  return (
    <Container padding={'medium'} flex>
      <Text margin={{ right: 'xsmall' }} font={{ size: 'normal', weight: 'bold' }} color={Color.PRIMARY_7}>
        {currentNode.path}
      </Text>
    </Container>
  )
}
