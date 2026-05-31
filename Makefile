.PHONY: all build test lint clean install docker-build docker-push docs

REGISTRY     := ghcr.io/vignesh2027
VERSION      := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
BUILD_DATE   := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT   := $(shell git rev-parse --short HEAD 2>/dev/null || echo "none")

all: install build test

install:
	pnpm install

build:
	pnpm run build

dev:
	pnpm run dev

test:
	pnpm run test

lint:
	pnpm run lint

typecheck:
	pnpm run typecheck

clean:
	pnpm run clean

format:
	pnpm run format

docker-build:
	docker build \
		--build-arg VERSION=$(VERSION) \
		--build-arg BUILD_DATE=$(BUILD_DATE) \
		--build-arg GIT_COMMIT=$(GIT_COMMIT) \
		-t $(REGISTRY)/helios:$(VERSION) \
		-t $(REGISTRY)/helios:latest \
		.

docker-push:
	docker push $(REGISTRY)/helios:$(VERSION)
	docker push $(REGISTRY)/helios:latest

docs:
	cd docs && pnpm run build

helm-package:
	helm package charts/helios -d charts/dist/

helm-lint:
	helm lint charts/helios/

version:
	@echo "Version: $(VERSION)"
	@echo "Commit:  $(GIT_COMMIT)"
	@echo "Date:    $(BUILD_DATE)"
