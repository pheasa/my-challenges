/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TMindmap } from "../mindmap";

export type TIssueMindmap = {
  id: string;
  issue?: string;
  mindmap?: string;
  issue_id?: string;
  mindmap_id?: string;
  mindmap_detail?: TMindmap;
  created_at: Date | string;
  updated_at: Date | string;
};

export type TIssueMindmapMap = {
  [issue_mindmap_id: string]: TIssueMindmap;
};

export type TIssueMindmapIdMap = {
  [issue_id: string]: string[];
};
