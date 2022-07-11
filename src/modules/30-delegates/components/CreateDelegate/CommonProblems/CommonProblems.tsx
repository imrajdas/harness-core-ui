/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Layout, Icon, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'

import CopyToClipboard from '@common/components/CopyToClipBoard/CopyToClipBoard'
import { DelegateTypes } from '@delegates/constants'
import css from '../K8sDelegate/CreateK8sDelegate.module.scss'

interface CommonProblemsProps {
  delegateType?: string
}

const CommonProblems: React.FC<CommonProblemsProps> = props => {
  const { delegateType } = props
  const { getString } = useStrings()
  const troubleshootLink = (
    <a href="https://docs.harness.io/" target="_blank" rel="noreferrer" style={{ textAlign: 'end', fontSize: '13px' }}>
      {getString('delegates.delegateNotInstalled.tabs.commonProblems.troubleshoot')}
    </a>
  )
  const K8Container = (
    <>
      <Layout.Vertical width={630} style={{ padding: '0px var(--spacing-large)' }}>
        <Layout.Horizontal
          spacing="medium"
          style={{
            borderBottom: '0.5px solid #B0B1C4',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 'var(--spacing-small) var(--spacing-medium)'
          }}
        >
          <Icon name="support-troubleshoot" size={18} />
          <Text color={Color.BLACK} font={{ size: 'medium', weight: 'bold' }} style={{ lineHeight: '22px' }}>
            {getString('delegates.delegateNotInstalled.tabs.commonProblems.hereIsWhatYouCanDo')}
          </Text>
        </Layout.Horizontal>
        <Layout.Vertical width={511} style={{ padding: 'var(--spacing-medium) 0px' }}>
          <Text color={Color.BLACK} font={{ weight: 'bold' }}>
            {getString('delegates.delegateNotInstalled.statusOfCluster')}
          </Text>
          {troubleshootLink}
          <Container
            intent="primary"
            padding="small"
            font={{
              align: 'center'
            }}
            flex
            className={css.verificationField}
          >
            <Text style={{ marginRight: '24px' }}>{getString('delegates.delegateNotInstalled.podCommand')}</Text>
            <CopyToClipboard content={getString('delegates.delegateNotInstalled.podCommand')} />
          </Container>
        </Layout.Vertical>
        <Layout.Vertical width={511} style={{ padding: 'var(--spacing-small) 0px' }}>
          <Text color={Color.BLACK} font={{ weight: 'bold' }}>
            {getString('delegates.delegateNotInstalled.tabs.commonProblems.checkTheDelegateLogs')}
          </Text>
          {troubleshootLink}
          <Container
            intent="primary"
            padding="small"
            font={{
              align: 'center'
            }}
            flex
            className={css.verificationField}
          >
            <Text style={{ marginRight: '24px' }}>{getString('delegates.delegateNotInstalled.verifyField2')}</Text>
            <CopyToClipboard content={getString('delegates.delegateNotInstalled.verifyField2')} />
          </Container>
        </Layout.Vertical>
        <Layout.Horizontal width={511} style={{ padding: 'var(--spacing-small) 0px' }}>
          <Text lineClamp={3} font="normal" color={Color.GREY_700} style={{ lineHeight: '24px' }}>
            {getString('delegates.delegateNotInstalled.tabs.commonProblems.description1')}
          </Text>
        </Layout.Horizontal>
        <Layout.Vertical width={511} style={{ padding: 'var(--spacing-small) 0px' }}>
          <Text color={Color.BLACK} font={{ weight: 'bold' }}>
            {getString('delegates.delegateNotInstalled.tabs.commonProblems.description2')}
          </Text>
          {troubleshootLink}
          <Container
            intent="primary"
            padding="small"
            font={{
              align: 'center'
            }}
            flex
            className={css.verificationField}
          >
            <Text style={{ marginRight: '24px' }}>{getString('delegates.delegateNotInstalled.verifyField3')}</Text>
            <CopyToClipboard content={getString('delegates.delegateNotInstalled.verifyField3')} />
          </Container>
        </Layout.Vertical>
      </Layout.Vertical>
    </>
  )

  const dockerContainer = (
    <>
      <Layout.Vertical width={630} style={{ padding: '0px var(--spacing-large)' }}>
        <Layout.Horizontal
          spacing="medium"
          style={{
            borderBottom: '0.5px solid #B0B1C4',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 'var(--spacing-small) var(--spacing-medium)'
          }}
        >
          <Icon name="support-troubleshoot" size={18} />
          <Text color={Color.BLACK} font={{ size: 'medium', weight: 'bold' }} style={{ lineHeight: '22px' }}>
            {getString('delegates.delegateNotInstalled.tabs.commonProblems.hereIsWhatYouCanDo')}
          </Text>
        </Layout.Horizontal>
        <Layout.Vertical width={511} style={{ padding: 'var(--spacing-medium) 0px' }}>
          <Text color={Color.BLACK} font={{ weight: 'bold' }}>
            {getString('delegates.delegateNotInstalled.statusOfCluster')}
          </Text>
          {troubleshootLink}
          <Container
            intent="primary"
            padding="small"
            font={{
              align: 'center'
            }}
            flex
            className={css.verificationField}
          >
            <Text style={{ marginRight: '24px' }}>{getString('delegates.delegateNotInstalled.verifyStatus1')}</Text>
            <CopyToClipboard content={getString('delegates.delegateNotInstalled.verifyStatus1')} />
          </Container>
        </Layout.Vertical>
        <Layout.Vertical width={511} style={{ padding: 'var(--spacing-small) 0px' }}>
          <Text color={Color.BLACK} font={{ weight: 'bold' }}>
            {getString('delegates.delegateNotInstalled.tabs.commonProblems.checkTheDelegateLogs')}
          </Text>
          {troubleshootLink}
          <Container
            intent="primary"
            padding="small"
            font={{
              align: 'center'
            }}
            flex
            className={css.verificationField}
          >
            <Text style={{ marginRight: '24px' }}>{getString('delegates.delegateNotInstalled.verifyLogs2')}</Text>
            <CopyToClipboard content={getString('delegates.delegateNotInstalled.verifyLogs2')} />
          </Container>
        </Layout.Vertical>
        <Layout.Vertical width={511} style={{ padding: 'var(--spacing-small) 0px' }}>
          <Text color={Color.BLACK} font={{ weight: 'bold' }}>
            {getString('delegates.delegateNotInstalled.tabs.commonProblems.removeOlderDelegate')}
          </Text>
          {troubleshootLink}
          <Container
            intent="primary"
            padding="small"
            font={{
              align: 'center'
            }}
            flex
            className={css.verificationField}
          >
            <Text style={{ marginRight: '24px' }}>{getString('delegates.delegateNotInstalled.removeDocker')}</Text>
            <CopyToClipboard content={getString('delegates.delegateNotInstalled.removeDocker')} />
          </Container>
        </Layout.Vertical>
      </Layout.Vertical>
    </>
  )

  return delegateType === DelegateTypes.DOCKER ? dockerContainer : K8Container
}

export default CommonProblems
