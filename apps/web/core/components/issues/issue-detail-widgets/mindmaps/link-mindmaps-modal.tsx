/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { GitFork, Search } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueServiceType, TMindmap } from "@plane/types";
import { Checkbox, Input, ModalCore, EModalPosition, EModalWidth, Loader } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMindmap } from "@/hooks/store/use-mindmap";
import useDebounce from "@/hooks/use-debounce";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  isOpen: boolean;
  onClose: () => void;
  issueServiceType: TIssueServiceType;
};

type TValidMindmap = TMindmap & { id: string };

export const LinkMindmapsModal = observer(function LinkMindmapsModal(props: Props) {
  const { workspaceSlug, projectId, issueId, isOpen, onClose, issueServiceType } = props;
  const { t } = useTranslation();

  const {
    mindmap: { getMindmapsByIssueId, getMindmapById, createMindmaps },
  } = useIssueDetail(issueServiceType);

  const projectMindmapStore = useMindmap();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMindmapIds, setSelectedMindmapIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Linked mindmap IDs for this issue
  const linkedMindmapIds = useMemo(() => {
    const issueMindmapIds = getMindmapsByIssueId(issueId) || [];
    return issueMindmapIds.map((id) => {
      const m = getMindmapById(id);
      return m?.mindmap_id || id;
    });
  }, [getMindmapsByIssueId, getMindmapById, issueId]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      projectMindmapStore
        .fetchMindmapsList(workspaceSlug, projectId)
        .finally(() => setIsLoading(false));
      setSelectedMindmapIds([]);
      setSearchQuery("");
    }
  }, [isOpen, workspaceSlug, projectId, projectMindmapStore]);

  const allMindmaps: TValidMindmap[] = useMemo(() => {
    const mindmapRecords = projectMindmapStore.mindmapsMap || {};
    return Object.values(mindmapRecords).filter(
      (mindmap): mindmap is TValidMindmap => !!mindmap && typeof mindmap.id === "string" && !mindmap.archived_at
    );
  }, [projectMindmapStore.mindmapsMap]);

  const filteredMindmaps = useMemo(() => {
    if (!debouncedSearch.trim()) return allMindmaps;
    return allMindmaps.filter((mindmap) =>
      mindmap.name?.toLowerCase().includes(debouncedSearch.toLowerCase().trim())
    );
  }, [allMindmaps, debouncedSearch]);

  const handleToggleSelect = (mindmapId: string) => {
    if (linkedMindmapIds.includes(mindmapId)) return;
    setSelectedMindmapIds((prev) =>
      prev.includes(mindmapId) ? prev.filter((id) => id !== mindmapId) : [...prev, mindmapId]
    );
  };

  const handleSelectAll = () => {
    const unlinkedFilteredIds = filteredMindmaps
      .filter((m) => !linkedMindmapIds.includes(m.id))
      .map((m) => m.id);

    const areAllSelected = unlinkedFilteredIds.length > 0 && unlinkedFilteredIds.every((id) => selectedMindmapIds.includes(id));
    if (areAllSelected) {
      setSelectedMindmapIds((prev) => prev.filter((id) => !unlinkedFilteredIds.includes(id)));
    } else {
      setSelectedMindmapIds((prev) => Array.from(new Set([...prev, ...unlinkedFilteredIds])));
    }
  };

  const handleSubmit = async () => {
    if (selectedMindmapIds.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please select at least one mindmap to link.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await createMindmaps(workspaceSlug, projectId, issueId, selectedMindmapIds);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Mindmaps linked successfully.",
      });
      onClose();
    } catch (error) {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to link mindmaps.",
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
          <h3 className="text-h4-medium text-primary">Link Mindmap</h3>
          <p className="text-caption-sm-regular text-secondary mt-0.5">
            Select mindmaps from this project to link with this work item.
          </p>
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-tertiary" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mindmaps..."
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
          ) : filteredMindmaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <GitFork className="h-10 w-10 text-tertiary mb-2" />
              <p className="text-body-sm-medium text-secondary">No mindmaps found</p>
              <p className="text-caption-sm-regular text-tertiary mt-1">
                {searchQuery ? "Try searching for a different term." : "No mindmaps available in this project."}
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
                <span>{selectedMindmapIds.length} selected</span>
              </div>
              {filteredMindmaps.map((mindmap) => {
                const isAlreadyLinked = linkedMindmapIds.includes(mindmap.id);
                const isChecked = isAlreadyLinked || selectedMindmapIds.includes(mindmap.id);

                return (
                  <div
                    key={mindmap.id}
                    onClick={() => !isAlreadyLinked && handleToggleSelect(mindmap.id)}
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
                      onChange={() => handleToggleSelect(mindmap.id)}
                    />
                    <GitFork className="h-4 w-4 text-tertiary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm-medium text-primary truncate">
                        {mindmap.name || "Untitled Mindmap"}
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
            disabled={selectedMindmapIds.length === 0}
          >
            Link {selectedMindmapIds.length > 0 ? `(${selectedMindmapIds.length})` : ""} Mindmaps
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
