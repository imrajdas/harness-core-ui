/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { Container } from '@wings-software/uicore'
import { Provider } from 'urql'
import { fromValue } from 'wonka'
import type { DocumentNode } from 'graphql'
import { setFieldValue, InputTypes, clickSubmit, fillAtForm } from '@common/utils/JestFormHelper'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import { FetchPerspectiveListDocument } from 'services/ce/services'
import PerspectiveReportsAndBudgets, { AnomalyAlerts, Budgets, ScheduledReports } from '../PerspectiveReportsAndBudgets'
import PerspectiveScheduledReportsResponse from './PerspectiveScheduledReportsResponse.json'
import PerspectiveBudgetsResponse from './PerspectiveBudgetsResponse.json'
import PerspectiveResponse from './PerspectiveResponse.json'
import useBudgetModal from '../PerspectiveCreateBudget'
import useCreateReportModal from '../PerspectiveCreateReport'
import PerspectiveList from './PerspectiveList.json'
import AnomalyAlertList from './AnomalyAlertList.json'

jest.mock('services/ce', () => ({
  useGetReportSetting: jest.fn().mockImplementation(() => {
    return { data: PerspectiveScheduledReportsResponse, refetch: jest.fn(), error: null, loading: false }
  }),
  useDeleteReportSetting: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: {}
      }
    }
  })),
  useDeleteBudget: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: {}
      }
    }
  })),
  useListBudgetsForPerspective: jest.fn().mockImplementation(() => ({
    data: PerspectiveBudgetsResponse,
    refetch: jest.fn(),
    error: null,
    loading: false
  })),
  useCreateReportSetting: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: {}
      }
    }
  })),
  useUpdateReportSetting: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: {}
      }
    }
  })),
  useGetPerspective: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: PerspectiveResponse
      }
    }
  })),
  useUpdateBudget: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: {}
      }
    }
  })),
  useCreateBudget: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: {}
      }
    }
  })),
  useCreatePerspective: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: {}
      }
    }
  })),
  useGetLastPeriodCost: jest.fn().mockImplementation(() => ({
    data: { resource: 100 },
    refetch: jest.fn(),
    error: null,
    loading: false
  })),
  useGetForecastCostForPeriod: jest.fn().mockImplementation(() => ({
    data: { resource: 100 },
    refetch: jest.fn(),
    error: null,
    loading: false
  })),
  useGetLastMonthCost: jest.fn().mockImplementation(() => ({
    data: { resource: 100 },
    refetch: jest.fn(),
    error: null,
    loading: false
  })),
  useGetForecastCost: jest.fn().mockImplementation(() => ({
    data: { resource: 100 },
    refetch: jest.fn(),
    error: null,
    loading: false
  })),
  useCreateNotificationSetting: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: {}
      }
    }
  })),
  useUpdateNotificationSetting: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: {}
      }
    }
  })),
  useGetNotificationSettings: jest.fn().mockImplementation(() => ({
    data: AnomalyAlertList,
    refetch: jest.fn(),
    error: null,
    loading: false
  })),
  useDeleteNotificationSettings: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: {}
      }
    }
  }))
}))

const params = {
  accountId: 'TEST_ACC',
  perspetiveId: 'perspectiveId',
  perspectiveName: 'sample perspective'
}

