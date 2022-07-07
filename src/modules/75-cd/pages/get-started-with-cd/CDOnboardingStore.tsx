import { defaultTo, merge } from 'lodash-es'
import React from 'react'
import {
  EnvironmentResponseDTO,
  getServiceV2Promise,
  GetServiceV2QueryParams,
  ServiceResponseDTO
} from 'services/cd-ng'
import type { GetPipelineQueryParams } from 'services/pipeline-ng'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import { yamlParse } from '@common/utils/YamlHelperMethods'
import {
  ActionReturnType,
  CDOnboardingContextActions,
  CDOnboardingReducer,
  CDOnboardingReducerState,
  initialState
} from './CDOnboardingActions'
import { newServiceState as initialServiceState } from './cdOnboardingUtils'

interface FetchServiceBoundProps {
  dispatch: React.Dispatch<ActionReturnType>
  queryParams: GetServiceV2QueryParams
  serviceIdentifier: string
}

interface FetchServiceUnboundProps {
  forceFetch?: boolean
  forceUpdate?: boolean
  signal?: AbortSignal
}

export interface CDOnboardingContextInterface {
  state: CDOnboardingReducerState
  fetchService: (args: FetchServiceUnboundProps) => Promise<void>
  saveServiceData: any //(args: FetchServiceUnboundProps) => Promise<void>
  saveEnvironmentData: any //(args: FetchServiceUnboundProps) => Promise<void>
  saveInfrastructureData: any //(args: FetchServiceUnboundProps) => Promise<void>
}

export const CDOnboardingContext = React.createContext<CDOnboardingContextInterface>({
  state: initialState,
  fetchService: () => new Promise<void>(() => undefined),
  saveServiceData: () => new Promise<void>(() => undefined),
  saveEnvironmentData: () => new Promise<void>(() => undefined),
  saveInfrastructureData: () => new Promise<void>(() => undefined)
})

export interface CDOnboardingProviderProps {
  queryParams: GetPipelineQueryParams
  pipelineIdentifier: string
  serviceIdentifier: string
}

const getServiceByIdentifier = (
  queryParams: GetServiceV2QueryParams,
  identifier: string,
  signal?: AbortSignal
): Promise<ServiceResponseDTO> => {
  return getServiceV2Promise(
    {
      queryParams,
      serviceIdentifier: identifier
    },
    signal
  )
    .then(response => {
      if (response.status === 'SUCCESS' && response.data?.service) {
        return response.data?.service
      }
      throw new Error()
    })
    .catch(error => {
      throw new Error(error)
    })
}

export function CDOnboardingProvider({
  queryParams,
  pipelineIdentifier,
  serviceIdentifier,
  children
}: React.PropsWithChildren<CDOnboardingProviderProps>): React.ReactElement {
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const [state, dispatch] = React.useReducer(
    CDOnboardingReducer,
    merge(
      {
        pipeline: {
          projectIdentifier: queryParams.projectIdentifier,
          orgIdentifier: queryParams.orgIdentifier
        }
      },
      initialState
    )
  )
  state.pipelineIdentifier = pipelineIdentifier

  const _fetchService = async (props: FetchServiceBoundProps, params: FetchServiceUnboundProps): Promise<void> => {
    const { serviceIdentifier: identifier } = props
    const { forceFetch = false, forceUpdate = false, signal } = params

    dispatch(CDOnboardingContextActions.fetching())
    if (forceFetch && forceUpdate) {
      const serviceDetails: ServiceResponseDTO = await getServiceByIdentifier(
        { ...queryParams, ...(repoIdentifier && branch ? { repoIdentifier, branch } : {}) },
        identifier,
        signal
      )
      const serviceYaml = yamlParse(defaultTo(serviceDetails.yaml, ''))
      const serviceData = merge(serviceYaml, initialServiceState)

      //   const defaultPipeline = {
      //     identifier: defaultTo(serviceDetails.identifier, DefaultNewPipelineId),
      //     name: serviceDetails.name as string,
      //     description: serviceDetails.description,
      //     tags: serviceDetails.tags
      //   }
      //   const refetchedPipeline = produce({ ...defaultPipeline }, draft => {
      //     if (!isEmpty(serviceData.service.serviceDefinition)) {
      //       set(draft, 'stages[0].stage.name', DefaultNewStageName)
      //       set(draft, 'stages[0].stage.identifier', DefaultNewStageId)
      //       set(
      //         draft,
      //         'stages[0].stage.spec.serviceConfig.serviceDefinition',
      //         cloneDeep(serviceData.service.serviceDefinition)
      //       )
      //       set(draft, 'stages[0].stage.spec.serviceConfig.serviceRef', serviceDetails.identifier)
      //     }
      //   })
      dispatch(
        CDOnboardingContextActions.updateService({
          service: serviceData,
          isUpdated: false,
          environment: undefined
        })
      )
      dispatch(
        CDOnboardingContextActions.success({
          error: '',
          service: serviceData,
          isUpdated: false,
          environment: undefined
        })
      )
      //   dispatch(CDOnboardingContextActions.initialized())
      //   onUpdatePipeline?.(refetchedPipeline as PipelineInfoConfig)
    }
  }
  const saveServiceData = (serviceObj: { service: any; serviceResponse: ServiceResponseDTO }): any => {
    dispatch(
      CDOnboardingContextActions.updateService({
        service: serviceObj.service,
        serviceResponse: serviceObj.serviceResponse
      })
    )
  }

  const saveEnvironmentData = (envObj: { environment: any; environmentResponse: EnvironmentResponseDTO }): any => {
    dispatch(
      CDOnboardingContextActions.updateEnvironment({
        environment: envObj.environment,
        environmentResponse: envObj.environmentResponse
      })
    )
  }

  const saveInfrastructureData = (infraObj: { infrastructure: any }): any => {
    dispatch(
      CDOnboardingContextActions.updateInfrastructure({
        infrastructure: infraObj.infrastructure
      })
    )
  }

  const fetchService = _fetchService.bind(null, {
    dispatch,
    queryParams,
    serviceIdentifier
  })

  return (
    <CDOnboardingContext.Provider
      value={{
        state,
        fetchService,
        saveServiceData,
        saveEnvironmentData,
        saveInfrastructureData
      }}
    >
      {children}
    </CDOnboardingContext.Provider>
  )
}

export function useCDOnboardingContext(): CDOnboardingContextInterface {
  // disabling this because this the definition of usePipelineContext
  // eslint-disable-next-line no-restricted-syntax
  return React.useContext(CDOnboardingContext)
}
