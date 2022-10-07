VERSION 0.6
FROM node:16-bullseye

WORKDIR /build
    
deps:
    RUN npm install -g pnpm
    RUN SHELL=bash pnpm setup
    ENV PNPM_HOME="/root/.local/share/pnpm"
    ENV PATH="$PNPM_HOME:$PATH"
    RUN apt-get update && apt-get install -y zip wget gcc g++ libssl-dev pkg-config python3

setup:
    FROM +deps
    COPY package.json .
    COPY pnpm-lock.yaml .
    RUN pnpm i --frozen-lockfile --reporter=append-only

pre-build:
    FROM +setup
    COPY . .

pack:
    FROM +pre-build
    RUN pnpm test
    RUN pnpm rome ci ./src
    RUN pnpm build
    RUN (cd dist && pnpm pack)
    SAVE ARTIFACT ./dist/*.tgz AS LOCAL ./.earthly-build/

validate-package:
    FROM node:16-bullseye
    WORKDIR /app
    COPY +pack/*.tgz /app/
    RUN ls
    # global install
    RUN npm i *.tgz -g
    RUN pnpm-cdx info MIT
    # sanity check commonjs packaging
    RUN npm init -y
    RUN npm i *.tgz
    RUN node -e "console.log(require('pnpm-cdx'))"
    SAVE IMAGE vp

publish-package:
    FROM +validate-package
    WORKDIR /app
    COPY +pack/*.tgz /app/
    RUN --secret NPM_TOKEN echo //registry.npmjs.org/:_authToken=$NPM_TOKEN > .npmrc
    RUN npm publish *.tgz