describe('test cases for Perspective Reports and Budget page', () => {
  test('should be able to render the reports and budget component', async () => {
    const handlePrevButtonClick = jest.fn().mockImplementationOnce(() => ({}))
    const { container } = render(
      <TestWrapper pathParams={params}>
        <PerspectiveReportsAndBudgets onPrevButtonClick={handlePrevButtonClick} onNext={jest.fn()} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})

const CreateReportWrapper = () => {
  const { openModal } = useCreateReportModal({ onSuccess: jest.fn() })
  return (
    <Container>
      <button onClick={() => openModal({ isEdit: true })} className="openModal" />
    </Container>
  )
}
describe('test cases for Perspective Create Report', () => {
  test('should be able to open create report modal', async () => {
    const { getByText } = render(
      <TestWrapper pathParams={params}>
        <ScheduledReports />
      </TestWrapper>
    )

    const openButton = getByText('ce.perspectives.reports.addReportSchedule')
    expect(openButton).toBeDefined()

    fireEvent.click(openButton!)

    const modal = findDialogContainer()
    expect(modal).toBeDefined()

    await waitFor(() => {
      expect(getByText('ce.perspectives.reports.cronLabel')).toBeDefined()
      expect(getByText('ce.perspectives.reports.recipientLabel')).toBeDefined()
    })

    fillAtForm([
      {
        container: modal!,
        type: InputTypes.TEXTFIELD,
        fieldId: 'name',
        value: 'name'
      },
      {
        container: modal!,
        type: InputTypes.TEXTAREA,
        fieldId: 'recipients',
        value: 'test@test.com'
      }
    ])

    await act(async () => {
      clickSubmit(modal!)
    })

    expect(modal).toMatchSnapshot()
  })

  test('should be able to delete report', async () => {
    const { getByText, getAllByTestId } = render(
      <TestWrapper pathParams={params}>
        <ScheduledReports />
      </TestWrapper>
    )

    const deleteIcon = getAllByTestId('deleteIcon')[0]

    act(() => {
      fireEvent.click(deleteIcon!)
    })

    await waitFor(() => {
      expect(getByText('ce.perspectives.reports.reportDeletedTxt')).toBeDefined()
    })
  })

  test('should be able to open create report modal in edit mode', async () => {
    const { container, getByText } = render(
      <TestWrapper pathParams={params}>
        <CreateReportWrapper />
      </TestWrapper>
    )

    const openButton = container.querySelector('.openModal')
    expect(openButton).toBeDefined()

    fireEvent.click(openButton!)

    const modal = findDialogContainer()
    expect(modal).toBeDefined()

    await waitFor(() => {
      expect(getByText('ce.perspectives.reports.cronLabel')).toBeDefined()
      expect(getByText('ce.perspectives.reports.recipientLabel')).toBeDefined()
    })

    fillAtForm([
      {
        container: modal!,
        type: InputTypes.TEXTFIELD,
        fieldId: 'name',
        value: 'name'
      },
      {
        container: modal!,
        type: InputTypes.TEXTAREA,
        fieldId: 'recipients',
        value: 'test@test.com'
      }
    ])

    await act(async () => {
      clickSubmit(modal!)
    })

    expect(modal).toMatchSnapshot()
  })
})

const CreateBudgetWrapper = () => {
  const { openModal } = useBudgetModal({ onSuccess: jest.fn() })
  return (
    <Container>
      <button onClick={() => openModal()} className="openModal" />
    </Container>
  )
}

describe('test cases for Perspective Create Budgets', () => {
  test('should be able to open create budget modal', async () => {
    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchPerspectiveListDocument) {
          return fromValue(PerspectiveList)
        }
      }
    }

    const { container, getByText } = render(
      <Provider value={responseState as any}>
        <TestWrapper pathParams={params}>
          <CreateBudgetWrapper />
        </TestWrapper>
      </Provider>
    )

    const openButton = container.querySelector('.openModal')
    expect(openButton).toBeDefined()

    fireEvent.click(openButton!)

    const modal = findDialogContainer()
    expect(modal).toBeDefined()

    await waitFor(() => Promise.resolve())

    expect(getByText('ce.perspectives.budgets.defineTarget.selectPerspective')).toBeDefined()
    expect(getByText('ce.perspectives.budgets.defineTarget.createNewPerspective')).toBeDefined()

    await setFieldValue({
      container: modal!,
      type: InputTypes.SELECT,
      fieldId: 'perspective',
      value: 'e6V1JG61QWubhV89vAmUIg'
    })

    await act(async () => {
      clickSubmit(modal!)
    })

    expect(getByText('ce.perspectives.budgets.setBudgetAmount.budgetPeriod')).toBeDefined()
    expect(getByText('ce.perspectives.budgets.setBudgetAmount.lastMonthSpend')).toBeDefined()

    await act(async () => {
      clickSubmit(modal!)
    })

    expect(getByText('ce.perspectives.budgets.configureAlerts.subTitle')).toBeDefined()
    expect(getByText('ce.perspectives.budgets.configureAlerts.budgetAmount')).toBeDefined()
    expect(findDialogContainer()).toMatchSnapshot()
  })

  test('should be able to delete budget', async () => {
    const { getAllByTestId, getByText } = render(
      <TestWrapper pathParams={params}>
        <Budgets perspectiveName="perspectiveName" />
      </TestWrapper>
    )

    const deleteIcon = getAllByTestId('deleteIcon')[0]

    act(() => {
      fireEvent.click(deleteIcon!)
    })

    await waitFor(() => {
      expect(getByText('ce.budgets.budgetDeletedTxt')).toBeDefined()
    })
  })
})

