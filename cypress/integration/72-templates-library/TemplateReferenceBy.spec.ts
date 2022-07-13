/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { templatesListRoute, gitSyncEnabledCall, templatesListCall, templatesListCallWithListType, templateReferencesCall } from '../../support/70-pipeline/constants'

describe('Template Reference By', () => {



    beforeEach(() => {
        cy.on('uncaught:exception', () => {
            // returning false here prevents Cypress from
            // failing the test
            return false
        })
        cy.intercept('GET', gitSyncEnabledCall, { connectivityMode: null, gitSyncEnabled: false })
        cy.intercept('POST', templatesListCall, { fixture: 'template/api/templatesList' }).as('templatesListCall')
        cy.intercept('POST', templatesListCallWithListType, { fixture: 'template/api/templatesList' }).as('templatesListCallForDrawer')
        cy.initializeRoute()
        cy.visit(templatesListRoute, {
            timeout: 30000
        })
        cy.wait(2000)
        cy.visitPageAssertion('[class*=TemplatesPage-module_pageBody]')
        cy.wait('@templatesListCall', { timeout: 10000 })

        cy.contains('p', 'Cypress Template Example 1').click()

        cy.wait('@templatesListCallForDrawer', { timeout: 10000 })
        cy.get('div[data-tab-id="INPUTS"]').should('be.visible')
        cy.get('div[data-tab-id="YAML"]').should('be.visible')
        cy.get('div[data-tab-id="REFERENCEDBY"]').should('be.visible').click()
    })

    it('when no references are present', () => {
        cy.wait(2000)
        cy.get('[data-icon="nav-project"]').should('be.visible')
        cy.contains('p', 'No references found').should('be.visible')
    })

    it('when pipeline and template references are present', () => {
        cy.intercept('GET', templateReferencesCall, { fixture: 'ng/api/entitySetupUsageV2' }).as('templateReferencesCall')
        cy.wait('@templateReferencesCall', { timeout: 10000 })
        cy.contains('p', 'stage temp (v34)').should('be.visible')
        cy.contains('p', 'Template').should('be.visible')
        cy.contains('p', 'pipeline temp latest (32)').should('be.visible')
        cy.contains('p', 'original pipeline').should('be.visible')
        cy.contains('p', 'Pipelines').should('be.visible')
    })

})
