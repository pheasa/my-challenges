/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { FileText, Search } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueServiceType, TPage } from "@plane/types";
import { Checkbox, Input, ModalCore, EModalPosition, EModalWidth, Loader } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { EPageStoreType, usePageStore } from "@/hooks/store/use-page-store";
import useDebounce from "@/hooks/use-debounce";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  isOpen: boolean;
  onClose: () => void;
  issueServiceType: TIssueServiceType;
};

type TValidPage = TPage & { id: string };

export const LinkPagesModal = observer(function LinkPagesModal(props: Props) {
  const { workspaceSlug, projectId, issueId, isOpen, onClose, issueServiceType } = props;
  const { t } = useTranslation();

  const {
    page: { getPagesByIssueId, getPageById, createPages },
  } = useIssueDetail(issueServiceType);

  const projectPageStore = usePageStore(EPageStoreType.PROJECT);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Linked page IDs for this issue
  const linkedPageIds = useMemo(() => {
    const issuePageIds = getPagesByIssueId(issueId) || [];
    return issuePageIds.map((id) => {
      const p = getPageById(id);
      return p?.page_id || id;
    });
  }, [getPagesByIssueId, getPageById, issueId]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      projectPageStore
        .fetchPagesList(workspaceSlug, projectId)
        .finally(() => setIsLoading(false));
      setSelectedPageIds([]);
      setSearchQuery("");
    }
  }, [isOpen, workspaceSlug, projectId, projectPageStore]);

  const allPages = useMemo(() => {
    const pageRecords = projectPageStore.data || {};
    return Object.values(pageRecords).filter(
      (page) => !!page && !!page.id && !page.archived_at
    );
  }, [projectPageStore.data]);

  const filteredPages = useMemo(() => {
    if (!debouncedSearch.trim()) return allPages;
    return allPages.filter((page) =>
      page.name?.toLowerCase().includes(debouncedSearch.toLowerCase().trim())
    );
  }, [allPages, debouncedSearch]);

  const handleToggleSelect = (pageId: string) => {
    if (linkedPageIds.includes(pageId)) return;
    setSelectedPageIds((prev) =>
      prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId]
    );
  };

  const handleSelectAll = () => {
    const unlinkedFilteredIds = filteredPages
      .filter((p) => p.id && !linkedPageIds.includes(p.id))
      .map((p) => p.id as string);

    const areAllSelected = unlinkedFilteredIds.length > 0 && unlinkedFilteredIds.every((id) => selectedPageIds.includes(id));
    if (areAllSelected) {
      setSelectedPageIds((prev) => prev.filter((id) => !unlinkedFilteredIds.includes(id)));
    } else {
      setSelectedPageIds((prev) => Array.from(new Set([...prev, ...unlinkedFilteredIds])));
    }
  };

  const handleSubmit = async () => {
    if (selectedPageIds.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please select at least one page to link.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await createPages(workspaceSlug, projectId, issueId, selectedPageIds);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Pages linked successfully.",
      });
      onClose();
    } catch (error) {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to link pages.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={onClose}
      position={EModalPosition.TOP}
      width={EModalWidth.LG}
    >
      <div className="flex flex-col h-[500px]">
        {/* Header */}
        <div className="p-4 border-b border-subtle">
          <h3 className="text-h4-medium text-primary">Link Pages</h3>
          <p className="text-caption-sm-regular text-secondary mt-0.5">
            Select pages from this project to link with this work item.
          </p>
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-tertiary" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages..."
              className="pl-9 w-full"
            />
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="space-y-3">
              <Loader className="space-y-3">
                <Loader.Item height="40px" width="100%" />
                <Loader.Item height="40px" width="100%" />
                <Loader.Item height="40px" width="100%" />
              </Loader>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <FileText className="h-10 w-10 text-tertiary mb-2" />
              <p className="text-body-sm-medium text-secondary">No pages found</p>
              <p className="text-caption-sm-regular text-tertiary mt-1">
                {searchQuery ? "Try searching for a different term." : "No pages available in this project."}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-2 pb-2 text-caption-sm-regular text-tertiary border-b border-subtle">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="hover:text-primary transition-colors cursor-pointer"
                >
                  Select all
                </button>
                <span>{selectedPageIds.length} selected</span>
              </div>
              {filteredPages.map((page) => {
                if (!page.id) return null;
                const pageId = page.id;
                const isAlreadyLinked = linkedPageIds.includes(pageId);
                const isChecked = isAlreadyLinked || selectedPageIds.includes(pageId);

                return (
                  <div
                    key={pageId}
                    onClick={() => !isAlreadyLinked && handleToggleSelect(pageId)}
                    className={`flex items-center gap-3 p-2.5 rounded border transition-colors ${
                      isAlreadyLinked
                        ? "border-subtle bg-layer-2 opacity-60 cursor-not-allowed"
                        : isChecked
                          ? "border-accent-strong bg-accent-subtle cursor-pointer"
                          : "border-subtle hover:bg-layer-1 cursor-pointer"
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      disabled={isAlreadyLinked}
                      onChange={() => handleToggleSelect(pageId)}
                    />
                    <FileText className="h-4 w-4 text-tertiary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm-medium text-primary truncate">
                        {page.name || "Untitled Page"}
                      </p>
                    </div>
                    {isAlreadyLinked && (
                      <span className="text-caption-xs-regular text-tertiary bg-layer-3 px-2 py-0.5 rounded">
                        Already linked
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-subtle px-4 py-3 bg-layer-1">
          <Button variant="secondary" size="base" onClick={onClose} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            size="base"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={selectedPageIds.length === 0}
          >
            Link {selectedPageIds.length > 0 ? `(${selectedPageIds.length})` : ""} Pages
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