describe('test case for Perspective anomaly alerts', () => {
  test('should be able to open create anomaly alert modal', async () => {
    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchPerspectiveListDocument) {
          return fromValue(PerspectiveList)
        }
      }
    }

    const { getByText, getAllByText } = render(
      <Provider value={responseState as any}>
        <TestWrapper pathParams={params}>
          <AnomalyAlerts />
        </TestWrapper>
      </Provider>
    )

    const openButton = getByText('ce.anomalyDetection.addNewAnomalyAlert')

    expect(openButton).toBeDefined()

    fireEvent.click(openButton!)

    const modal = findDialogContainer()
    expect(modal).toBeDefined()

    expect(modal).toMatchSnapshot()

    await waitFor(() => {
      expect(getByText('ce.anomalyDetection.notificationAlerts.heading')).toBeDefined()
      expect(getAllByText('ce.anomalyDetection.notificationAlerts.overviewStep')).toBeDefined()
    })

    await waitFor(() => Promise.resolve())

    expect(getByText('ce.anomalyDetection.notificationAlerts.selectPerspective')).toBeDefined()

    await setFieldValue({
      container: modal!,
      type: InputTypes.SELECT,
      fieldId: 'perspective',
      value: 'e6V1JG61QWubhV89vAmUIg'
    })

    const saveAndContinueBtn = getAllByText('saveAndContinue')[0]
    act(() => {
      fireEvent.click(saveAndContinueBtn!)
    })
    expect(getByText('ce.anomalyDetection.notificationAlerts.notificationStepSubtext')).toBeDefined()

    const submitFormBtn = modal?.querySelector('[data-testid="submitForm"]')
    expect(submitFormBtn).toBeDefined()
    act(() => {
      fireEvent.click(submitFormBtn!)
    })

    await waitFor(() => {
      expect(findDialogContainer()).toBeFalsy()
    })
  })

  test('should be able to delete the anomaly alert', async () => {
    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchPerspectiveListDocument) {
          return fromValue(PerspectiveList)
        } else {
          return fromValue({})
        }
      }
    }

    const { container, getByText } = render(
      <Provider value={responseState as any}>
        <TestWrapper pathParams={params}>
          <AnomalyAlerts />
        </TestWrapper>
      </Provider>
    )

    await waitFor(() => Promise.resolve())

    const deleteIcon = container.querySelector('[data-testid="deleteIcon"]')
    act(() => {
      fireEvent.click(deleteIcon!)
    })

    await waitFor(() => {
      expect(getByText('ce.anomalyDetection.notificationAlerts.deleteAlertSuccessMsg')).toBeDefined()
    })
  })

  test('Should be able to open anomaly modal on click of edit icon', async () => {
    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchPerspectiveListDocument) {
          return fromValue(PerspectiveList)
        } else {
          return fromValue({})
        }
      }
    }

    const { container } = render(
      <Provider value={responseState as any}>
        <TestWrapper pathParams={params}>
          <AnomalyAlerts />
        </TestWrapper>
      </Provider>
    )

    const editIcon = container.querySelector('[data-testid="editIcon"]')
    act(() => {
      fireEvent.click(editIcon!)
    })

    const modal = findDialogContainer()
    expect(modal).toBeDefined()
  })
})
