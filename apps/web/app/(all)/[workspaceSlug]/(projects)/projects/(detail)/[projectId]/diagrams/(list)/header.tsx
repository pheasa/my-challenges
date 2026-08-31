/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@plane/propel/button";
import { DiagramIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Breadcrumbs, Header, Input, ModalCore, EModalPosition, EModalWidth } from "@plane/ui";
import { CommonProjectBreadcrumbs } from "@/components/breadcrumbs/common";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { useDiagram } from "@/hooks/store/use-diagram";
import { useProject } from "@/hooks/store/use-project";

export const DiagramsListHeader = observer(function DiagramsListHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = useParams();
  const { currentProjectDetails, loader } = useProject();
  const { createDiagram } = useDiagram();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !workspaceSlug || !projectId) return;

    setIsCreating(true);
    try {
      const created = await createDiagram(workspaceSlug.toString(), projectId.toString(), {
        name: newTitle.trim(),
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Diagram created",
        message: "New diagram created successfully.",
      });
      setIsModalOpen(false);
      setNewTitle("");
      router.push(`/${workspaceSlug}/projects/${projectId}/diagrams/${created.id}`);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Could not create diagram. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Header>
        <Header.LeftItem>
          <Breadcrumbs isLoading={loader === "init-loader"}>
            <CommonProjectBreadcrumbs workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label="Diagrams"
                  href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/diagrams/`}
                  icon={<DiagramIcon className="h-4 w-4 text-tertiary" />}
                  isLast
                />
              }
              isLast
            />
          </Breadcrumbs>
        </Header.LeftItem>
        <Header.RightItem>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            Add diagram
          </Button>
        </Header.RightItem>
      </Header>

      <ModalCore
        isOpen={isModalOpen}
        handleClose={() => setIsModalOpen(false)}
        position={EModalPosition.CENTER}
        width={EModalWidth.MD}
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4 p-6 bg-surface-1 text-primary">
          <div>
            <h3 className="text-16 font-semibold text-primary">Create New Diagram</h3>
            <p className="text-12 text-secondary mt-0.5">
              Give your diagram a title to begin designing.
            </p>
          </div>

          <div className="space-y-1.5 mt-2">
            <label htmlFor="modal-diagram-title" className="text-12 font-medium text-secondary">
              Title
            </label>
            <Input
              id="modal-diagram-title"
              name="diagramTitle"
              type="text"
              required
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Auth Flow Sequence Diagram"
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <Button
              variant="neutral-primary"
              size="sm"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isCreating || !newTitle.trim()}
              loading={isCreating}
            >
              Create
            </Button>
          </div>
        </form>
      </ModalCore>
    </>
  );
});
