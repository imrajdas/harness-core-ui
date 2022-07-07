# Copyright 2022 Harness Inc. All rights reserved.
# Use of this source code is governed by the PolyForm Shield 1.0.0 license
# that can be found in the licenses directory at the root of this repository, also available at
# https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.

export BRANCH=develop
git checkout $BRANCH

# bump minor version (0.1.0 -> 0.2.0)
yarn version --minor --no-git-tag-version --no-commit-hooks
git add package.json

# get branch name (0.2.0 -> 0.2.x)
export NEW_VERSION=$(cat package.json | grep version | cut -d: -f2 | cut -d\" -f2 | cut -d. -f1,2).x
echo $NEW_VERSION

NEW_BRANCH="release/$NEW_VERSION"
echo $NEW_BRANCH

# updating the jira tickets
chmod 700 scripts/ci/*.*
scripts/ci/release-branch-update-jiras.sh

# commit to develop
git commit -nm "Branching to $NEW_BRANCH"
git push origin develop
export COMMIT_ID_FOR_NEW_VERSION=`git rev-parse HEAD`

# create release branch
git checkout master
git checkout -b $NEW_BRANCH
git cherry-pick ${COMMIT_ID_FOR_NEW_VERSION} --strategy-option theirs
git push origin $NEW_BRANCH
