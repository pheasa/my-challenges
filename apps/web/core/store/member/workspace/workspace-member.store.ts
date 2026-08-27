/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set, sortBy } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import type { EUserPermissions } from "@plane/constants";
import type {
  IWorkspaceBulkInviteFormData,
  IWorkspaceMember,
  IWorkspaceMemberInvitation,
  ITeamWork,
} from "@plane/types";
// services
import { WorkspaceService } from "@/services/workspace.service";
// types
import type { IRouterStore } from "@/store/router.store";
import type { IUserStore } from "@/store/user";
// store
import type { IMemberRootStore } from "../index.ts";
import type { IWorkspaceMemberFiltersStore } from "./workspace-member-filters.store";
import { WorkspaceMemberFiltersStore } from "./workspace-member-filters.store";
import type { RootStore } from "@/store/root.store";

export interface IWorkspaceMembership {
  id: string;
  member: string;
  role: EUserPermissions;
  is_active?: boolean;
}

export interface IWorkspaceMemberStore {
  // observables
  workspaceMemberMap: Record<string, Record<string, IWorkspaceMembership>>;
  workspaceMemberInvitations: Record<string, IWorkspaceMemberInvitation[]>;
  teamWorkMap: Record<string, Record<string, ITeamWork>>;
  projectTeamWorkMap: Record<string, Record<string, ITeamWork>>;
  // filters store
  filtersStore: IWorkspaceMemberFiltersStore;
  // computed
  workspaceMemberIds: string[] | null;
  workspaceMemberInvitationIds: string[] | null;
  teamWorkIds: string[] | null;
  memberMap: Record<string, IWorkspaceMembership> | null;
  // computed actions
  getWorkspaceMemberIds: (workspaceSlug: string) => string[];
  getFilteredWorkspaceMemberIds: (workspaceSlug: string) => string[];
  getSearchedWorkspaceMemberIds: (searchQuery: string) => string[] | null;
  getSearchedWorkspaceInvitationIds: (searchQuery: string) => string[] | null;
  getWorkspaceMemberDetails: (workspaceMemberId: string) => IWorkspaceMember | null;
  getWorkspaceInvitationDetails: (invitationId: string) => IWorkspaceMemberInvitation | null;
  getTeamWorkDetails: (teamWorkId: string) => ITeamWork | null;
  getSearchedTeamWorkIds: (searchQuery: string) => string[] | null;
  getProjectTeamWorkIds: (projectId: string) => string[] | null;
  getProjectTeamWorkDetails: (projectId: string, teamWorkId: string) => ITeamWork | null;
  // fetch actions
  fetchWorkspaceMembers: (workspaceSlug: string) => Promise<IWorkspaceMember[]>;
  fetchWorkspaceMemberInvitations: (workspaceSlug: string) => Promise<IWorkspaceMemberInvitation[]>;
  fetchTeamWorks: (workspaceSlug: string) => Promise<ITeamWork[]>;
  fetchProjectTeamWorks: (workspaceSlug: string, projectId: string) => Promise<ITeamWork[]>;
  setProjectTeamWorks: (workspaceSlug: string, projectId: string, teamWorkIds: string[]) => Promise<ITeamWork[]>;
  // crud actions
  updateMember: (workspaceSlug: string, userId: string, data: { role: EUserPermissions }) => Promise<void>;
  removeMemberFromWorkspace: (workspaceSlug: string, userId: string) => Promise<void>;
  createTeamWork: (workspaceSlug: string, data: Partial<ITeamWork>) => Promise<ITeamWork>;
  updateTeamWork: (workspaceSlug: string, teamWorkId: string, data: Partial<ITeamWork>) => Promise<ITeamWork>;
  deleteTeamWork: (workspaceSlug: string, teamWorkId: string) => Promise<void>;
  // invite actions
  inviteMembersToWorkspace: (workspaceSlug: string, data: IWorkspaceBulkInviteFormData) => Promise<void>;
  updateMemberInvitation: (
    workspaceSlug: string,
    invitationId: string,
    data: Partial<IWorkspaceMemberInvitation>
  ) => Promise<void>;
  deleteMemberInvitation: (workspaceSlug: string, invitationId: string) => Promise<void>;
  isUserSuspended: (userId: string, workspaceSlug: string) => boolean;
}

