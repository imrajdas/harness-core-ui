/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import {
  accountId,
  executionHistoryRoute,
  executionMetadata,
  orgIdentifier,
  pipelineExecutionCall,
  pipelineExecutionSummaryAPI,
  pipelineHealthCall,
  pipelineIdentifier,
  pipelineSummaryCallAPI,
  projectId
} from '../../support/70-pipeline/constants'

describe('Pipeline Execution History', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.initializeRoute()
    cy.visit(executionHistoryRoute, {
      timeout: 30000
    })
  })

  it('loads a pipeline with no executions', () => {
    cy.visitPageAssertion()
    cy.findByText('There are no deployments in your project').should('exist')
    cy.findByText('Your Pipeline does not have any executions yet. Click the button below to run a pipeline.').should(
      'exist'
    )
    cy.findByText('Run a Pipeline').should('exist').click()
    cy.get('.RunPipelineForm-module_footer_BfhlT2').within(() => {
      cy.findByText('Run Pipeline').should('exist')
      cy.findByText('Cancel').should('exist')
    })
    cy.get('.RunPipelineForm-module_crossIcon__wWY4s').click()
  })

  // Toolbar
  it('interacts with page subheader toolbar', () => {
    // Fixtures
    cy.intercept(pipelineSummaryCallAPI, {
      fixture: 'pipeline/api/executionHistory/executionSummary.json'
    }).as('executionSummary')

    cy.intercept(pipelineExecutionSummaryAPI, {
      fixture: 'pipeline/api/executionHistory/executionSummary.json'
    }).as('executionSummary')
    cy.visitPageAssertion()
    // Check Run button in header
    cy.wait(1000)
    cy.get('.PageSubHeader--container')
      .should('be.visible')
      .within(() => {
        cy.findByText('Run').click()
      })
    cy.get('.RunPipelineForm-module_footer_BfhlT2').within(() => {
      cy.findByText('Run Pipeline').should('exist')
      cy.findByText('Cancel').should('exist')
    })
    cy.get('.RunPipelineForm-module_crossIcon__wWY4s').click()

    // Check my deployments
    cy.get('.PageSubHeader--container').within(() => {
      cy.get('input[type=checkbox]').should('not.be.checked')
      cy.findByText('My Deployments').click()
      cy.get('input[type=checkbox]').should('be.checked')
      cy.url().should('contain', 'myDeployments=true')
      cy.findByText('My Deployments').click()
      cy.url().should('not.contain', 'myDeployments=true')
    })

    // Check status
    cy.get('.PageSubHeader--container').within(() => {
      cy.findByText('Status').click()
    })

    cy.get('.bp3-menu > :nth-child(1)')
      .should('contain', 'Aborted')
      .click()
      .url({ decode: true })
      .should('contain', 'status[0]=Aborted')

    cy.get('.bp3-menu > :nth-child(2)')
      .should('contain', 'Expired')
      .click()
      .url({ decode: true })
      .should('contain', 'status[1]=Expired')

    cy.get('.bp3-menu > :nth-child(3)')
      .should('contain', 'Failed')
      .click()
      .url({ decode: true })
      .should('contain', 'status[2]=Failed')

    cy.get('.bp3-menu > :nth-child(4)')
      .should('contain', 'Running')
      .click()
      .url({ decode: true })
      .should('contain', 'status[3]=Running')

    cy.get('.bp3-menu > :nth-child(5)')
      .should('contain', 'Success')
      .click()
      .url({ decode: true })
      .should('contain', 'status[4]=Success')

    cy.get('.bp3-menu > :nth-child(6)')
      .should('contain', 'Approval Rejected')
      .click()
      .url({ decode: true })
      .should('contain', 'status[5]=ApprovalRejected')

    cy.get('.MultiSelectDropDown--counter').should('contain', 6)

    cy.get('.bp3-menu > :nth-child(7)')
      .should('contain', 'Paused')
      .click()
      .url({ decode: true })
      .should('contain', 'status[6]=Paused')

    cy.get('.bp3-menu > :nth-child(8)')
      .should('contain', 'Waiting on approval')
      .click()
      .url({ decode: true })
      .should('contain', 'status[7]=ApprovalWaiting')

    cy.get('.bp3-menu > :nth-child(9)')
      .should('contain', 'Waiting on intervention')
      .click()
      .url({ decode: true })
      .should('contain', 'status[8]=InterventionWaiting')

    cy.get('.bp3-menu > :nth-child(10)')
      .should('contain', 'Waiting for resources')
      .click()
      .url({ decode: true })
      .should('contain', 'status[9]=ResourceWaiting')

    cy.get('.MultiSelectDropDown--counter').should('contain', 10)
    cy.get('body').click(0, 0)

    // Check search
    cy.get('input[type=search]').type('test_search')
    cy.url().should('contain', 'searchTerm=test_search')
    cy.get('.ExpandingSearchInput--btnWrapper > .bp3-button').click()
    cy.get('input[type=search]').should('be.empty')
  })

  // Execution Health
  it('shows pipeline health metris', () => {
    // Fixtures
    cy.intercept('GET', pipelineHealthCall, {
      fixture: 'pipeline/api/executionHistory/pipelineHealth.json'
    }).as('pipelineHealth')

    cy.visitPageAssertion()
    cy.get('[class*=PipelineDeploymentList-module_healthAndExecutions] > :nth-child(1)').within(() => {
      cy.findByText('Pipeline health').should('exist')
      cy.findByText('Last 30 days').click()
      cy.findByText('Last 60 days').click({ force: true })
      cy.findByText('Last 60 days').click()
      cy.findByText('Last 7 days').click({ force: true })

      cy.get('[class*=PipelineSummaryCards] > :nth-child(1)').within(() => {
        cy.findByText('Total Executions').should('exist')
        cy.get('[class*=CIDashboardSummaryCards-module_contentMainText]').should('contain.text', '5952')
      })

      cy.get('[class*=PipelineSummaryCards] > :nth-child(2)').within(() => {
        cy.findByText('Success Rate').should('exist')
        cy.get('[class*=CIDashboardSummaryCards-module_contentMainText]').should('contain.text', '0%')
      })

      cy.get('[class*=PipelineSummaryCards] > :nth-child(3)').within(() => {
        cy.findByText('Mean Duration').should('exist')
        cy.get('[class*=CIDashboardSummaryCards-module_contentMainText]').should('contain.text', '14s')
      })

      cy.get('[class*=PipelineSummaryCards] > :nth-child(4)').within(() => {
        cy.findByText('Median Duration').should('exist')
        cy.get('[class*=CIDashboardSummaryCards-module_contentMainText]').should('contain.text', '12s')
      })
    })
  })

  // Executions Chart
  it('shows pipeline executions chart', () => {
    // Fixtures
    cy.intercept(pipelineExecutionCall, {
      fixture: 'pipeline/api/executionHistory/pipelineExecution.json'
    }).as('pipelineExecution')

    cy.visitPageAssertion()
    cy.get('[class*=PipelineDeploymentList-module_healthAndExecutions] > :nth-child(2)').within(() => {
      cy.findByText('Executions').should('exist')
      cy.findByText('# of executions').should('exist')
      cy.findByText('Date').should('exist')
      cy.findByText('Successful').should('exist')
      cy.findByText('Failed').should('exist')
      cy.findByText('Aborted').should('exist')
      cy.findByText('Expired').should('exist')

      cy.get('.highcharts-series.highcharts-series-2 > [x="327.5"]').should('exist')
      cy.get('.highcharts-series.highcharts-series-2 > [x="464.5"]').should('exist')
      cy.get('.highcharts-series.highcharts-series-1 > [x="464.5"]').should('exist')
      cy.get('.highcharts-series.highcharts-series-1 > [x="487.5"]').should('exist')
      cy.get('.highcharts-series.highcharts-series-1 > [x="578.5"]').should('exist')
    })
  })

  // Execution List
  it('loads successful, aborted and failed pipelines', () => {
    // Fixtures
    cy.intercept('GET', pipelineSummaryCallAPI, {
      fixture: 'pipeline/api/executionHistory/executionSummary.json'
    }).as('executionSummary')

    cy.intercept('POST', pipelineExecutionSummaryAPI, {
      fixture: 'pipeline/api/executionHistory/executionSummary.json'
    }).as('executionSummary')
    cy.visitPageAssertion()

    // Check various status
    // Success
    cy.get('[class^=ExecutionList]').children().should('have.length', 3)
    cy.get('[class^=ExecutionList] > :nth-child(1)').within(() => {
      cy.findByText('SUCCESS').should('exist')
      cy.findByText('Duration: 11s').should('exist')
      cy.findByText('John Doe').should('exist')

      cy.get('[class^=ExecutionActions]').click()
    })
    cy.findByText('Retry Failed Pipeline').should('not.exist')
    cy.get('body').type('{esc}')
    cy.get('[class^=ExecutionList] > :nth-child(1)').click()
    cy.url().should(
      'contain',
      `account/${accountId}/cd/orgs/${orgIdentifier}/projects/${projectId}/pipelines/${pipelineIdentifier}/executions/jDwNFYhgT2KTW_zVDZdhHg/pipeline`
    )
    cy.go('back')

    // Aborted
    cy.get('[class^=ExecutionList] > :nth-child(2)').within(() => {
      cy.findByText('ABORTED').should('exist')
      cy.findByText('Duration: 8s').should('exist')
      cy.findByText('John Doe').should('exist')

      cy.get('[class^=ExecutionActions]').click()
    })
    cy.findByText('Retry Failed Pipeline').should('exist')
    cy.get('body').type('{esc}')
    cy.get('[class^=ExecutionList] > :nth-child(2)').click()
    cy.url().should(
      'contain',
      `account/${accountId}/cd/orgs/${orgIdentifier}/projects/${projectId}/pipelines/${pipelineIdentifier}/executions/2BNrdFYSTCKTcVXlLnhP7Q/pipeline`
    )
    cy.go('back')

    // Failed
    cy.get('[class^=ExecutionList] > :nth-child(3)').within(() => {
      cy.findByText('FAILED').should('exist')
      cy.findByText('Duration: 41s').should('exist')
      cy.findByText('John Doe').should('exist')
      cy.findByText('Services deployed (1)').should('exist')
      cy.findByText('Environments (1)').should('exist')

      cy.get('[class^=ExecutionActions]').click()
    })
    cy.findByText('Retry Failed Pipeline').should('exist')
    cy.get('body').type('{esc}')
    cy.get('[class^=ExecutionList] > :nth-child(3)').click()
    cy.url().should(
      'contain',
      `account/${accountId}/cd/orgs/${orgIdentifier}/projects/${projectId}/pipelines/${pipelineIdentifier}/executions/og6igi2RRcWUVLPqUUeAHQ/pipeline`
    )
    cy.go('back')
  })

  it('Compare various executions', () => {
    cy.intercept('GET', pipelineSummaryCallAPI, {
      fixture: 'pipeline/api/executionHistory/executionSummary.json'
    }).as('executionSummary')
    cy.intercept('POST', pipelineExecutionSummaryAPI, {
      fixture: 'pipeline/api/executionHistory/executionSummary.json'
    }).as('executionListSummary')
    cy.intercept('GET', executionMetadata, {
      fixture: 'pipeline/api/pipelineExecution/executionMetadata.json'
    }).as('executionMetadata')

    cy.visitPageAssertion()
    cy.wait('@executionListSummary')
    cy.findAllByRole('button', {
      name: /more/i
    })
      .first()
      .click()
    cy.findByText('Compare Executions').click()
    cy.findByRole('button', {
      name: /compare/i
    }).should('be.disabled')
    cy.findAllByRole('checkbox').eq(1).click({ force: true })
    cy.findByRole('button', {
      name: /compare/i
    }).click()
    cy.wait('@executionMetadata')
    cy.findAllByRole('heading', { name: 'testPipeline_Cypress' }).should('have.length', 2)
  })
})
