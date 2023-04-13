use sqlx::error::Error;
use sqlx::postgres::PgListener;

// the payload type must implement `Serialize` and `Clone`.
#[derive(Clone, serde::Serialize)]
struct Payload {
  message: String,
}

pub async fn start_listening(
    window: tauri::Window,
    url: &str,
) -> Result<(), Error> {
    let mut listener = PgListener::connect(url).await.unwrap();
    listener.listen("spec_data_change").await?;
    loop {
        while let Some(notification) = listener.try_recv().await? {
            let data = notification.payload().to_owned();
            window.emit("data:change", Payload { message: data.into() }).unwrap();
        }
    }
}