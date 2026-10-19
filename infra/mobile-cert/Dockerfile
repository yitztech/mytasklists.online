FROM alpine:3.21

RUN apk add --no-cache openssl openjdk17-jre-headless

WORKDIR /app
COPY generate-certs.sh /app/generate-certs.sh
RUN chmod +x /app/generate-certs.sh

VOLUME ["/certs"]

ENTRYPOINT ["/app/generate-certs.sh"]