export class WorkspaceMemberStore implements IWorkspaceMemberStore {
  // observables
  workspaceMemberMap: {
    [workspaceSlug: string]: Record<string, IWorkspaceMembership>;
  } = {}; // { workspaceSlug: { userId: userDetails } }
  workspaceMemberInvitations: Record<string, IWorkspaceMemberInvitation[]> = {}; // { workspaceSlug: [invitations] }
  teamWorkMap: { [workspaceSlug: string]: Record<string, ITeamWork> } = {}; // { workspaceSlug: { teamWorkId: teamWork } }
  projectTeamWorkMap: { [projectId: string]: Record<string, ITeamWork> } = {}; // { projectId: { teamWorkId: teamWork } }
  // filters store
  filtersStore: IWorkspaceMemberFiltersStore;
  // stores
  routerStore: IRouterStore;
  userStore: IUserStore;
  memberRoot: IMemberRootStore;
  // services
  workspaceService;

  constructor(_memberRoot: IMemberRootStore, _rootStore: RootStore) {
    makeObservable(this, {
      // observables
      workspaceMemberMap: observable,
      workspaceMemberInvitations: observable,
      teamWorkMap: observable,
      projectTeamWorkMap: observable,
      // computed
      workspaceMemberIds: computed,
      workspaceMemberInvitationIds: computed,
      teamWorkIds: computed,
      memberMap: computed,
      // actions
      fetchWorkspaceMembers: action,
      updateMember: action,
      removeMemberFromWorkspace: action,
      fetchWorkspaceMemberInvitations: action,
      updateMemberInvitation: action,
      deleteMemberInvitation: action,
      fetchTeamWorks: action,
      fetchProjectTeamWorks: action,
      setProjectTeamWorks: action,
      createTeamWork: action,
      updateTeamWork: action,
      deleteTeamWork: action,
    });
    // initialize filters store
    this.filtersStore = new WorkspaceMemberFiltersStore();
    // root store
    this.routerStore = _rootStore.router;
    this.userStore = _rootStore.user;
    this.memberRoot = _memberRoot;
    // services
    this.workspaceService = new WorkspaceService();
  }

  /**
   * @description get the list of all the user ids of all the members of the current workspace
   */
  get workspaceMemberIds() {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return null;

    return this.getWorkspaceMemberIds(workspaceSlug);
  }

  get memberMap() {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return null;
    return this.workspaceMemberMap?.[workspaceSlug] ?? {};
  }

  get workspaceMemberInvitationIds() {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return null;
    return this.workspaceMemberInvitations?.[workspaceSlug]?.map((inv) => inv.id);
  }

  get teamWorkIds() {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return null;
    const teamWorks = Object.values(this.teamWorkMap?.[workspaceSlug] ?? {});
    return teamWorks.map((teamWork) => teamWork.id);
  }

  getWorkspaceMemberIds = computedFn((workspaceSlug: string) => {
    let members = Object.values(this.workspaceMemberMap?.[workspaceSlug] ?? {});
    members = sortBy(members, [
      (m) => m.member !== this.userStore?.data?.id,
      (m) => this.memberRoot?.memberMap?.[m.member]?.display_name?.toLowerCase(),
    ]);
    //filter out bots
    const memberIds = members.filter((m) => !this.memberRoot?.memberMap?.[m.member]?.is_bot).map((m) => m.member);
    return memberIds;
  });

  /**
   * @description get the filtered and sorted list of all the user ids of all the members of the workspace
   * @param workspaceSlug
   */
  getFilteredWorkspaceMemberIds = computedFn((workspaceSlug: string) => {
    let members = Object.values(this.workspaceMemberMap?.[workspaceSlug] ?? {});
    //filter out bots and inactive members
    members = members.filter((m) => !this.memberRoot?.memberMap?.[m.member]?.is_bot);

    // Use filters store to get filtered member ids
    const memberIds = this.filtersStore.getFilteredMemberIds(
      members,
      this.memberRoot?.memberMap || {},
      (member) => member.member
    );

    return memberIds;
  });

