/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { FieldArray, FieldArrayRenderProps, FormikProps } from 'formik'
import {
  Container,
  FormInput,
  StepProps,
  Layout,
  Text,
  Formik,
  Button,
  Icon,
  FormikForm,
  ModalErrorHandlerBinding,
  ModalErrorHandler,
  FlexExpander,
  IconName,
  Select,
  ButtonVariation
} from '@wings-software/uicore'
import * as Yup from 'yup'
import { TagInput } from '@blueprintjs/core'
import { Color, FontVariation } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import formatCost from '@ce/utils/formatCost'
import { useCreateBudget, Budget, AlertThreshold, useUpdateBudget } from 'services/ce'
import { USER_JOURNEY_EVENTS } from '@ce/TrackingEventsConstants'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { BudgetAlertChannels, BudgetStepData } from '../types'
import css from '../PerspectiveCreateBudget.module.scss'
interface Props {
  name: string
  viewId: string
  accountId: string
  onSuccess: () => void
  budget?: Budget
  isEditMode: boolean
  initiatorPage?: string
}

interface ThresholdForm {
  alertThresholds: AlertThresholdWithNotifcationChannel[]
}

interface AlertChannelOption {
  label: string
  value: BudgetAlertChannels
  icon: {
    name: IconName
  }
}

type AlertThresholdWithNotifcationChannel = AlertThreshold & { notificationChannel: BudgetAlertChannels }

const makeNewThresold = (): AlertThresholdWithNotifcationChannel => {
  return {
    percentage: undefined,
    basedOn: 'ACTUAL_COST',
    userGroupIds: [],
    notificationChannel: BudgetAlertChannels.EMAIL,
    emailAddresses: [],
    slackWebhooks: []
  }
}

