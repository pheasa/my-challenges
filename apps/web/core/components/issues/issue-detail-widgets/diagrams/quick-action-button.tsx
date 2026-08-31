/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { PlusIcon } from "@plane/propel/icons";
import type { TIssueServiceType } from "@plane/types";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  customButton?: React.ReactNode;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const IssueDiagramsActionButton = observer(function IssueDiagramsActionButton(props: Props) {
  const { customButton, disabled = false, issueServiceType } = props;
  const { toggleDiagramModal } = useIssueDetail(issueServiceType);

  const handleOnClick = (e: React.MouseEvent<any>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      toggleDiagramModal(true);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOnClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleOnClick(e as any);
        }
      }}
      className={`inline-flex items-center justify-center ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {customButton ? customButton : <PlusIcon className="h-4 w-4" />}
    </div>
  );
});
