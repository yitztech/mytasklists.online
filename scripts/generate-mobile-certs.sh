#!/usr/bin/env sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT/infra/mobile-cert/certs}"
mkdir -p "$OUTPUT_DIR"
OUTPUT_DIR="$OUTPUT_DIR" "$ROOT/infra/mobile-cert/generate-certs.sh"
