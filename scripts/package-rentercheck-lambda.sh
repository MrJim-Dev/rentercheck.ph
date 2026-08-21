#!/bin/sh
set -eu

repository_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
package_path=${RENTERCHECK_WEB_PACKAGE:-/private/tmp/rentercheck-web-lambda.zip}

if [ -e "$package_path" ]; then
  echo "Refusing to overwrite existing package: $package_path" >&2
  exit 1
fi

: "${NEXT_PUBLIC_SITE_URL:?NEXT_PUBLIC_SITE_URL is required for the production build}"
: "${NEXT_PUBLIC_MRJIM_AUTH_URL:?NEXT_PUBLIC_MRJIM_AUTH_URL is required for the production build}"
: "${NEXT_PUBLIC_MRJIM_AUTH_PUBLISHABLE_KEY:?NEXT_PUBLIC_MRJIM_AUTH_PUBLISHABLE_KEY is required for the production build}"
: "${NEXT_SERVER_ACTIONS_ENCRYPTION_KEY:?NEXT_SERVER_ACTIONS_ENCRYPTION_KEY is required for the production build}"

cd "$repository_root"
if [ -z "${NEXT_DEPLOYMENT_ID:-}" ]; then
  NEXT_DEPLOYMENT_ID=$(git rev-parse --verify HEAD | cut -c1-32)
  export NEXT_DEPLOYMENT_ID
fi

pnpm install --frozen-lockfile
pnpm build
pnpm exec esbuild infra/rentercheck/lambda/start.mjs \
  --bundle \
  --format=esm \
  --platform=node \
  --main-fields=module,main \
  --outfile=.next/standalone/start.mjs

cp infra/rentercheck/lambda/run.sh .next/standalone/run.sh
chmod +x .next/standalone/run.sh
mkdir -p .next/standalone/.next/static .next/standalone/public
cp -R .next/static/. .next/standalone/.next/static/
cp -R public/. .next/standalone/public/

sharp_runtime=$(find .next/standalone/node_modules -path '*/@img/sharp-linux-arm64/lib/sharp-linux-arm64.node' -print -quit)
if [ -z "$sharp_runtime" ]; then
  echo "The Linux arm64 sharp runtime was not traced into the standalone artifact" >&2
  exit 1
fi

sharp_libvips_runtime=$(find .next/standalone/node_modules -path '*/@img/sharp-libvips-linux-arm64/lib/libvips-cpp.so.*' -print -quit)
if [ -z "$sharp_libvips_runtime" ]; then
  echo "The Linux arm64 sharp libvips runtime was not traced into the standalone artifact" >&2
  exit 1
fi

argon2_source=$(find node_modules/.pnpm -path '*/argon2/prebuilds/linux-arm64/argon2.armv8.glibc.node' -print -quit)
argon2_target=$(find .next/standalone/node_modules -path '*/argon2' -type d -print -quit)
if [ -z "$argon2_source" ] || [ -z "$argon2_target" ]; then
  echo "The Linux arm64 argon2 runtime was not found in the standalone artifact" >&2
  exit 1
fi
mkdir -p "$argon2_target/prebuilds/linux-arm64"
cp "$argon2_source" "$argon2_target/prebuilds/linux-arm64/argon2.armv8.glibc.node"

(cd .next/standalone && zip -qyr "$package_path" .)
echo "$package_path"
