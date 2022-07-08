/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Heading, Layout, Link, Text } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import img from './create-a-flag.svg'

export const CreateAFlagInfoView: React.FC = () => {
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
          {getString('cf.onboarding.simpliestFlag')}
        </Heading>
        <img width="300" src={img} style={{ alignSelf: 'center' }} />
        <Container>
          <Text style={{ lineHeight: '20px', color: '#6B6D85' }}>
            {getString('cf.onboarding.simpliestFlagDescription')}
          </Text>
          <Container margin={{ top: 'medium' }}>
            <Link
              href="https://docs.harness.io/article/1j7pdkqh7j-create-a-feature-flag#step_4_create_a_flag_type"
              target="_blank"
              text={getString('cf.onboarding.otherTypes')}
            />
          </Container>
        </Container>
      </Layout.Vertical>
    </Container>
  )
}
