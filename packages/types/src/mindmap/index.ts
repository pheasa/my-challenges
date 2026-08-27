/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TLogoProps } from "../common";

export type TMindmapNode = {
  id?: string;
  text: string;
  x: number;
  y: number;
  isRoot?: boolean;
  children?: TMindmapNode[];
};

export type TMindmapData = {
  tree: TMindmapNode;
};

export type TMindmap = {
  id: string;
  name: string;
  data?: TMindmapData;
  workspace: string;
  project_ids?: string[];
  access?: number;
  color?: string;
  is_favorite?: boolean;
  is_locked?: boolean;
  archived_at?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
  created_by?: string;
  updated_by?: string;
  owned_by?: string;
  logo_props?: TLogoProps;
  sort_order?: number;
};

export type TMindmapNavigationTabs = "public" | "private" | "archived";

export type TMindmapFilters = {
  searchQuery: string;
  sortKey: "name" | "created_at" | "updated_at";
  sortBy: "asc" | "desc";
};
