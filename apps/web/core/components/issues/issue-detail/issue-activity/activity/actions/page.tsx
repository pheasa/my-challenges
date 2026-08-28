/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { FileText } from "lucide-react";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// components
import { IssueActivityBlockComponent } from "./helpers/activity-block";

type TIssuePageActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssuePageActivity = observer(function IssuePageActivity(props: TIssuePageActivity) {
  const { activityId, ends } = props;
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;

  const pageId = activity.new_identifier || activity.old_identifier;
  const pageName = activity.new_value || activity.old_value || "Untitled Page";
  const pageUrl = pageId
    ? `/${activity.workspace_detail?.slug || activity.workspace}/projects/${activity.project}/pages/${pageId}`
    : null;

  return (
    <IssueActivityBlockComponent
      icon={<FileText size={14} className="text-secondary flex-shrink-0" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.verb === "created" ? (
          <>
            <span>linked the page </span>
            {pageUrl ? (
              <a
                href={pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                {pageName}
              </a>
            ) : (
              <span className="font-medium text-primary">{pageName}</span>
            )}
          </>
        ) : (
          <>
            <span>unlinked the page </span>
            {pageUrl ? (
              <a
                href={pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                {pageName}
              </a>
            ) : (
              <span className="font-medium text-primary">{pageName}</span>
            )}
          </>
        )}
      </>
    </IssueActivityBlockComponent>
  );
});
