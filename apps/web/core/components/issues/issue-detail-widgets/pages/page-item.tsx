/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import Link from "next/link";
import { observer } from "mobx-react";
import { ExternalLink, FileText, Trash2 } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssuePage, TIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issuePage: TIssuePage;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const PageItem = observer(function PageItem(props: Props) {
  const { workspaceSlug, projectId, issueId, issuePage, disabled = false, issueServiceType } = props;

  const {
    page: { removePage },
  } = useIssueDetail(issueServiceType);

  const [isDeleting, setIsDeleting] = useState(false);

  const pageId = issuePage.page_id || issuePage.page || issuePage.page_detail?.id;
  const pageName = issuePage.page_detail?.name || "Untitled Page";
  const pageUrl = `/${workspaceSlug}/projects/${projectId}/pages/${pageId}`;

  const handleUnlink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsDeleting(true);
      await removePage(workspaceSlug, projectId, issueId, issuePage.id);
    } catch (error) {
      console.error("Failed to unlink page:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="group flex items-center justify-between gap-2 px-3 py-2 rounded-md hover:bg-layer-1 border border-transparent hover:border-subtle transition-colors">
      <Link
        href={pageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 min-w-0 flex-1 text-secondary hover:text-primary transition-colors"
      >
        <FileText className="h-4 w-4 text-tertiary flex-shrink-0" />
        <span className="text-body-sm-medium truncate">{pageName}</span>
        <ExternalLink className="h-3 w-3 text-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </Link>

      {!disabled && (
        <Tooltip tooltipContent="Unlink page">
          <button
            type="button"
            onClick={handleUnlink}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-100 p-1 text-tertiary hover:text-danger-primary rounded transition-all cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      )}
    </div>
  );
});
