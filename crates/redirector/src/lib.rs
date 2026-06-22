#[macro_use]
pub mod failure;

pub mod health;
pub mod redirects;
pub mod state;

pub use failure::Failure;
pub use health::handler as health_handler;
pub use redirects::handler as redirect_handler;
pub use state::SharedState;
