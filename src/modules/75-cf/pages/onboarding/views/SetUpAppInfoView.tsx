/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Heading, Layout, Link, Text } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import flagId from './flag-id.svg'
import sdk from './sdk.svg'

export const SetUpAppInfoView: React.FC = () => {
  const { getString } = useStrings()
  return (
    <Container
      width={400}
      padding="xxlarge"
      style={{
        boxShadow: '-8px 0 10px -5px rgb(96 97 112 / 16%)',
        position: 'fixed',
        top: '90px',
        right: 0,
        bottom: '60px',
        zIndex: 0
      }}
    >
      <Layout.Vertical spacing="xxlarge">
        <Heading level={2} style={{ fontWeight: 500, color: '#22222A' }}>
          {getString('cf.onboarding.help.heading1')}
        </Heading>
        <img width="248" height="101" src={flagId} style={{ alignSelf: 'center' }} />
        <Text style={{ lineHeight: '20px', color: '#6B6D85' }}>{getString('cf.onboarding.help.text1')}</Text>

        <Heading level={2} style={{ fontWeight: 500, color: '#22222A' }}>
          {getString('cf.onboarding.help.heading2')}
        </Heading>
        <img width="180" height="134" src={sdk} style={{ alignSelf: 'center' }} />
        <Text style={{ lineHeight: '20px', color: '#6B6D85' }}>{getString('cf.onboarding.help.text2')}</Text>

        <Container>
          <Link
            href="https://docs.harness.io/article/rvqprvbq8f-client-side-and-server-side-sdks"
            target="_blank"
            text={getString('cf.onboarding.help.getStarted')}
          />
        </Container>
      </Layout.Vertical>
    </Container>
  )
}
