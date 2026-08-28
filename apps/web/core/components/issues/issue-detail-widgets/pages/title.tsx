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
import { IssuePagesActionButton } from "./quick-action-button";

type Props = {
  isOpen: boolean;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
};

export const IssuePagesCollapsibleTitle = observer(function IssuePagesCollapsibleTitle(props: Props) {
  const { isOpen, issueId, disabled, issueServiceType } = props;

  const {
    page: { getPagesByIssueId },
  } = useIssueDetail(issueServiceType);

  const pagesCount = getPagesByIssueId(issueId)?.length ?? 0;

  const indicatorElement = useMemo(
    () => (
      <span className="flex items-center justify-center">
        <p className="text-14 !leading-3 text-tertiary">{pagesCount}</p>
      </span>
    ),
    [pagesCount]
  );

  return (
    <CollapsibleButton
      isOpen={isOpen}
      title="Pages"
      indicatorElement={indicatorElement}
      actionItemElement={
        !disabled && <IssuePagesActionButton issueServiceType={issueServiceType} disabled={disabled} />
      }
    />
  );
});
