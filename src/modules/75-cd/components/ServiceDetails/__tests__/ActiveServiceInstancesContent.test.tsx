/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, render, fireEvent } from '@testing-library/react'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import * as cdngServices from 'services/cd-ng'
import * as useFeatureFlagMock from '@common/hooks/useFeatureFlag'
import dataMock from '../DeploymentView/dataMock.json'
import { ActiveServiceInstances } from '../ActiveServiceInstances/ActiveServiceInstances'

jest.mock('highcharts-react-official', () => () => <></>)

const mockData = {
  status: 'SUCCESS',
  data: {
    envBuildIdAndInstanceCountInfoList: [
      {
        envId: 'env1',
        envName: 'envName',
        buildIdAndInstanceCountList: [{ buildId: 'build1', count: 1 }, {}, { buildId: 'build3', count: 3 }]
      },
      {}
    ]
  }
}
const noData = {
  status: 'SUCCESS',
  data: {}
}
jest.spyOn(useFeatureFlagMock, 'useFeatureFlag').mockReturnValue(true) // FeatureFlag.SERVICE_DASHBOARD_V2
jest.spyOn(cdngServices, 'useGetActiveServiceInstanceSummary').mockImplementation(() => {
  return {
    loading: false,
    error: false,
    data: {},
    refetch: jest.fn()
  } as any
})
jest.spyOn(cdngServices, 'useGetInstanceGrowthTrend').mockImplementation(() => {
  return {
    loading: false,
    error: false,
    data: {},
    refetch: jest.fn()
  } as any
})
describe('ActiveServiceInstancesContent', () => {
  jest.spyOn(cdngServices, 'useGetEnvArtifactDetailsByServiceId').mockImplementation(() => {
    return {
      mutate: () => Promise.resolve({ loading: false, data: [] })
    } as any
  })
  test('should render ActiveServiceInstancesContent', () => {
    jest.spyOn(cdngServices, 'useGetEnvBuildInstanceCount').mockImplementation(() => {
      return { loading: false, error: false, data: mockData, refetch: jest.fn() } as any
    })
    const { container, getByText } = render(
      <TestWrapper>
        <ActiveServiceInstances />
      </TestWrapper>
    )
    expect(getByText('cd.serviceDashboard.seeMore')).toBeTruthy()
    expect(container).toMatchSnapshot()
  })
  test('should render error', () => {
    jest.spyOn(cdngServices, 'useGetEnvBuildInstanceCount').mockImplementation(() => {
      return { loading: false, error: true, data: noData, refetch: jest.fn() } as any
    })
    const { container, getByText } = render(
      <TestWrapper>
        <ActiveServiceInstances />
      </TestWrapper>
    )
    expect(getByText('Retry')).toBeTruthy()
    expect(container).toMatchSnapshot()
  })

  test('should render loading', () => {
    jest.spyOn(cdngServices, 'useGetEnvBuildInstanceCount').mockImplementation(() => {
      return { loading: true, error: false, data: noData, refetch: jest.fn() } as any
    })
    const { container } = render(
      <TestWrapper>
        <ActiveServiceInstances />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render no data', () => {
    jest.spyOn(cdngServices, 'useGetEnvBuildInstanceCount').mockImplementation(() => {
      return {
        loading: false,
        error: false,
        data: noData,
        refetch: jest.fn()
      } as any
    })
    const { container } = render(
      <TestWrapper>
        <ActiveServiceInstances />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})

describe('ActiveInstance Details Dialog', () => {
  test('Open details dialog', async () => {
    jest.spyOn(cdngServices, 'useGetEnvBuildInstanceCount').mockImplementation(() => {
      return { loading: false, error: false, data: mockData, refetch: jest.fn() } as any
    })
    const { getByText } = render(
      <TestWrapper>
        <ActiveServiceInstances />
      </TestWrapper>
    )

    const moreDetailsButton = getByText('cd.serviceDashboard.moreDetails')
    await act(async () => {
      fireEvent.click(moreDetailsButton!)
    })

    const popup = findDialogContainer()
    expect(popup).toBeTruthy()
    expect(popup).toMatchSnapshot()
  })

  test('Expand all sections in dialog', async () => {
    jest.spyOn(cdngServices, 'useGetEnvBuildInstanceCount').mockImplementation(() => {
      return { loading: false, error: false, data: mockData, refetch: jest.fn() } as any
    })
    const { getByText } = render(
      <TestWrapper>
        <ActiveServiceInstances />
      </TestWrapper>
    )

    const moreDetailsButton = getByText('cd.serviceDashboard.moreDetails')
    await act(async () => {
      fireEvent.click(moreDetailsButton!)
    })

    const popup = findDialogContainer()
    expect(popup).toBeTruthy()

    const expandButtons = document.querySelectorAll('.bp3-icon')
    await act(async () => {
      expandButtons.forEach(expandButton => {
        fireEvent.click(expandButton)
      })
    })

    expect(popup).toMatchSnapshot()
  })
})

//tests differents default states of tab according to the returned api response

describe('ActiveInstance Tab states', () => {
  //tab should be defaulted to activeInstances
  test('when both are not empty - (activeInstance and deployments)', () => {
    jest.spyOn(cdngServices, 'useGetEnvArtifactDetailsByServiceId').mockImplementation(() => {
      return {
        data: dataMock
      } as any
    })
    jest.spyOn(cdngServices, 'useGetEnvBuildInstanceCount').mockImplementation(() => {
      return { loading: false, error: false, data: mockData, refetch: jest.fn() } as any
    })
    const { getByText } = render(
      <TestWrapper>
        <ActiveServiceInstances />
      </TestWrapper>
    )

    // activeInstance Tab should be visible
    expect(getByText('common.instanceLabel')).toBeTruthy()
  })

  //tab should be defaulted to deployments
  test('when activeInstance is empty and deployments is not', () => {
    jest.spyOn(cdngServices, 'useGetEnvArtifactDetailsByServiceId').mockImplementation(() => {
      return {
        data: dataMock
      } as any
    })
    jest.spyOn(cdngServices, 'useGetEnvBuildInstanceCount').mockImplementation(() => {
      return {
        loading: false,
        error: false,
        data: noData,
        refetch: jest.fn()
      } as any
    })
    const { getByText } = render(
      <TestWrapper>
        <ActiveServiceInstances />
      </TestWrapper>
    )
    //check if table header are visible
    expect(getByText('environment')).toBeTruthy()
    expect(getByText('cd.artifactVersion')).toBeTruthy()

    //check if table rows of deployments are visible

    //value is environment column
    expect(getByText('NewEnv')).toBeTruthy()

    //corresponding artifact version
    expect(getByText('perl')).toBeTruthy()
  })

  //when both are empty then defaulted to activeInstance
  test('when both are empty', () => {
    jest.spyOn(cdngServices, 'useGetEnvArtifactDetailsByServiceId').mockImplementation(() => {
      return {
        mutate: () => Promise.resolve({ loading: false, data: [] })
      } as any
    })
    jest.spyOn(cdngServices, 'useGetEnvBuildInstanceCount').mockImplementation(() => {
      return {
        loading: false,
        error: false,
        data: noData,
        refetch: jest.fn()
      } as any
    })
    const { getByText } = render(
      <TestWrapper>
        <ActiveServiceInstances />
      </TestWrapper>
    )
    //activeInstance tab should open
    expect(getByText('cd.serviceDashboard.noActiveServiceInstances')).toBeTruthy()
  })
})
