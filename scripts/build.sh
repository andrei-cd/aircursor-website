#!/usr/bin/env bash

set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_dir="$project_dir/dist"

rm -rf "$output_dir"
mkdir -p "$output_dir"

cp "$project_dir/index.html" "$output_dir/"
cp "$project_dir/404.html" "$output_dir/"
cp -R "$project_dir/assets" "$output_dir/"
cp -R "$project_dir/feedback" "$output_dir/"
cp -R "$project_dir/privacy" "$output_dir/"
cp -R "$project_dir/support" "$output_dir/"

if [[ -f "$project_dir/_headers" ]]; then
  cp "$project_dir/_headers" "$output_dir/"
fi

if [[ -f "$project_dir/_redirects" ]]; then
  cp "$project_dir/_redirects" "$output_dir/"
fi

echo "Built static site in $output_dir"

