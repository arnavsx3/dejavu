use std::{error::Error, io, net::SocketAddr};

use tokio::net::TcpListener;
use tracing_subscriber::EnvFilter;

fn listen_address(value: Option<&str>) -> Result<SocketAddr, Box<dyn Error + Send + Sync>> {
    let address: SocketAddr = value.unwrap_or("127.0.0.1:4783").parse()?;
    if !address.ip().is_loopback() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "DEJAVU_ADDR must be a loopback address; phone pairing is not implemented yet",
        )
        .into());
    }
    Ok(address)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error + Send + Sync>> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .try_init()?;

    let address = listen_address(std::env::var("DEJAVU_ADDR").ok().as_deref())?;
    let listener = TcpListener::bind(address).await?;
    tracing::info!(address = %listener.local_addr()?, "dejavu is listening");

    axum::serve(listener, dejavu_server::router())
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    Ok(())
}

async fn shutdown_signal() {
    let interrupt = async {
        if let Err(error) = tokio::signal::ctrl_c().await {
            tracing::error!(%error, "could not listen for interrupt; shutting down");
        }
    };

    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut signal) => {
                signal.recv().await;
            }
            Err(error) => {
                tracing::error!(%error, "could not listen for termination; shutting down");
            }
        }
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        () = interrupt => {},
        () = terminate => {},
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_to_loopback() -> Result<(), Box<dyn Error + Send + Sync>> {
        assert_eq!(listen_address(None)?.to_string(), "127.0.0.1:4783");
        Ok(())
    }

    #[test]
    fn permits_ipv6_loopback() -> Result<(), Box<dyn Error + Send + Sync>> {
        assert!(listen_address(Some("[::1]:4783"))?.ip().is_loopback());
        Ok(())
    }

    #[test]
    fn rejects_network_exposure_and_invalid_configuration() {
        for address in ["0.0.0.0:4783", "192.168.1.4:4783", "invalid"] {
            assert!(listen_address(Some(address)).is_err());
        }
    }
}
