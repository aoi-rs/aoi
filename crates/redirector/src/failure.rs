use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::Serialize;

pub struct Failure {
    status_code: StatusCode,
    message: String,
}

#[derive(Serialize)]
struct FailureResponse {
    message: String,
}

impl Failure {
    pub fn new(status_code: StatusCode, message: impl ToString) -> Self {
        Self {
            status_code,
            message: message.to_string(),
        }
    }
}

impl IntoResponse for Failure {
    fn into_response(self) -> Response {
        (
            self.status_code,
            Json(FailureResponse {
                message: self.message,
            }),
        )
            .into_response()
    }
}

#[macro_export]
macro_rules! failure {
    () => {
        Failure::new(
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            "Something went wrong on our side",
        )
    };

    ($status_code:expr, $($arg:tt)*) => {
        Failure::new($status_code, format_args!($($arg)*))
    };
}
