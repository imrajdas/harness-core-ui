import React, { useReducer } from 'react'
import { DefaultNewPipelineId } from '@templates-library/components/TemplateStudio/PipelineTemplateCanvas/PipelineTemplateCanvasWrapper'
import type { PipelineInfoConfig } from 'services/cd-ng'

interface DimentionsActions {
  type: string
  data: any
}
interface CDOnboardingStoreConfig {
  service: any
  environment: any
  pipeline: any
}

const DefaultPipeline: PipelineInfoConfig = {
  name: '',
  identifier: DefaultNewPipelineId
}
const DefaultService = {
  serviceDefinition: {
    spec: {}
  }
}

const initialServiceState = {
  service: { ...DefaultService }
  // isLoading: false,
}

interface StoreConfigReturnType extends CDOnboardingStoreConfig {
  updateService?: (service: any) => void
  updateEnvironment?: (environment: any) => void
  updatePipeline?: (pipeline: any) => void
}

const initialValues = {
  service: { ...initialServiceState },
  environment: {},
  pipeline: { ...DefaultPipeline }
}

//initial state
export const CDOnboardingStoreContext = React.createContext(initialValues)

function useCDOnboardingContext(): StoreConfigReturnType {
  return React.useContext(CDOnboardingStoreContext)
}

export const UPDATE_DIMENSION = 'UPDATE_DIMENSION'
export const UPDATE_SERVICE = 'UPDATE_SERVICE'
export const UPDATE_ENVIRONMENT = 'UPDATE_ENVIRONMENT'
export const UPDATE_PIPLEINE = 'UPDATE_PIPELINE'

// Reducer
export function cdOnboardingReducer(
  state: CDOnboardingStoreConfig,
  action: DimentionsActions
): CDOnboardingStoreConfig {
  switch (action.type) {
    case UPDATE_SERVICE: {
      return {
        ...state,
        service: { ...state.service, ...action.data }
      }
    }

    case UPDATE_ENVIRONMENT: {
      return {
        ...state,
        environment: { ...state.environment, ...action.data }
      }
    }

    case UPDATE_PIPLEINE: {
      return {
        ...state,
        pipeline: { ...state.pipeline, ...action.data }
      }
    }
    default:
      return state
  }
}
function NodeDimensionProvider(props: any): React.ReactElement {
  const [onboardingState, updateCDOnboardingReducer] = useReducer(cdOnboardingReducer, initialValues)

  const updateService = (service: any): void =>
    updateCDOnboardingReducer({
      type: UPDATE_SERVICE,
      data: service
    })

  const updateEnvironment = (environment: any): void =>
    updateCDOnboardingReducer({
      type: UPDATE_ENVIRONMENT,
      data: environment
    })

  const updatePipeline = (pipeline: any): void =>
    updateCDOnboardingReducer({
      type: UPDATE_PIPLEINE,
      data: pipeline
    })
  const serviceData = { service: onboardingState.service, updateService }
  const environmentData = { environment: onboardingState.environment, updateEnvironment }
  const pipelineData = { pipeline: onboardingState.pipeline, updatePipeline }

  return (
    <CDOnboardingStoreContext.Provider
      value={{
        serviceData,
        environmentData,
        pipelineData
      }}
      {...props}
    />
  )
}

export { NodeDimensionProvider, useCDOnboardingContext }
