#!/usr/bin/env bash
# The public repo (RemoteCommander_publish) holds built npm packages only —
# never source. Every tracked file must match the allowlist below, and every
# binary must really be a compiled executable. Runs locally before a push
# (tools/release/sync-publish.sh) and in the public repo on every push.
#
#   guard.sh [DIR]    DIR = the tree to check (default: current directory)
set -euo pipefail

cd "${1:-.}"
# Exact shapes of what may be published; nothing else
ALLOWED=(
  '^README\.md$'
  '^\.gitattributes$'
  '^\.github/workflows/(guard|release)\.yml$'
  '^\.github/guard\.sh$'
  '^packages/remote-commander/package\.json$'
  '^packages/remote-commander/README\.md$'
  '^packages/remote-commander/bin/remote-commander\.js$'
  '^packages/remote-commander-(win32|darwin|linux)-(x64|arm64)/package\.json$'
  '^packages/remote-commander-(win32)-(x64|arm64)/bin/remote-commander-mcp\.exe$'
  '^packages/remote-commander-(darwin|linux)-(x64|arm64)/bin/remote-commander-mcp$'
)
# The one script shipped as text: the launcher; it must stay small
MAX_LAUNCHER_BYTES=4096
LAUNCHER="packages/remote-commander/bin/remote-commander.js"

fail=0
say() { printf 'guard: %s\n' "$1" >&2; fail=1; }

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  mapfile -t files < <(git ls-files)
else
  mapfile -t files < <(find . -type f -not -path './.git/*' | sed 's#^\./##')
fi
[[ ${#files[@]} -gt 0 ]] || say "nothing to check"

for file in "${files[@]}"; do
  ok=0
  for pattern in "${ALLOWED[@]}"; do
    [[ "$file" =~ $pattern ]] && { ok=1; break; }
  done
  [[ $ok -eq 1 ]] || say "not allowed in the public repo: $file"
done

# Binaries must be compiled executables (PE, ELF, Mach-O), not scripts or text
for file in "${files[@]}"; do
  [[ "$file" == */bin/remote-commander-mcp* ]] || continue
  magic="$(head -c 4 "$file" | od -An -tx1 | tr -d ' \n')"
  case "$magic" in
    4d5a*) ;;                       # PE (MZ)
    7f454c46) ;;                    # ELF
    cffaedfe|cefaedfe|cafebabe) ;;  # Mach-O 64/32, fat
    *) say "not a compiled executable: $file ($magic)" ;;
  esac
done

if [[ -f "$LAUNCHER" ]] && [[ $(wc -c <"$LAUNCHER") -gt $MAX_LAUNCHER_BYTES ]]; then
  say "$LAUNCHER is larger than $MAX_LAUNCHER_BYTES bytes; the launcher only starts the binary"
fi

[[ $fail -eq 0 ]] || exit 1
echo "guard: ${#files[@]} files, all allowed"
