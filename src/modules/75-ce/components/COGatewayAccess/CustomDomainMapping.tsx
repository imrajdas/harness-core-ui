/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo, isEmpty, get } from 'lodash-es'
import { Container, Heading, Layout, SelectOption, Text, Checkbox, Select } from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { Radio } from '@blueprintjs/core'
import type { FormikProps } from 'formik'
import { useStrings } from 'framework/strings'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useValidateCustomDomains } from 'services/lw'
import type { GatewayDetails } from '../COCreateGateway/models'
import { areCustomDomainsValid } from './helper'
import css from './COGatewayAccess.module.scss'

interface CustomDomainMappingProps {
  formikProps: FormikProps<any>
  gatewayDetails: GatewayDetails
  setGatewayDetails: (details: GatewayDetails) => void
  hostedZonesList: SelectOption[]
  setDNSProvider: (val: string) => void
  setHelpTextSections: (s: string[]) => void
  domainsToOverlap: string[]
  setDomainsToOverlap: (domains: string[]) => void
  overrideRoute53: boolean
  setOverrideRoute53: (flag: boolean) => void
}

const EMPTY_OPTION = { value: '', label: '' }

const CustomDomainMapping: React.FC<CustomDomainMappingProps> = ({
  formikProps,
  gatewayDetails,
  setGatewayDetails,
  hostedZonesList,
  setDNSProvider,
  setHelpTextSections,
  domainsToOverlap,
  setDomainsToOverlap,
  overrideRoute53,
  setOverrideRoute53
}) => {
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()

  const [selectedHostname, setSelectedHostname] = useState<SelectOption>(EMPTY_OPTION)

  const { mutate: validateDomains } = useValidateCustomDomains({
    account_id: accountId,
    queryParams: {
      accountIdentifier: accountId
    }
  })

  useEffect(() => {
    const id = get(gatewayDetails, 'routing.custom_domain_providers.route53.hosted_zone_id', null)
    const selectedHostedZone = hostedZonesList.find(zone => zone.value === id)
    setSelectedHostname(defaultTo(selectedHostedZone, EMPTY_OPTION))
  }, [hostedZonesList])

  const handleValidation = async (zoneId: string) => {
    const { response } = await validateDomains({
      access_point_id: gatewayDetails.accessPointID,
      cloud_account_id: gatewayDetails.cloudAccount.id,
      custom_domain_providers: {
        route53: {
          hosted_zone_id: zoneId
        }
      },
      custom_domains: gatewayDetails.customDomains,
      exclude_list: gatewayDetails.hostName ? [gatewayDetails.hostName] : undefined
    })
    if (response) {
      const overlappedDomains: string[] = []
      Object.entries(response).forEach(([domain, val]) => {
        if (val) {
          overlappedDomains.push(domain)
        }
      })
      setDomainsToOverlap(overlappedDomains)
    }
  }

  useEffect(() => {
    const hostedZoneId = get(gatewayDetails, 'routing.custom_domain_providers.route53.hosted_zone_id', null)
    if (areCustomDomainsValid(defaultTo(gatewayDetails.customDomains, [])) && hostedZoneId) {
      handleValidation(hostedZoneId)
    }
  }, [
    gatewayDetails.routing.custom_domain_providers?.route53?.hosted_zone_id,
    gatewayDetails.customDomains,
    gatewayDetails.accessPointID
  ])

  const onOtherProviderSelect = (val: string) => {
    formikProps.setFieldValue('dnsProvider', val)
    setDNSProvider(val)
    const updatedGatewayDetails = { ...gatewayDetails }
    updatedGatewayDetails.routing = {
      ...gatewayDetails.routing,
      custom_domain_providers: { others: {} },
      override_dns_record: false
    }
    setGatewayDetails(updatedGatewayDetails)
    setHelpTextSections(['usingCustomDomain', 'dns-others'])
    setDomainsToOverlap([])
    setOverrideRoute53(false)
  }

  return (
    <Container className={css.dnsLinkContainer}>
      <Layout.Vertical spacing="medium">
        <Heading level={3} font={{ weight: 'bold' }}>
          {getString('ce.co.autoStoppingRule.setupAccess.customDomain.mappingHeader')}
        </Heading>
        <Text font={{ weight: 'light' }} color="Color.GREY_500" className={css.mapDomainHelperText}>
          {getString('ce.co.autoStoppingRule.setupAccess.customDomain.mappingSubHeader')}
        </Text>
        <Layout.Vertical spacing={'small'}>
          <Layout.Horizontal flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
            <Radio
              value="route53"
              checked={formikProps.values.dnsProvider === 'route53'}
              onChange={e => {
                setSelectedHostname(EMPTY_OPTION)
                formikProps.setFieldValue('dnsProvider', e.currentTarget.value)
                setDNSProvider(e.currentTarget.value)
                const updatedGatewayDetails = { ...gatewayDetails }
                updatedGatewayDetails.routing = {
                  ...gatewayDetails.routing,
                  custom_domain_providers: { route53: {} }
                }
                setGatewayDetails(updatedGatewayDetails)
                setHelpTextSections(['usingCustomDomain'])
              }}
              name={'route53RadioBtn'}
            />
            <Select
              inputProps={{
                placeholder: getString('ce.co.accessPoint.select.route53')
              }}
              value={selectedHostname}
              items={hostedZonesList}
              onChange={async item => {
                setSelectedHostname(item)
                formikProps.setFieldValue('route53Account', item.value)
                const updatedGatewayDetails = { ...gatewayDetails }
                updatedGatewayDetails.routing = {
                  ...gatewayDetails.routing,
                  custom_domain_providers: {
                    route53: { hosted_zone_id: item.value as string }
                  }
                }
                setGatewayDetails(updatedGatewayDetails)
                if (areCustomDomainsValid(defaultTo(updatedGatewayDetails.customDomains, []))) {
                  await handleValidation(item.value as string)
                }
              }}
              name="route53Account"
            />
          </Layout.Horizontal>
          <Radio
            value="others"
            checked={formikProps.values.dnsProvider === 'others'}
            label="Others"
            onChange={e => {
              setSelectedHostname(EMPTY_OPTION)
              onOtherProviderSelect(e.currentTarget.value)
            }}
            data-testid={'otherDnsProvider'}
          />
        </Layout.Vertical>
        {!isEmpty(domainsToOverlap) && (
          <Layout.Vertical spacing={'small'}>
            <Container className={css.overlappingDomainsInfo}>
              <Text
                font={{ variation: FontVariation.BODY }}
                icon="info-messaging"
                iconProps={{ size: 22 }}
                color={Color.BLUE_800}
              >
                {getString('ce.co.autoStoppingRule.setupAccess.customDomain.overrideCustomDomainsInfoText', {
                  domains: domainsToOverlap.join()
                })}
              </Text>
            </Container>
            <Checkbox
              label={getString('ce.co.autoStoppingRule.setupAccess.customDomain.agreementText')}
              checked={overrideRoute53}
              onChange={e => {
                setOverrideRoute53(e.currentTarget.checked)
                setGatewayDetails({
                  ...gatewayDetails,
                  routing: {
                    ...gatewayDetails.routing,
                    override_dns_record: e.currentTarget.checked
                  }
                })
              }}
            />
          </Layout.Vertical>
        )}
      </Layout.Vertical>
    </Container>
  )
}

export default CustomDomainMapping
