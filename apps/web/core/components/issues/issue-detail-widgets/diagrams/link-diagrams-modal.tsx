/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Workflow, Search } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueServiceType, TDiagram } from "@plane/types";
import { Checkbox, Input, ModalCore, EModalPosition, EModalWidth, Loader } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useDiagram } from "@/hooks/store/use-diagram";
import useDebounce from "@/hooks/use-debounce";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  isOpen: boolean;
  onClose: () => void;
  issueServiceType: TIssueServiceType;
};

type TValidDiagram = TDiagram & { id: string };

export const LinkDiagramsModal = observer(function LinkDiagramsModal(props: Props) {
  const { workspaceSlug, projectId, issueId, isOpen, onClose, issueServiceType } = props;
  const { t } = useTranslation();

  const {
    diagram: { getDiagramsByIssueId, getDiagramById, createDiagrams },
  } = useIssueDetail(issueServiceType);

  const projectDiagramStore = useDiagram();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiagramIds, setSelectedDiagramIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Linked diagram IDs for this issue
  const linkedDiagramIds = useMemo(() => {
    const issueDiagramIds = getDiagramsByIssueId(issueId) || [];
    return issueDiagramIds.map((id) => {
      const d = getDiagramById(id);
      return d?.diagram_id || id;
    });
  }, [getDiagramsByIssueId, getDiagramById, issueId]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      projectDiagramStore
        .fetchDiagramsList(workspaceSlug, projectId)
        .finally(() => setIsLoading(false));
      setSelectedDiagramIds([]);
      setSearchQuery("");
    }
  }, [isOpen, workspaceSlug, projectId, projectDiagramStore]);

  const allDiagrams: TValidDiagram[] = useMemo(() => {
    const diagramRecords = projectDiagramStore.diagramsMap || {};
    return Object.values(diagramRecords).filter(
      (diagram): diagram is TValidDiagram => !!diagram && typeof diagram.id === "string" && !diagram.archived_at
    );
  }, [projectDiagramStore.diagramsMap]);

  const filteredDiagrams = useMemo(() => {
    if (!debouncedSearch.trim()) return allDiagrams;
    return allDiagrams.filter((diagram) =>
      diagram.name?.toLowerCase().includes(debouncedSearch.toLowerCase().trim())
    );
  }, [allDiagrams, debouncedSearch]);

  const handleToggleSelect = (diagramId: string) => {
    if (linkedDiagramIds.includes(diagramId)) return;
    setSelectedDiagramIds((prev) =>
      prev.includes(diagramId) ? prev.filter((id) => id !== diagramId) : [...prev, diagramId]
    );
  };

  const handleSelectAll = () => {
    const unlinkedFilteredIds = filteredDiagrams
      .filter((d) => !linkedDiagramIds.includes(d.id))
      .map((d) => d.id);

    const areAllSelected = unlinkedFilteredIds.length > 0 && unlinkedFilteredIds.every((id) => selectedDiagramIds.includes(id));
    if (areAllSelected) {
      setSelectedDiagramIds((prev) => prev.filter((id) => !unlinkedFilteredIds.includes(id)));
    } else {
      setSelectedDiagramIds((prev) => Array.from(new Set([...prev, ...unlinkedFilteredIds])));
    }
  };

  const handleSubmit = async () => {
    if (selectedDiagramIds.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please select at least one diagram to link.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await createDiagrams(workspaceSlug, projectId, issueId, selectedDiagramIds);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Diagrams linked successfully.",
      });
      onClose();
    } catch (error) {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to link diagrams.",
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
          <h3 className="text-h4-medium text-primary">Link Diagram</h3>
          <p className="text-caption-sm-regular text-secondary mt-0.5">
            Select diagrams from this project to link with this work item.
          </p>
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-tertiary" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search diagrams..."
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
          ) : filteredDiagrams.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <Workflow className="h-10 w-10 text-tertiary mb-2" />
              <p className="text-body-sm-medium text-secondary">No diagrams found</p>
              <p className="text-caption-sm-regular text-tertiary mt-1">
                {searchQuery ? "Try searching for a different term." : "No diagrams available in this project."}
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
                <span>{selectedDiagramIds.length} selected</span>
              </div>
              {filteredDiagrams.map((diagram) => {
                const isAlreadyLinked = linkedDiagramIds.includes(diagram.id);
                const isChecked = isAlreadyLinked || selectedDiagramIds.includes(diagram.id);

                return (
                  <div
                    key={diagram.id}
                    onClick={() => !isAlreadyLinked && handleToggleSelect(diagram.id)}
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
                      onChange={() => handleToggleSelect(diagram.id)}
                    />
                    <Workflow className="h-4 w-4 text-tertiary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm-medium text-primary truncate">
                        {diagram.name || "Untitled Diagram"}
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
            disabled={selectedDiagramIds.length === 0}
          >
            Link {selectedDiagramIds.length > 0 ? `(${selectedDiagramIds.length})` : ""} Diagrams
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
