FROM ubuntu:24.04

ARG DEBIAN_FRONTEND=noninteractive
ARG NODE_MAJOR=22
ARG ANDROID_SDK_ROOT=/opt/android-sdk
ARG ANDROID_CMDLINE_TOOLS_VERSION=14742923

ENV ANDROID_HOME=${ANDROID_SDK_ROOT}
ENV ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT}
ENV JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
ENV PATH=${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${ANDROID_SDK_ROOT}/platform-tools:${PATH}

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      git \
      gnupg \
      openjdk-21-jdk \
      openssh-client \
      python3 \
      sudo \
      unzip \
      wget \
      zip && \
    rm -rf /var/lib/apt/lists/*

RUN install -d -m 0755 /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | \
      gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" > \
      /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p "${ANDROID_SDK_ROOT}/cmdline-tools" && \
    curl -fsSL "https://dl.google.com/android/repository/commandlinetools-linux-${ANDROID_CMDLINE_TOOLS_VERSION}_latest.zip" \
      -o /tmp/android-commandlinetools.zip && \
    unzip -q /tmp/android-commandlinetools.zip -d /tmp/android-commandlinetools && \
    mkdir -p "${ANDROID_SDK_ROOT}/cmdline-tools/latest" && \
    cp -a /tmp/android-commandlinetools/cmdline-tools/. "${ANDROID_SDK_ROOT}/cmdline-tools/latest/" && \
    rm -rf /tmp/android-commandlinetools /tmp/android-commandlinetools.zip

RUN yes | sdkmanager --sdk_root="${ANDROID_SDK_ROOT}" --licenses >/tmp/android-licenses.log || true && \
    sdkmanager --sdk_root="${ANDROID_SDK_ROOT}" \
      "platform-tools" \
      "platforms;android-36" \
      "build-tools;35.0.0" \
      "build-tools;36.0.0" && \
    rm -f /tmp/android-licenses.log

RUN id -u ubuntu >/dev/null 2>&1 || useradd -m -s /bin/bash ubuntu && \
    usermod -aG sudo ubuntu && \
    echo "ubuntu ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/ubuntu && \
    chmod 0440 /etc/sudoers.d/ubuntu && \
    chown -R ubuntu:ubuntu "${ANDROID_SDK_ROOT}"

USER ubuntu
WORKDIR /workspace
