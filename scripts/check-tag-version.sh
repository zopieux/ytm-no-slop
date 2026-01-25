#!/usr/bin/env bash
# Check if a tag is being pushed and verify it matches package.json version

# Read lines from stdin
while read local_ref local_sha remote_ref remote_sha
do
  # Check if we are pushing a tag
  if echo "$remote_ref" | grep -q "refs/tags/"; then
    TAG_NAME=${remote_ref#refs/tags/}
    
    # Remove 'v' prefix if present for version comparison
    VERSION_FROM_TAG=${TAG_NAME#v}
    
    # Read version from package.json
    VERSION_FROM_PKG=$(jq -r .version package.json)
    
    if [ "$VERSION_FROM_TAG" != "$VERSION_FROM_PKG" ]; then
      echo "Error: Tag version ($TAG_NAME) does not match package.json version ($VERSION_FROM_PKG)."
      exit 1
    fi
    
    echo "Success: Tag version ($TAG_NAME) matches package.json version."
  fi
done

exit 0
