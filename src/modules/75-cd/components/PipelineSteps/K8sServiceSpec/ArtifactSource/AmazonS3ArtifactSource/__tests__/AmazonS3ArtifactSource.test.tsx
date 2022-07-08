/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import userEvent from '@testing-library/user-event'
import {
  act,
  findByText,
  fireEvent,
  getByText,
  queryByAttribute,
  render,
  waitFor,
  RenderResult
} from '@testing-library/react'
import { Formik, FormikForm, RUNTIME_INPUT_VALUE } from '@harness/uicore'

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
  getConnectorListPromise: jest.fn().mockImplementation(() => Promise.resolve(connectorsData)),
  useGetConnector: jest.fn().mockImplementation(() => {
    return { data: connectorsData.data.content[0], refetch: fetchConnectors, loading: false }
  }),
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
  artifacts: {
    primary: {
      type: 'AmazonS3',
      spec: {
        connectorRef: '',
        bucketName: '',
        filePath: ''
      }
    }
  },
  artifact: {
    identifier: '',
    type: 'AmazonS3',
    spec: {
      connectorRef: RUNTIME_INPUT_VALUE,
      bucketName: RUNTIME_INPUT_VALUE,
      filePath: RUNTIME_INPUT_VALUE
    }
  },
  isSidecar: false,
  artifactPath: 'primary',
  isArtifactsRuntime: true,
  pipelineIdentifier: 'testPipeline',
  artifactSourceBaseFactory: new ArtifactSourceBaseFactory()
}

const renderComponent = (passedProps?: Omit<ArtifactSourceRenderProps, 'formik'>): RenderResult => {
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

  test(`when isArtifactsRuntime is false`, () => {
    const { container } = renderComponent({ ...props, isArtifactsRuntime: false })

    expect(container.querySelector(`input[name='${artifactCommonPath}.artifacts.primary.spec.bucketName']`)).toBeNull()
    expect(container.querySelector(`input[name='${artifactCommonPath}.artifacts.primary.spec.filePath']`)).toBeNull()
    expect(
      container.querySelector(`input[name='${artifactCommonPath}.artifacts.primary.spec.filePathRegex']`)
    ).toBeNull()
    expect(container).toMatchSnapshot()
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

  test(`when readonly is true, all fields should be disabled`, () => {
    const { container } = renderComponent({ ...props, readonly: true })

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)

    const connnectorRefInput = queryByAttribute('data-testid', container, /connectorRef/)
    const bucketNameInput = queryByNameAttribute(`${artifactCommonPath}.artifacts.primary.spec.bucketName`)
    const filePathInput = queryByNameAttribute(`${artifactCommonPath}.artifacts.primary.spec.filePath`)
    expect(connnectorRefInput).toBeDisabled()
    expect(bucketNameInput).toBeDisabled()
    expect(filePathInput).toBeDisabled()
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
          bucketName: RUNTIME_INPUT_VALUE,
          filePath: RUNTIME_INPUT_VALUE
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

  test(`clicking on Bucket Name field should call fetchBuckets function and display no buckets option when bucket data is not present`, async () => {
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
          bucketName: RUNTIME_INPUT_VALUE,
          filePath: RUNTIME_INPUT_VALUE
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

  test(`clicking on Bucket Name field should NOT call fetchBuckets function when bucket data is already fetched`, async () => {
    jest.spyOn(cdng, 'useGetV2BucketListForS3').mockImplementation((): any => {
      return {
        loading: false,
        data: bucketListData,
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
          bucketName: RUNTIME_INPUT_VALUE,
          filePath: RUNTIME_INPUT_VALUE
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
    const firstOption = await findByText(selectListMenu as HTMLElement, 'tdp-tdp2-1rc6irugmilkh')
    expect(firstOption).toBeDefined()
    await waitFor(() => expect(fetchBuckets).not.toHaveBeenCalled())
  })

  test(`selecting connector should reset bucketName value`, async () => {
    jest.spyOn(cdng, 'useGetV2BucketListForS3').mockImplementation((): any => {
      return {
        loading: false,
        data: bucketListData,
        refetch: fetchBuckets
      }
    })

    const { container } = renderComponent({
      ...props,
      artifacts: {
        primary: {
          type: 'AmazonS3',
          spec: {
            connectorRef: 'Git_CTR',
            bucketName: '',
            filePath: ''
          }
        }
      },
      artifact: {
        identifier: '',
        type: 'AmazonS3',
        spec: {
          connectorRef: 'Git_CTR',
          bucketName: RUNTIME_INPUT_VALUE,
          filePath: RUNTIME_INPUT_VALUE
        }
      },
      template: templateAmazonS3Artifact
    })

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)
    // Choose first option for bucketName from dropdown
    const bucketNameInput = queryByNameAttribute(
      `${artifactCommonPath}.artifacts.primary.spec.bucketName`
    ) as HTMLInputElement
    expect(bucketNameInput).not.toBeNull()
    expect(bucketNameInput).not.toBeDisabled()
    expect(bucketNameInput.value).toBe('')
    const portalDivs = document.getElementsByClassName('bp3-portal')
    expect(portalDivs.length).toBe(0)
    const dropdownIcons = container.querySelectorAll('[data-icon="chevron-down"]')
    const bucketNameDropDownIcon = dropdownIcons[1]
    fireEvent.click(bucketNameDropDownIcon!)
    expect(fetchBuckets).toHaveBeenCalledTimes(0)
    expect(portalDivs.length).toBe(1)
    const dropdownPortalDiv = portalDivs[0]
    const selectListMenu = dropdownPortalDiv.querySelector('.bp3-menu')
    const firstOption = await findByText(selectListMenu as HTMLElement, 'tdp-tdp2-1rc6irugmilkh')
    expect(firstOption).toBeDefined()
    userEvent.click(firstOption)
    expect(bucketNameInput.value).toBe('tdp-tdp2-1rc6irugmilkh')

    // Switch the connector - choose AWS connector for connectorRef field
    const connnectorRefInput = queryByAttribute('data-testid', container, /connectorRef/)
    expect(connnectorRefInput).toBeTruthy()
    if (connnectorRefInput) {
      act(() => {
        fireEvent.click(connnectorRefInput)
      })
    }
    await act(async () => {
      const connectorSelectorDialog = document.getElementsByClassName('bp3-dialog')[0] as HTMLElement
      const awsConnector = await findByText(connectorSelectorDialog as HTMLElement, 'AWS')
      expect(awsConnector).toBeTruthy()
      fireEvent.click(awsConnector)
      const applySelected = getByText(connectorSelectorDialog, 'entityReference.apply')
      await act(async () => {
        fireEvent.click(applySelected)
      })
    })
    expect(fetchBuckets).toBeCalled()
    expect(fetchBuckets).toHaveBeenCalledTimes(1)
    // Expect bucketName field values to be empty after switching connector
    expect(bucketNameInput.value).toBe('')

    // Choose second option for bucketName from dropdown
    expect(portalDivs.length).toBe(2)
    fireEvent.click(bucketNameDropDownIcon!)
    expect(fetchBuckets).toHaveBeenCalledTimes(1)
    expect(portalDivs.length).toBe(2)
    const bucketNameDropdownPortalDiv = portalDivs[0]
    const dropdownOptionList = bucketNameDropdownPortalDiv.querySelector('.bp3-menu')
    const secondOption = await findByText(dropdownOptionList as HTMLElement, 'cdng-terraform-state')
    expect(secondOption).toBeDefined()
    userEvent.click(secondOption)
    expect(bucketNameInput.value).toBe('cdng-terraform-state')
  })
})
