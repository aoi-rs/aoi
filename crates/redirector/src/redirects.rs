use crate::{Failure, SharedState};
use aws_sdk_dynamodb::types::AttributeValue;
use axum::{
    extract::{Path, State},
    http::{StatusCode, header},
    response::{IntoResponse, Response},
};
use std::{sync::Arc, time::Instant};

pub struct RedirectResponse {
    destination_url: String,
}

impl RedirectResponse {
    pub fn new(destination_url: impl Into<String>) -> Self {
        Self {
            destination_url: destination_url.into(),
        }
    }
}

impl IntoResponse for RedirectResponse {
    fn into_response(self) -> Response {
        (
            StatusCode::PERMANENT_REDIRECT,
            [
                (header::LOCATION, self.destination_url.as_str()),
                (header::CACHE_CONTROL, "public, max-age=31536000, immutable"),
            ],
        )
            .into_response()
    }
}

pub async fn handler(
    State(state): State<Arc<SharedState>>,
    Path(slug): Path<String>,
) -> Result<RedirectResponse, Failure> {
    println!("redirect call received");

    let start = Instant::now();

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
        .map_err(|err| {
            println!("error querying DynamoDB: {err:?}");
            failure!()
        })?;

    println!("DynamoDB query took: {:?}", start.elapsed());

    match output.items().first() {
        Some(item) => {
            let destination_url = item
                .get("d")
                .ok_or_else(|| {
                    println!("error accessing 'd' attribute in ok_or_else");
                    failure!()
                })?
                .as_s()
                .map_err(|err| {
                    println!("error using 'as_s()' in 'd' attribute: {err:?}");
                    failure!()
                })?;

            Ok(RedirectResponse::new(destination_url))
        }
        _ => Err(failure!(
            StatusCode::NOT_FOUND,
            "The link '{slug}' could not be found",
        )),
    }
}
