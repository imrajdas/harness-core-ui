/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { Formik, FormikForm } from '@harness/uicore'

import * as cdng from 'services/cd-ng'
import { TestWrapper } from '@common/utils/testUtils'
import type { ArtifactSourceRenderProps } from '@cd/factory/ArtifactSourceFactory/ArtifactSourceBase'
import { ArtifactSourceBaseFactory } from '@cd/factory/ArtifactSourceFactory/ArtifactSourceBaseFactory'
import type { K8SDirectServiceStep } from '@cd/components/PipelineSteps/K8sServiceSpec/K8sServiceSpecInterface'
import {
  mockConnectorsResponse,
  mockJobResponse
} from '@pipeline/components/PipelineSteps/Steps/JenkinsStep/__tests__/JenkinsStepTestHelper'
import {
  commonFormikInitialValues,
  mockArtifactPathResponse,
  mockBuildResponse,
  templateJenkinsArtifact,
  templateJenkinsArtifactWithoutJobName
} from './mocks'
import { JenkinsArtifactSource } from '../JenkinsArtifactSource'

// Mock API and Functions
const fetchConnectors = (): Promise<unknown> => Promise.resolve(mockConnectorsResponse.data)
const refetchJobs = jest.fn().mockReturnValue(mockJobResponse.data)
const refetchArtifactPath = jest.fn().mockReturnValue(mockArtifactPathResponse)
const refetchJenkinsBuild = jest.fn().mockReturnValue(mockBuildResponse)

jest.mock('services/cd-ng', () => ({
  useGetConnector: () => {
    return { data: mockConnectorsResponse.data, refetch: fetchConnectors, error: null, loading: false }
  },
  useGetJobDetailsForJenkins: jest.fn().mockImplementation(() => {
    return { data: mockJobResponse.data, refetch: refetchJobs, error: null, loading: false }
  }),
  useGetArtifactPathForJenkins: jest.fn().mockImplementation(() => {
    return { data: mockArtifactPathResponse, refetch: refetchArtifactPath, error: null, loading: false }
  }),
  useGetBuildsForJenkins: jest.fn().mockImplementation(() => {
    return { data: mockBuildResponse, refetch: refetchJenkinsBuild, error: null, loading: false }
  })
}))

const submitForm = jest.fn()

// Mock props and other data
const commonInitialValues: K8SDirectServiceStep = {
  customStepProps: {},
  deploymentType: 'ServerlessAwsLambda'
}

const artifactCommonPath = 'pipeline.stages[0].stage.spec.serviceConfig.serviceDefinition.spec'
export const props: Omit<ArtifactSourceRenderProps, 'formik'> = {
  isPrimaryArtifactsRuntime: true,
  isSidecarRuntime: false,
  template: templateJenkinsArtifact,
  path: artifactCommonPath,
  initialValues: commonInitialValues,
  accountId: 'testAccoountId',
  projectIdentifier: 'testProject',
  orgIdentifier: 'testOrg',
  readonly: false,
  stageIdentifier: 'Stage_1',
  allowableTypes: [],
  fromTrigger: false,
  artifact: {
    identifier: '',
    type: 'Jenkins',
    spec: {
      jobName: '',
      artifactPath: '',
      build: ''
    }
  },
  isSidecar: false,
  artifactPath: 'primary',
  isArtifactsRuntime: true,
  pipelineIdentifier: 'testPipeline',
  artifactSourceBaseFactory: new ArtifactSourceBaseFactory()
}

const renderComponent = (passedProps?: Omit<ArtifactSourceRenderProps, 'formik'>) => {
  return render(
    <TestWrapper>
      <Formik initialValues={commonFormikInitialValues} formName="jenkinsArtifact" onSubmit={submitForm}>
        {formikProps => (
          <FormikForm>
            {new JenkinsArtifactSource().renderContent({ formik: formikProps, ...(passedProps ?? props) })}
          </FormikForm>
        )}
      </Formik>
    </TestWrapper>
  )
}

describe('JenkinsArtifactSource tests', () => {
  beforeEach(() => {
    jest.spyOn(cdng, 'useGetArtifactPathForJenkins').mockImplementation((): any => {
      return {
        loading: false,
        data: mockArtifactPathResponse,
        refetch: refetchArtifactPath
      }
    })
    refetchArtifactPath.mockReset()
  })

  test(`renders fine for all Runtime values`, () => {
    const { container } = renderComponent()

    expect(container.querySelector(`input[name='${artifactCommonPath}.artifacts.primary.spec.jobName']`)).not.toBeNull()
    expect(
      container.querySelector(`input[name='${artifactCommonPath}.artifacts.primary.spec.artifactPath']`)
    ).not.toBeNull()
    expect(container.querySelector(`input[name='${artifactCommonPath}.artifacts.primary.spec.build']`)).not.toBeNull()
    expect(container).toMatchSnapshot()
  })

  test(`after selecting jobName, artifactPath should be fetched and loading will be shown till response comes`, async () => {
    jest.spyOn(cdng, 'useGetArtifactPathForJenkins').mockImplementation((): any => {
      return {
        loading: true,
        data: [],
        refetch: refetchArtifactPath
      }
    })

    const { container, queryByText } = renderComponent({
      ...props,
      artifact: {
        identifier: '',
        type: 'Jenkins',
        spec: {
          connectorRef: 'artifactJenkinsConnector',
          jobName: 'sampleJob',
          artifactPath: '',
          build: ''
        }
      },
      template: templateJenkinsArtifactWithoutJobName
    })
    const loadingArtifactsOption = queryByText('loading')
    expect(loadingArtifactsOption).toBeDefined()
    expect(container).toMatchSnapshot()
  })
})
