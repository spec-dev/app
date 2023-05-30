# Spec Desktop App

This repo contains the react app and sidecar libraries for our Electron desktop app.

## Requirements

- node >= 16
- npm >= 8
- postgres >= 14
- Sass
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
$ git clone https://github.com/spec-dev/app && cd app && npm install
$ mkdir src/styles/css
$ cd ..
```

### 2) Clone & install dependencies for the Spec client

Before running the dashboard, you'll want to pull the Spec client locally so that you can build it into a binary with `pkg` and leverage it as a sidecar within the Electron app.

```bash
$ git clone https://github.com/spec-dev/spec && cd spec && npm i && cd ..
```

Ultimately you should have the Spec client repo live at the same folder level as the desktop app (this repo):
```bash
./some_parent_folder
    app/
    spec/
```

### 3) Build the Spec client into a binary and package it as a sidecar

Jump back into the Spec client folder and create a custom `pkg` script that will build the client into a binary and make it available within the desktop app as a sidecar:

```bash
$ cd spec
$ mkdir bin
$ touch bin/pkg
$ chmod u+x bin/*
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
$ bin/pkg
```

The Spec client should now be available as a binary at `sidecars/bin/mac/spec` within this repo.

### 4) Setup a test project on Spec to use with the desktop app

At this point, you will need to have a Spec project to test the desktop app with, so follow steps in the next section to make that happen.

## Test Project Setup

### 1) Install the Spec CLI

Before running the desktop app, you'll want to install the Spec CLI. Currently the CLI is what controls user auth and all things project management, while the desktop app is used for more quickly adding live tables to a customer's database and writing the config for the data mappings. Ultimately, everything will migrate over to the desktop app, but currently they work in tandem.

```bash
$ npm install -g @spec.dev/cli @spec.dev/spec
```

### 2) Create a new local database

Create a fresh database for your new Spec project:

```bash
$ createdb testing
```

### 3) Create a new folder for your Spec project

```bash
$ mkdir test-project && cd test-project
```

**The rest of the steps will assume you are *inside* your new `test-project` folder**

### 4) Log into the Spec CLI

```bash
$ spec login
```

### 5) Initialize a new Spec project

```bash
$ spec init
```

This will create 2 files inside a new `.spec` folder:
1) `connect.toml` - Specifies the different database environments to run the Spec client against
2) `project.toml` - Specifies which live tables you want in your database and their respective data mappings

### 5) Link the remote Spec project to this local folder

I went ahead and created a new Spec project named `test` that exists under the `test` namespace in our Core DB. This project (like all of them) has its own set of API credentials. When you run the following command, the Spec CLI will automatically pull down those API credentials for you. It then tells the CLI that this folder (`test-project`, or `.`) is the local location of the `test/test` project.

```bash
$ spec link project test/test .
```

### 6) Specify the database you want the Spec client to run against

Open `.spec/connect` and configure the rest of the local database connection info. For the `user`, use whatever the default user "prefix" is when you type `psql` and enter the interactive `psql` shell. 

```toml
# Local database
[local]
name = 'testing'
port = 5432
host = 'localhost'
user = 'your-username'
password = '' # Should be able to leave blank
```

At this point, you should be ready to run the app (next section).

## Run the App

To run the desktop app, you'll need 3 different terminal tabs:
1) The react app
2) Sass live-compiling into CSS
3) The electron app

### Tab 1 - The react app

First, make sure you have the following environment variables set:
```
export ENV=local
```

Start the react dev server:
```bash
$ npm start
```

### Tab 2 - Sass
```bash
$ npm run sass
```

### Tab 3 - Electron

First, make sure you have the following environment variables set:
```
export ENV=local
```

*Make sure Tab 1 is fully running before even trying to run this*
```bash
$ npm run electron
```

Once the Electron tab is running, the desktop app should open and show you your (presumably empty) database.