/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import {
  Formik,
  FormikForm,
  Container,
  FormInput,
  Layout,
  FlexExpander,
  Button,
  Text,
  PageSpinner,
  useToaster,
  ExpandingSearchInput
} from '@wings-software/uicore'
import { Menu, MenuItem, Popover, Position } from '@blueprintjs/core'
import { FontVariation } from '@harness/design-system'
import { useParams, useHistory } from 'react-router-dom'
import * as Yup from 'yup'
import { useUpdatePerspective, CEView, useGetFolders, CEViewFolder } from 'services/ce'
import {
  QlceViewRuleInput,
  QlceViewFieldInputInput,
  ViewChartType,
  ViewTimeRangeType,
  QlceViewTimeGroupType
} from 'services/ce/services'
import { useStrings } from 'framework/strings'
import type { ViewIdCondition } from 'services/ce/'
import { DEFAULT_GROUP_BY, perspectiveDateLabelToDisplayText, searchList } from '@ce/utils/perspectiveUtils'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { USER_JOURNEY_EVENTS } from '@ce/TrackingEventsConstants'
import { folderViewType } from '@ce/constants'
import PerspectiveFilters from '../PerspectiveFilters'
import PerspectiveBuilderPreview from '../PerspectiveBuilderPreview/PerspectiveBuilderPreview'
// import ProTipIcon from './images/pro-tip.svg'
import css from './PerspectiveBuilder.module.scss'

export const CREATE_CALL_OBJECT = {
  viewVersion: 'v1',
  viewTimeRange: {
    viewTimeRangeType: ViewTimeRangeType.Last_7
  },
  viewType: 'CUSTOMER',
  viewVisualization: {
    granularity: QlceViewTimeGroupType.Day
  }
}

export interface PerspectiveFormValues {
  name: string
  viewRules?: QlceViewRuleInput[]
  viewVisualization: {
    groupBy: QlceViewFieldInputInput
    chartType: ViewChartType
  }
}

interface FolderSelectionProps {
  selectedFolder: CEViewFolder
  setSelectedFolder: (value: CEViewFolder) => void
  foldersList: CEViewFolder[]
}

const FolderSelection: React.FC<FolderSelectionProps> = ({ selectedFolder, setSelectedFolder, foldersList }) => {
  const { getString } = useStrings()
  const [folders, setFolders] = useState<CEViewFolder[]>(foldersList)
  const onSearch = (searchVal: string) => {
    const filteredList = searchList(searchVal, foldersList)
    setFolders(filteredList)
  }

  useEffect(() => {
    setFolders(foldersList)
  }, [foldersList])

  return (
    <Popover
      position={Position.BOTTOM_RIGHT}
      modifiers={{
        arrow: { enabled: false },
        flip: { enabled: true },
        keepTogether: { enabled: true },
        preventOverflow: { enabled: true }
      }}
      hoverCloseDelay={0}
      transitionDuration={0}
      minimal={true}
      content={
        <Menu>
          <ExpandingSearchInput
            onChange={text => onSearch(text.trim())}
            alwaysExpanded={true}
            placeholder={getString('search')}
          />
          {folders.map(folder => {
            if (folder.viewType === folderViewType.SAMPLE) {
              return null
            }
            return (
              <MenuItem
                key={folder.uuid}
                active={selectedFolder.uuid === folder.uuid}
                onClick={() => {
                  setSelectedFolder(folder)
                }}
                icon={'folder-close'}
                text={folder.name}
              />
            )
          })}
        </Menu>
      }
    >
      <Layout.Horizontal flex={{ alignItems: 'center' }}>
        <Text font={{ variation: FontVariation.BODY }}>{getString('ce.perspectives.createPerspective.nameLabel')}</Text>
        <Button
          intent="primary"
          minimal
          text={selectedFolder?.name || ''}
          iconProps={{
            size: 16
          }}
          rightIcon="caret-down"
          className={css.folderSelectionBtn}
        />
      </Layout.Horizontal>
    </Popover>
  )
}

interface PerspectiveBuilderProps {
  perspectiveData?: CEView
  onNext: (resource: CEView, payload: CEView) => void
}

