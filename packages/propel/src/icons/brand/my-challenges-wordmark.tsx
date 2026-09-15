/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import type { ISvgIcons } from "../type";

export function MyChallengesWordmark({ width = "320", height = "48", className, color = "currentColor" }: ISvgIcons) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 320 48"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <text
        x="0"
        y="38"
        fontFamily={`"Inter Variable", Inter, -apple-system, BlinkMacSystemFont, sans-serif`}
        fontSize="36"
        fontWeight="600"
        fill={color}
      >
        My Challenges
      </text>
    </svg>
  );
}
