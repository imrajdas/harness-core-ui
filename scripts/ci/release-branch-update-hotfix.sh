# Copyright 2022 Harness Inc. All rights reserved.
# Use of this source code is governed by the PolyForm Shield 1.0.0 license
# that can be found in the licenses directory at the root of this repository, also available at
# https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.

KEYS=`git log --pretty=oneline --abbrev-commit |\
      awk "/${PREVIOUS_CUT_COMMIT_MESSAGE}/ {exit} {print}" |\
      grep -o -iE '(ART|BT|CCE|CCM|CDS|CE|CI|COMP|CV|CVNG|DEL|DOC|DX|ER|FFM|OPS|OPA|PIP|PL|SEC|STO|SWAT|GTM|ONP|PIE|LWG|CHAOS)-[0-9]+' | sort | uniq`


LABEL="HOTFIX"

if [ "${PURPOSE}" = "ui" ]
then
    LABEL="NG_UI_SAAS_HOTFIX"
    FIELD_ID="customfield_10645"
    # This hotfix field need to be updated with new NG UI hotfix field Id.
    HOTFIX_FIELD="customfield_10774"
elif [ "${PURPOSE}" = "ui-on-prem" ]
then
    LABEL="NG_UI_ONPREM_HOTFIX"
    FIELD_ID="customfield_10647"
    # This hotfix field need to be updated with new NG UI hotfix field Id.
    HOTFIX_FIELD="customfield_10776"
else
   echo "Unknown purpose ${PURPOSE}"
   exit 1
fi

echo $KEYS

echo $LABEL


for KEY in ${KEYS}
do
    echo $KEY
    curl \
       -X PUT \
	--data "{ \"update\": { \"labels\": [ {\"add\": \"${LABEL}\"} ] }, \"fields\" : { \"${FIELD_ID}\" : \"${VERSION}\", \"${HOTFIX_FIELD}\" : \"${VERSION}\" } }" \
	-H "Content-Type: application/json" \
       https://harness.atlassian.net/rest/api/2/issue/${KEY} \
       --user $JIRA_USERNAME:$JIRA_PASSWORD
done
