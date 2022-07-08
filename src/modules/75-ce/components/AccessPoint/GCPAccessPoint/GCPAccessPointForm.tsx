/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Menu } from '@blueprintjs/core'
import { isEmpty as _isEmpty, defaultTo as _defaultTo } from 'lodash-es'
import { Button, Container, Formik, FormikForm, FormInput, Icon, Layout, SelectOption } from '@harness/uicore'
import {
  AccessPoint,
  useAllSecurityGroups,
  useAllSubnets,
  useAllVPCs,
  useAllZones,
  useGetMachineListForZone
} from 'services/lw'
import { useStrings } from 'framework/strings'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import useRegionsForSelection from '@ce/common/hooks/useRegionsForSelection'
import type { AccessPointScreenMode } from '@ce/types'
import css from './GCPAccessPoint.module.scss'

export interface GcpApFormValue {
  region?: string
  securityGroups?: Array<SelectOption>
  certificate?: string
  vpc?: string
  zone?: string
  machine_type?: string
  subnet_name?: string
  cert_secret_id?: string
  key_secret_id?: string
}

interface GCPAccessPointFormProps {
  handleSubmit?: (values: GcpApFormValue) => void
  loadBalancer: AccessPoint
  cloudAccountId: string
  handlePreviousClick: (values: GcpApFormValue) => void
  isSaving: boolean
  mode: AccessPointScreenMode
}

type AllFieldsKey = keyof GcpApFormValue

const lbFieldToFormFieldMap: Record<string, AllFieldsKey> = {
  region: 'region',
  'metadata.security_groups': 'securityGroups',
  vpc: 'vpc',
  'metadata.zone': 'zone',
  'metadata.machine_type': 'machine_type',
  'metadata.subnet_name': 'subnet_name',
  'metadata.certificates.cert_secret_id': 'cert_secret_id',
  'metadata.certificates.key_secret_id': 'key_secret_id'
}

