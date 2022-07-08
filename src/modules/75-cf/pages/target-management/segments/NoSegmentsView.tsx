/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { Container } from '@harness/uicore'
import { NoData } from '@cf/components/NoData/NoData'
import { String, useStrings } from 'framework/strings'
import { NewSegmentButton } from './NewSegmentButton'
import imageURL from '../../../images/segment.svg'

export interface NoSegmentsViewProps {
  onNewSegmentCreated: (segmentIdentifier: string) => void
}

export const NoSegmentsView: React.FC<NoSegmentsViewProps> = ({ onNewSegmentCreated }) => {
  const { projectIdentifier, orgIdentifier, accountId: accountIdentifier } = useParams<Record<string, string>>()
  const { getString } = useStrings()

  return (
    <Container width="100%" height="100%" flex={{ align: 'center-center' }}>
      <NoData
        imageURL={imageURL}
        message={getString('cf.segments.noTargetGroupsForEnv')}
        description={<String useRichText stringID="cf.segments.noTargetGroupsDescription" />}
      >
        <NewSegmentButton
          accountIdentifier={accountIdentifier}
          orgIdentifier={orgIdentifier}
          projectIdentifier={projectIdentifier}
          onCreated={onNewSegmentCreated}
        />
      </NoData>
    </Container>
  )
}
