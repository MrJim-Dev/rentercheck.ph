#!/bin/sh
set -eu

repository_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
package_path=${RENTERCHECK_MIGRATION_PACKAGE:-/private/tmp/rentercheck-migration.zip}

if [ -e "$package_path" ]; then
  echo "Refusing to overwrite existing package: $package_path" >&2
  exit 1
fi

cd "$repository_root/infra/rentercheck/migration"
pnpm install --prod --lockfile=false
(cd "$repository_root/infra/rentercheck/migration" && zip -qyr "$package_path" handler.mjs package.json node_modules)
(cd "$repository_root/infra/rentercheck" && zip -q "$package_path" schema.sql)
echo "$package_path"
