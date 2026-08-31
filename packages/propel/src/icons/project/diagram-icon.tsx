/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { IconWrapper } from "../icon-wrapper";
import type { ISvgIcons } from "../type";

export function DiagramIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <rect x="12" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <rect x="7.5" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <path d="M5.5 8v2a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V8M10 11v1" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </IconWrapper>
  );
}
