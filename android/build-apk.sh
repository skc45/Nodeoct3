#!/usr/bin/env bash
# Attach the sideload APK for this patch. See android/ATTACHING.md.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT/android"
VERSION_FILE="$ANDROID_DIR/version.properties"
DIST_DIR="$ROOT/dist"
APK_NAME="nodeoct3-ascii.apk"
STABLE_APK="$DIST_DIR/$APK_NAME"
MANIFEST="$DIST_DIR/apk-manifest.txt"
WEB_FILES=(index.html styles.css app.js)

BUMP=0
for arg in "$@"; do
  case "$arg" in
    --bump) BUMP=1 ;;
    --help|-h)
      echo "Usage: android/build-apk.sh [--bump]"
      echo "  --bump  increment versionCode and the last versionName component"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Usage: android/build-apk.sh [--bump]" >&2
      exit 1
      ;;
  esac
done

export ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/android-sdk}}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
if command -v javac >/dev/null 2>&1; then
  export JAVA_HOME="${JAVA_HOME:-$(dirname "$(dirname "$(readlink -f "$(command -v javac)")")")}"
fi

read_prop() {
  sed -n "s/^${1}=//p" "$VERSION_FILE" | tr -d '\r' | tail -n 1
}

bump_version() {
  local code name prefix last
  code="$(read_prop versionCode)"
  name="$(read_prop versionName)"
  if [[ -z "$code" || -z "$name" ]]; then
    echo "Could not read versionCode/versionName from $VERSION_FILE" >&2
    exit 1
  fi
  code=$((code + 1))
  prefix="${name%.*}"
  last="${name##*.}"
  if [[ "$prefix" == "$name" ]]; then
    name=$((10#$name + 1))
  else
    last=$((10#$last + 1))
    name="${prefix}.${last}"
  fi
  printf 'versionCode=%s\nversionName=%s\n' "$code" "$name" > "$VERSION_FILE"
}

if [[ ! -f "$VERSION_FILE" ]]; then
  echo "Missing $VERSION_FILE" >&2
  exit 1
fi

if [[ "$BUMP" -eq 1 ]]; then
  bump_version
  echo "Bumped version to $(read_prop versionName) ($(read_prop versionCode))"
fi

VERSION_CODE="$(read_prop versionCode)"
VERSION_NAME="$(read_prop versionName)"

printf "sdk.dir=%s\n" "$ANDROID_HOME" > "$ANDROID_DIR/local.properties"

cd "$ANDROID_DIR"
./gradlew assembleDebug --no-daemon

mkdir -p "$DIST_DIR"
cp "$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk" "$STABLE_APK"

for file in "${WEB_FILES[@]}"; do
  repo_hash="$(sha256sum "$ROOT/$file" | awk '{print $1}')"
  apk_hash="$(unzip -p "$STABLE_APK" "assets/$file" | sha256sum | awk '{print $1}')"
  if [[ "$repo_hash" != "$apk_hash" ]]; then
    echo "APK asset $file does not match the repo. Refusing to attach." >&2
    exit 1
  fi
done

SHA256="$(sha256sum "$STABLE_APK" | awk '{print $1}')"
GIT_SHA="uncommitted"
if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  GIT_SHA="$(git -C "$ROOT" rev-parse HEAD)"
  if [[ -n "$(git -C "$ROOT" status --porcelain)" ]]; then
    GIT_SHA="${GIT_SHA}+dirty"
  fi
fi

{
  echo "package=com.skc45.nodeoct3"
  echo "appName=ASCII Notes"
  echo "versionCode=$VERSION_CODE"
  echo "versionName=$VERSION_NAME"
  echo "apk=dist/$APK_NAME"
  echo "sha256=$SHA256"
  echo "git=$GIT_SHA"
  echo "built=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
} > "$MANIFEST"

if command -v aapt >/dev/null 2>&1 || [[ -x "$ANDROID_HOME/build-tools/34.0.0/aapt" ]]; then
  AAPT="$(command -v aapt || true)"
  AAPT="${AAPT:-$ANDROID_HOME/build-tools/34.0.0/aapt}"
  BADGING="$("$AAPT" dump badging "$STABLE_APK")"
  echo "$BADGING" | grep -q "versionName='$VERSION_NAME'" || {
    echo "APK versionName does not match $VERSION_FILE" >&2
    exit 1
  }
  echo "$BADGING" | grep -q "versionCode='$VERSION_CODE'" || {
    echo "APK versionCode does not match $VERSION_FILE" >&2
    exit 1
  }
fi

ARTIFACT_DIR="/opt/cursor/artifacts"
if [[ -d "$ARTIFACT_DIR" ]]; then
  versioned="$ARTIFACT_DIR/nodeoct3_ascii_v${VERSION_NAME//./_}.apk"
  cp "$STABLE_APK" "$versioned"
  cp "$MANIFEST" "$ARTIFACT_DIR/apk-manifest-v${VERSION_NAME//./_}.txt"
  echo "Copied $versioned"
fi

echo "Attached $STABLE_APK"
echo "  ASCII Notes v$VERSION_NAME ($VERSION_CODE)"
echo "  sha256 $SHA256"
echo "  manifest $MANIFEST"
