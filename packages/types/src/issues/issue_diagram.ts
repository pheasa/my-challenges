/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TDiagram } from "../diagram";

export type TIssueDiagram = {
  id: string;
  issue?: string;
  diagram?: string;
  issue_id?: string;
  diagram_id?: string;
  diagram_detail?: TDiagram;
  created_at: Date | string;
  updated_at: Date | string;
};

export type TIssueDiagramMap = {
  [issue_diagram_id: string]: TIssueDiagram;
};

export type TIssueDiagramIdMap = {
  [issue_id: string]: string[];
};
