/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Layout, Text, Button } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import CopyToClipboard from '@common/components/CopyToClipBoard/CopyToClipBoard'
import { DelegateTypes, TroubleShootingTypes } from '@delegates/constants'
import css from './DelegateInstallationError.module.scss'

interface TroubleShootingProps {
  delegateType?: string
}

const TroubleShooting: React.FC<TroubleShootingProps> = props => {
  const { delegateType } = props
  const { getString } = useStrings()
  const docsLink = (
    <div style={{ padding: 'var(--spacing-medium) 0px' }}>
      <a href="https://docs.harness.io" target="_blank" rel="noreferrer" style={{ marginTop: 'var(--spacing-medium)' }}>
        {getString('delegates.harnessDocs')}
      </a>
    </div>
  )

  const CommonText = ({ children }: { children: React.ReactElement | string }) => (
    <Text color={Color.BLACK_100} margin={{ top: 'var(--spacing-medium)', bottom: 'var(--spacing-medium)' }}>
      {children}
    </Text>
  )
  const harnessSupportEmail = (
    <div className={css.harnessSupportContainer}>
      <a href="mailto:support@harness.io">{getString('delegates.delegateNotInstalled.contactHarness')}</a>
    </div>
  )
  const [activeEvent, setActiveEvent] = React.useState(
    delegateType === DelegateTypes.DOCKER
      ? TroubleShootingTypes.VERIFY_CONTAINER_STATUS
      : TroubleShootingTypes.VERIFY_PODS_COMEUP
  )
  const iconProps = { size: 10, color: Color.ORANGE_400 }

  return (
    <Layout.Vertical width={630} style={{ padding: '0px var(--spacing-large)' }}>
      <Layout.Horizontal
        flex
        style={{
          borderBottom: '0.5px solid #B0B1C4',
          padding: 'var(--spacing-small) var(--spacing-medium)'
        }}
      >
        <Button
          intent="primary"
          minimal
          text={getString('back')}
          onClick={() => {
            switch (activeEvent) {
              case TroubleShootingTypes.VERIFY_CONTAINER_STATUS:
                setActiveEvent(TroubleShootingTypes.VERIFY_CONTAINER_STATUS)
                return
              case TroubleShootingTypes.VERIFY_HARNESS_SASS:
                setActiveEvent(TroubleShootingTypes.VERIFY_PODS_COMEUP)
                return
              case TroubleShootingTypes.CURL_HARNESS_IO:
                setActiveEvent(TroubleShootingTypes.VERIFY_HARNESS_SASS)
                return
              case TroubleShootingTypes.DO_YOU_HAVE_PROXY:
                setActiveEvent(TroubleShootingTypes.CURL_HARNESS_IO)
                return
              case TroubleShootingTypes.CHECK_PROXY:
                setActiveEvent(TroubleShootingTypes.DO_YOU_HAVE_PROXY)
                return
              case TroubleShootingTypes.VERIFY_EVENTS:
                setActiveEvent(TroubleShootingTypes.VERIFY_PODS_COMEUP)
                return
              case TroubleShootingTypes.CHECK_CLUSTER_PERMISSION:
                setActiveEvent(TroubleShootingTypes.VERIFY_EVENTS)
                return
              case TroubleShootingTypes.CONTAINER_FAILED_START:
                setActiveEvent(TroubleShootingTypes.VERIFY_EVENTS)
                return
              case TroubleShootingTypes.CHECK_CLUSTER_CONFIG:
                setActiveEvent(TroubleShootingTypes.CONTAINER_FAILED_START)
                return
              case TroubleShootingTypes.CAN_CLUSTER_CONNECT_TO_REGISTRY:
                setActiveEvent(TroubleShootingTypes.VERIFY_EVENTS)
                return
              case TroubleShootingTypes.CONTAINER_RUNNING:
                setActiveEvent(TroubleShootingTypes.VERIFY_CONTAINER_STATUS)
                return
              case TroubleShootingTypes.CONTAINER_NOT_RUNNING:
                setActiveEvent(TroubleShootingTypes.VERIFY_CONTAINER_STATUS)
                return
              default:
                setActiveEvent(TroubleShootingTypes.VERIFY_PODS_COMEUP)
                return
            }
          }}
        />

        <Text
          icon="info"
          color={Color.BLACK}
          font={{ size: 'medium', weight: 'bold' }}
          style={{ lineHeight: '22px' }}
          iconProps={{
            color: Color.BLUE_800
          }}
        >
          {getString('delegates.delegateNotInstalled.tabs.commonProblems.hereIsWhatYouCanDo')}
        </Text>
        <Button
          intent="primary"
          minimal
          text={getString('restart')}
          onClick={() => {
            setActiveEvent(
              delegateType === DelegateTypes.DOCKER
                ? TroubleShootingTypes.VERIFY_CONTAINER_STATUS
                : TroubleShootingTypes.VERIFY_PODS_COMEUP
            )
          }}
        />
      </Layout.Horizontal>
      {/* Below is troubleshoot related to delegate type and it should be rendered conditionally */}
      <Layout.Vertical width={511} style={{ padding: 'var(--spacing-medium) 0px' }}>
        <Layout.Horizontal flex>
          <Text color={Color.BLACK_100}>{getString('delegates.delegateNotInstalled.statusOfCluster')}</Text>
          <a
            href="https://docs.harness.io/"
            target="_blank"
            rel="noreferrer"
            style={{ textAlign: 'end', fontSize: '13px' }}
          >
            {getString('delegates.delegateNotInstalled.tabs.commonProblems.troubleshoot')}
          </a>
        </Layout.Horizontal>
        <Container
          intent="primary"
          padding="small"
          font={{
            align: 'center'
          }}
          flex
          className={css.podCmndField}
        >
          <Text>
            {delegateType === DelegateTypes.DOCKER
              ? getString('delegates.delegateNotInstalled.verifyStatus2')
              : getString('delegates.delegateNotInstalled.podCommand')}
          </Text>
          <CopyToClipboard
            content={
              delegateType === DelegateTypes.DOCKER
                ? getString('delegates.delegateNotInstalled.verifyStatus2')
                : getString('delegates.delegateNotInstalled.podCommand')
            }
          />
        </Container>
      </Layout.Vertical>
      {activeEvent === TroubleShootingTypes.VERIFY_CONTAINER_STATUS && (
        <Container className={css.podCmndVerification} style={{ padding: 'var(--spacing-medium) 0px' }}>
          <Text color={Color.BLACK_100}>{getString('delegates.delegateNotInstalled.containerRunning')}</Text>
          <Container style={{ marginTop: 'var(--spacing-medium)' }}>
            <Button
              onClick={() => {
                setActiveEvent(TroubleShootingTypes.CONTAINER_RUNNING)
              }}
              text={getString('yes')}
            />
            <Button
              intent="none"
              onClick={() => {
                setActiveEvent(TroubleShootingTypes.CONTAINER_NOT_RUNNING)
              }}
              className={css.noBtn}
              text={getString('no')}
            />
          </Container>
        </Container>
      )}
      {activeEvent === TroubleShootingTypes.VERIFY_PODS_COMEUP && (
        <Container className={css.podCmndVerification} style={{ padding: 'var(--spacing-medium) 0px' }}>
          <Text color={Color.BLACK_100}>{getString('delegates.delegateNotInstalled.podComeUp')}</Text>
          <Container style={{ marginTop: 'var(--spacing-medium)' }}>
            <Button
              onClick={() => {
                setActiveEvent(TroubleShootingTypes.VERIFY_HARNESS_SASS)
              }}
              text={getString('yes')}
            />
            <Button
              intent="none"
              onClick={() => {
                setActiveEvent(TroubleShootingTypes.VERIFY_EVENTS)
              }}
              className={css.noBtn}
              text={getString('no')}
            />
          </Container>
        </Container>
      )}
      {/* left side flow */}
      {activeEvent === TroubleShootingTypes.VERIFY_HARNESS_SASS && (
        <>
          <Layout.Vertical width={511} style={{ padding: 'var(--spacing-medium) 0px' }}>
            <Text color={Color.BLACK_100}>{getString('delegates.delegateNotInstalled.harnessErrorValidation')}</Text>
          </Layout.Vertical>
          <Container className={css.podCmndVerification}>
            <Button
              onClick={() => {
                setActiveEvent(TroubleShootingTypes.CURL_HARNESS_IO)
              }}
              text={getString('yes')}
            />
            <Button
              text={getString('no')}
              intent="none"
              className={css.noBtn}
              onClick={() => {
                setActiveEvent(TroubleShootingTypes.CONTACT_HARNESS_SUPPORT)
              }}
            />
          </Container>
        </>
      )}
      {activeEvent === TroubleShootingTypes.CURL_HARNESS_IO && (
        <>
          <Layout.Vertical width={511} style={{ padding: 'var(--spacing-medium) 0px' }}>
            <CommonText>{getString('delegates.delegateNotInstalled.curlHarnessIO')}</CommonText>
            <CommonText>{getString('delegates.delegateNotInstalled.curlHarnessIO2')}</CommonText>
            <CommonText>{getString('delegates.delegateNotInstalled.curlHarnessIO3')}</CommonText>
          </Layout.Vertical>
          <Container className={css.podCmndVerification}>
            <Button
              onClick={() => {
                setActiveEvent(TroubleShootingTypes.CHECK_FIREWALL_PORTS)
              }}
              text={getString('yes')}
            />
            <Button
              text={getString('no')}
              intent="none"
              className={css.noBtn}
              onClick={() => {
                setActiveEvent(TroubleShootingTypes.DO_YOU_HAVE_PROXY)
              }}
            />
          </Container>
        </>
      )}
      {activeEvent === TroubleShootingTypes.DO_YOU_HAVE_PROXY && (
        <>
          <Layout.Vertical width={511} style={{ padding: 'var(--spacing-medium) 0px' }}>
            <Text color={Color.BLACK_100}>{getString('delegates.delegateNotInstalled.doYouHaveProxy')}</Text>
          </Layout.Vertical>
          <Container className={css.podCmndVerification}>
            <Button
              onClick={() => {
                setActiveEvent(TroubleShootingTypes.CHECK_PROXY)
              }}
              text={getString('yes')}
            />
            <Button
              text={getString('no')}
              intent="none"
              className={css.noBtn}
              onClick={() => {
                setActiveEvent(TroubleShootingTypes.CHECK_FIREWALL_PORTS)
              }}
            />
          </Container>
        </>
      )}
      {activeEvent === TroubleShootingTypes.CHECK_PROXY && (
        <>
          <Layout.Vertical width={511} style={{ padding: 'var(--spacing-medium) 0px' }}>
            <CommonText>{getString('delegates.delegateNotInstalled.checkProxy')}</CommonText>
          </Layout.Vertical>
          <Container className={css.podCmndVerification}>
            <Button
              onClick={() => {
                setActiveEvent(TroubleShootingTypes.GOOD_TO_GO)
              }}
              text={getString('yes')}
            />
            <Button
              text={getString('no')}
              intent="none"
              className={css.noBtn}
              onClick={() => {
                setActiveEvent(TroubleShootingTypes.CHECK_FIREWALL_PORTS)
              }}
            />
          </Container>
        </>
      )}
      {activeEvent === TroubleShootingTypes.CONTAINER_RUNNING && (
        <Layout.Vertical width={511} style={{ padding: 'var(--spacing-medium) 0px' }}>
          <Layout.Horizontal flex>
            <Text color={Color.BLACK_100}>
              {getString('delegates.delegateNotInstalled.tabs.commonProblems.checkTheDelegateLogs')}
            </Text>
            <a
              href="https://docs.harness.io/"
              target="_blank"
              rel="noreferrer"
              style={{ textAlign: 'end', fontSize: '13px' }}
            >
              {getString('delegates.delegateNotInstalled.tabs.commonProblems.troubleshoot')}
            </a>
          </Layout.Horizontal>
          <Container
            intent="primary"
            padding="small"
            font={{
              align: 'center'
            }}
            flex
            className={css.podCmndField}
          >
            <Text>{getString('delegates.delegateNotInstalled.verifyLogs1')}</Text>
            <CopyToClipboard content={getString('delegates.delegateNotInstalled.verifyLogs1')} />
          </Container>
          <Layout.Vertical width={511} style={{ padding: 'var(--spacing-medium) 0px' }}>
            <CommonText>{getString('delegates.delegateNotInstalled.logsError')}</CommonText>
            {harnessSupportEmail}
            {docsLink}
          </Layout.Vertical>
        </Layout.Vertical>
      )}
      {/* right side flow */}
      {activeEvent === TroubleShootingTypes.VERIFY_EVENTS && (
        <>
          <Layout.Vertical width={511} style={{ padding: 'var(--spacing-medium) 0px' }}>
            <Text color={Color.BLACK_100}>{getString('delegates.delegateNotInstalled.eventErrorBlock')}</Text>
          </Layout.Vertical>
          <Container className={css.btnContainer}>
            <Button
              onClick={() => setActiveEvent(TroubleShootingTypes.CHECK_CLUSTER_PERMISSION)}
              rightIcon="warning-sign"
              iconProps={iconProps}
              className={css.error}
            >
              {getString('delegates.delegateNotInstalled.permissionError')}
            </Button>
            <Button
              onClick={() => setActiveEvent(TroubleShootingTypes.CONTAINER_FAILED_START)}
              rightIcon="warning-sign"
              iconProps={iconProps}
              className={`${css.error} ${css.addSpacing}`}
            >
              {getString('delegates.delegateNotInstalled.crashloopError')}
            </Button>
            <Button
              onClick={() => setActiveEvent(TroubleShootingTypes.CAN_CLUSTER_CONNECT_TO_REGISTRY)}
              rightIcon="warning-sign"
              iconProps={iconProps}
              className={`${css.error} ${css.addSpacing}`}
            >
              {getString('delegates.delegateNotInstalled.pullError')}
            </Button>
          </Container>
        </>
      )}
      {activeEvent === TroubleShootingTypes.CHECK_CLUSTER_PERMISSION && (
        <>
          <Layout.Vertical width={511} style={{ padding: 'var(--spacing-medium) 0px' }}>
            <CommonText>{getString('delegates.delegateNotInstalled.checkClusterPermission')}</CommonText>
            <CommonText>{getString('delegates.delegateNotInstalled.checkClusterPermission2')}</CommonText>
            {harnessSupportEmail}
            {docsLink}
          </Layout.Vertical>
        </>
      )}
      {activeEvent === TroubleShootingTypes.CONTAINER_FAILED_START && (
        <>
          <Layout.Vertical width={511} style={{ padding: 'var(--spacing-medium) 0px' }}>
            <CommonText>{getString('delegates.delegateNotInstalled.eventErrorBlock')}</CommonText>
          </Layout.Vertical>
          <Container className={css.btnContainer}>
            <Button
              onClick={() => setActiveEvent(TroubleShootingTypes.CONTACT_HARNESS_SUPPORT)}
              rightIcon="warning-sign"
              iconProps={iconProps}
              className={css.error}
            >
              {getString('delegates.delegateNotInstalled.applicationError')}
            </Button>
            <Button
              onClick={() => setActiveEvent(TroubleShootingTypes.CHECK_CLUSTER_CONFIG)}
              rightIcon="warning-sign"
              iconProps={iconProps}
              className={`${css.error} ${css.addSpacing}`}
            >
              {getString('delegates.delegateNotInstalled.CPUorMemError')}
            </Button>
          </Container>
        </>
      )}
      {activeEvent === TroubleShootingTypes.CHECK_CLUSTER_CONFIG && (
        <>
          <Layout.Vertical width={511} style={{ padding: 'var(--spacing-medium) 0px' }}>
            <CommonText>{getString('delegates.delegateNotInstalled.checkClusterConfig')}</CommonText>
            <CommonText>{getString('delegates.delegateNotInstalled.checkClusterConfig2')}</CommonText>
          </Layout.Vertical>
          <Container className={css.podCmndVerification}>
            <Button
              onClick={() => {
                setActiveEvent(TroubleShootingTypes.GOOD_TO_GO)
              }}
              text={getString('yes')}
            />
            <Button
              text={getString('no')}
              intent="none"
              className={css.noBtn}
              onClick={() => {
                setActiveEvent(TroubleShootingTypes.CONTACT_HARNESS_SUPPORT)
              }}
            />
          </Container>
        </>
      )}
      {activeEvent === TroubleShootingTypes.CAN_CLUSTER_CONNECT_TO_REGISTRY && (
        <Layout.Vertical width={511} style={{ padding: 'var(--spacing-medium) 0px' }}>
          <CommonText>{getString('delegates.delegateNotInstalled.checkCanClusterConnectToRegistry')}</CommonText>
          <CommonText>{getString('delegates.delegateNotInstalled.contactHarness')}</CommonText>
          {docsLink}
        </Layout.Vertical>
      )}
      {/* end messages */}
      {activeEvent === TroubleShootingTypes.CHECK_FIREWALL_PORTS && (
        <Layout.Vertical width={511} style={{ padding: 'var(--spacing-medium) 0px' }}>
          <CommonText>{getString('delegates.delegateNotInstalled.checkFirewallPorts')}</CommonText>
          {harnessSupportEmail}
          {docsLink}
        </Layout.Vertical>
      )}
      {activeEvent === TroubleShootingTypes.GOOD_TO_GO && (
        <Layout.Vertical width={511} style={{ padding: 'var(--spacing-medium) 0px' }}>
          <CommonText>{getString('delegates.delegateNotInstalled.goodToGo')}</CommonText>
        </Layout.Vertical>
      )}
      {activeEvent === TroubleShootingTypes.CONTACT_HARNESS_SUPPORT && (
        <Layout.Vertical width={511} style={{ padding: 'var(--spacing-medium) 0px' }}>
          {harnessSupportEmail}
          {docsLink}
        </Layout.Vertical>
      )}
      {activeEvent === TroubleShootingTypes.CONTAINER_NOT_RUNNING && (
        <Layout.Vertical width={511} style={{ padding: 'var(--spacing-medium) 0px' }}>
          <Layout.Horizontal flex>
            <Text color={Color.BLACK_100}>
              {getString('delegates.delegateNotInstalled.tabs.commonProblems.checkTheDelegateLogs')}
            </Text>
            <a
              href="https://docs.harness.io/"
              target="_blank"
              rel="noreferrer"
              style={{ textAlign: 'end', fontSize: '13px' }}
            >
              {getString('delegates.delegateNotInstalled.tabs.commonProblems.troubleshoot')}
            </a>
          </Layout.Horizontal>
          <Container
            intent="primary"
            padding="small"
            font={{
              align: 'center'
            }}
            flex
            className={css.podCmndField}
          >
            <Text>{getString('delegates.delegateNotInstalled.verifyLogs1')}</Text>
            <CopyToClipboard content={getString('delegates.delegateNotInstalled.verifyLogs1')} />
          </Container>
          <Layout.Vertical width={511} style={{ padding: 'var(--spacing-medium) 0px' }}>
            <CommonText>{getString('delegates.delegateNotInstalled.checkError')}</CommonText>
            <Container
              intent="primary"
              padding="small"
              font={{
                align: 'center'
              }}
              flex
              className={css.podCmndField}
            >
              <Text style={{ marginRight: '24px' }}>{getString('delegates.delegateNotInstalled.heartbeatFailed')}</Text>
            </Container>
            <CommonText>{getString('delegates.delegateNotInstalled.logsError')}</CommonText>
            {harnessSupportEmail}
            {docsLink}
          </Layout.Vertical>
        </Layout.Vertical>
      )}
    </Layout.Vertical>
  )
}

export default TroubleShooting
