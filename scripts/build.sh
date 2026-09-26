#!/usr/bin/env bash
set -euo pipefail

project_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
dist_root="$project_root/dist"

python3 "$project_root/tools/build_worker.py"

rm -rf "$dist_root"
mkdir -p "$dist_root/server"
cp "$project_root/worker/index.js" "$dist_root/server/index.js"
if [[ -f "$project_root/.openai/hosting.json" ]]; then
  mkdir -p "$dist_root/.openai"
  cp "$project_root/.openai/hosting.json" "$dist_root/.openai/hosting.json"
fi

echo "Built $dist_root"
