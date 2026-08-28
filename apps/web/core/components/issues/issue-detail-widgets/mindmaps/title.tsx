/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useMemo } from "react";
import { observer } from "mobx-react";
import type { TIssueServiceType } from "@plane/types";
import { CollapsibleButton } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { IssueMindmapsActionButton } from "./quick-action-button";

type Props = {
  isOpen: boolean;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
};

export const IssueMindmapsCollapsibleTitle = observer(function IssueMindmapsCollapsibleTitle(props: Props) {
  const { isOpen, issueId, disabled, issueServiceType } = props;

  const {
    mindmap: { getMindmapsByIssueId },
  } = useIssueDetail(issueServiceType);

  const mindmapsCount = getMindmapsByIssueId(issueId)?.length ?? 0;

  const indicatorElement = useMemo(
    () => (
      <span className="flex items-center justify-center">
        <p className="text-14 !leading-3 text-tertiary">{mindmapsCount}</p>
      </span>
    ),
    [mindmapsCount]
  );

  return (
    <CollapsibleButton
      isOpen={isOpen}
      title="Mindmaps"
      indicatorElement={indicatorElement}
      actionItemElement={
        !disabled && <IssueMindmapsActionButton issueServiceType={issueServiceType} disabled={disabled} />
      }
    />
  );
});