const ConfigureAlerts: React.FC<StepProps<BudgetStepData> & Props> = props => {
  const { getString } = useStrings()
  const [loading, setLoading] = useState(false)
  const [hasError, setError] = useState(false)
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding | undefined>()
  const { prevStepData, previousStep, accountId, budget, isEditMode, initiatorPage = '' } = props
  const {
    type,
    perspective,
    growthRate,
    period,
    budgetName,
    perspectiveName,
    startTime,
    budgetAmount = 0
  } = (prevStepData || {}) as BudgetStepData
  const { trackEvent } = useTelemetry()

  const { mutate: updateBudget } = useUpdateBudget({
    id: budget?.uuid || '',
    queryParams: { accountIdentifier: accountId }
  })
  const { mutate: createBudget } = useCreateBudget({
    queryParams: { accountIdentifier: accountId }
  })

  useEffect(() => {
    trackEvent(USER_JOURNEY_EVENTS.CONFIGURE_BUDGET_ALERTS, { pageName: initiatorPage, isEditMode })
  }, [])

  const getInitialValues = () => {
    return {
      alertThresholds: budget?.alertThresholds?.map(alert => ({
        ...alert,
        notificationChannel: alert.slackWebhooks?.length ? BudgetAlertChannels.SLACK : BudgetAlertChannels.EMAIL
      })) || [makeNewThresold()]
    }
  }

  const handleSubmit = async ({ alertThresholds }: ThresholdForm) => {
    setError(false)
    setLoading(true)

    trackEvent(USER_JOURNEY_EVENTS.SAVE_BUDGET, {
      pageName: initiatorPage,
      isEditMode,
      alerts: alertThresholds.length,
      budgetType: type,
      budgetPeriod: period
    })

    const altThresholds = alertThresholds.map(alt => {
      return {
        basedOn: alt.basedOn,
        emailAddresses: alt.emailAddresses,
        percentage: alt.percentage,
        userGroupIds: alt.userGroupIds,
        slackWebhooks: alt.slackWebhooks
      }
    })

    /* istanbul ignore next */
    const emptyThresholds = (t: AlertThreshold) =>
      (t.emailAddresses?.length || t.slackWebhooks?.length || 0) > 0 && t.percentage
    const payload = {
      accountId,
      name: budgetName,
      alertThresholds: altThresholds.filter(emptyThresholds),
      type: type === 'PREVIOUS_MONTH_SPEND' ? 'PREVIOUS_PERIOD_SPEND' : type,
      period,
      startTime,
      growthRate: growthRate,
      budgetAmount: +budgetAmount,
      scope: {
        viewName: perspectiveName,
        type: 'PERSPECTIVE',
        viewId: perspective
      }
    }

    try {
      /* istanbul ignore next */
      await (isEditMode ? updateBudget(payload as Budget) : createBudget(payload as Budget))
      props.onSuccess()
    } catch (e) {
      setError(true)
      setLoading(false)
      /* istanbul ignore next */
      modalErrorHandler?.showDanger(e.data.message)
    }
  }

  return (
    <Container>
      <Formik<ThresholdForm>
        formName="alertThresholds"
        initialValues={getInitialValues()}
        validationSchema={Yup.object().shape(
          {
            alertThresholds: Yup.array(
              Yup.object({
                emailAddresses: Yup.lazy(() =>
                  Yup.array(
                    Yup.string().when('slackWebhooks', {
                      is: slackWebhooks => !slackWebhooks || slackWebhooks.length === 0,
                      then: Yup.string()
                        .required(getString('common.validation.email.required'))
                        .email(getString('common.validation.email.format'))
                    })
                  )
                ),
                slackWebhooks: Yup.lazy(() =>
                  Yup.array(
                    Yup.string().when('emailAddresses', {
                      is: emailAddresses => !emailAddresses || emailAddresses.length === 0,
                      then: Yup.string()
                        .required(getString('common.validation.urlIsRequired'))
                        .url(getString('validation.urlIsNotValid'))
                    })
                  )
                )
              })
            )
          },
          [['emailAddresses', 'slackWebhooks']]
        )}
        onSubmit={data => {
          handleSubmit(data)
        }}
      >
        {formikProps => {
          return (
            <FormikForm>
              <Container className={css.selectPerspectiveContainer}>
                <Text
                  font={{ variation: FontVariation.H4 }}
                  tooltipProps={{
                    dataTooltipId: 'createBudgetConfigureAlerts'
                  }}
                >
                  {getString('ce.perspectives.budgets.configureAlerts.title')}
                </Text>
                <ModalErrorHandler bind={setModalErrorHandler} />
                <Text
                  margin={{
                    top: 'xlarge',
                    bottom: 'xlarge'
                  }}
                >
                  {getString('ce.perspectives.budgets.configureAlerts.subTitle')}
                </Text>
                <Container
                  margin={{
                    bottom: 'xlarge'
                  }}
                >
                  <Text inline color="grey800" margin={{ right: 'small' }}>
                    {getString('ce.perspectives.budgets.configureAlerts.budgetAmount')}
                  </Text>
                  <Text inline color="grey800" font={{ weight: 'bold', size: 'medium' }}>
                    {formatCost(+budgetAmount)}
                  </Text>
                </Container>
                <Thresholds formikProps={formikProps} hasError={hasError} />
                <FlexExpander />
                <Layout.Horizontal spacing="medium">
                  <Button
                    text={getString('previous')}
                    icon="chevron-left"
                    onClick={() => previousStep?.(prevStepData)}
                  />
                  <Button
                    intent="primary"
                    rightIcon={'chevron-right'}
                    disabled={loading || !formikProps.isValid}
                    onClick={() => {
                      setTimeout(() => {
                        formikProps.submitForm()
                      }, 0)
                    }}
                  >
                    {getString('save')}
                  </Button>
                </Layout.Horizontal>
              </Container>
            </FormikForm>
          )
        }}
      </Formik>
    </Container>
  )
}

interface ThresholdsProps {
  formikProps: FormikProps<ThresholdForm>
  hasError: boolean
}

const Thresholds = (props: ThresholdsProps): JSX.Element => {
  const { formikProps } = props
  const { alertThresholds: alerts } = formikProps.values
  const endRef = useRef<HTMLDivElement>(null)
  const { getString } = useStrings()

  const renderLabels = () => {
    return (
      <div className={css.thresholdLabel}>
        <Text className={css.label}>{getString('ce.perspectives.budgets.configureAlerts.basedOn')}</Text>
        <Text color="grey0">{getString('ce.perspectives.budgets.configureAlerts.exceeds')}</Text>
        <Text className={css.label}>{getString('ce.perspectives.budgets.configureAlerts.percent')}</Text>
        <Text className={css.label}>{getString('ce.perspectives.budgets.configureAlerts.sendAlertTo')}</Text>
      </div>
    )
  }

  const renderThresholds = (arrayHelpers: FieldArrayRenderProps) => {
    return alerts.map((at, idx) => {
      return (
        <Threshold
          key={idx}
          index={idx}
          value={at}
          formikProps={formikProps}
          handleEmailChange={values => {
            formikProps.setFieldValue(`alertThresholds.${idx}.emailAddresses`, values)
          }}
          handleSlackWebhookChange={values => {
            formikProps.setFieldValue(`alertThresholds.${idx}.slackWebhooks`, values)
          }}
          handleNotificationChannelChange={value => {
            formikProps.setFieldValue(`alertThresholds.${idx}.notificationChannel`, value)
          }}
          onDelete={() => {
            if (alerts.length > 1) {
              arrayHelpers.remove(idx)
            }
          }}
        />
      )
    })
  }

  const renderAddThresholdButton = (arrayHelpers: FieldArrayRenderProps) => {
    return (
      <Container margin="medium">
        <Button
          variation={ButtonVariation.SECONDARY}
          text={getString('ce.perspectives.budgets.configureAlerts.createAlert')}
          onClick={() => {
            arrayHelpers.push(makeNewThresold())
            const timer = setTimeout(() => {
              endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
              clearTimeout(timer)
            }, 0)
          }}
        />
      </Container>
    )
  }

  return (
    <FieldArray
      name="alertThresholds"
      render={arrayHelpers => {
        return (
          <Container>
            <div className={css.thresholds}>
              {renderLabels()}
              <div className={css.threshCtn}>
                {renderThresholds(arrayHelpers)}
                <div ref={endRef} />
              </div>
              {renderAddThresholdButton(arrayHelpers)}
            </div>
          </Container>
        )
      }}
    />
  )
}

