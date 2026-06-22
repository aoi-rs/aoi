use crate::{Failure, SharedState};
use aws_sdk_dynamodb::types::AttributeValue;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Redirect,
};
use std::sync::Arc;

pub async fn handler(
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
