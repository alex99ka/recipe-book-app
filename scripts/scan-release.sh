#!/usr/bin/env bash
# Fails if a release file (APK or zip) carries anything secret-shaped.
# The repo and its releases are public, so this runs before anything is published.
# Usage: scripts/scan-release.sh <file>...   (run from the repo root)
set -euo pipefail

# The Firebase API keys are public by design; these are the only ones allowed.
allowed=$(grep -ohE 'AIza[0-9A-Za-z_-]{35}' src/environments/environment.ts google-services.json | sort -u)
[ -n "$allowed" ] || { echo "no known Firebase keys found to allow" >&2; exit 1; }

status=0
for file in "$@"; do
  dir=$(mktemp -d)
  unzip -qq -o "$file" -d "$dir"

  bad_files=$(find "$dir" \( -name '.env*' -o -name '*.jks' -o -name '*.keystore' -o -name '*.p12' \
    -o -name 'service-account*.json' \) -print)
  if [ -n "$bad_files" ]; then
    echo "::error::$file contains files that must never ship:"; echo "$bad_files"; status=1
  fi

  # -a: dex and resources are binary, but strings in them are still plain bytes.
  if grep -raloE 'sk-ant-[0-9A-Za-z_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY|"private_key"|"type": *"service_account"|ghp_[0-9A-Za-z]{30,}|github_pat_[0-9A-Za-z_]{30,}' "$dir"; then
    echo "::error::$file contains a secret-shaped string (files above)"; status=1
  fi

  unknown=$(grep -raohE 'AIza[0-9A-Za-z_-]{35}' "$dir" | sort -u | grep -vxF "$allowed" || true)
  if [ -n "$unknown" ]; then
    echo "::error::$file contains a Google API key that is not one of the known public Firebase keys"; status=1
  fi

  rm -rf "$dir"
  [ $status -eq 0 ] && echo "clean: $file"
done
exit $status
