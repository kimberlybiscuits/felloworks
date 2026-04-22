#!/bin/bash
# Scan frontend/ for hardcoded secrets before a git commit.
# Blocks if anything suspicious is found.

RESULTS=$(grep -rn \
  -e "SERVICE_ROLE" \
  -e "service_role" \
  -e "sk_live" \
  -e "sk_test" \
  -e "PRIVATE_KEY" \
  -e "private_key" \
  --include="*.js" --include="*.html" --include="*.css" \
  /home/kim/projects/felloworks/frontend/ 2>/dev/null)

if [ -n "$RESULTS" ]; then
  echo "$RESULTS" >&2
  echo '{"decision":"block","reason":"Potential secret found in frontend/ — review before committing.","systemMessage":"⚠️  Secret scan blocked the commit. Check the output above."}'
  exit 2
fi

exit 0