const PerspectiveBuilder: React.FC<PerspectiveBuilderProps> = props => {
  const { getString } = useStrings()
  const { perspectiveId, accountId } = useParams<{ perspectiveId: string; accountId: string }>()
  const history = useHistory()
  const { showError } = useToaster()
  const { trackEvent } = useTelemetry()
  const [selectedFolder, setSelectedFolder] = useState<CEViewFolder>({})
  const { perspectiveData } = props

  const { mutate: createView, loading } = useUpdatePerspective({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { data: foldersListResullt } = useGetFolders({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const foldersList = foldersListResullt?.data || []

  useEffect(() => {
    if (foldersList) {
      const defaultFolder = foldersList.filter(data =>
        perspectiveData?.folderId ? data.uuid === perspectiveData?.folderId : data.viewType === folderViewType.DEFAULT
      )
      setSelectedFolder(defaultFolder[0])
    }
  }, [foldersList])

  /* istanbul ignore next */
  const makeCreateCall: (value: CEView) => void = async values => {
    const apiObject = {
      ...CREATE_CALL_OBJECT,
      ...values,
      viewState: 'DRAFT',
      viewType: 'CUSTOMER',
      viewPreferences: perspectiveData?.viewPreferences,
      uuid: perspectiveId,
      folderId: selectedFolder?.uuid || ''
    }

    if (apiObject.viewRules) {
      apiObject.viewRules.forEach((item, index) => {
        if (item?.viewConditions && item.viewConditions.length === 0 && apiObject.viewRules) {
          delete apiObject.viewRules[index]
        } else if (item.viewConditions) {
          item.viewConditions.forEach(x => {
            const viewFieldObj = x as ViewIdCondition
            if (viewFieldObj.viewField?.identifierName) {
              delete viewFieldObj.viewField.identifierName
            }
          })
        }
      })
      apiObject.viewRules = apiObject.viewRules.filter(x => x !== null)
    } else {
      apiObject['viewRules'] = []
    }

    try {
      const { data } = await createView(apiObject as CEView)
      if (data) {
        props.onNext(data, apiObject as CEView)
      }
    } catch (err: any) {
      const errMessage = err.data.message
      showError(errMessage)
    }
  }

  /* istanbul ignore next */
  const goBack: () => void = () => {
    history.goBack()
  }

  const dateLabelToDisplayText = perspectiveDateLabelToDisplayText(getString)

  const ViewTimeRange = [
    {
      value: ViewTimeRangeType.Last_7,
      label: dateLabelToDisplayText[ViewTimeRangeType.Last_7]
    },
    {
      value: ViewTimeRangeType.Last_30,
      label: dateLabelToDisplayText[ViewTimeRangeType.Last_30]
    },
    {
      value: ViewTimeRangeType.LastMonth,
      label: dateLabelToDisplayText[ViewTimeRangeType.LastMonth]
    },
    {
      value: ViewTimeRangeType.CurrentMonth,
      label: dateLabelToDisplayText[ViewTimeRangeType.CurrentMonth]
    }
  ]

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .trim()
      .required(getString('ce.perspectives.createPerspective.validationErrors.nameError'))
      .min(1, getString('ce.perspectives.createPerspective.validationErrors.nameLengthError'))
      .max(80, getString('ce.perspectives.createPerspective.validationErrors.nameLengthError')),
    viewRules: Yup.array().of(
      Yup.object().shape({
        viewConditions: Yup.array().of(
          Yup.object().shape({
            viewOperator: Yup.string(),
            viewField: Yup.object().shape({
              fieldId: Yup.string().required(),
              fieldName: Yup.string(),
              identifier: Yup.string().required(),
              identifierName: Yup.string().nullable()
            })
          })
        )
      })
    )
  })

  return (
    <Container className={css.mainContainer}>
      {loading && <PageSpinner />}
      <Formik<CEView>
        formName="createPerspective"
        /* istanbul ignore next */
        initialValues={{
          name: perspectiveData?.name,
          viewVisualization: {
            groupBy: perspectiveData?.viewVisualization?.groupBy || DEFAULT_GROUP_BY,
            chartType: perspectiveData?.viewVisualization?.chartType || ViewChartType.StackedLineChart
          },
          viewTimeRange: {
            viewTimeRangeType: perspectiveData?.viewTimeRange?.viewTimeRangeType || ViewTimeRangeType.Last_7
          },
          viewRules: perspectiveData?.viewRules || []
        }}
        enableReinitialize={true}
        onSubmit={
          /* istanbul ignore next */ () => {
            Promise.resolve()
          }
        }
        validationSchema={validationSchema}
      >
        {formikProps => {
          return (
            <FormikForm className={css.formContainer}>
              <Container className={css.innerContainer}>
                <Layout.Vertical
                  spacing="medium"
                  height="100%"
                  className={css.builderContainer}
                  padding={{ left: 'large', right: 'xxlarge', bottom: 'xxlarge', top: 'xxlarge' }}
                >
                  <Text font={{ variation: FontVariation.H4 }} margin={{ bottom: 'large' }}>
                    {getString('ce.perspectives.createPerspective.title')}
                  </Text>
                  <Layout.Horizontal style={{ position: 'relative' }}>
                    <FormInput.Text
                      name="name"
                      label={
                        <FolderSelection
                          selectedFolder={selectedFolder}
                          setSelectedFolder={setSelectedFolder}
                          foldersList={foldersList}
                        />
                      }
                      placeholder={getString('ce.perspectives.createPerspective.name')}
                      tooltipProps={{
                        dataTooltipId: 'perspectiveNameInput'
                      }}
                      className={css.perspectiveNameInput}
                    />
                    <FlexExpander />
                    <Popover
                      position={Position.BOTTOM_LEFT}
                      modifiers={{
                        arrow: { enabled: false },
                        flip: { enabled: true },
                        keepTogether: { enabled: true },
                        preventOverflow: { enabled: true }
                      }}
                      content={
                        <Menu>
                          {ViewTimeRange.map(timeRange => (
                            <MenuItem
                              onClick={() => {
                                formikProps.setFieldValue('viewTimeRange.viewTimeRangeType', timeRange.value)
                              }}
                              text={timeRange.label}
                              key={timeRange.value}
                            />
                          ))}
                        </Menu>
                      }
                    >
                      <Button
                        minimal
                        text={
                          formikProps.values.viewTimeRange?.viewTimeRangeType
                            ? dateLabelToDisplayText[formikProps.values.viewTimeRange?.viewTimeRangeType]
                            : 'Select Time Range'
                        }
                        rightIcon="calendar"
                      />
                    </Popover>
                  </Layout.Horizontal>

                  <div>
                    <PerspectiveFilters formikProps={formikProps} />
                  </div>
                  <FlexExpander />

                  {/*
                    this block is commented out, we will uncomment it once custom fields are Done

                  {<Container padding="medium" background="grey100" className={css.proTipContainer}>
                    <Layout.Horizontal spacing="medium">
                      <img src={ProTipIcon} />
                      <Container>
                        <Text font="small">{getString('ce.perspectives.createPerspective.proTipText')}</Text>
                        <Layout.Horizontal
                          spacing="xlarge"
                          margin={{
                            top: 'medium'
                          }}
                        >
                          <Text font="small" color="primary7" className={css.linkText}>
                            {getString('ce.perspectives.createPerspective.createCustomField')}
                          </Text>
                          <Text font="small" color="primary7" className={css.linkText}>
                            {getString('ce.perspectives.createPerspective.learnMoreCustomField')}
                          </Text>
                        </Layout.Horizontal>
                      </Container>
                    </Layout.Horizontal>
                  </Container>} */}
                  <Layout.Horizontal
                    padding={{
                      top: 'medium'
                    }}
                    spacing="large"
                  >
                    <Button
                      icon="chevron-left"
                      text={getString('ce.perspectives.createPerspective.prevButton')}
                      onClick={goBack}
                    />
                    <Button
                      icon="chevron-right"
                      intent="primary"
                      disabled={!!Object.keys(formikProps.errors).length}
                      text={getString('ce.perspectives.createPerspective.nextButton')}
                      onClick={
                        /* istanbul ignore next */ () => {
                          trackEvent(USER_JOURNEY_EVENTS.PERSPECTIVE_STEP1_NEXT, {})
                          makeCreateCall(formikProps.values)
                        }
                      }
                    />
                  </Layout.Horizontal>
                </Layout.Vertical>
                <PerspectiveBuilderPreview
                  setGroupBy={(groupBy: QlceViewFieldInputInput) => {
                    formikProps.setFieldValue('viewVisualization.groupBy', groupBy)
                  }}
                  showBusinessMappingButton={true}
                  formValues={formikProps.values}
                  groupBy={formikProps.values.viewVisualization?.groupBy as any}
                  chartType={formikProps.values.viewVisualization?.chartType as any}
                  setChartType={(type: ViewChartType) => {
                    formikProps.setFieldValue('viewVisualization.chartType', type)
                  }}
                />
              </Container>
            </FormikForm>
          )
        }}
      </Formik>
    </Container>
  )
}

export default PerspectiveBuilder
