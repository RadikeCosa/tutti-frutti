"use client";

import { useState } from "react";

interface MinimalClientProps {
  readonly initialLabel?: string;
}

export default function MinimalClient({
  initialLabel = "Click me",
}: MinimalClientProps) {
  const [count, setCount] = useState<number>(0);
  const [label, setLabel] = useState<string>(initialLabel);

  const handleClick = () => {
    setCount((prev) => prev + 1);
    setLabel("Clicked");
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="rounded bg-black px-3 py-2 text-sm font-medium text-white"
        onClick={handleClick}
      >
        {label}
      </button>
      <p className="text-sm">Clicks: {count}</p>
    </div>
  );
}