  /**
   * @description get the list of all the user ids that match the search query of all the members of the current workspace
   * @param searchQuery
   */
  getSearchedWorkspaceMemberIds = computedFn((searchQuery: string) => {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return null;
    const filteredMemberIds = this.getFilteredWorkspaceMemberIds(workspaceSlug);
    if (!filteredMemberIds) return null;
    const searchedWorkspaceMemberIds = filteredMemberIds.filter((userId) => {
      const memberDetails = this.getWorkspaceMemberDetails(userId);
      if (!memberDetails) return false;
      const memberSearchQuery = `${memberDetails.member.first_name} ${memberDetails.member.last_name} ${
        memberDetails.member?.display_name
      } ${memberDetails.member.email ?? ""}`;
      return memberSearchQuery.toLowerCase()?.includes(searchQuery.toLowerCase());
    });
    return searchedWorkspaceMemberIds;
  });

  /**
   * @description get the list of all the invitation ids that match the search query of all the member invitations of the current workspace
   * @param searchQuery
   */
  getSearchedWorkspaceInvitationIds = computedFn((searchQuery: string) => {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return null;
    const workspaceMemberInvitationIds = this.workspaceMemberInvitationIds;
    if (!workspaceMemberInvitationIds) return null;
    const searchedWorkspaceMemberInvitationIds = workspaceMemberInvitationIds.filter((invitationId) => {
      const invitationDetails = this.getWorkspaceInvitationDetails(invitationId);
      if (!invitationDetails) return false;
      const invitationSearchQuery = `${invitationDetails.email}`;
      return invitationSearchQuery.toLowerCase()?.includes(searchQuery.toLowerCase());
    });
    return searchedWorkspaceMemberInvitationIds;
  });

  /**
   * @description get the details of a workspace member
   * @param userId
   */
  getWorkspaceMemberDetails = computedFn((userId: string) => {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return null;
    const workspaceMember = this.workspaceMemberMap?.[workspaceSlug]?.[userId];
    if (!workspaceMember) return null;

    const memberDetails: IWorkspaceMember = {
      id: workspaceMember.id,
      role: workspaceMember.role,
      member: this.memberRoot?.memberMap?.[workspaceMember.member],
      is_active: workspaceMember.is_active,
    };
    return memberDetails;
  });

  /**
   * @description get the details of a workspace member invitation
   * @param workspaceSlug
   * @param memberId
   */
  getWorkspaceInvitationDetails = computedFn((invitationId: string) => {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return null;
    const invitationsList = this.workspaceMemberInvitations?.[workspaceSlug];
    if (!invitationsList) return null;

    const invitation = invitationsList.find((inv) => inv.id === invitationId);
    return invitation ?? null;
  });

  /**
   * @description fetch all the members of a workspace
   * @param workspaceSlug
   */
  fetchWorkspaceMembers = async (workspaceSlug: string) =>
    await this.workspaceService.fetchWorkspaceMembers(workspaceSlug).then((response) => {
      runInAction(() => {
        response.forEach((member) => {
          set(this.memberRoot?.memberMap, member.member.id, { ...member.member, joining_date: member.created_at });
          set(this.workspaceMemberMap, [workspaceSlug, member.member.id], {
            id: member.id,
            member: member.member.id,
            role: member.role,
            is_active: member.is_active,
          });
        });
      });
      return response;
    });

  /**
   * @description update the role of a workspace member
   * @param workspaceSlug
   * @param userId
   * @param data
   */
  updateMember = async (workspaceSlug: string, userId: string, data: { role: EUserPermissions }) => {
    const memberDetails = this.getWorkspaceMemberDetails(userId);
    if (!memberDetails) throw new Error("Member not found");
    // original data to revert back in case of error
    const originalProjectMemberData = { ...this.workspaceMemberMap?.[workspaceSlug]?.[userId] };
    try {
      runInAction(() => {
        set(this.workspaceMemberMap, [workspaceSlug, userId, "role"], data.role);
      });
      await this.workspaceService.updateWorkspaceMember(workspaceSlug, memberDetails.id, data);
    } catch (error) {
      // revert back to original members in case of error
      runInAction(() => {
        set(this.workspaceMemberMap, [workspaceSlug, userId], originalProjectMemberData);
      });
      throw error;
    }
  };

