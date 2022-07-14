#!/bin/bash
# Copyright 2022 Harness Inc. All rights reserved.
# Use of this source code is governed by the PolyForm Shield 1.0.0 license
# that can be found in the licenses directory at the root of this repository, also available at
# https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.

set +e

PROJECTS="ART|BT|CCE|CCM|CDS|CE|CI|COMP|CV|CVNG|DEL|DOC|DX|ER|FFM|OPA|OPS|PIP|PL|SEC|STO|SWAT|GTM|ONP|PIE|LWG|CHAOS"

KEY=`echo "${ghprbPullTitle}" | grep -o -iE "\[(${PROJECTS})-[0-9]+]:" | grep -o -iE "(${PROJECTS})-[0-9]+"`

echo "${ghprbPullTitle}"
echo $KEY

jira_response=`curl -X GET -H "Content-Type: application/json" https://harness.atlassian.net/rest/api/2/issue/${KEY}?fields=issuetype,customfield_10687,customfield_10709,customfield_10748,customfield_10763,customfield_10785 --user $JIRA_USERNAME:$JIRA_PASSWORD`

issuetype=`echo "${jira_response}" | jq ".fields.issuetype.name" | tr -d '"'`
bug_resolution=`echo "${jira_response}" | jq ".fields.customfield_10687" | tr -d '"'`
jira_resolved_as=`echo "${jira_response}" | jq ".fields.customfield_10709" | tr -d '"'`
phase_injected=`echo "${jira_response}" | jq ".fields.customfield_10748" | tr -d '"'`
what_changed=`echo "${jira_response}" | jq ".fields.customfield_10763" | tr -d '"'`
ff_added=`echo "${jira_response}" | jq ".fields.customfield_10785.value" | tr -d '"'`

echo "issueType is ${issuetype}"

if [[ "${issuetype}" = "Bug" && ( "${bug_resolution}" = "" || "${jira_resolved_as}" = "null" || "${phase_injected}" = "null" || "${what_changed}" = "null" ) ]]
then
      if [[ -z ${bug_resolution} ]]
      then
        echo "bug resolution is empty"
      fi

      if [[ "${jira_resolved_as}" = "null" ]]
      then
        echo "jira resolved is not selected"
      fi

      if [[ "${phase_injected}" = "null" ]]
      then
        echo "phase_injected is not selected"
      fi

      if [[ "${what_changed}" = "null" ]]
      then
        echo "what_changed is not updated"
      fi
      exit 1
fi

if [[ "${issuetype}" = "Story" && ( "${ff_added}" = "null" || "${what_changed}" = "null" ) ]]
then
      if [[ "${ff_added}" = "null" ]]
      then
        echo "FF added is not updated, Please update FF added to proceed"
      fi
      if [[ "${what_changed}" = "null" ]]
      then
        echo "what_changed is not updated"
      fi
      exit 1
fi
