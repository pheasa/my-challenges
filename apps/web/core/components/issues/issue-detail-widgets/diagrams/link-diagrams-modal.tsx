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
    const ids = new Set<string>();
    issueDiagramIds.forEach((id) => {
      ids.add(id);
      const d = getDiagramById(id);
      if (d) {
        if (d.diagram_id) ids.add(d.diagram_id);
        if (d.diagram) ids.add(d.diagram);
        if (d.diagram_detail?.id) ids.add(d.diagram_detail.id);
        if (d.id) ids.add(d.id);
      }
    });
    return Array.from(ids);
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

  const unlinkedDiagrams = useMemo(() => {
    return allDiagrams.filter((diagram) => !linkedDiagramIds.includes(diagram.id));
  }, [allDiagrams, linkedDiagramIds]);

  const filteredDiagrams = useMemo(() => {
    if (!debouncedSearch.trim()) return unlinkedDiagrams;
    return unlinkedDiagrams.filter((diagram) =>
      diagram.name?.toLowerCase().includes(debouncedSearch.toLowerCase().trim())
    );
  }, [unlinkedDiagrams, debouncedSearch]);

  const handleToggleSelect = (diagramId: string) => {
    setSelectedDiagramIds((prev) =>
      prev.includes(diagramId) ? prev.filter((id) => id !== diagramId) : [...prev, diagramId]
    );
  };

  const handleSelectAll = () => {
    const availableIds = filteredDiagrams.map((d) => d.id);
    const areAllSelected =
      availableIds.length > 0 && availableIds.every((id) => selectedDiagramIds.includes(id));
    if (areAllSelected) {
      setSelectedDiagramIds((prev) => prev.filter((id) => !availableIds.includes(id)));
    } else {
      setSelectedDiagramIds((prev) => Array.from(new Set([...prev, ...availableIds])));
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
              <p className="text-body-sm-medium text-secondary">
                {searchQuery ? "No diagrams found" : "No available diagrams"}
              </p>
              <p className="text-caption-sm-regular text-tertiary mt-1">
                {searchQuery
                  ? "Try searching for a different term."
                  : allDiagrams.length > 0
                    ? "All diagrams in this project are already linked to this work item."
                    : "No diagrams available in this project."}
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
                const isChecked = selectedDiagramIds.includes(diagram.id);

                return (
                  <button
                    type="button"
                    key={diagram.id}
                    onClick={() => handleToggleSelect(diagram.id)}
                    className={`flex w-full items-center gap-3 p-2.5 rounded border transition-colors cursor-pointer text-left ${
                      isChecked
                        ? "border-accent-strong bg-accent-subtle"
                        : "border-subtle hover:bg-layer-1"
                    }`}
                  >
                    <div className="pointer-events-none flex items-center justify-center">
                      <Checkbox
                        checked={isChecked}
                        onChange={() => {}}
                      />
                    </div>
                    <Workflow className="h-4 w-4 text-tertiary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm-medium text-primary truncate">
                        {diagram.name || "Untitled Diagram"}
                      </p>
                    </div>
                  </button>
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