  /**
   * @description remove a member from workspace
   * @param workspaceSlug
   * @param userId
   */
  removeMemberFromWorkspace = async (workspaceSlug: string, userId: string) => {
    const memberDetails = this.getWorkspaceMemberDetails(userId);
    if (!memberDetails) throw new Error("Member not found");
    // oxlint-disable-next-line promise/always-return
    await this.workspaceService.deleteWorkspaceMember(workspaceSlug, memberDetails?.id).then(() => {
      runInAction(() => {
        set(this.workspaceMemberMap, [workspaceSlug, userId, "is_active"], false);
      });
    });
  };

  /**
   * @description get the details of a team work
   * @param teamWorkId
   */
  getTeamWorkDetails = computedFn((teamWorkId: string) => {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return null;
    return this.teamWorkMap?.[workspaceSlug]?.[teamWorkId] ?? null;
  });

  /**
   * @description get the list of all the team work ids that match the search query of the current workspace
   * @param searchQuery
   */
  getSearchedTeamWorkIds = computedFn((searchQuery: string) => {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return null;
    const teamWorkIds = this.teamWorkIds;
    if (!teamWorkIds) return null;
    const searchedTeamWorkIds = teamWorkIds.filter((teamWorkId) => {
      const teamWorkDetails = this.getTeamWorkDetails(teamWorkId);
      if (!teamWorkDetails) return false;
      const teamWorkSearchQuery = `${teamWorkDetails.name} ${teamWorkDetails.role ?? ""}`;
      return teamWorkSearchQuery.toLowerCase()?.includes(searchQuery.toLowerCase());
    });
    return searchedTeamWorkIds;
  });

  /**
   * @description fetch all the team works of a workspace
   * @param workspaceSlug
   */
  fetchTeamWorks = async (workspaceSlug: string) =>
    await this.workspaceService.fetchTeamWorks(workspaceSlug).then((response) => {
      runInAction(() => {
        const teamWorkMap: Record<string, ITeamWork> = {};
        response.forEach((teamWork) => {
          teamWorkMap[teamWork.id] = teamWork;
        });
        set(this.teamWorkMap, workspaceSlug, teamWorkMap);
      });
      return response;
    });

  /**
   * @description get the ids of all the team works of a project
   * @param projectId
   */
  getProjectTeamWorkIds = computedFn((projectId: string) => {
    const teamWorks = Object.values(this.projectTeamWorkMap?.[projectId] ?? {});
    return teamWorks.map((teamWork) => teamWork.id);
  });

  /**
   * @description get the details of a project team work
   * @param projectId
   * @param teamWorkId
   */
  getProjectTeamWorkDetails = computedFn((projectId: string, teamWorkId: string) => {
    return this.projectTeamWorkMap?.[projectId]?.[teamWorkId] ?? null;
  });

  /**
   * @description fetch all the team works of a project
   * @param workspaceSlug
   * @param projectId
   */
  fetchProjectTeamWorks = async (workspaceSlug: string, projectId: string) =>
    await this.workspaceService.fetchProjectTeamWorks(workspaceSlug, projectId).then((response) => {
      runInAction(() => {
        const projectTeamWorkMap: Record<string, ITeamWork> = {};
        response.forEach((teamWork) => {
          projectTeamWorkMap[teamWork.id] = teamWork;
        });
        set(this.projectTeamWorkMap, projectId, projectTeamWorkMap);
      });
      return response;
    });

  /**
   * @description set the team works of a project
   * @param workspaceSlug
   * @param projectId
   * @param teamWorkIds
   */
  setProjectTeamWorks = async (workspaceSlug: string, projectId: string, teamWorkIds: string[]) =>
    await this.workspaceService.setProjectTeamWorks(workspaceSlug, projectId, teamWorkIds).then((response) => {
      runInAction(() => {
        const projectTeamWorkMap: Record<string, ITeamWork> = {};
        response.forEach((teamWork) => {
          projectTeamWorkMap[teamWork.id] = teamWork;
        });
        set(this.projectTeamWorkMap, projectId, projectTeamWorkMap);
      });
      return response;
    });

  /**
   * @description create a team work
   * @param workspaceSlug
   * @param data
   */
  createTeamWork = async (workspaceSlug: string, data: Partial<ITeamWork>) => {
    const response = await this.workspaceService.createTeamWork(workspaceSlug, data);
    runInAction(() => {
      set(this.teamWorkMap, [workspaceSlug, response.id], response);
    });
    return response;
  };

