/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MultiTypeInputType, RUNTIME_INPUT_VALUE, StepProps } from '@harness/uicore'
import {
  mockConnectorsResponse,
  mockJobResponse
} from '@pipeline/components/PipelineSteps/Steps/JenkinsStep/__tests__/JenkinsStepTestHelper'
import * as cdng from 'services/cd-ng'
import { TestWrapper } from '@common/utils/testUtils'
import type {
  JenkinsArtifactType,
  JenkinsArtifactProps
} from '@pipeline/components/ArtifactsSelection/ArtifactInterface'
import { mockArtifactPathResponse, mockBuildResponse } from './mocks'
import { JenkinsArtifact } from '../JenkinsArtifact'

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

const commonInitialValues: JenkinsArtifactType = {
  identifier: '',
  spec: {
    jobName: '',
    artifactPath: '',
    build: RUNTIME_INPUT_VALUE
  }
}

const onSubmit = jest.fn()
export const props: Omit<StepProps<cdng.ConnectorConfigDTO> & JenkinsArtifactProps, 'initialValues'> = {
  key: 'key',
  name: 'Artifact details',
  expressions: [],
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  context: 1,
  handleSubmit: onSubmit,
  artifactIdentifiers: [],
  selectedArtifact: 'Jenkins',
  prevStepData: {
    connectorId: {
      value: 'testConnector'
    }
  }
}

describe('AmazonS3 tests', () => {
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

  test(`renders fine for the NEW artifact`, () => {
    const { container } = render(
      <TestWrapper>
        <JenkinsArtifact initialValues={commonInitialValues} {...props} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test(`renders fine for the existing artifact when jobName is present`, async () => {
    const initialValues = {
      identifier: '',
      spec: {
        jobName: 'automationNew',
        artifactPath: '',
        build: RUNTIME_INPUT_VALUE
      },
      type: 'Jenkins'
    }
    const { container, getByText } = render(
      <TestWrapper>
        <JenkinsArtifact initialValues={initialValues as any} {...props} />
      </TestWrapper>
    )

    expect(container.querySelector('input[name="spec.jobName"]')).not.toBeNull()
    expect(container.querySelector('input[name="spec.build"]')).not.toBeNull()
    expect(container.querySelector('input[name="spec.artifactPath"]')).not.toBeNull()
    expect(container).toMatchSnapshot()

    const submitBtn = getByText('submit')
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(props.handleSubmit).toBeCalled()
      expect(props.handleSubmit).toHaveBeenCalledWith({
        identifier: '',
        spec: {
          connectorRef: 'testConnector',
          jobName: 'automationNew',
          artifactPath: '',
          build: RUNTIME_INPUT_VALUE
        }
      })
    })
  })

  test(`renders fine for the existing artifact when all values are runtime inputs`, async () => {
    const initialValues = {
      identifier: '',
      spec: {
        jobName: RUNTIME_INPUT_VALUE,
        artifactPath: RUNTIME_INPUT_VALUE,
        build: RUNTIME_INPUT_VALUE
      },
      type: 'Jenkins'
    }
    const { container, getByText } = render(
      <TestWrapper>
        <JenkinsArtifact initialValues={initialValues as any} {...props} />
      </TestWrapper>
    )

    expect(container.querySelector('input[name="spec.jobName"]')).not.toBeNull()
    expect(container.querySelector('input[name="spec.artifactPath"]')).not.toBeNull()
    expect(container.querySelector('input[name="spec.build"]')).not.toBeNull()
    expect(container).toMatchSnapshot()

    const submitBtn = getByText('submit')
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(onSubmit).toBeCalled()
      expect(onSubmit).toHaveBeenCalledWith({
        identifier: '',
        spec: {
          connectorRef: 'testConnector',
          jobName: RUNTIME_INPUT_VALUE,
          artifactPath: RUNTIME_INPUT_VALUE,
          build: RUNTIME_INPUT_VALUE
        }
      })
    })
  })
})
