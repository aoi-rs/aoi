pub struct SharedState {
    pub dynamodb: aws_sdk_dynamodb::Client,
}

impl SharedState {
    pub async fn from_env() -> Self {
        let config = aws_config::load_from_env().await;
        let dynamodb = aws_sdk_dynamodb::Client::new(&config);

        Self { dynamodb }
    }
}
