/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import type { TIssueDiagram, TIssueDiagramMap, TIssueDiagramIdMap, TIssueServiceType } from "@plane/types";
import { IssueService } from "@/services/issue";
// types
import type { IIssueDetail } from "./root.store";

export interface IIssueDiagramStoreActions {
  addDiagrams: (issueId: string, diagrams: TIssueDiagram[]) => void;
  fetchDiagrams: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueDiagram[]>;
  createDiagrams: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    diagramIds: string[]
  ) => Promise<TIssueDiagram[]>;
  removeDiagram: (workspaceSlug: string, projectId: string, issueId: string, diagramId: string) => Promise<void>;
}

export interface IIssueDiagramStore extends IIssueDiagramStoreActions {
  // observables
  diagrams: TIssueDiagramIdMap;
  diagramMap: TIssueDiagramMap;
  // computed
  issueDiagrams: string[] | undefined;
  // helper methods
  getDiagramsByIssueId: (issueId: string) => string[] | undefined;
  getDiagramById: (diagramId: string) => TIssueDiagram | undefined;
}

export class IssueDiagramStore implements IIssueDiagramStore {
  // observables
  diagrams: TIssueDiagramIdMap = {};
  diagramMap: TIssueDiagramMap = {};
  // root store
  rootIssueDetailStore: IIssueDetail;
  // services
  issueService: IssueService;
  serviceType: TIssueServiceType;

  constructor(rootStore: IIssueDetail, serviceType: TIssueServiceType) {
    makeObservable(this, {
      // observables
      diagrams: observable,
      diagramMap: observable,
      // computed
      issueDiagrams: computed,
      // actions
      addDiagrams: action.bound,
      fetchDiagrams: action,
      createDiagrams: action,
      removeDiagram: action,
    });
    this.serviceType = serviceType;
    this.rootIssueDetailStore = rootStore;
    this.issueService = new IssueService(serviceType);
  }

  // computed
  get issueDiagrams() {
    const issueId = this.rootIssueDetailStore.peekIssue?.issueId;
    if (!issueId) return undefined;
    return this.diagrams[issueId] ?? undefined;
  }

  // helper methods
  getDiagramsByIssueId = (issueId: string) => {
    if (!issueId) return undefined;
    return this.diagrams[issueId] ?? undefined;
  };

  getDiagramById = (diagramId: string) => {
    if (!diagramId) return undefined;
    return this.diagramMap[diagramId] ?? undefined;
  };

  // actions
  addDiagrams = (issueId: string, diagrams: TIssueDiagram[]) => {
    runInAction(() => {
      this.diagrams[issueId] = diagrams.map((diagram) => diagram.id);
      diagrams.forEach((diagram) => set(this.diagramMap, diagram.id, diagram));
    });
  };

  fetchDiagrams = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const response = await this.issueService.fetchIssueDiagrams(workspaceSlug, projectId, issueId);
    this.addDiagrams(issueId, response);
    return response;
  };

  createDiagrams = async (workspaceSlug: string, projectId: string, issueId: string, diagramIds: string[]) => {
    const response = await this.issueService.createIssueDiagrams(workspaceSlug, projectId, issueId, diagramIds);
    runInAction(() => {
      if (!this.diagrams[issueId]) {
        this.diagrams[issueId] = [];
      }
      response.forEach((item) => {
        if (!this.diagrams[issueId].includes(item.id)) {
          this.diagrams[issueId].push(item.id);
        }
        set(this.diagramMap, item.id, item);
      });
    });
    // fetching activity
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return response;
  };

  removeDiagram = async (workspaceSlug: string, projectId: string, issueId: string, diagramId: string) => {
    // diagramId can be IssueDiagram id or Diagram id
    const issueDiagram = this.diagramMap[diagramId];
    const targetDiagramId = issueDiagram
      ? issueDiagram.diagram_id || issueDiagram.diagram || issueDiagram.diagram_detail?.id || issueDiagram.id
      : diagramId;
    const issueDiagramId = issueDiagram ? issueDiagram.id : diagramId;

    await this.issueService.deleteIssueDiagram(workspaceSlug, projectId, issueId, targetDiagramId);

    if (this.diagrams[issueId]) {
      const diagramIndex = this.diagrams[issueId].findIndex((id) => id === issueDiagramId || id === diagramId);
      if (diagramIndex >= 0) {
        runInAction(() => {
          this.diagrams[issueId].splice(diagramIndex, 1);
          delete this.diagramMap[issueDiagramId];
          delete this.diagramMap[diagramId];
        });
      }
    }

    // fetching activity
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
  };
}
