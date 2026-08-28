/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TPage } from "../page";

export type TIssuePage = {
  id: string;
  issue?: string;
  page?: string;
  issue_id?: string;
  page_id?: string;
  page_detail?: TPage;
  created_at: Date | string;
  updated_at: Date | string;
};

export type TIssuePageMap = {
  [issue_page_id: string]: TIssuePage;
};

export type TIssuePageIdMap = {
  [issue_id: string]: string[];
};
