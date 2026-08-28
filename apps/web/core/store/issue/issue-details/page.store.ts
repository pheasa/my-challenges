/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import type { TIssuePage, TIssuePageMap, TIssuePageIdMap, TIssueServiceType } from "@plane/types";
import { IssueService } from "@/services/issue";
// types
import type { IIssueDetail } from "./root.store";

export interface IIssuePageStoreActions {
  addPages: (issueId: string, pages: TIssuePage[]) => void;
  fetchPages: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssuePage[]>;
  createPages: (workspaceSlug: string, projectId: string, issueId: string, pageIds: string[]) => Promise<TIssuePage[]>;
  removePage: (workspaceSlug: string, projectId: string, issueId: string, pageId: string) => Promise<void>;
}

export interface IIssuePageStore extends IIssuePageStoreActions {
  // observables
  pages: TIssuePageIdMap;
  pageMap: TIssuePageMap;
  // computed
  issuePages: string[] | undefined;
  // helper methods
  getPagesByIssueId: (issueId: string) => string[] | undefined;
  getPageById: (pageId: string) => TIssuePage | undefined;
}

export class IssuePageStore implements IIssuePageStore {
  // observables
  pages: TIssuePageIdMap = {};
  pageMap: TIssuePageMap = {};
  // root store
  rootIssueDetailStore: IIssueDetail;
  // services
  issueService: IssueService;
  serviceType: TIssueServiceType;

  constructor(rootStore: IIssueDetail, serviceType: TIssueServiceType) {
    makeObservable(this, {
      // observables
      pages: observable,
      pageMap: observable,
      // computed
      issuePages: computed,
      // actions
      addPages: action.bound,
      fetchPages: action,
      createPages: action,
      removePage: action,
    });
    this.serviceType = serviceType;
    this.rootIssueDetailStore = rootStore;
    this.issueService = new IssueService(serviceType);
  }

  // computed
  get issuePages() {
    const issueId = this.rootIssueDetailStore.peekIssue?.issueId;
    if (!issueId) return undefined;
    return this.pages[issueId] ?? undefined;
  }

  // helper methods
  getPagesByIssueId = (issueId: string) => {
    if (!issueId) return undefined;
    return this.pages[issueId] ?? undefined;
  };

  getPageById = (pageId: string) => {
    if (!pageId) return undefined;
    return this.pageMap[pageId] ?? undefined;
  };

  // actions
  addPages = (issueId: string, pages: TIssuePage[]) => {
    runInAction(() => {
      this.pages[issueId] = pages.map((page) => page.id);
      pages.forEach((page) => set(this.pageMap, page.id, page));
    });
  };

  fetchPages = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const response = await this.issueService.fetchIssuePages(workspaceSlug, projectId, issueId);
    this.addPages(issueId, response);
    return response;
  };

  createPages = async (workspaceSlug: string, projectId: string, issueId: string, pageIds: string[]) => {
    const response = await this.issueService.createIssuePages(workspaceSlug, projectId, issueId, pageIds);
    runInAction(() => {
      if (!this.pages[issueId]) {
        this.pages[issueId] = [];
      }
      response.forEach((item) => {
        if (!this.pages[issueId].includes(item.id)) {
          this.pages[issueId].push(item.id);
        }
        set(this.pageMap, item.id, item);
      });
    });
    // fetching activity
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return response;
  };

  removePage = async (workspaceSlug: string, projectId: string, issueId: string, pageId: string) => {
    // pageId can be IssuePage id or Page id
    const issuePage = this.pageMap[pageId];
    const targetPageId = issuePage
      ? issuePage.page_id || issuePage.page || issuePage.page_detail?.id || issuePage.id
      : pageId;
    const issuePageId = issuePage ? issuePage.id : pageId;

    await this.issueService.deleteIssuePage(workspaceSlug, projectId, issueId, targetPageId);

    if (this.pages[issueId]) {
      const pageIndex = this.pages[issueId].findIndex((id) => id === issuePageId || id === pageId);
      if (pageIndex >= 0) {
        runInAction(() => {
          this.pages[issueId].splice(pageIndex, 1);
          delete this.pageMap[issuePageId];
          delete this.pageMap[pageId];
        });
      }
    }

    // fetching activity
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
  };
}
