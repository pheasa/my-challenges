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
import { IssueDiagramsActionButton } from "./quick-action-button";

type Props = {
  isOpen: boolean;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
};

export const IssueDiagramsCollapsibleTitle = observer(function IssueDiagramsCollapsibleTitle(props: Props) {
  const { isOpen, issueId, disabled, issueServiceType } = props;

  const {
    diagram: { getDiagramsByIssueId },
  } = useIssueDetail(issueServiceType);

  const diagramsCount = getDiagramsByIssueId(issueId)?.length ?? 0;

  const indicatorElement = useMemo(
    () => (
      <span className="flex items-center justify-center">
        <p className="text-14 !leading-3 text-tertiary">{diagramsCount}</p>
      </span>
    ),
    [diagramsCount]
  );

  return (
    <CollapsibleButton
      isOpen={isOpen}
      title="Diagrams"
      indicatorElement={indicatorElement}
      actionItemElement={
        !disabled && <IssueDiagramsActionButton issueServiceType={issueServiceType} disabled={disabled} />
      }
    />
  );
});
