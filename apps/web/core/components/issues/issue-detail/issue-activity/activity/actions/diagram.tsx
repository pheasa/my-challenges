/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { Workflow } from "lucide-react";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// components
import { IssueActivityBlockComponent } from "./helpers/activity-block";

type TIssueDiagramActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueDiagramActivity = observer(function IssueDiagramActivity(props: TIssueDiagramActivity) {
  const { activityId, ends } = props;
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;

  const diagramId = activity.new_identifier || activity.old_identifier;
  const diagramName = activity.new_value || activity.old_value || "Untitled Diagram";
  const diagramUrl = diagramId
    ? `/${activity.workspace_detail?.slug || activity.workspace}/projects/${activity.project}/diagrams/${diagramId}`
    : null;

  return (
    <IssueActivityBlockComponent
      icon={<Workflow size={14} className="text-secondary flex-shrink-0" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.verb === "created" ? (
          <>
            <span>linked the diagram </span>
            {diagramUrl ? (
              <a
                href={diagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                {diagramName}
              </a>
            ) : (
              <span className="font-medium text-primary">{diagramName}</span>
            )}
          </>
        ) : (
          <>
            <span>unlinked the diagram </span>
            {diagramUrl ? (
              <a
                href={diagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                {diagramName}
              </a>
            ) : (
              <span className="font-medium text-primary">{diagramName}</span>
            )}
          </>
        )}
      </>
    </IssueActivityBlockComponent>
  );
});
