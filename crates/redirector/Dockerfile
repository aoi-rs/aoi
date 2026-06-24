FROM rust:1.96.0 AS builder

WORKDIR /usr/src/redirector

COPY . .

RUN cargo install --path .

FROM debian:trixie-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/cargo/bin/redirector /usr/bin/redirector

ENV PORT=12000

EXPOSE 12000

CMD ["redirector"]
