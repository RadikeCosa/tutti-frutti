import React, { forwardRef } from "react";

export interface LoadingSpinnerProps {
  readonly size?: "sm" | "md" | "lg" | "fullscreen";
  readonly message?: string;
  readonly className?: string;
}

const SIZE_MAP: Record<NonNullable<LoadingSpinnerProps["size"]>, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-4",
  lg: "h-12 w-12 border-4",
  fullscreen: "h-16 w-16 border-4",
};

const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = "md", message, className }, ref) => {
    const isFullscreen = size === "fullscreen";
    const spinner = (
      <div
        className={[
          "animate-spin rounded-full border-t-transparent border-blue-600 border-solid",
          SIZE_MAP[size],
          isFullscreen ? "z-50" : "",
          className || "",
        ].join(" ")}
        aria-label="Cargando"
        role="status"
      />
    );

    if (isFullscreen) {
      return (
        <div
          ref={ref}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40"
        >
          {spinner}
          {message && (
            <span
              className="mt-4 text-base font-medium text-white drop-shadow-sm"
              aria-live="polite"
            >
              {message}
            </span>
          )}
        </div>
      );
    }

    return (
      <div ref={ref} className="flex flex-col items-center justify-center">
        {spinner}
        {message && (
          <span className="mt-2 text-sm text-blue-700" aria-live="polite">
            {message}
          </span>
        )}
      </div>
    );
  },
);

LoadingSpinner.displayName = "LoadingSpinner";

export default LoadingSpinner;
