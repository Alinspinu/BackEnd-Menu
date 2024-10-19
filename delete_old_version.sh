#!/bin/bash

# Get the first 200 versions sorted by creation time
VERSIONS_TO_DELETE=$(gcloud app versions list --format="value(id)" --sort-by="createTime" | head -n 200)

# Check if there are versions to delete
if [ -n "$VERSIONS_TO_DELETE" ]; then
  # Delete the first 200 versions
  for VERSION in $VERSIONS_TO_DELETE; 
  do 
    echo "Deleting version: $VERSION"
    gcloud app versions delete $VERSION --quiet
  done
else
  echo "No versions to delete."
fi
