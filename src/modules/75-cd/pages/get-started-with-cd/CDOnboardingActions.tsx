import { clone } from 'lodash-es'
import { DefaultNewPipelineId } from '@templates-library/components/TemplateStudio/PipelineTemplateCanvas/PipelineTemplateCanvasWrapper'
import type { PipelineInfoConfig } from 'services/pipeline-ng'
import type { ServiceResponseDTO } from 'services/cd-ng'
import {
  newServiceState as initialServiceState,
  newEnvironmentState as initialEnvironmentState
} from './cdOnboardingUtils'

export const DefaultPipeline: PipelineInfoConfig = {
  name: '',
  identifier: DefaultNewPipelineId
}

export interface CDOnboardingReducerState {
  pipeline?: PipelineInfoConfig
  service?: any
  serviceResponse: ServiceResponseDTO
  environment?: any
  infrastructure?: any
  environmentResponse: ServiceResponseDTO
  pipelineIdentifier: string
  error?: string
  schemaErrors: boolean
  isLoading: boolean
  isInitialized: boolean
  isUpdated: boolean
}

export enum CDOnboardingActions {
  Initialize = 'Initialize',
  Fetching = 'Fetching',
  UpdatePipeline = 'UpdatePipeline',
  UpdateService = 'UpdateService',
  UpdateEnvironment = 'UpdateEnvironment',
  UpdateInfrastructure = 'UpdateInfrastructure',
  Success = 'Success',
  Error = 'Error'
}

export interface ActionResponse {
  error?: string
  schemaErrors?: boolean
  isUpdated?: boolean
  pipeline?: PipelineInfoConfig
  pipelineIdentifier?: string
  service?: any
  environment?: any
  infrastructure?: any
  serviceResponse?: ServiceResponseDTO
  environmentResponse?: any
}

export interface ActionReturnType {
  type: CDOnboardingActions
  response?: ActionResponse
}

const initialized = (): ActionReturnType => ({ type: CDOnboardingActions.Initialize })
const updatePipeline = (): ActionReturnType => ({ type: CDOnboardingActions.UpdatePipeline })
const updateService = (response: ActionResponse): ActionReturnType => ({
  type: CDOnboardingActions.UpdateService,
  response
})
const updateEnvironment = (response: ActionResponse): ActionReturnType => ({
  type: CDOnboardingActions.UpdateEnvironment,
  response
})
const updateInfrastructure = (response: ActionResponse): ActionReturnType => ({
  type: CDOnboardingActions.UpdateInfrastructure,
  response
})
const fetching = (): ActionReturnType => ({ type: CDOnboardingActions.Fetching })
const success = (response: ActionResponse): ActionReturnType => ({ type: CDOnboardingActions.Success, response })
const error = (response: ActionResponse): ActionReturnType => ({ type: CDOnboardingActions.Error, response })

export const CDOnboardingContextActions = {
  // dbInitialized,
  initialized,
  updatePipeline,
  updateService,
  updateEnvironment,
  updateInfrastructure,
  fetching,
  success,
  error
}

export const initialState: CDOnboardingReducerState = {
  pipeline: { ...DefaultPipeline },
  pipelineIdentifier: DefaultNewPipelineId,
  service: initialServiceState.service,
  serviceResponse: {},
  environment: initialEnvironmentState.environment,
  infrastructure: initialEnvironmentState.infrastructure,
  environmentResponse: {},
  schemaErrors: false,
  isLoading: false,
  isUpdated: false,
  isInitialized: false
}

export const CDOnboardingReducer = (state = initialState, data: ActionReturnType): CDOnboardingReducerState => {
  const { type, response } = data
  switch (type) {
    case CDOnboardingActions.Initialize:
      return {
        ...state,
        isInitialized: true
      }
    case CDOnboardingActions.UpdatePipeline:
      return {
        ...state,
        isUpdated: response?.isUpdated ?? true,
        pipeline: response?.pipeline ? clone(response?.pipeline) : state.pipeline
      }
    case CDOnboardingActions.UpdateService:
      return {
        ...state,
        isUpdated: response?.isUpdated ?? true,
        service: response?.service ? clone(response?.service) : state.service,
        serviceResponse: response?.serviceResponse ? clone(response?.serviceResponse) : state.serviceResponse
      }
    case CDOnboardingActions.UpdateEnvironment:
      return {
        ...state,
        environment: response?.environment ? clone(response?.environment) : state.environment,
        environmentResponse: response?.environmentResponse
          ? clone(response?.environmentResponse)
          : state.environmentResponse
      }
    case CDOnboardingActions.UpdateInfrastructure:
      return {
        ...state,
        infrastructure: response?.infrastructure ? clone(response?.infrastructure) : state.infrastructure
      }
    case CDOnboardingActions.Fetching:
      return {
        ...state,
        isLoading: true,
        isUpdated: false
      }
    case CDOnboardingActions.Success:
    case CDOnboardingActions.Error:
      return { ...state, isLoading: false, ...response }
    default:
      return state
  }
}
