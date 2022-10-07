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
    FROM +setup
    RUN pnpm build
    RUN (cd dist && pnpm pack)
    SAVE ARTIFACT ./dist/*.tgz AS LOCAL ./.earthly-build