  /**
   * @description update a team work
   * @param workspaceSlug
   * @param teamWorkId
   * @param data
   */
  updateTeamWork = async (workspaceSlug: string, teamWorkId: string, data: Partial<ITeamWork>) => {
    const originalTeamWork = { ...this.teamWorkMap?.[workspaceSlug]?.[teamWorkId] };
    try {
      runInAction(() => {
        set(this.teamWorkMap, [workspaceSlug, teamWorkId], {
          ...(this.teamWorkMap?.[workspaceSlug]?.[teamWorkId] ?? {}),
          ...data,
        });
      });
      const response = await this.workspaceService.updateTeamWork(workspaceSlug, teamWorkId, data);
      runInAction(() => {
        set(this.teamWorkMap, [workspaceSlug, teamWorkId], response);
      });
      return response;
    } catch (error) {
      // revert back to original in case of error
      runInAction(() => {
        set(this.teamWorkMap, [workspaceSlug, teamWorkId], originalTeamWork);
      });
      throw error;
    }
  };

  /**
   * @description delete a team work
   * @param workspaceSlug
   * @param teamWorkId
   */
  deleteTeamWork = async (workspaceSlug: string, teamWorkId: string) => {
    // oxlint-disable-next-line promise/always-return
    await this.workspaceService.deleteTeamWork(workspaceSlug, teamWorkId).then(() => {
      runInAction(() => {
        delete this.teamWorkMap[workspaceSlug]?.[teamWorkId];
      });
    });
  };

  /**
   * @description fetch all the member invitations of a workspace
   * @param workspaceSlug
   */
  fetchWorkspaceMemberInvitations = async (workspaceSlug: string) =>
    await this.workspaceService.workspaceInvitations(workspaceSlug).then((response) => {
      runInAction(() => {
        set(this.workspaceMemberInvitations, workspaceSlug, response);
      });
      return response;
    });

  /**
   * @description bulk invite members to a workspace
   * @param workspaceSlug
   * @param data
   */
  inviteMembersToWorkspace = async (workspaceSlug: string, data: IWorkspaceBulkInviteFormData) => {
    const response = await this.workspaceService.inviteWorkspace(workspaceSlug, data);
    await this.fetchWorkspaceMemberInvitations(workspaceSlug);
    return response;
  };

  /**
   * @description update the role of a member invitation
   * @param workspaceSlug
   * @param invitationId
   * @param data
   */
  updateMemberInvitation = async (
    workspaceSlug: string,
    invitationId: string,
    data: Partial<IWorkspaceMemberInvitation>
  ) => {
    const originalMemberInvitations = [...(this.workspaceMemberInvitations?.[workspaceSlug] ?? [])]; // in case of error, we will revert back to original members
    try {
      const memberInvitations = originalMemberInvitations?.map((invitation) => ({
        ...invitation,
        ...(invitation.id === invitationId && data),
      }));
      // optimistic update
      runInAction(() => {
        set(this.workspaceMemberInvitations, workspaceSlug, memberInvitations);
      });
      await this.workspaceService.updateWorkspaceInvitation(workspaceSlug, invitationId, data);
    } catch (error) {
      // revert back to original members in case of error
      runInAction(() => {
        set(this.workspaceMemberInvitations, workspaceSlug, originalMemberInvitations);
      });
      throw error;
    }
  };

  /**
   * @description delete a member invitation
   * @param workspaceSlug
   * @param memberId
   */
  deleteMemberInvitation = async (workspaceSlug: string, invitationId: string) =>
    // oxlint-disable-next-line promise/always-return
    await this.workspaceService.deleteWorkspaceInvitations(workspaceSlug.toString(), invitationId).then(() => {
      runInAction(() => {
        this.workspaceMemberInvitations[workspaceSlug] = this.workspaceMemberInvitations[workspaceSlug].filter(
          (inv) => inv.id !== invitationId
        );
      });
    });

  isUserSuspended = computedFn((userId: string, workspaceSlug: string) => {
    if (!workspaceSlug) return false;
    const workspaceMember = this.workspaceMemberMap?.[workspaceSlug]?.[userId];
    return workspaceMember?.is_active === false;
  });
}
