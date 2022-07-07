/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { ACRArtifactSource } from '@cd/components/PipelineSteps/K8sServiceSpec/ArtifactSource/ACRArtifactSource/ACRArtifactSource'
import { AmazonS3ArtifactSource } from '@cd/components/PipelineSteps/K8sServiceSpec/ArtifactSource/AmazonS3ArtifactSource/AmazonS3ArtifactSource'
import { ArtifactoryArtifactSource } from '@cd/components/PipelineSteps/K8sServiceSpec/ArtifactSource/ArtifactoryArtifactSource/ArtifactoryArtifactSource'
import { CustomArtifactSource } from '@cd/components/PipelineSteps/K8sServiceSpec/ArtifactSource/CustomArtifactSource/CustomArtifactSource'
import { DockerArtifactSource } from '@cd/components/PipelineSteps/K8sServiceSpec/ArtifactSource/DockerArtifactSource/DockerArtifactSource'
import { ECRArtifactSource } from '@cd/components/PipelineSteps/K8sServiceSpec/ArtifactSource/ECRArtifactSource/ECRArtifactSource'
import { GCRArtifactSource } from '@cd/components/PipelineSteps/K8sServiceSpec/ArtifactSource/GCRArtifactSource/GCRArtifactSource'
import { NexusArtifactSource } from '@cd/components/PipelineSteps/K8sServiceSpec/ArtifactSource/NexusArtifactSource/NexusArtifactSource'
import type { ArtifactSourceBase } from './ArtifactSourceBase'

export class ArtifactSourceBaseFactory {
  protected artifactSourceDict: Map<string, ArtifactSourceBase<unknown>>

  constructor() {
    this.artifactSourceDict = new Map()
  }

  getArtifactSource<T>(artifactSourceType: string): ArtifactSourceBase<T> | undefined {
    if (artifactSourceType) {
      return this.artifactSourceDict.get(artifactSourceType) as ArtifactSourceBase<T>
    }
  }

  registerArtifactSource<T>(artifactSource: ArtifactSourceBase<T>): void {
    this.artifactSourceDict.set(artifactSource.getArtifactSourceType(), artifactSource)
  }

  deRegisterArtifactSource(artifactSourceType: string): void {
    this.artifactSourceDict.delete(artifactSourceType)
  }
}

const artifactSourceBaseFactory = new ArtifactSourceBaseFactory()
artifactSourceBaseFactory.registerArtifactSource(new DockerArtifactSource())
artifactSourceBaseFactory.registerArtifactSource(new GCRArtifactSource())
artifactSourceBaseFactory.registerArtifactSource(new ECRArtifactSource())
artifactSourceBaseFactory.registerArtifactSource(new NexusArtifactSource())
artifactSourceBaseFactory.registerArtifactSource(new ArtifactoryArtifactSource())
artifactSourceBaseFactory.registerArtifactSource(new CustomArtifactSource())
artifactSourceBaseFactory.registerArtifactSource(new ACRArtifactSource())
artifactSourceBaseFactory.registerArtifactSource(new AmazonS3ArtifactSource())
export default artifactSourceBaseFactory
