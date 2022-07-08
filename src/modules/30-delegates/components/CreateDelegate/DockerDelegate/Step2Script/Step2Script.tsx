/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import set from 'lodash-es/set'
import { Button, Layout, StepProps, Heading, Text, Container } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import CopyToClipboard from '@common/components/CopyToClipBoard/CopyToClipBoard'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import YamlBuilder from '@common/components/YAMLBuilder/YamlBuilder'

import { useGenerateDockerDelegateYAML, DelegateSetupDetails } from 'services/portal'

import type { DockerDelegateWizardData } from '../CreateDockerDelegate'
import css from './Step2Script.module.scss'

const dockerFileName = 'docker-compose.yml'
const dockerComposeCommand = `docker-compose -f ${dockerFileName} up -d`

const getCommandBlock = (label: string, command: string) => (
  <>
    <Text margin={{ top: 'medium' }} color={Color.BLACK}>
      {label}
    </Text>
    <Layout.Horizontal spacing="medium">
      <Container
        intent="primary"
        padding="small"
        font={{
          align: 'center'
        }}
        flex
        className={css.verificationField}
      >
        <Text margin={{ right: 'xxlarge' }} font="small">
          {`$ ${command}`}
        </Text>
        <CopyToClipboard content={command} />
      </Container>
    </Layout.Horizontal>
  </>
)

const Step2Script: React.FC<StepProps<DockerDelegateWizardData>> = props => {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const [delegateDockerYaml, setDelegateDockerYaml] = useState('')
  const { getString } = useStrings()
  const { previousStep, prevStepData } = props

  const linkRef = React.useRef<HTMLAnchorElement>(null)

  const { mutate: getDockerYaml } = useGenerateDockerDelegateYAML({
    queryParams: {
      accountId
    }
  })

  const fetchDockerYaml = async () => {
    const createParams = { ...prevStepData } as DelegateSetupDetails

    if (projectIdentifier) {
      set(createParams, 'projectIdentifier', projectIdentifier)
    }
    if (orgIdentifier) {
      set(createParams, 'orgIdentifier', orgIdentifier)
    }
    set(createParams, 'delegateType', 'DOCKER')
    const dockerYaml = (await getDockerYaml(createParams)) as any
    setDelegateDockerYaml(dockerYaml)
  }

  useEffect(() => {
    fetchDockerYaml()
  }, [])

  const onDownload = () => {
    const content = new Blob([delegateDockerYaml as BlobPart], { type: 'data:text/plain;charset=utf-8' })
    if (linkRef?.current) {
      linkRef.current.href = window.URL.createObjectURL(content)
      linkRef.current.download = dockerFileName
      linkRef.current.click()
    }
  }

  const yamlBuilderComp = (
    <YamlBuilder
      entityType="Delegates"
      fileName={dockerFileName}
      isReadOnlyMode={true}
      isEditModeSupported={false}
      hideErrorMesageOnReadOnlyMode={true}
      existingYaml={delegateDockerYaml as any}
      showSnippetSection={false}
      width="568px"
      height="462px"
      theme="DARK"
    />
  )

  return (
    <>
      <Layout.Horizontal padding={{ top: 'small', left: 'xlarge', right: 'xlarge' }}>
        <Layout.Vertical spacing="medium">
          <div>{yamlBuilderComp}</div>
          <Layout.Horizontal padding={{ top: 'medium' }}>
            <Button
              id="stepReviewScriptDownloadButton"
              icon="arrow-down"
              text={getString('delegates.downloadYAMLFile')}
              onClick={onDownload}
              outlined
            />
          </Layout.Horizontal>
          <Layout.Horizontal padding={{ top: 'medium' }} spacing="small">
            <Button
              id="stepReviewScriptBackButton"
              text={getString('back')}
              icon="chevron-left"
              onClick={() => previousStep?.({ ...prevStepData })}
              intent="none"
            />
            <Button
              id="stepReviewScriptContinueButton"
              type="submit"
              intent="primary"
              text={getString('continue')}
              rightIcon="chevron-right"
              onClick={() => {
                props.nextStep?.({ ...prevStepData })
              }}
            />
          </Layout.Horizontal>
        </Layout.Vertical>
        <Layout.Vertical className={css.verticalDivider}>
          <hr />
        </Layout.Vertical>
        <Layout.Vertical>
          <Heading level={2} margin={{ bottom: 'large' }} color={Color.BLACK}>
            {getString('delegates.delegateCreation.docker.verifyTitle')}
          </Heading>

          <Text lineClamp={2} font="normal" margin={{ bottom: 'medium' }}>
            {getString('delegates.delegateCreation.docker.verifyDesc1')}
          </Text>

          <Text lineClamp={2} margin={{ bottom: 'medium' }}>
            {getString('delegates.delegateCreation.docker.verifyDesc2')}
          </Text>

          <Layout.Horizontal spacing="medium">
            <Container
              intent="primary"
              padding="small"
              font={{
                align: 'center'
              }}
              flex
              className={css.verificationField}
            >
              <Text margin={{ right: 'xxlarge' }} font="small">
                {`$ ${dockerComposeCommand}`}
              </Text>
              <CopyToClipboard content={dockerComposeCommand} />
            </Container>
          </Layout.Horizontal>
        </Layout.Vertical>
        <div className={css.dockerDetailsContainer} style={{ display: 'none' }}>
          <Heading level={2} font={{ weight: 'bold' }} color={Color.BLACK} margin={{ bottom: 'large' }}>
            {getString('delegates.delegateCreation.docker.scriptTitle')}
          </Heading>

          {getCommandBlock(getString('delegates.delegateCreation.docker.scriptText'), '')}

          {getCommandBlock(getString('delegates.delegateCreation.docker.scriptCommandGetIds'), 'docker ps')}

          {getCommandBlock(
            getString('delegates.delegateCreation.docker.scriptSeeLogs'),
            'docker logs -f <container-id>'
          )}

          {getCommandBlock(
            getString('delegates.delegateCreation.docker.scriptRunInShell'),
            'docker container exec -it <container-id> bash'
          )}

          <Text margin={{ top: 'xlarge' }} color={Color.BLACK}>
            {getString('delegates.delegateCreation.docker.docLinkBefore')}
            <a
              rel="noreferrer"
              href="https://docs.harness.io/article/5ww21ewdt8-configure-delegate-proxy-settings"
              target="_blank"
            >
              {getString('delegates.delegateCreation.docker.docLink')}
            </a>
          </Text>
        </div>
      </Layout.Horizontal>
      <a className="hide" ref={linkRef} target={'_blank'} />
    </>
  )
}

export default Step2Script
