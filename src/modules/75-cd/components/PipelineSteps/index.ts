/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'

import { AzureInfrastructureSpec } from './AzureInfrastructureStep/AzureInfrastructureStep'
import { HttpStep } from './HttpStep/HttpStep'
import { K8RolloutDeployStep } from './K8sRolloutDeployStep/K8sRolloutDeployStep'
import { ShellScriptStep } from './ShellScriptStep/ShellScriptStep'
import { KubernetesInfraSpec } from './KubernetesInfraSpec/KubernetesInfraSpec'
import { KubernetesServiceSpec } from './K8sServiceSpec/K8sServiceSpec'
import { K8sBlueGreenDeployStep } from './K8sBgStep/K8sBlueGreenDeployStep'
import { K8sCanaryDeployStep } from './K8sCanaryDeploy/K8sCanaryDeployStep'
import { K8sBGSwapServices } from './K8sBGSwapServices/K8sBGSwapServices'
import { K8sScaleStep } from './K8sScale/K8sScaleStep'
import { K8sRollingRollbackStep } from './K8sRollingRollback/K8sRollingRollback'
import { K8sCanaryDeleteStep } from './K8sCanaryDelete/K8sCanaryDeleteStep'
import { K8sApplyStep } from './K8sApply/K8sApplyStep'
import { K8sDeleteStep } from './K8sDelete/K8sDeleteStep'
import { DeployEnvironmentStep } from './DeployEnvStep/DeployEnvStep'
import { DeployInfrastructureStep } from './DeployInfrastructureStep/DeployInfrastructureStep'
import { DeployServiceStep } from './DeployServiceStep/DeployServiceStep'
import { HelmDeploy } from './HelmDeploy/HelmDeploy'
import { HelmRollback } from './HelmRollback/HelmRollback'
import { TerraformRollback } from './TerraformRollback/TerraformRollback'
import { TerraformDestroy } from './TerraformDestroy/TerraformDestroy'
import { TerraformPlan } from './TerraformPlan/TerraformPlan'
import { TerraformApply } from './TerraformApply/TerraformApply'
import { InfraProvisioning } from './InfraProvisioning/InfraProvisioning'
import { GcpInfrastructureSpec } from './GcpInfrastructureSpec/GcpInfrastructureSpec'
import { PDCInfrastructureSpec } from './PDCInfrastructureSpec/PDCInfrastructureSpec'
import { SshWinRmAzureInfrastructureSpec } from './SshWinRmAzureInfrastructureSpec/SshWinRmAzureInfrastructureSpec'
import { PolicyStep } from './PolicyStep/PolicyStep'
import { ServerlessLambdaDeployStep } from './ServerlessLambdaDeploy/ServerlessLambdaDeploy'
import { ServerlessLambdaRollbackStep } from './ServerlessLambdaRollback/ServerlessLambdaRollback'
import { ServerlessAwsLambdaSpec } from './ServerlessAWSLambda/ServerlessAwsLambdaSpec'
import { ServerlessAzureSpec } from './ServerlessAzure/ServerlessAzureSpec'
import { ServerlessGCPSpec } from './ServerlessGCP/ServerlessGCPSpec'
import { ServerlessAwsLambdaServiceSpec } from './ServerlessAwsLambdaServiceSpec/ServerlessAwsLambdaServiceSpec'
import { CFRollbackStack } from './CloudFormation/RollbackStack/RollbackStack'
import { CFDeleteStack } from './CloudFormation/DeleteStack/DeleteStack'
import { CFCreateStack } from './CloudFormation/CreateStack/CreateStack'
import { CreatePr } from './CreatePrStep/CreatePrStep'
import { MergePR } from './MergePrStep/MergePrStep'
import { AzureWebAppRollback } from './AzureWebAppRollback/AzureWebAppRollback'
import { AzureSlotDeployment } from './AzureSlotDeployment/AzureSlotDeployment'
import { AzureTrafficShift } from './AzureTrafficShift/AzureTrafficShift'
import { AzureSwapSlot } from './AzureWebAppSwapSlot/AzureWebAppSwapSlot'

factory.registerStep(new HttpStep())
factory.registerStep(new K8RolloutDeployStep())
factory.registerStep(new K8sRollingRollbackStep())
factory.registerStep(new K8sBlueGreenDeployStep())
factory.registerStep(new K8sCanaryDeployStep())
factory.registerStep(new K8sBGSwapServices())
factory.registerStep(new K8sScaleStep())
factory.registerStep(new K8sCanaryDeleteStep())
factory.registerStep(new K8sApplyStep())
factory.registerStep(new K8sDeleteStep())
factory.registerStep(new ShellScriptStep())
factory.registerStep(new KubernetesInfraSpec())
factory.registerStep(new GcpInfrastructureSpec())
factory.registerStep(new PDCInfrastructureSpec())
factory.registerStep(new SshWinRmAzureInfrastructureSpec())
factory.registerStep(new ServerlessAwsLambdaSpec())
factory.registerStep(new ServerlessAzureSpec())
factory.registerStep(new ServerlessGCPSpec())
factory.registerStep(new DeployEnvironmentStep())
factory.registerStep(new DeployInfrastructureStep())
factory.registerStep(new DeployServiceStep())
factory.registerStep(new KubernetesServiceSpec())
factory.registerStep(new ServerlessAwsLambdaServiceSpec())
factory.registerStep(new HelmDeploy())
factory.registerStep(new HelmRollback())
factory.registerStep(new TerraformRollback())
factory.registerStep(new TerraformDestroy())
factory.registerStep(new TerraformApply())
factory.registerStep(new TerraformPlan())
factory.registerStep(new InfraProvisioning())
factory.registerStep(new PolicyStep())
factory.registerStep(new ServerlessLambdaDeployStep())
factory.registerStep(new ServerlessLambdaRollbackStep())
factory.registerStep(new AzureInfrastructureSpec())
factory.registerStep(new CFRollbackStack())
factory.registerStep(new CFDeleteStack())
factory.registerStep(new CFCreateStack())
factory.registerStep(new CreatePr())
factory.registerStep(new MergePR())
factory.registerStep(new AzureWebAppRollback())
factory.registerStep(new AzureSlotDeployment())
factory.registerStep(new AzureTrafficShift())
factory.registerStep(new AzureSwapSlot())
