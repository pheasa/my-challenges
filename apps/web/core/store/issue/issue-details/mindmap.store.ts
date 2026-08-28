/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import type { TIssueMindmap, TIssueMindmapMap, TIssueMindmapIdMap, TIssueServiceType } from "@plane/types";
import { IssueService } from "@/services/issue";
// types
import type { IIssueDetail } from "./root.store";

export interface IIssueMindmapStoreActions {
  addMindmaps: (issueId: string, mindmaps: TIssueMindmap[]) => void;
  fetchMindmaps: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueMindmap[]>;
  createMindmaps: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    mindmapIds: string[]
  ) => Promise<TIssueMindmap[]>;
  removeMindmap: (workspaceSlug: string, projectId: string, issueId: string, mindmapId: string) => Promise<void>;
}

export interface IIssueMindmapStore extends IIssueMindmapStoreActions {
  // observables
  mindmaps: TIssueMindmapIdMap;
  mindmapMap: TIssueMindmapMap;
  // computed
  issueMindmaps: string[] | undefined;
  // helper methods
  getMindmapsByIssueId: (issueId: string) => string[] | undefined;
  getMindmapById: (mindmapId: string) => TIssueMindmap | undefined;
}

export class IssueMindmapStore implements IIssueMindmapStore {
  // observables
  mindmaps: TIssueMindmapIdMap = {};
  mindmapMap: TIssueMindmapMap = {};
  // root store
  rootIssueDetailStore: IIssueDetail;
  // services
  issueService: IssueService;
  serviceType: TIssueServiceType;

  constructor(rootStore: IIssueDetail, serviceType: TIssueServiceType) {
    makeObservable(this, {
      // observables
      mindmaps: observable,
      mindmapMap: observable,
      // computed
      issueMindmaps: computed,
      // actions
      addMindmaps: action.bound,
      fetchMindmaps: action,
      createMindmaps: action,
      removeMindmap: action,
    });
    this.serviceType = serviceType;
    this.rootIssueDetailStore = rootStore;
    this.issueService = new IssueService(serviceType);
  }

  // computed
  get issueMindmaps() {
    const issueId = this.rootIssueDetailStore.peekIssue?.issueId;
    if (!issueId) return undefined;
    return this.mindmaps[issueId] ?? undefined;
  }

  // helper methods
  getMindmapsByIssueId = (issueId: string) => {
    if (!issueId) return undefined;
    return this.mindmaps[issueId] ?? undefined;
  };

  getMindmapById = (mindmapId: string) => {
    if (!mindmapId) return undefined;
    return this.mindmapMap[mindmapId] ?? undefined;
  };

  // actions
  addMindmaps = (issueId: string, mindmaps: TIssueMindmap[]) => {
    runInAction(() => {
      this.mindmaps[issueId] = mindmaps.map((mindmap) => mindmap.id);
      mindmaps.forEach((mindmap) => set(this.mindmapMap, mindmap.id, mindmap));
    });
  };

  fetchMindmaps = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const response = await this.issueService.fetchIssueMindmaps(workspaceSlug, projectId, issueId);
    this.addMindmaps(issueId, response);
    return response;
  };

  createMindmaps = async (workspaceSlug: string, projectId: string, issueId: string, mindmapIds: string[]) => {
    const response = await this.issueService.createIssueMindmaps(workspaceSlug, projectId, issueId, mindmapIds);
    runInAction(() => {
      if (!this.mindmaps[issueId]) {
        this.mindmaps[issueId] = [];
      }
      response.forEach((item) => {
        if (!this.mindmaps[issueId].includes(item.id)) {
          this.mindmaps[issueId].push(item.id);
        }
        set(this.mindmapMap, item.id, item);
      });
    });
    // fetching activity
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return response;
  };

  removeMindmap = async (workspaceSlug: string, projectId: string, issueId: string, mindmapId: string) => {
    // mindmapId can be IssueMindmap id or Mindmap id
    const issueMindmap = this.mindmapMap[mindmapId];
    const targetMindmapId = issueMindmap
      ? issueMindmap.mindmap_id || issueMindmap.mindmap || issueMindmap.mindmap_detail?.id || issueMindmap.id
      : mindmapId;
    const issueMindmapId = issueMindmap ? issueMindmap.id : mindmapId;

    await this.issueService.deleteIssueMindmap(workspaceSlug, projectId, issueId, targetMindmapId);

    if (this.mindmaps[issueId]) {
      const mindmapIndex = this.mindmaps[issueId].findIndex((id) => id === issueMindmapId || id === mindmapId);
      if (mindmapIndex >= 0) {
        runInAction(() => {
          this.mindmaps[issueId].splice(mindmapIndex, 1);
          delete this.mindmapMap[issueMindmapId];
          delete this.mindmapMap[mindmapId];
        });
      }
    }

    // fetching activity
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
  };
}
