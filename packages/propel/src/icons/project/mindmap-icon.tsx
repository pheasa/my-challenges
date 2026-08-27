/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { IconWrapper } from "../icon-wrapper";
import type { ISvgIcons } from "../type";

export function MindmapIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M4.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM11.5 4.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM11.5 15.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6.8 5.5c1.4-.8 2.5-1.7 3.2-2.3M6.8 7.5c1.4.8 2.5 1.7 3.2 2.3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </IconWrapper>
  );
}
