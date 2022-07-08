/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { noop } from 'lodash-es'
import { render, getAllByText, fireEvent } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { TestWrapper } from '@common/utils/testUtils'
import { clickSubmit, fillAtForm, InputTypes } from '@common/utils/JestFormHelper'
import {
  useCreateConnector,
  useGetConnectorListV2,
  useGetTestConnectionResult,
  useUpdateConnector
} from 'services/cd-ng'
import CreateCeGcpConnector from '../CreateCeGcpConnector'
import BillingExport from '../steps/BillingExport'

const commonProps = {
  accountId: 'dummy',
  orgIdentifier: '',
  projectIdentifier: '',
  setIsEditMode: noop,
  onClose: jest.fn(),
  onSuccess: noop
}

const mockedConnector = {
  name: 'gcp_1',
  identifier: 'gcp_1',
  description: null,
  orgIdentifier: null,
  projectIdentifier: null,
  tags: {},
  type: 'GcpCloudCost',
  spec: {
    featuresEnabled: ['BILLING', 'VISIBILITY'],
    projectId: 'id-1234',
    serviceAccountEmail: '502@gserviceaccount.com',
    billingExportSpec: {
      datasetId: 'BillingReport',
      tableId: 'gcp_billing_export_harnessio_gcp'
    }
  }
}

jest.mock('services/cd-ng')
const useGetConnectorListV2Mock = useGetConnectorListV2 as jest.MockedFunction<any>
const useUpdateConnectorMock = useUpdateConnector as jest.MockedFunction<any>
const useCreateConnectorMock = useCreateConnector as jest.MockedFunction<any>
const useGetTestConnectionResultMock = useGetTestConnectionResult as jest.MockedFunction<any>

jest.mock('services/ce', () => ({
  useGcpserviceaccount: jest.fn().mockImplementation(() => ({
    status: 'SUCCESS',
    data: {
      data: 'harness-ce-kmpys-27520@ccm-play.iam.gserviceaccount.com'
    },
    loading: false,
    refetch: jest.fn()
  }))
}))

useGetConnectorListV2Mock.mockImplementation(() => ({
  mutate: async () => {
    return {
      status: 'SUCCESS',
      data: {
        pageItemCount: 0,
        content: []
      }
    }
  }
}))

useUpdateConnectorMock.mockImplementation(() => ({
  mutate: async () => {
    return {
      status: 'SUCCESS'
    }
  },
  loading: false
}))

useCreateConnectorMock.mockImplementation(() => ({
  mutate: async () => {
    return {
      status: 'SUCCESS'
    }
  },
  loading: false
}))

useGetTestConnectionResultMock.mockImplementation(() => ({
  mutate: async () => {
    return {
      status: 'SUCCESS'
    }
  },
  loading: false
}))

describe('Create Secret Manager Wizard', () => {
  test('should render form', async () => {
    const { container, getByText } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateCeGcpConnector {...commonProps} isEditMode={false} connectorInfo={undefined} />
      </TestWrapper>
    )

    //Overview Step
    expect(getAllByText(container, 'connectors.ceGcp.overview.projectIdLabel')[0]).toBeDefined()
    expect(container).toMatchSnapshot()

    fillAtForm([
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'name',
        value: 'dummyname'
      },
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'projectId',
        value: '12345'
      }
    ])

    await act(async () => {
      clickSubmit(container)
    })

    //Billing Export Page
    expect(getAllByText(container, 'connectors.ceGcp.billingExport.description')[0]).toBeDefined()

    //Check if the extention opens
    expect(getAllByText(container, 'connectors.ceGcp.billingExtention.heading')[0]).toBeDefined()

    expect(container).toMatchSnapshot()

    fillAtForm([
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'datasetId',
        value: 'randomdatasetId'
      }
    ])

    await act(async () => {
      clickSubmit(container)
    })

    // Choose requirements Step
    expect(getAllByText(container, 'connectors.ceGcp.chooseRequirements.description')[0]).toBeDefined()
    const optimizationCard = container.querySelectorAll('.bp3-card')[2]
    expect(optimizationCard).toBeDefined()
    act(() => {
      fireEvent.click(optimizationCard)
    })
    expect(container).toMatchSnapshot()
    await act(async () => {
      clickSubmit(container)
    })

    //Grant Permission Step
    expect(getAllByText(container, 'connectors.ceGcp.grantPermission.step1')[0]).toBeDefined()
    expect(container).toMatchSnapshot()

    await act(async () => {
      clickSubmit(container)
    })

    //Test Connection Step
    expect(getAllByText(container, 'connectors.ceGcp.testConnection.heading')).toBeDefined()
    const finishBtn = getByText('finish')
    expect(finishBtn).toBeDefined()
    act(() => {
      fireEvent.click(finishBtn!)
    })
    expect(commonProps.onClose).toBeCalled()

    expect(container).toMatchSnapshot()
  })

  test('should show billing table for exising billing connectors', async () => {
    useGetConnectorListV2Mock.mockImplementation(() => ({
      mutate: async () => {
        return {
          status: 'SUCCESS',
          data: {
            pageItemCount: 1,
            content: [mockedConnector]
          }
        }
      }
    }))

    const { getByText } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <BillingExport
          name={'connectors.ceGcp.billingExport.heading'}
          prevStepData={{
            name: 'gcp-con',
            identifier: 'igcp-con-id',
            type: 'Gcp',
            spec: {
              billingExportSpec: { datasetId: 'dataset-id', tableId: 'table-id' },
              featuresEnabled: ['BILLING'],
              projectId: '',
              serviceAccountEmail: 'string'
            },
            existingCurReports: [
              {
                projectId: 'id-1234',
                datasetId: 'data-set-id',
                tableId: 'table-id'
              }
            ]
          }}
        />
      </TestWrapper>
    )

    expect(getByText('id-1234')).toBeDefined()
  })

  test('should throw an error when connectors already exist for a given gcpProjectId', async () => {
    useGetConnectorListV2Mock.mockImplementation(() => ({
      mutate: async () => {
        return {
          status: 'SUCCESS',
          data: {
            pageItemCount: 2,
            content: []
          }
        }
      }
    }))

    const { container, getByText } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateCeGcpConnector {...commonProps} isEditMode={false} connectorInfo={undefined} />
      </TestWrapper>
    )

    fillAtForm([
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'name',
        value: 'dummyname'
      },
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'projectId',
        value: '12345'
      }
    ])

    await act(async () => {
      clickSubmit(container)
    })

    expect(getByText('connectors.ceGcp.overview.alreadyExist')).toBeDefined()
    expect(container).toMatchSnapshot()
  })
})
