use aws_sdk_dynamodb::types::AttributeValue;
use axum::{
    Router,
    extract::{Path, State},
    http::StatusCode,
    response::Redirect,
    routing::get,
};
use redirector::{failure, failure::Failure, state::SharedState};
use std::{io, sync::Arc};
use tokio::net::TcpListener;

async fn handler(
    State(state): State<Arc<SharedState>>,
    Path(slug): Path<String>,
) -> Result<Redirect, Failure> {
    let output = state
        .dynamodb
        .query()
        .table_name("links")
        .index_name("link_destinations")
        .projection_expression("d")
        .key_condition_expression("s = :slug")
        .expression_attribute_values(":slug", AttributeValue::S(slug.to_owned()))
        .limit(1)
        .send()
        .await
        .map_err(|_| failure!())?;

    match output.items().first() {
        Some(item) => {
            let destination_url = item
                .get("d")
                .ok_or_else(|| failure!())?
                .as_s()
                .map_err(|_| failure!())?;

            Ok(Redirect::permanent(destination_url))
        }
        _ => Err(failure!(
            StatusCode::NOT_FOUND,
            "The link '{slug}' could not be found",
        )),
    }
}

const DEFAULT_PORT: u16 = 3000;

#[tokio::main]
async fn main() -> io::Result<()> {
    let state = Arc::new(SharedState::from_env().await);

    let router = Router::new()
        .route("/{slug}", get(handler))
        .with_state(state);

    let port = match std::env::var("PORT") {
        Ok(value) => value.parse::<u16>().unwrap_or(DEFAULT_PORT),
        _ => DEFAULT_PORT,
    };

    let listener = TcpListener::bind(format!("0.0.0.0:{port}")).await?;

    axum::serve(listener, router).await
}
