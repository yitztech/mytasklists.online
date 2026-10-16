#!/usr/bin/env sh
set -e

OUTPUT_DIR="${OUTPUT_DIR:-/certs}"
mkdir -p "$OUTPUT_DIR"

echo "=== Generando certificados de desarrollo para aplicaciones móviles (iOS / Android) ==="

# 1. Root Certificate Authority (CA) para desarrollo móvil
if [ ! -f "$OUTPUT_DIR/mobile-dev-ca.key" ] || [ ! -f "$OUTPUT_DIR/mobile-dev-ca.crt" ]; then
  echo "--> Generando Root CA para desarrollo móvil..."
  openssl genrsa -out "$OUTPUT_DIR/mobile-dev-ca.key" 2048
  openssl req -x509 -new -nodes -key "$OUTPUT_DIR/mobile-dev-ca.key" \
    -sha256 -days 3650 -out "$OUTPUT_DIR/mobile-dev-ca.crt" \
    -subj "/C=MX/ST=CDMX/L=Mexico/O=MyTaskLists Dev/OU=Mobile Development/CN=MyTaskLists Mobile Dev Root CA"
else
  echo "--> Root CA existente en $OUTPUT_DIR/mobile-dev-ca.crt"
fi

# 2. Certificado TLS para servidor local / emuladores móviles
# Cubre localhost, 127.0.0.1, 10.0.2.2 (gateway Android Emulator), host.docker.internal y *.local
echo "--> Generando certificado TLS para endpoints de desarrollo móvil..."
openssl genrsa -out "$OUTPUT_DIR/mobile-dev.key" 2048

cat <<EOF > "$OUTPUT_DIR/san.cnf"
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = req_ext

[dn]
C = MX
ST = CDMX
L = Mexico
O = MyTaskLists Dev
OU = Mobile Dev
CN = localhost

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.local
DNS.3 = host.docker.internal
DNS.4 = 10.0.2.2
IP.1 = 127.0.0.1
IP.2 = 10.0.2.2
IP.3 = 0.0.0.0
EOF

openssl req -new -key "$OUTPUT_DIR/mobile-dev.key" \
  -out "$OUTPUT_DIR/mobile-dev.csr" \
  -config "$OUTPUT_DIR/san.cnf"

openssl x509 -req -in "$OUTPUT_DIR/mobile-dev.csr" \
  -CA "$OUTPUT_DIR/mobile-dev-ca.crt" \
  -CAkey "$OUTPUT_DIR/mobile-dev-ca.key" \
  -CAcreateserial -out "$OUTPUT_DIR/mobile-dev.crt" \
  -days 825 -sha256 -extfile "$OUTPUT_DIR/san.cnf" -extensions req_ext

rm -f "$OUTPUT_DIR/mobile-dev.csr" "$OUTPUT_DIR/san.cnf"

# 3. Exportar PKCS12 para iOS / Android Network Security
openssl pkcs12 -export -out "$OUTPUT_DIR/mobile-dev.p12" \
  -inkey "$OUTPUT_DIR/mobile-dev.key" \
  -in "$OUTPUT_DIR/mobile-dev.crt" \
  -certfile "$OUTPUT_DIR/mobile-dev-ca.crt" \
  -passout pass:mobiledev

# 4. Keystore de depuración para Android
KEYTOOL="keytool"
if [ -x "/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home/bin/keytool" ]; then
  KEYTOOL="/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home/bin/keytool"
fi

if command -v "$KEYTOOL" >/dev/null 2>&1; then
  echo "--> Generando Android debug.keystore con $KEYTOOL..."
  rm -f "$OUTPUT_DIR/debug.keystore"
  "$KEYTOOL" -genkey -v -keystore "$OUTPUT_DIR/debug.keystore" \
    -storepass android -alias androiddebugkey -keypass android -keyalg RSA \
    -keysize 2048 -validity 10000 \
    -dname "CN=Android Debug,O=Android,C=US" || echo "Aviso: keytool no pudo ejecutarse; ejecútalo dentro del contenedor Docker de mobile-cert."
fi

echo "=== Certificados generados correctamente en $OUTPUT_DIR ==="
ls -la "$OUTPUT_DIR"
