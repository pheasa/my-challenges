/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { GitFork } from "lucide-react";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// components
import { IssueActivityBlockComponent } from "./helpers/activity-block";

type TIssueMindmapActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueMindmapActivity = observer(function IssueMindmapActivity(props: TIssueMindmapActivity) {
  const { activityId, ends } = props;
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;

  const mindmapId = activity.new_identifier || activity.old_identifier;
  const mindmapName = activity.new_value || activity.old_value || "Untitled Mindmap";
  const mindmapUrl = mindmapId
    ? `/${activity.workspace_detail?.slug || activity.workspace}/projects/${activity.project}/mindmaps/${mindmapId}`
    : null;

  return (
    <IssueActivityBlockComponent
      icon={<GitFork size={14} className="text-secondary flex-shrink-0" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.verb === "created" ? (
          <>
            <span>linked the mindmap </span>
            {mindmapUrl ? (
              <a
                href={mindmapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                {mindmapName}
              </a>
            ) : (
              <span className="font-medium text-primary">{mindmapName}</span>
            )}
          </>
        ) : (
          <>
            <span>unlinked the mindmap </span>
            {mindmapUrl ? (
              <a
                href={mindmapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                {mindmapName}
              </a>
            ) : (
              <span className="font-medium text-primary">{mindmapName}</span>
            )}
          </>
        )}
      </>
    </IssueActivityBlockComponent>
  );
});
