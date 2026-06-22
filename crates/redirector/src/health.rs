use axum::Json;
use serde::Serialize;

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
}

impl Default for HealthResponse {
    fn default() -> Self {
        Self {
            status: "ok".to_owned(),
        }
    }
}

pub async fn handler() -> Json<HealthResponse> {
    Json(HealthResponse::default())
}
