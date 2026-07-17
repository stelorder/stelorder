import React from "react";
import { Navigate, NavigateProps, useLocation } from "react-router-dom";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

type ErrorBoundaryProps = React.PropsWithChildren & {
  Navigate?: ({ to, replace, state, relative, }: NavigateProps) => null;
};

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Captured error in ErrorBoundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.Navigate && import.meta.env.VITE_MODE !== 'development') {
        console.warn("Redirecting to error page due to error:", this.state.error);
        return (
          <this.props.Navigate
            to="/error"
            replace={true}
          />
        );
      }
      return (
        <div style={{ padding: "2rem", color: "red" }}>
          <h2>¡Ocurrió un error inesperado!</h2>
          <p>{this.state.error?.message}</p>
          <details style={{ whiteSpace: "pre-wrap" }}>
            {this.state.errorInfo?.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundaryWithNavigate(props: React.PropsWithChildren<{}>) {
  const location = useLocation();
  return <ErrorBoundary Navigate={Navigate} key={location.pathname}>{props.children}</ErrorBoundary>;
}
