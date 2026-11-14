import * as React from "react";
import { Box as CubeIcon, Leaf as LeafIcon } from "lucide-react";

export { CubeIcon, LeafIcon };

export function ElephantIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 19V9a4 4 0 0 0-4-4H9a5 5 0 0 0-5 5v9" />
      <path d="M4 14c0 3 2 5 5 5" />
      <path d="M14 19v-4a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v4" />
      <path d="M9 19v-4" />
      <circle cx="8" cy="10" r="1" fill="currentColor" />
      <path d="M19 12h2a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2h-1" />
    </svg>
  );
}

export function DolphinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 14c2-4 6-7 11-7a7 7 0 0 1 6 3c-1.5 1-3.5 1.5-5 1.5-2 0-3.5-.5-5-1" />
      <path d="M14 7c0-2-1-3-2-4-1 1-1.5 2.5-1.5 4" />
      <path d="M3 14c3 3 7 4 11 2 3-1.5 5-4.5 6-7.5" />
      <path d="M20 8.5c1.5.5 2.5 1.5 3 2.5-1 .5-2 0-3-.5" />
      <path d="M3 14c-1 1.5-1.5 3.5-1 5 .8-.5 1.7-1 2.5-1.5" />
      <circle cx="16" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}

