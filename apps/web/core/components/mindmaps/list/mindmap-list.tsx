/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Star, Trash2, Brain } from "lucide-react";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { MindmapIcon } from "@plane/propel/icons";
import type { TMindmap } from "@plane/types";
import { Input, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { useMindmap } from "@/hooks/store/use-mindmap";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const MindmapList = observer(function MindmapList({ workspaceSlug, projectId }: Props) {
  const router = useRouter();
  const { mindmapsMap, createMindmap, deleteMindmap, addToFavorites, removeFromFavorites } = useMindmap();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const projectMindmaps = Object.values(mindmapsMap).filter((m) =>
    search ? m.name?.toLowerCase().includes(search.toLowerCase()) : true
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    try {
      const created = await createMindmap(workspaceSlug, projectId, {
        name: newTitle.trim(),
      });
      setToast({
        type: "success",
        title: "Mindmap created",
        message: "New mindmap created successfully.",
      });
      setIsModalOpen(false);
      setNewTitle("");
      router.push(`/${workspaceSlug}/projects/${projectId}/mindmaps/${created.id}`);
    } catch (error) {
      setToast({
        type: "error",
        title: "Error",
        message: "Could not create mindmap.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, mindmapId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this mindmap?")) return;

    try {
      await deleteMindmap(workspaceSlug, projectId, mindmapId);
      setToast({
        type: "success",
        title: "Deleted",
        message: "Mindmap deleted successfully.",
      });
    } catch (error) {
      setToast({
        type: "error",
        title: "Error",
        message: "Could not delete mindmap.",
      });
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, mindmap: TMindmap) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (mindmap.is_favorite) {
        await removeFromFavorites(workspaceSlug, projectId, mindmap.id);
      } else {
        await addToFavorites(workspaceSlug, projectId, mindmap.id);
      }
    } catch (error) {
      // ignore
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-canvas text-primary">
      {/* Subheader Toolbar */}
      <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-subtle bg-surface-1">
        <div className="flex items-center gap-2">
          <span className="text-13 font-medium text-secondary">All Mindmaps</span>
          <span className="text-11 text-tertiary bg-surface-2 px-2 py-0.5 rounded-full">
            {projectMindmaps.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-placeholder" />
            <input
              type="text"
              placeholder="Search mindmaps..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-12 bg-surface-2 rounded-md border border-subtle focus:border-strong focus:outline-none text-primary placeholder:text-placeholder w-48 sm:w-60 transition"
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            prependIcon={<Plus className="size-3.5" />}
          >
            New Mindmap
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
        {projectMindmaps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectMindmaps.map((mindmap) => (
              <Link
                key={mindmap.id}
                href={`/${workspaceSlug}/projects/${projectId}/mindmaps/${mindmap.id}`}
                className="group relative flex flex-col p-4 bg-surface-1 hover:bg-surface-2 border border-subtle hover:border-strong rounded-lg shadow-2xs transition duration-150"
              >
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-surface-2 group-hover:bg-surface-1 text-primary rounded-md border border-subtle">
                    <Brain className="size-4 text-primary" />
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(e, mindmap)}
                      className={`p-1.5 rounded-md hover:bg-layer-transparent-hover transition ${
                        mindmap.is_favorite ? "text-amber-500 opacity-100" : "text-placeholder"
                      }`}
                    >
                      <Star className="size-3.5 fill-current" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, mindmap.id)}
                      className="p-1.5 rounded-md text-placeholder hover:text-danger-primary hover:bg-layer-transparent-hover transition"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-medium text-primary text-13 truncate">
                    {mindmap.name || "Untitled Mindmap"}
                  </h3>
                  <p className="text-11 text-tertiary mt-0.5">
                    Updated {mindmap.updated_at ? new Date(mindmap.updated_at).toLocaleDateString() : "recently"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-3.5 bg-surface-2 text-secondary rounded-xl mb-3 border border-subtle">
              <MindmapIcon className="size-8 text-secondary" />
            </div>
            <h2 className="text-14 font-semibold text-primary">No mindmaps yet</h2>
            <p className="text-12 text-secondary max-w-sm mt-1 mb-5">
              Get started by creating your first mindmap to visualize connected thoughts and ideas.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              prependIcon={<Plus className="size-3.5" />}
            >
              Create Mindmap
            </Button>
          </div>
        )}
      </div>

      {/* Create Mindmap Modal */}
      <ModalCore
        isOpen={isModalOpen}
        handleClose={() => setIsModalOpen(false)}
        position={EModalPosition.CENTER}
        width={EModalWidth.MD}
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4 p-6 bg-surface-1 text-primary">
          <div>
            <h3 className="text-16 font-semibold text-primary">Create New Mindmap</h3>
            <p className="text-12 text-secondary mt-0.5">
              Give your mindmap a title to begin brainstorming.
            </p>
          </div>

          <div className="space-y-1.5 mt-2">
            <label htmlFor="mindmap-title" className="text-12 font-medium text-secondary">
              Title
            </label>
            <Input
              id="mindmap-title"
              name="mindmapTitle"
              type="text"
              required
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Product Architecture & Strategy"
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
    </div>
  );
});
