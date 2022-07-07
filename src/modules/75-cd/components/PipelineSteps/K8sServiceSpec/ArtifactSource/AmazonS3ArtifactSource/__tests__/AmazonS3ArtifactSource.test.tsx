/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { findByText, fireEvent, render, waitFor } from '@testing-library/react'
import { Formik, FormikForm } from '@harness/uicore'

import * as cdng from 'services/cd-ng'
import { TestWrapper } from '@common/utils/testUtils'
import { connectorsData } from '@connectors/pages/connectors/__tests__/mockData'
import type { ArtifactSourceRenderProps } from '@cd/factory/ArtifactSourceFactory/ArtifactSourceBase'
import { ArtifactSourceBaseFactory } from '@cd/factory/ArtifactSourceFactory/ArtifactSourceBaseFactory'
import type { K8SDirectServiceStep } from '@cd/components/PipelineSteps/K8sServiceSpec/K8sServiceSpecInterface'
import { AmazonS3ArtifactSource } from '../AmazonS3ArtifactSource'
import {
  bucketListData,
  commonFormikInitialValues,
  templateAmazonS3Artifact,
  templateAmazonS3ArtifactWithFilePathRegex,
  templateAmazonS3ArtifactWithoutConnectorRef
} from './mock'

// Mock API and Functions
const fetchConnectors = (): Promise<unknown> => Promise.resolve(connectorsData)
const fetchBuckets = jest.fn().mockReturnValue(bucketListData)
jest.mock('services/cd-ng', () => ({
  useGetConnector: () => {
    return {
      data: fetchConnectors,
      refetch: jest.fn()
    }
  },
  useGetV2BucketListForS3: jest.fn().mockImplementation(() => {
    return { data: bucketListData, refetch: fetchBuckets, error: null, loading: false }
  })
}))

const submitForm = jest.fn()

// Mock props and other data
const commonInitialValues: K8SDirectServiceStep = {
  customStepProps: {},
  deploymentType: 'ServerlessAwsLambda'
}

const artifactCommonPath = 'pipeline.stages[0].stage.spec.seviceConfig.serviceDefinition.spec'
export const props: Omit<ArtifactSourceRenderProps, 'formik'> = {
  isPrimaryArtifactsRuntime: true,
  isSidecarRuntime: false,
  template: templateAmazonS3Artifact,
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
    type: 'AmazonS3',
    spec: {
      bucketName: '',
      filePath: ''
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
      <Formik initialValues={commonFormikInitialValues} formName="amazonS3Artifact" onSubmit={submitForm}>
        {formikProps => (
          <FormikForm>
            {new AmazonS3ArtifactSource().renderContent({ formik: formikProps, ...(passedProps ?? props) })}
          </FormikForm>
        )}
      </Formik>
    </TestWrapper>
  )
}

describe('AmazonS3ArtifactSource tests', () => {
  beforeEach(() => {
    jest.spyOn(cdng, 'useGetV2BucketListForS3').mockImplementation((): any => {
      return {
        loading: false,
        data: bucketListData,
        refetch: fetchBuckets
      }
    })
    fetchBuckets.mockReset()
  })

  test(`renders fine for all Runtime values when filePath is present`, () => {
    const { container } = renderComponent()

    expect(
      container.querySelector(`input[name='${artifactCommonPath}.artifacts.primary.spec.bucketName']`)
    ).not.toBeNull()
    expect(
      container.querySelector(`input[name='${artifactCommonPath}.artifacts.primary.spec.filePath']`)
    ).not.toBeNull()
    expect(
      container.querySelector(`input[name='${artifactCommonPath}.artifacts.primary.spec.filePathRegex']`)
    ).toBeNull()
    expect(container).toMatchSnapshot()
  })

  test(`renders fine for all Runtime values when filePathRegex is present`, () => {
    const { container } = renderComponent({ ...props, template: templateAmazonS3ArtifactWithFilePathRegex })

    expect(
      container.querySelector(`input[name='${artifactCommonPath}.artifacts.primary.spec.bucketName']`)
    ).not.toBeNull()
    expect(container.querySelector(`input[name='${artifactCommonPath}.artifacts.primary.spec.filePath']`)).toBeNull()
    expect(
      container.querySelector(`input[name='${artifactCommonPath}.artifacts.primary.spec.filePathRegex']`)
    ).not.toBeNull()
    expect(container).toMatchSnapshot()
  })

  test(`clicking on Bucket Name field should display loading option when bucket data is being fetched`, async () => {
    jest.spyOn(cdng, 'useGetV2BucketListForS3').mockImplementation((): any => {
      return {
        loading: true,
        data: null,
        refetch: fetchBuckets
      }
    })

    const { container } = renderComponent({
      ...props,
      artifact: {
        identifier: '',
        type: 'AmazonS3',
        spec: {
          connectorRef: 'AWSX',
          bucketName: '',
          filePath: ''
        }
      },
      template: templateAmazonS3ArtifactWithoutConnectorRef
    })

    const portalDivs = document.getElementsByClassName('bp3-portal')
    expect(portalDivs.length).toBe(0)

    const bucketNameDropDownButton = container.querySelector('[data-icon="chevron-down"]')
    fireEvent.click(bucketNameDropDownButton!)
    expect(portalDivs.length).toBe(1)
    const dropdownPortalDiv = portalDivs[0]
    const selectListMenu = dropdownPortalDiv.querySelector('.bp3-menu')
    const loadingBucketsOption = await findByText(selectListMenu as HTMLElement, 'Loading Buckets...')
    expect(loadingBucketsOption).toBeDefined()
    await waitFor(() => expect(fetchBuckets).toHaveBeenCalled())
  })

  test(`clicking on Bucket Name field should call fetchBuckets function when bucket data is not present`, async () => {
    jest.spyOn(cdng, 'useGetV2BucketListForS3').mockImplementation((): any => {
      return {
        loading: false,
        data: null,
        refetch: fetchBuckets
      }
    })

    const { container } = renderComponent({
      ...props,
      artifact: {
        identifier: '',
        type: 'AmazonS3',
        spec: {
          connectorRef: 'AWSX',
          bucketName: '',
          filePath: ''
        }
      },
      template: templateAmazonS3ArtifactWithoutConnectorRef
    })

    const portalDivs = document.getElementsByClassName('bp3-portal')
    expect(portalDivs.length).toBe(0)

    const bucketNameDropDownButton = container.querySelector('[data-icon="chevron-down"]')
    fireEvent.click(bucketNameDropDownButton!)
    expect(portalDivs.length).toBe(1)
    const dropdownPortalDiv = portalDivs[0]
    const selectListMenu = dropdownPortalDiv.querySelector('.bp3-menu')
    const noBucketsOption = await findByText(selectListMenu as HTMLElement, 'pipeline.noBuckets')
    expect(noBucketsOption).toBeDefined()
    await waitFor(() => expect(fetchBuckets).toHaveBeenCalled())
  })
})
