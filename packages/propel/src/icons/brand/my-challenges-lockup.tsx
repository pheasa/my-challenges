/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import type { ISvgIcons } from "../type";

export function MyChallengesLockup({ width = "360", height = "52", className, color = "currentColor" }: ISvgIcons) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 360 52"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Icon: Mountain range with flag */}
      <g transform="translate(0, 2) scale(0.56)">
        {/* Left mountain (shorter) */}
        <path d="M2 48 L22 16 L42 48 Z" fill={color} />
        {/* Right mountain (taller) */}
        <path d="M30 48 L55 2 L82 48 Z" fill={color} />
        {/* Flag at the summit */}
        <path d="M55 2 L55 14 L65 8 Z" fill={color} opacity={0.6} />
      </g>
      {/* Wordmark: "My Challenges" */}
      <text
        x="56"
        y="38"
        fontFamily={`"Inter Variable", Inter, -apple-system, BlinkMacSystemFont, sans-serif`}
        fontSize="32"
        fontWeight="600"
        fill={color}
      >
        My Challenges
      </text>
    </svg>
  );
}
