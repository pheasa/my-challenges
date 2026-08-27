/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { makeObservable, observable, action, computed, runInAction } from "mobx";
import type { TMindmap, TMindmapFilters } from "@plane/types";
import { ProjectMindmapService } from "@/services/mindmap/project-mindmap.service";
import type { CoreRootStore } from "../root.store";

export interface IProjectMindmapStore {
  loader: boolean;
  mindmapsMap: Record<string, TMindmap>;
  currentMindmapId: string | null;
  filters: TMindmapFilters;
  getMindmapById: (mindmapId: string) => TMindmap | undefined;
  getProjectMindmapIds: (projectId: string) => string[];
  fetchMindmapsList: (workspaceSlug: string, projectId: string) => Promise<TMindmap[]>;
  fetchMindmapDetails: (workspaceSlug: string, projectId: string, mindmapId: string) => Promise<TMindmap>;
  createMindmap: (workspaceSlug: string, projectId: string, data: Partial<TMindmap>) => Promise<TMindmap>;
  updateMindmap: (
    workspaceSlug: string,
    projectId: string,
    mindmapId: string,
    data: Partial<TMindmap>
  ) => Promise<TMindmap>;
  deleteMindmap: (workspaceSlug: string, projectId: string, mindmapId: string) => Promise<void>;
  archiveMindmap: (workspaceSlug: string, projectId: string, mindmapId: string) => Promise<void>;
  unarchiveMindmap: (workspaceSlug: string, projectId: string, mindmapId: string) => Promise<void>;
  addToFavorites: (workspaceSlug: string, projectId: string, mindmapId: string) => Promise<void>;
  removeFromFavorites: (workspaceSlug: string, projectId: string, mindmapId: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
}

export class ProjectMindmapStore implements IProjectMindmapStore {
  loader: boolean = false;
  mindmapsMap: Record<string, TMindmap> = {};
  currentMindmapId: string | null = null;
  filters: TMindmapFilters = {
    searchQuery: "",
    sortKey: "created_at",
    sortBy: "desc",
  };

  private projectMindmapService: ProjectMindmapService;
  rootStore: CoreRootStore;

  constructor(rootStore: CoreRootStore) {
    makeObservable(this, {
      loader: observable,
      mindmapsMap: observable,
      currentMindmapId: observable,
      filters: observable,
      fetchMindmapsList: action,
      fetchMindmapDetails: action,
      createMindmap: action,
      updateMindmap: action,
      deleteMindmap: action,
      archiveMindmap: action,
      unarchiveMindmap: action,
      addToFavorites: action,
      removeFromFavorites: action,
      setSearchQuery: action,
    });
    this.rootStore = rootStore;
    this.projectMindmapService = new ProjectMindmapService();
  }

  getMindmapById = (mindmapId: string): TMindmap | undefined => {
    return this.mindmapsMap[mindmapId];
  };

  getProjectMindmapIds = (projectId: string): string[] => {
    return Object.values(this.mindmapsMap)
      .filter((mindmap) => mindmap.project_ids?.includes(projectId))
      .map((m) => m.id);
  };

  fetchMindmapsList = async (workspaceSlug: string, projectId: string): Promise<TMindmap[]> => {
    this.loader = true;
    try {
      const mindmaps = await this.projectMindmapService.fetchAll(workspaceSlug, projectId);
      runInAction(() => {
        mindmaps.forEach((m) => {
          this.mindmapsMap[m.id] = m;
        });
        this.loader = false;
      });
      return mindmaps;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
      });
      throw error;
    }
  };

  fetchMindmapDetails = async (
    workspaceSlug: string,
    projectId: string,
    mindmapId: string
  ): Promise<TMindmap> => {
    this.loader = true;
    try {
      const mindmap = await this.projectMindmapService.fetchById(workspaceSlug, projectId, mindmapId);
      runInAction(() => {
        this.mindmapsMap[mindmap.id] = mindmap;
        this.currentMindmapId = mindmap.id;
        this.loader = false;
      });
      return mindmap;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
      });
      throw error;
    }
  };

  createMindmap = async (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TMindmap>
  ): Promise<TMindmap> => {
    const response = await this.projectMindmapService.create(workspaceSlug, projectId, data);
    runInAction(() => {
      this.mindmapsMap[response.id] = response;
    });
    return response;
  };

  updateMindmap = async (
    workspaceSlug: string,
    projectId: string,
    mindmapId: string,
    data: Partial<TMindmap>
  ): Promise<TMindmap> => {
    // optimistic update
    if (this.mindmapsMap[mindmapId]) {
      runInAction(() => {
        this.mindmapsMap[mindmapId] = {
          ...this.mindmapsMap[mindmapId],
          ...data,
        };
      });
    }
    const response = await this.projectMindmapService.update(workspaceSlug, projectId, mindmapId, data);
    runInAction(() => {
      this.mindmapsMap[mindmapId] = response;
    });
    return response;
  };

  deleteMindmap = async (workspaceSlug: string, projectId: string, mindmapId: string): Promise<void> => {
    await this.projectMindmapService.remove(workspaceSlug, projectId, mindmapId);
    runInAction(() => {
      delete this.mindmapsMap[mindmapId];
    });
  };

  archiveMindmap = async (workspaceSlug: string, projectId: string, mindmapId: string): Promise<void> => {
    await this.projectMindmapService.archive(workspaceSlug, projectId, mindmapId);
    runInAction(() => {
      if (this.mindmapsMap[mindmapId]) {
        this.mindmapsMap[mindmapId].archived_at = new Date().toISOString();
      }
    });
  };

  unarchiveMindmap = async (workspaceSlug: string, projectId: string, mindmapId: string): Promise<void> => {
    await this.projectMindmapService.unarchive(workspaceSlug, projectId, mindmapId);
    runInAction(() => {
      if (this.mindmapsMap[mindmapId]) {
        this.mindmapsMap[mindmapId].archived_at = null;
      }
    });
  };

  addToFavorites = async (workspaceSlug: string, projectId: string, mindmapId: string): Promise<void> => {
    await this.projectMindmapService.addToFavorites(workspaceSlug, projectId, mindmapId);
    runInAction(() => {
      if (this.mindmapsMap[mindmapId]) {
        this.mindmapsMap[mindmapId].is_favorite = true;
      }
    });
  };

  removeFromFavorites = async (workspaceSlug: string, projectId: string, mindmapId: string): Promise<void> => {
    await this.projectMindmapService.removeFromFavorites(workspaceSlug, projectId, mindmapId);
    runInAction(() => {
      if (this.mindmapsMap[mindmapId]) {
        this.mindmapsMap[mindmapId].is_favorite = false;
      }
    });
  };

  setSearchQuery = (query: string) => {
    this.filters.searchQuery = query;
  };
}
