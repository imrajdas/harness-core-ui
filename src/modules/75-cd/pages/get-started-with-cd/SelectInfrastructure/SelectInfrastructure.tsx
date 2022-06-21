/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useRef, useState } from 'react'
import {
  Text,
  FontVariation,
  Layout,
  CardSelect,
  Icon,
  Container,
  Formik,
  FormikForm as Form,
  Color,
  DropDown,
  Button,
  ButtonVariation,
  Accordion
} from '@harness/uicore'
import type { FormikContextType } from 'formik'
import { useStrings } from 'framework/strings'

import type { ConnectorRequestBody } from 'services/cd-ng'
import Stepk8ClusterDetails from '@connectors/components/CreateConnector/K8sConnector/StepAuth/Stepk8ClusterDetails'
import { InfrastructureTypes, InfrastructureType } from '../DeployProvisioningWizard/Constants'
import css from '../DeployProvisioningWizard/DeployProvisioningWizard.module.scss'

export interface SelectInfrastructureRef {
  values: SelectInfrastructureInterface
  setFieldTouched(
    field: keyof SelectInfrastructureInterface & string,
    isTouched?: boolean,
    shouldValidate?: boolean
  ): void
  validate: () => boolean
  showValidationErrors: () => void
}
export interface SelectInfrastructureInterface {
  infraType?: string
  envName?: string
}

interface SelectInfrastructureProps {
  disableNextBtn: () => void
  enableNextBtn: () => void
  onClose: () => void
  onSuccess: (data?: ConnectorRequestBody) => void | Promise<void>
  setIsEditMode: (val: boolean) => void
}

const SelectInfrastructureRef = (props: SelectInfrastructureProps): React.ReactElement => {
  const { getString } = useStrings()
  const { disableNextBtn, enableNextBtn } = props
  const [infrastructureType, setInfrastructureType] = useState<InfrastructureType | undefined>()
  const formikRef = useRef<FormikContextType<SelectInfrastructureInterface>>()

  useEffect(() => {
    if (infrastructureType) enableNextBtn()
    else disableNextBtn()
  })

  const borderBottom = <div className={css.repoborderBottom} />
  return (
    <Layout.Vertical width="80%">
      <Text font={{ variation: FontVariation.H4 }}>{getString('cd.getStartedWithCD.workloadDeploy')}</Text>
      <Formik<SelectInfrastructureInterface>
        initialValues={{}}
        formName="cdInfrastructure"
        // validationSchema={getValidationSchema()}
        validateOnChange={true}
        onSubmit={(values: SelectInfrastructureInterface) => Promise.resolve(values)}
      >
        {formikProps => {
          formikRef.current = formikProps
          return (
            <Form>
              <Container padding={{ top: 'xxlarge', bottom: 'xxxlarge' }}>
                <CardSelect
                  data={InfrastructureTypes}
                  cornerSelected={true}
                  className={css.icons}
                  cardClassName={css.serviceDeploymentTypeCard}
                  renderItem={(item: InfrastructureType) => (
                    <>
                      <Layout.Vertical flex>
                        <Icon name={item.icon} size={30} flex className={css.serviceDeploymentTypeIcon} />

                        <Text font={{ variation: FontVariation.SMALL_SEMI }} padding={{ top: 'xxlarge' }} width={78}>
                          {getString(item.label)}
                        </Text>
                      </Layout.Vertical>
                    </>
                  )}
                  selected={infrastructureType}
                  onChange={(item: InfrastructureType) => {
                    formikProps.setFieldValue('infrastructureType', item)
                    setInfrastructureType(item)
                  }}
                />
              </Container>
              <Container padding={{ bottom: 'xxlarge' }}>
                <Text color={Color.GREY_600} padding={{ top: 'xlarge', bottom: 'xsmall' }}>
                  {getString('cd.getStartedWithCD.envName')}
                </Text>
                <DropDown
                  filterable={false}
                  width={320}
                  onChange={item => {
                    formikProps.setFieldValue('envName', item.value)
                  }}
                  items={[]}
                />
              </Container>
              {borderBottom}
              <div className={css.accordionPadding}>
                <Accordion className={css.accordion}>
                  <Accordion.Panel
                    id="codeRepo"
                    summary={
                      <Text font={{ variation: FontVariation.H5 }} width={300}>
                        {getString('common.authMethod')}
                      </Text>
                    }
                    details={
                      <Stepk8ClusterDetails
                        setIsEditMode={props.setIsEditMode}
                        connectorInfo={undefined}
                        accountId={''}
                        orgIdentifier={''}
                        projectIdentifier={''}
                        isEditMode={false}
                        onConnectorCreated={props.onSuccess}
                        hideModal={props.onClose}
                        onBoarding={true}
                      ></Stepk8ClusterDetails>
                    }
                  />
                </Accordion>
              </div>
              {borderBottom}
              <div className={css.accordionPadding}>
                <Accordion className={css.accordion}>
                  <Accordion.Panel
                    id="codeRepo"
                    summary={
                      <Text font={{ variation: FontVariation.H5 }} width={300}>
                        {getString('cd.getStartedWithCD.setupDelegate')}
                      </Text>
                    }
                    details={
                      <>
                        <Text padding={{ bottom: 'medium' }}>{getString('cd.getStartedWithCD.delegateInfo')}</Text>
                        <Button
                          text={getString('cd.getStartedWithCD.setupaNewDelegate')}
                          variation={ButtonVariation.SECONDARY}
                        />
                      </>
                    }
                  />
                </Accordion>
              </div>
              {borderBottom}
            </Form>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

export const SelectInfrastructure = React.forwardRef(SelectInfrastructureRef)
