/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TrashIcon } from "@plane/propel/icons";
import type { ITeamWork } from "@plane/types";
import { getFileURL } from "@plane/utils";
// components
import { MembersSettingsLoader } from "@/components/ui/loader/settings/members";
// hooks
import { useMember } from "@/hooks/store/use-member";

type Props = {
  projectId: string;
  searchQuery?: string;
  onRemove: (teamWork: ITeamWork) => void;
};

export const ProjectTeamWorkList = observer(function ProjectTeamWorkList(props: Props) {
  const { projectId, searchQuery, onRemove } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    workspace: { fetchProjectTeamWorks, getProjectTeamWorkIds, getProjectTeamWorkDetails },
  } = useMember();
  const { t } = useTranslation();

  // fetching project team works
  const { isLoading } = useSWR(
    workspaceSlug ? `PROJECT_TEAM_WORKS_${workspaceSlug.toString()}_${projectId}` : null,
    workspaceSlug ? () => fetchProjectTeamWorks(workspaceSlug.toString(), projectId) : null
  );

  if (isLoading) return <MembersSettingsLoader />;

  // derived values
  const projectTeamWorkIds = getProjectTeamWorkIds(projectId);
  const teamWorks =
    projectTeamWorkIds
      ?.map((teamWorkId) => getProjectTeamWorkDetails(projectId, teamWorkId))
      .filter((teamWork): teamWork is ITeamWork => teamWork !== null) ?? [];

  const filteredTeamWorks = searchQuery
    ? teamWorks.filter((teamWork) => {
        const teamWorkQuery = `${teamWork.name} ${teamWork.role ?? ""}`.toLowerCase();
        return teamWorkQuery.includes(searchQuery.toLowerCase());
      })
    : teamWorks;

  return (
    <div className="divide-y-[0.5px] divide-subtle overflow-scroll">
      {filteredTeamWorks.map((teamWork) => (
        <div key={teamWork.id} className="group flex w-full items-center justify-between gap-x-4 gap-y-2 px-3 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-x-2.5">
            {teamWork.avatar && teamWork.avatar.trim() !== "" ? (
              <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full text-on-color capitalize">
                <img
                  src={getFileURL(teamWork.avatar)}
                  className="absolute top-0 left-0 h-full w-full rounded-full object-cover"
                  alt={teamWork.name}
                />
              </span>
            ) : (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-layer-3 text-11 text-tertiary capitalize">
                {(teamWork.name ?? "?")[0]}
              </span>
            )}
            <div className="min-w-0">
              <div className="truncate text-body-xs-regular text-primary">{teamWork.name}</div>
              {teamWork.role && <div className="truncate text-11 text-secondary">{teamWork.role}</div>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRemove(teamWork)}
            className="grid size-7 shrink-0 place-items-center rounded-md text-secondary opacity-0 transition-opacity hover:bg-danger-subtle hover:text-danger-primary group-hover:opacity-100"
            aria-label={t("remove")}
          >
            <TrashIcon className="size-3.5" />
          </button>
        </div>
      ))}
      {filteredTeamWorks.length === 0 && (
        <h4 className="mt-16 text-center text-body-xs-regular text-placeholder">
          {searchQuery ? t("no_matching_members") : t("workspace_settings.settings.members.empty_state")}
        </h4>
      )}
    </div>
  );
});
