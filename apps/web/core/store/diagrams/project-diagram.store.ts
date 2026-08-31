/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { makeObservable, observable, action, runInAction } from "mobx";
import type { TDiagram, TDiagramFilters } from "@plane/types";
import { ProjectDiagramService } from "@/services/diagram/project-diagram.service";
import type { CoreRootStore } from "../root.store";

export interface IProjectDiagramStore {
  loader: boolean;
  diagramsMap: Record<string, TDiagram>;
  currentDiagramId: string | null;
  filters: TDiagramFilters;
  getDiagramById: (diagramId: string) => TDiagram | undefined;
  getProjectDiagramIds: (projectId: string) => string[];
  fetchDiagramsList: (workspaceSlug: string, projectId: string) => Promise<TDiagram[]>;
  fetchDiagramDetails: (workspaceSlug: string, projectId: string, diagramId: string) => Promise<TDiagram>;
  createDiagram: (workspaceSlug: string, projectId: string, data: Partial<TDiagram>) => Promise<TDiagram>;
  updateDiagram: (
    workspaceSlug: string,
    projectId: string,
    diagramId: string,
    data: Partial<TDiagram>
  ) => Promise<TDiagram>;
  deleteDiagram: (workspaceSlug: string, projectId: string, diagramId: string) => Promise<void>;
  archiveDiagram: (workspaceSlug: string, projectId: string, diagramId: string) => Promise<void>;
  unarchiveDiagram: (workspaceSlug: string, projectId: string, diagramId: string) => Promise<void>;
  addToFavorites: (workspaceSlug: string, projectId: string, diagramId: string) => Promise<void>;
  removeFromFavorites: (workspaceSlug: string, projectId: string, diagramId: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
}

export class ProjectDiagramStore implements IProjectDiagramStore {
  loader: boolean = false;
  diagramsMap: Record<string, TDiagram> = {};
  currentDiagramId: string | null = null;
  filters: TDiagramFilters = {
    searchQuery: "",
    sortKey: "created_at",
    sortBy: "desc",
  };

  private projectDiagramService: ProjectDiagramService;
  rootStore: CoreRootStore;

  constructor(rootStore: CoreRootStore) {
    makeObservable(this, {
      loader: observable,
      diagramsMap: observable,
      currentDiagramId: observable,
      filters: observable,
      fetchDiagramsList: action,
      fetchDiagramDetails: action,
      createDiagram: action,
      updateDiagram: action,
      deleteDiagram: action,
      archiveDiagram: action,
      unarchiveDiagram: action,
      addToFavorites: action,
      removeFromFavorites: action,
      setSearchQuery: action,
    });
    this.rootStore = rootStore;
    this.projectDiagramService = new ProjectDiagramService();
  }

  getDiagramById = (diagramId: string): TDiagram | undefined => {
    return this.diagramsMap[diagramId];
  };

  getProjectDiagramIds = (projectId: string): string[] => {
    return Object.values(this.diagramsMap)
      .filter((diagram) => diagram.project_ids?.includes(projectId))
      .map((d) => d.id);
  };

  fetchDiagramsList = async (workspaceSlug: string, projectId: string): Promise<TDiagram[]> => {
    this.loader = true;
    try {
      const diagrams = await this.projectDiagramService.fetchAll(workspaceSlug, projectId);
      runInAction(() => {
        diagrams.forEach((d) => {
          this.diagramsMap[d.id] = d;
        });
        this.loader = false;
      });
      return diagrams;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
      });
      throw error;
    }
  };

  fetchDiagramDetails = async (
    workspaceSlug: string,
    projectId: string,
    diagramId: string
  ): Promise<TDiagram> => {
    this.loader = true;
    try {
      const diagram = await this.projectDiagramService.fetchById(workspaceSlug, projectId, diagramId);
      runInAction(() => {
        this.diagramsMap[diagram.id] = diagram;
        this.currentDiagramId = diagram.id;
        this.loader = false;
      });
      return diagram;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
      });
      throw error;
    }
  };

  createDiagram = async (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TDiagram>
  ): Promise<TDiagram> => {
    const response = await this.projectDiagramService.create(workspaceSlug, projectId, data);
    runInAction(() => {
      this.diagramsMap[response.id] = response;
    });
    return response;
  };

  updateDiagram = async (
    workspaceSlug: string,
    projectId: string,
    diagramId: string,
    data: Partial<TDiagram>
  ): Promise<TDiagram> => {
    // optimistic update
    if (this.diagramsMap[diagramId]) {
      runInAction(() => {
        this.diagramsMap[diagramId] = {
          ...this.diagramsMap[diagramId],
          ...data,
        };
      });
    }
    const response = await this.projectDiagramService.update(workspaceSlug, projectId, diagramId, data);
    runInAction(() => {
      this.diagramsMap[diagramId] = response;
    });
    return response;
  };

  deleteDiagram = async (workspaceSlug: string, projectId: string, diagramId: string): Promise<void> => {
    await this.projectDiagramService.remove(workspaceSlug, projectId, diagramId);
    runInAction(() => {
      delete this.diagramsMap[diagramId];
    });
  };

  archiveDiagram = async (workspaceSlug: string, projectId: string, diagramId: string): Promise<void> => {
    await this.projectDiagramService.archive(workspaceSlug, projectId, diagramId);
    runInAction(() => {
      if (this.diagramsMap[diagramId]) {
        this.diagramsMap[diagramId].archived_at = new Date().toISOString();
      }
    });
  };

  unarchiveDiagram = async (workspaceSlug: string, projectId: string, diagramId: string): Promise<void> => {
    await this.projectDiagramService.unarchive(workspaceSlug, projectId, diagramId);
    runInAction(() => {
      if (this.diagramsMap[diagramId]) {
        this.diagramsMap[diagramId].archived_at = null;
      }
    });
  };

  addToFavorites = async (workspaceSlug: string, projectId: string, diagramId: string): Promise<void> => {
    await this.projectDiagramService.addToFavorites(workspaceSlug, projectId, diagramId);
    runInAction(() => {
      if (this.diagramsMap[diagramId]) {
        this.diagramsMap[diagramId].is_favorite = true;
      }
    });
  };

  removeFromFavorites = async (workspaceSlug: string, projectId: string, diagramId: string): Promise<void> => {
    await this.projectDiagramService.removeFromFavorites(workspaceSlug, projectId, diagramId);
    runInAction(() => {
      if (this.diagramsMap[diagramId]) {
        this.diagramsMap[diagramId].is_favorite = false;
      }
    });
  };

  setSearchQuery = (query: string) => {
    this.filters.searchQuery = query;
  };
}
