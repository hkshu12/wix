#!/usr/bin/env bash
set -euo pipefail

export ANDROID_HOME="${ANDROID_HOME:-/opt/android-sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export PATH="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"

required_packages=(
  "platform-tools"
  "platforms;android-36"
  "build-tools;35.0.0"
  "build-tools;36.0.0"
)

for package in "${required_packages[@]}"; do
  if ! sdkmanager --sdk_root="$ANDROID_SDK_ROOT" --list_installed | awk '{print $1}' | grep -Fxq "$package"; then
    echo "Missing Android SDK package: $package" >&2
    exit 1
  fi
done

npm ci