const GCPAccessPointForm: React.FC<GCPAccessPointFormProps> = ({
  loadBalancer,
  cloudAccountId,
  handlePreviousClick,
  handleSubmit,
  mode,
  isSaving
}) => {
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()

  const [selectedRegion, setSelectedRegion] = useState<string | undefined>(loadBalancer.region)
  const [selectedVpc, setSelectedVpc] = useState<string | undefined>(loadBalancer.vpc)
  const [selectedZone, setSelectedZone] = useState<string | undefined>(loadBalancer.metadata?.zone)
  const [zonesOptions, setZonesOptions] = useState<SelectOption[]>([])
  const [vpcOptions, setvpcOptions] = useState<SelectOption[]>([])
  const [sgOptions, setSGOptions] = useState<SelectOption[]>([])
  const [machineTypesOptions, setMachineTypesOptions] = useState<SelectOption[]>([])
  const [subnetOptions, setSubnetOptions] = useState<SelectOption[]>([])
  const [editableFieldsMap, setEditableFieldsMap] = useState<Record<string, boolean>>({})
  const { data: regionOptions, loading: regionsLoading } = useRegionsForSelection({
    cloudAccountId,
    additionalProps: {}
  })

  const isEditMode = mode === 'edit' || !_isEmpty(loadBalancer.id)

  const {
    data: zones,
    refetch: fetchZones,
    loading: zonesLoading
  } = useAllZones({
    account_id: accountId,
    queryParams: {
      cloud_account_id: cloudAccountId,
      accountIdentifier: accountId,
      region: _defaultTo(selectedRegion, '')
    },
    lazy: true
  })

  const {
    data: vpcs,
    refetch: vpcsReload,
    loading: vpcsLoading
  } = useAllVPCs({
    account_id: accountId, // eslint-disable-line
    queryParams: {
      region: _defaultTo(selectedRegion, ''),
      cloud_account_id: cloudAccountId, // eslint-disable-line
      accountIdentifier: accountId
    },
    lazy: true
  })

  const {
    data: machinesData,
    refetch: fetchMachines,
    loading: machinesLoading
  } = useGetMachineListForZone({
    account_id: accountId,
    queryParams: {
      accountIdentifier: accountId,
      cloud_account_id: cloudAccountId,
      zone: _defaultTo(selectedZone, '')
    },
    lazy: true
  })

  const {
    data: securityGroups,
    refetch: sgsReload,
    loading: sgsLoading
  } = useAllSecurityGroups({
    account_id: accountId, // eslint-disable-line
    queryParams: {
      region: _defaultTo(selectedRegion, ''),
      vpc_id: _defaultTo(selectedVpc, ''),
      cloud_account_id: cloudAccountId,
      accountIdentifier: accountId
    },
    lazy: true
  })

  const {
    data: subnets,
    refetch: subnetsReload,
    loading: subnetsLoading
  } = useAllSubnets({
    account_id: accountId, // eslint-disable-line
    queryParams: {
      cloud_account_id: cloudAccountId,
      region: _defaultTo(selectedRegion, ''),
      accountIdentifier: accountId,
      vpc: _defaultTo(selectedVpc, '')
    },
    lazy: true
  })

  useEffect(() => {
    if (mode !== 'create') {
      const editMap: Record<string, boolean> = {}
      loadBalancer.editables?.forEach(field => {
        const key = lbFieldToFormFieldMap[field]
        editMap[key as string] = true
      })
      setEditableFieldsMap(editMap)
    }
  }, [])

  useEffect(() => {
    if (selectedRegion) {
      vpcsReload()
      fetchZones()
    }
  }, [selectedRegion])

  useEffect(() => {
    if (selectedVpc) {
      subnetsReload()
      sgsReload()
    }
  }, [selectedVpc])

  useEffect(() => {
    const loaded: SelectOption[] = _defaultTo(
      zones?.response?.map(z => {
        return {
          label: z,
          value: z
        }
      }),
      []
    )
    setZonesOptions(loaded)
  }, [zones])

  useEffect(() => {
    const loaded: SelectOption[] = _defaultTo(
      vpcs?.response?.map(v => {
        return {
          label: v.name as string,
          value: v.name as string
        }
      }),
      []
    )
    setvpcOptions(loaded)
  }, [vpcs])

  useEffect(() => {
    const loaded: SelectOption[] = _defaultTo(
      securityGroups?.response?.map(v => {
        return {
          label: v.name as string,
          value: v.id as string
        }
      }),
      []
    )
    setSGOptions(loaded)
  }, [securityGroups])

  useEffect(() => {
    const loaded: SelectOption[] = _defaultTo(
      machinesData?.response?.map(m => {
        return {
          label: m.name as string,
          value: m.name as string
        }
      }),
      []
    )
    setMachineTypesOptions(loaded)
  }, [machinesData])

  useEffect(() => {
    const loaded: SelectOption[] = _defaultTo(
      subnets?.response?.map(s => {
        return {
          label: s.name as string,
          value: s.name as string
        }
      }),
      []
    )
    setSubnetOptions(loaded)
  }, [subnets])

  useEffect(() => {
    if (selectedZone) {
      fetchMachines()
    }
  }, [selectedZone])

  return (
    <Container>
      <Formik<GcpApFormValue>
        initialValues={{
          region: _defaultTo(loadBalancer.region, selectedRegion),
          zone: _defaultTo(loadBalancer.metadata?.zone, selectedZone),
          vpc: _defaultTo(loadBalancer.vpc, selectedVpc),
          securityGroups: _defaultTo(
            loadBalancer.metadata?.security_groups?.map(x => {
              return {
                value: x,
                label: x
              }
            }),
            []
          ),
          machine_type: _defaultTo(
            loadBalancer.metadata?.machine_type,
            machinesData?.response?.find(m => m.is_default)?.name
          ),
          subnet_name: loadBalancer.metadata?.subnet_name,
          cert_secret_id: _defaultTo(loadBalancer.metadata?.certificates?.[0]?.cert_secret_id, ''),
          key_secret_id: _defaultTo(loadBalancer.metadata?.certificates?.[0]?.key_secret_id, '')
        }}
        enableReinitialize
        formName="lbFormSecond"
        onSubmit={values => handleSubmit?.(values)}
      >
        {({ submitForm, setFieldValue, values }) => (
          <FormikForm>
            <Layout.Horizontal className={css.formFieldRow}>
              <FormInput.Select
                name="region"
                label={getString('regionLabel')}
                placeholder={getString('pipeline.regionPlaceholder')}
                items={regionOptions}
                onChange={item => {
                  setSelectedRegion(item.value as string)
                }}
                disabled={isEditMode ? !editableFieldsMap['region'] : regionsLoading}
              />
              <FormInput.Select
                name="zone"
                label={getString('ce.co.accessPoint.zone')}
                placeholder={getString('ce.co.accessPoint.select.zone')}
                items={zonesOptions}
                onChange={item => {
                  setSelectedZone(item.value as string)
                }}
                disabled={isEditMode ? !editableFieldsMap['zone'] : zonesLoading}
              />
            </Layout.Horizontal>
            <Layout.Horizontal className={css.formFieldRow}>
              <FormInput.Select
                name="vpc"
                label={getString('ce.co.accessPoint.vpcLabel')}
                placeholder={getString('ce.co.accessPoint.select.vpc')}
                items={vpcOptions}
                onChange={e => {
                  setFieldValue('vpc', e.value)
                  setSelectedVpc(e.value as string)
                }}
                disabled={isEditMode ? !editableFieldsMap['vpc'] : vpcsLoading}
              />
              <FormInput.MultiSelect
                name="securityGroups"
                label={getString('ce.co.accessPoint.securityGroupsLabel')}
                placeholder={getString('ce.co.accessPoint.select.securityGroups')}
                multiSelectProps={{
                  itemRender: (_item, { handleClick }) => (
                    <Menu.Item
                      key={_item.label}
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        padding: '5px 10px'
                      }}
                      onClick={handleClick}
                      text={_item.label}
                    />
                  )
                }}
                items={sgOptions}
                disabled={isEditMode ? !editableFieldsMap['securityGroups'] : sgsLoading}
              />
            </Layout.Horizontal>
            <Layout.Horizontal className={css.formFieldRow}>
              <FormInput.Select
                label={getString('ce.co.accessPoint.subnet')}
                placeholder={getString('ce.co.accessPoint.select.subnet')}
                name="subnet_name"
                items={subnetOptions}
                disabled={isEditMode ? !editableFieldsMap['subnet_name'] : subnetsLoading}
              />
              <FormInput.Select
                name="machine_type"
                label={getString('ce.co.accessPoint.machineType')}
                placeholder={getString('ce.co.accessPoint.select.machineType')}
                items={machineTypesOptions}
                disabled={isEditMode ? !editableFieldsMap['machine_type'] : machinesLoading}
              />
            </Layout.Horizontal>
            <Layout.Horizontal className={css.formFieldRow}>
              <FormInput.Text
                name="cert_secret_id"
                label={getString('ce.co.accessPoint.gcpCertificateId')}
                tooltipProps={{ dataTooltipId: 'tlsCertificateSecretId' }}
                placeholder={getString('ce.co.accessPoint.gcpCertificatePlaceholder')}
              />
              <FormInput.Text
                name="key_secret_id"
                label={getString('ce.co.accessPoint.gcpSecretId')}
                tooltipProps={{ dataTooltipId: 'tlsPrivateKeySecretId' }}
                placeholder={getString('ce.co.accessPoint.gcpSecretPlaceholder')}
              />
            </Layout.Horizontal>
            <Layout.Horizontal style={{ marginTop: 220 }}>
              <Button
                text={'Back'}
                icon={'chevron-left'}
                onClick={() => handlePreviousClick(values)}
                data-testid="previousButton"
                style={{ marginRight: 'var(--spacing-large)' }}
              ></Button>
              {isSaving && <Icon name="spinner" size={24} color="blue500" style={{ alignSelf: 'center' }} />}
              {!isSaving && (
                <Button
                  intent="primary"
                  text={'Save Load Balancer'}
                  onClick={submitForm}
                  disabled={!selectedRegion && !selectedVpc && _isEmpty(loadBalancer.metadata?.security_groups)}
                ></Button>
              )}
            </Layout.Horizontal>
          </FormikForm>
        )}
      </Formik>
    </Container>
  )
}

export default GCPAccessPointForm
