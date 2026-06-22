use axum::{Router, routing::get};
use redirector::{SharedState, health_handler, redirect_handler};
use std::{io, sync::Arc};
use tokio::net::TcpListener;

const DEFAULT_PORT: u16 = 3000;

#[tokio::main]
async fn main() -> io::Result<()> {
    let state = Arc::new(SharedState::from_env().await);

    let router = Router::new()
        .route("/", get(health_handler))
        .route("/{slug}", get(redirect_handler))
        .with_state(state);

    let port = match std::env::var("PORT") {
        Ok(value) => value.parse::<u16>().unwrap_or(DEFAULT_PORT),
        _ => DEFAULT_PORT,
    };

    let listener = TcpListener::bind(format!("0.0.0.0:{port}")).await?;

    axum::serve(listener, router).await
}
