# Spec Desktop App

This repo contains the react app and sidecar libraries that all get packaged into Spec's electron.js desktop app.

## Requirements

- node >= 16
- npm >= 8
- postgres >= 14
- [Spec Client](https://github.com/spec-dev/spec) (no docs yet just check below)
- [Spec CLI](https://github.com/spec-dev/cli) (no docs yet just check below)

### Helpful Links

Installing Node.js with `nvm` on Mac:<br>
https://collabnix.com/how-to-install-and-configure-nvm-on-mac-os/

Installing Postgres with brew:<br>
https://gist.github.com/ibraheem4/ce5ccd3e4d7a65589ce84f2a3b7c23a3

## Local Setup

### 1) Clone & install dependencies for this repo

```bash
$ git clone https://github.com/spec-dev/app && cd app && npm i && cd ..
```

### 2) Clone & install dependencies for this Spec client

Before running the dashboard, you'll want to pull the Spec client locally so that you can build it into a binary with `pkg` and leverage it as a sidecar within the electron app.

```bash
$ git clone https://github.com/spec-dev/spec && cd spec && npm i && cd ..
```

Ultimately you should have the Spec client repo live at the same folder level as the desktop app:
```bash
./spec-stuff
    app/
    spec/
```

### 3) Build the Spec client into a binary and package it as a sidecar

Jump back into the Spec client folder and create a custom `pkg` script that will build the client into a binary and then make it available within the desktop app folder as another sidecar:

```bash
$ cd spec
$ mkdir bin
$ touch bin/pkg
```

Copy the following contents into your new `bin/pkg` file:
```bash
#!/bin/bash
npm run build
pkg .
mkdir -p ../app/sidecars/bin/mac
cp build/spec-macos ../app/sidecars/bin/mac/spec
```

Package the Spec client into a sidecar:
```bash
$ chmod u+x bin/*
$ bin/pkg
```

The Spec client should now be available as a binary at `sidecars/bin/mac/spec` within this repo.

### Install the Spec CLI

Before running the dashboard, you'll want to install the Spec CLI. Currently the CLI is what controls user auth and all things project management, while the dashboard is just used for adding live tables to a database. Ultimately, everything will migrate over to the dashboard, but currently they work in tandem.

```bash
$ npm install -g @spec.dev/cli @spec.dev/spec
```