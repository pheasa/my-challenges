/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import type { LucideIcon } from "lucide-react";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local imports
import { MemberDropdownBase } from "./base";
import type { MemberDropdownProps } from "./types";

type TMemberDropdownProps = {
  icon?: LucideIcon;
  memberIds?: string[];
  onClose?: () => void;
  optionsClassName?: string;
  projectId?: string;
  renderByDefault?: boolean;
} & MemberDropdownProps;

export const MemberDropdown = observer(function MemberDropdown(props: TMemberDropdownProps) {
  const { memberIds: propsMemberIds, projectId, showTeamWork = false } = props;
  // router params
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    getUserDetails,
    project: { getProjectMemberIds, fetchProjectMembers },
    workspace: { workspaceMemberIds, fetchWorkspaceMembers, teamWorkIds, fetchTeamWorks, getTeamWorkDetails },
  } = useMember();

  const memberIds = propsMemberIds
    ? propsMemberIds
    : projectId
      ? getProjectMemberIds(projectId, false)
      : workspaceMemberIds;

  // Fetch team works if enabled
  useSWR(
    workspaceSlug && showTeamWork ? `WORKSPACE_TEAM_WORKS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchTeamWorks(workspaceSlug.toString()) : null
  );

  // Combine member IDs with team work IDs
  const combinedMemberIds = showTeamWork ? [...(memberIds ?? []), ...(teamWorkIds ?? [])] : memberIds;

  const onDropdownOpen = () => {
    if (workspaceSlug) {
      if (projectId) {
        fetchProjectMembers(workspaceSlug.toString(), projectId);
      } else {
        fetchWorkspaceMembers(workspaceSlug.toString());
      }
      if (showTeamWork) {
        fetchTeamWorks(workspaceSlug.toString());
      }
    }
  };

  return (
    <MemberDropdownBase
      {...props}
      getUserDetails={getUserDetails}
      getTeamWorkDetails={showTeamWork ? getTeamWorkDetails : undefined}
      memberIds={combinedMemberIds ?? []}
      onDropdownOpen={onDropdownOpen}
      showTeamWork={showTeamWork}
      teamWorkIds={showTeamWork ? (teamWorkIds ?? []) : []}
    />
  );
});
