#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT/android"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/android-sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export JAVA_HOME="${JAVA_HOME:-$(dirname "$(dirname "$(readlink -f "$(command -v javac)")")")}"

printf "sdk.dir=%s\n" "$ANDROID_HOME" > "$ANDROID_DIR/local.properties"

cd "$ANDROID_DIR"
./gradlew assembleDebug --no-daemon

mkdir -p "$ROOT/dist"
cp "$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk" "$ROOT/dist/nodeoct3-ascii.apk"
echo "Built $ROOT/dist/nodeoct3-ascii.apk"