interface ThresholdProps {
  handleEmailChange: (value: React.ReactNode) => void
  handleSlackWebhookChange: (value: React.ReactNode) => void
  handleNotificationChannelChange: (value: BudgetAlertChannels) => void
  value: AlertThresholdWithNotifcationChannel
  onDelete: () => void
  index: number
  formikProps: FormikProps<ThresholdForm>
}

const Threshold = (props: ThresholdProps): JSX.Element => {
  const {
    value,
    index: idx,
    onDelete,
    handleEmailChange,
    handleSlackWebhookChange,
    handleNotificationChannelChange,
    formikProps
  } = props
  const { getString } = useStrings()
  const BASED_ON_OPTIONS = useMemo(() => {
    return [
      {
        label: getString('ce.perspectives.budgets.configureAlerts.actual'),
        value: 'ACTUAL_COST'
      },
      {
        label: getString('ce.perspectives.budgets.configureAlerts.forecasted'),
        value: 'FORECASTED_COST'
      }
    ]
  }, [])

  const alertChannelOptions: AlertChannelOption[] = useMemo(
    () => [
      {
        label: getString('email'),
        value: BudgetAlertChannels.EMAIL,
        icon: { name: 'email-inline' }
      },
      {
        label: getString('notifications.slackwebhookUrl'),
        value: BudgetAlertChannels.SLACK,
        icon: { name: 'service-slack' }
      }
    ],
    []
  )

  const isSlackChannel = value.notificationChannel === BudgetAlertChannels.SLACK

  const handleOnChange = (values: React.ReactNode[]): void => {
    if (isSlackChannel) {
      handleSlackWebhookChange(values)
    } else {
      handleEmailChange(values)
    }
    clearInput()
  }

  const clearInput = () => {
    if (isSlackChannel) {
      handleEmailChange([])
    } else {
      handleSlackWebhookChange([])
    }
  }

  return (
    <div className={css.threshold}>
      <FormInput.Select
        value={BASED_ON_OPTIONS.find(op => op.value === value.basedOn)}
        items={BASED_ON_OPTIONS}
        name={`alertThresholds.${idx}.basedOn`}
      />
      <Text className={css.pushdown7}>exceeds</Text>
      <FormInput.Text
        name={`alertThresholds.${idx}.percentage`}
        inputGroup={{ type: 'number' }}
        placeholder={getString('ce.perspectives.budgets.configureAlerts.enterPercent')}
      />
      <Container>
        <Container className={css.sendAlertTo}>
          <Select
            items={alertChannelOptions}
            allowCreatingNewItems={false}
            value={alertChannelOptions[isSlackChannel ? 1 : 0]}
            onChange={item => {
              handleNotificationChannelChange(item.value as BudgetAlertChannels)
              clearInput()
            }}
            className={css.alertChannelsInput}
            name={`alertThresholds.${idx}.notificationChannel`}
          />
          <TagInput
            addOnBlur
            className={css.tagInput}
            tagProps={{ className: css.tag }}
            placeholder={getString('ce.perspectives.budgets.configureAlerts.emailPlaceholder')}
            onChange={handleOnChange}
            values={isSlackChannel ? value.slackWebhooks : value.emailAddresses}
          />
        </Container>
        <Text color={Color.RED_600} margin={{ top: 'small', left: 'small' }}>
          {(formikProps.errors.alertThresholds?.[idx] as any)?.[isSlackChannel ? 'slackWebhooks' : 'emailAddresses']}
        </Text>
      </Container>
      <Icon
        color="grey200"
        size={18}
        name="ban-circle"
        className={css.pushdown7}
        onClick={onDelete}
        style={{ cursor: 'pointer' }}
      />
    </div>
  )
}

export default ConfigureAlerts
