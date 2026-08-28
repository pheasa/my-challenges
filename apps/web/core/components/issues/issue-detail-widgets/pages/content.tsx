/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import type { TIssueServiceType } from "@plane/types";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { PageItem } from "./page-item";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
};

export const IssuePagesCollapsibleContent = observer(function IssuePagesCollapsibleContent(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled, issueServiceType } = props;

  const {
    page: { getPagesByIssueId, getPageById },
  } = useIssueDetail(issueServiceType);

  const pageIds = getPagesByIssueId(issueId) || [];

  if (pageIds.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {pageIds.map((id) => {
        const issuePage = getPageById(id);
        if (!issuePage) return null;
        return (
          <PageItem
            key={id}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            issuePage={issuePage}
            disabled={disabled}
            issueServiceType={issueServiceType}
          />
        );
      })}
    </div>
  );
});
