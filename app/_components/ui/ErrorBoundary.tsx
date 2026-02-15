import React from "react";
import { useRouter } from "next/navigation";

export interface ErrorBoundaryProps {
  readonly children: React.ReactNode;
  readonly fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * ErrorBoundary
 * Maneja errores de renderizado y muestra una UI amigable.
 *
 * @example
 * <ErrorBoundary>
 *   <SuspiciousComponent />
 * </ErrorBoundary>
 *
 * @example
 * <ErrorBoundary fallback={(error, reset) => <CustomError error={error} onReset={reset} />}>
 *   <SuspiciousComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
    this.resetError = this.resetError.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("ErrorBoundary caught an error:", error, info);
    }
  }

  resetError() {
    this.setState({ error: null });
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }
      // Default fallback UI
      return (
        <DefaultErrorUI error={this.state.error} onReset={this.resetError} />
      );
    }
    return this.props.children;
  }
}

function DefaultErrorUI({
  error,
  onReset,
}: {
  error: Error;
  onReset: () => void;
}) {
  // useRouter solo en cliente
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow max-w-md w-full p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Algo salió mal</h2>
        <p className="mb-6 text-gray-700">
          {error.message || "Ocurrió un error inesperado."}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            className="px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            onClick={onReset}
            type="button"
          >
            Intentar de nuevo
          </button>
          <button
            className="px-6 py-2 rounded bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
            onClick={() => router.push("/")}
            type="button"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
