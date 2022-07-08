/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo, toLower } from 'lodash-es'
import { useParams, Link } from 'react-router-dom'
import { Spinner } from '@blueprintjs/core'
import { Container, Layout, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import type { ResourceConstraintDetail } from 'services/pipeline-ng'
import type { CDStageModuleInfo } from 'services/cd-ng'
import routes from '@common/RouteDefinitions'
import type { PipelineType, ExecutionPathProps } from '@common/interfaces/RouteInterfaces'
import { isServerlessDeploymentType } from '@pipeline/utils/stageHelpers'

export interface ResourceConstraintTooltipProps {
  loading: boolean
  data?: {
    executionList?: ResourceConstraintDetail[]
    moduleInfo?: {
      [key: string]: CDStageModuleInfo
    }
    executionId: string
  }
}

const getnoOfExecutionsBeforePipeline = (
  executionList: ResourceConstraintDetail[] = [],
  executionId?: string
): number => {
  let noOfExecutionsBeforePipeline = 0
  for (let index = 0; index < executionList.length; index++) {
    if (executionList[index].planExecutionId === executionId) {
      break
    }
    noOfExecutionsBeforePipeline++
  }
  return noOfExecutionsBeforePipeline
}
export default function ResourceConstraintTooltip(props: ResourceConstraintTooltipProps): React.ReactElement {
  const { projectIdentifier, orgIdentifier, accountId, module, source } = useParams<PipelineType<ExecutionPathProps>>()
  const { getString } = useStrings()
  const noOfExecutionsBeforePipeline = getnoOfExecutionsBeforePipeline(
    props?.data?.executionList,
    props.data?.executionId
  )

  const stageDeploymentType = props.data?.moduleInfo?.[module]?.serviceInfo?.deploymentType
  const isServerlessDeploymentTypeSelected = isServerlessDeploymentType(defaultTo(stageDeploymentType, ''))

  return props.loading ? (
    <Container border={{ top: true, width: 1, color: Color.GREY_100 }} padding={'medium'}>
      <Spinner size={24} />
    </Container>
  ) : (
    <Container padding={'medium'} border={{ top: true, width: 1, color: Color.GREY_100 }}>
      {props?.data?.executionList?.length && (
        <Layout.Vertical spacing={'small'}>
          <Text font={{ size: 'small' }}>
            {getString('pipeline.resourceConstraints.infoText', {
              executioncount: noOfExecutionsBeforePipeline,
              executiontext:
                noOfExecutionsBeforePipeline > 1
                  ? toLower(getString('executionsText'))
                  : toLower(getString('executionText')),
              infraEntityText: isServerlessDeploymentTypeSelected
                ? getString('pipeline.resourceConstraints.serverlessInfraEntity')
                : getString('pipeline.resourceConstraints.k8sNamespaceText')
            })}
            <a href="https://docs.harness.io/article/jrzwrdpvm2" target="_blank" rel="noopener noreferrer">
              {getString('learnMore')}
            </a>
          </Text>
          {props?.data?.executionList?.map((pipeline: ResourceConstraintDetail, index: number) => (
            <Container key={`${pipeline.pipelineIdentifier}-${index}`}>
              <Link
                to={routes.toExecutionPipelineView({
                  pipelineIdentifier: pipeline.pipelineIdentifier || '',
                  projectIdentifier,
                  orgIdentifier,
                  module,
                  accountId,
                  executionIdentifier: pipeline?.planExecutionId || '',
                  source
                })}
              >
                <Layout.Horizontal>
                  <Text
                    title={pipeline.pipelineIdentifier}
                    width={200}
                    lineClamp={1}
                    inline={true}
                    font={{ size: 'small' }}
                    color={Color.BLUE_500}
                  >
                    {pipeline.pipelineIdentifier}
                  </Text>
                  <Text inline={true} color={Color.BLUE_500} font={{ size: 'small' }}>
                    {pipeline.planExecutionId === props.data?.executionId &&
                      pipeline.state !== 'ACTIVE' &&
                      getString('pipeline.resourceConstraints.yourPipeline')}
                    {pipeline.state === 'ACTIVE' && getString('pipeline.resourceConstraints.currentlyExecuting')}
                  </Text>
                </Layout.Horizontal>
              </Link>
            </Container>
          ))}
        </Layout.Vertical>
      )}
    </Container>
  )
}
