/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { Heading, Layout, Formik, FormikForm } from '@wings-software/uicore'
import * as Yup from 'yup'
import { isEmpty as _isEmpty, defaultTo as _defaultTo } from 'lodash-es'
import type { DNSLinkSetupFormVal } from '@ce/types'
import { useStrings } from 'framework/strings'
import type { ConnectionMetadata, CustomDomainDetails, GatewayDetails } from '../COCreateGateway/models'
import { Utils } from '../../common/Utils'
import LBAdvancedConfiguration from './LBAdvancedConfiguration'
import ResourceAccessUrlSelector from './ResourceAccessUrlSelector'
import LoadBalancerSelection from './LoadBalancerSelection'

interface DNSLinkSetupProps {
  gatewayDetails: GatewayDetails
  setHelpTextSections: (s: string[]) => void
  setGatewayDetails: (gw: GatewayDetails) => void
  onInfoIconClick?: () => void
  activeStepDetails?: { count?: number; tabId?: string } | null
  serverNames: string[]
  setServerNames: (val: string[]) => void
  domainsToOverlap: string[]
  setDomainsToOverlap: (domains: string[]) => void
  overrideRoute53: boolean
  setOverrideRoute53: (flag: boolean) => void
}

const DNSLinkSetup: React.FC<DNSLinkSetupProps> = props => {
  const { getString } = useStrings()
  const accessDetails = props.gatewayDetails.opts.access_details as ConnectionMetadata // eslint-disable-line
  const customDomainProviderDetails = props.gatewayDetails.routing.custom_domain_providers as CustomDomainDetails // eslint-disable-line
  const allCustomDomains = useMemo(
    () => Utils.getAllCustomDomains(props.serverNames, props.gatewayDetails.customDomains),
    [props.serverNames, props.gatewayDetails.customDomains]
  )

  return (
    <Layout.Vertical spacing="medium" padding="medium">
      <Heading level={3}>{getString('ce.co.gatewayAccess.dnsLinkHeader')}</Heading>

      <Formik<DNSLinkSetupFormVal>
        initialValues={{
          customURL: allCustomDomains.join(','),
          publicallyAccessible: _defaultTo(accessDetails.dnsLink.public as string, 'yes'),
          dnsProvider: customDomainProviderDetails
            ? customDomainProviderDetails.route53
              ? 'route53'
              : 'others'
            : 'route53',
          route53Account: Utils.getConditionalResult(
            !_isEmpty(customDomainProviderDetails?.route53),
            customDomainProviderDetails?.route53?.hosted_zone_id,
            ''
          )
          // accessPoint: props.gatewayDetails.accessPointID
        }}
        formName="dnsLinkSetup"
        enableReinitialize={true}
        onSubmit={values => alert(JSON.stringify(values))}
        validationSchema={Yup.object().shape({
          customURL: Yup.string()
            .trim()
            .matches(
              /((https?):\/\/)?(www.)?[a-z0-9-]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#-]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
              'Enter a valid URL'
            )
        })}
      >
        {formik => (
          <FormikForm>
            <Layout.Vertical spacing="large">
              <LoadBalancerSelection
                gatewayDetails={props.gatewayDetails}
                setGatewayDetails={props.setGatewayDetails}
              />
              {_isEmpty(props.gatewayDetails.routing.container_svc) && (
                <LBAdvancedConfiguration
                  gatewayDetails={props.gatewayDetails}
                  setGatewayDetails={props.setGatewayDetails}
                  activeStepDetails={props.activeStepDetails}
                  setServerNames={props.setServerNames}
                />
              )}
              <ResourceAccessUrlSelector
                formikProps={formik}
                gatewayDetails={props.gatewayDetails}
                setGatewayDetails={props.setGatewayDetails}
                setHelpTextSections={props.setHelpTextSections}
                serverNames={props.serverNames}
                overrideRoute53={props.overrideRoute53}
                setOverrideRoute53={props.setOverrideRoute53}
                domainsToOverlap={props.domainsToOverlap}
                setDomainsToOverlap={props.setDomainsToOverlap}
                allCustomDomains={allCustomDomains}
              />
            </Layout.Vertical>
          </FormikForm>
        )}
      </Formik>
    </Layout.Vertical>
  )
}

export default DNSLinkSetup
