# Copyright 2022 Harness Inc. All rights reserved.
# Use of this source code is governed by the PolyForm Shield 1.0.0 license
# that can be found in the licenses directory at the root of this repository, also available at
# https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.

# ------ from Commit List => extract JIRA Tickets
# [(CCM|CD|CE|DOC|ER|HAR|LE|PL|SEC|SWAT|UI|DX)-[0-9]+]
VERSION=$(cat package.json | grep version | cut -d: -f2 | cut -d\" -f2)
echo $VERSION
KEYS=`git log --pretty=oneline --abbrev-commit | awk "1;/Branching to release\//{exit}" | grep -o -iE '(BT|CCE|CCM|CDS|CE|CI|COMP|CV|CVNG|DEL|DOC|DX|ER|FFM|OPS|OPA|PIE|PL|SEC|STO|SWAT|GTM|ONP|CHAOS)-[0-9]+' | sort | uniq`
echo --- List of JIRA ---
echo $KEYS
echo --- End

# status id 151 is for Dev complete
STATUS_ID=151

if [ ! -z "$STATUS_ID_TO_MOVE" ]
then
      STATUS_ID=$STATUS_ID_TO_MOVE
fi

if [ "${PURPOSE}" = "ui" ]
then
    FIELD_ID="customfield_10787"
elif [ "${PURPOSE}" = "ui-on-prem" ]
then
    FIELD_ID="customfield_10647"
else
   echo "Unknown purpose ${PURPOSE}"
   exit 1
fi
# => add a field to those tickets
for KEY in ${KEYS}
do
    echo Updating JIRA: $KEY
    curl \
       -X PUT \
       --data "{ \"fields\" : { \"${FIELD_ID}\" : \"${VERSION}\" }}" \
       -H "Content-Type: application/json" \
       https://harness.atlassian.net/rest/api/2/issue/${KEY} \
       --user $JIRA_USERNAME:$JIRA_PASSWORD

    status=`curl -X GET -H "Content-Type: application/json" https://harness.atlassian.net/rest/api/2/issue/${KEY}?fields=status --user $JIRA_USERNAME:$JIRA_PASSWORD | jq ".fields.status.name" | tr -d '"'`
    if [[ "${status}" = "QA Test" || "${status}" = "Done" || "${status}" = "Under investigation" ]]
            then
               echo " ${KEY}  is in Done or QA-Test status, Hence no update"
            else
               echo " ${KEY}  is in  ${status} , Hence moving to QA-Test status"
               curl \
                 -X POST \
                --data "{\"transition\":{\"id\":\"${STATUS_ID}\"}}" \
                -H "Content-Type: application/json" \
                https://harness.atlassian.net/rest/api/2/issue/${KEY}/transitions \
                --user $JIRA_USERNAME:$JIRA_PASSWORD
    fi
done
