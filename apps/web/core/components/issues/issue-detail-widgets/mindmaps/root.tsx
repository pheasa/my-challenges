/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import type { TIssueServiceType } from "@plane/types";
import { Collapsible } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { IssueMindmapsCollapsibleContent } from "./content";
import { IssueMindmapsCollapsibleTitle } from "./title";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const MindmapsCollapsible = observer(function MindmapsCollapsible(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled = false, issueServiceType } = props;

  const { openWidgets, toggleOpenWidget } = useIssueDetail(issueServiceType);
  const isCollapsibleOpen = openWidgets.includes("mindmaps");

  return (
    <Collapsible
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleOpenWidget("mindmaps")}
      title={
        <IssueMindmapsCollapsibleTitle
          isOpen={isCollapsibleOpen}
          issueId={issueId}
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      }
      buttonClassName="w-full"
    >
      <IssueMindmapsCollapsibleContent
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        disabled={disabled}
        issueServiceType={issueServiceType}
      />
    </Collapsible>
  );
});
