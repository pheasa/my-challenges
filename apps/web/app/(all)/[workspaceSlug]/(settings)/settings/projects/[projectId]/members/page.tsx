/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// types
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { SearchIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ITeamWork } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { CountChip } from "@/components/common/count-chip";
import { PageHead } from "@/components/core/page-title";
import { ProjectTeamWorkList } from "@/components/project/project-team-work-list";
import { TeamWorkMultiSelectModal } from "@/components/project/team-work-multi-select-modal";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import type { Route } from "./+types/page";
import { MembersProjectSettingsHeader } from "./header";

const ProjectMembersSettingsPage = observer(function ProjectMembersSettingsPage({ params }: Route.ComponentProps) {
  // states
  const [isTeamWorkModalOpen, setIsTeamWorkModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  // router
  const { workspaceSlug, projectId } = params;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const {
    workspace: {
      teamWorkIds,
      getTeamWorkDetails,
      getProjectTeamWorkIds,
      fetchTeamWorks,
      fetchProjectTeamWorks,
      setProjectTeamWorks,
    },
  } = useMember();
  const { currentProjectDetails } = useProject();

  // fetching team works (workspace directory) and the project's team works
  useSWR(
    workspaceSlug ? `WORKSPACE_TEAM_WORKS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchTeamWorks(workspaceSlug) : null
  );
  useSWR(
    workspaceSlug && projectId ? `PROJECT_TEAM_WORKS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectTeamWorks(workspaceSlug, projectId) : null
  );

  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const allTeamWorks = (teamWorkIds ?? [])
    .map((teamWorkId) => getTeamWorkDetails(teamWorkId))
    .filter((teamWork): teamWork is ITeamWork => teamWork !== null);
  const projectTeamWorkIds = getProjectTeamWorkIds(projectId) ?? [];

  const handleSetTeamWorks = async (ids: string[]) => {
    try {
      await setProjectTeamWorks(workspaceSlug, projectId, ids);
      setIsTeamWorkModalOpen(false);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: t("workspace_settings.settings.members.update_success"),
      });
    } catch (error: unknown) {
      const err = error as { error?: string };
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: err?.error ?? t("something_went_wrong_please_try_again"),
      });
      throw error;
    }
  };

  const handleRemoveTeamWork = async (teamWork: ITeamWork) => {
    const remainingIds = projectTeamWorkIds.filter((id) => id !== teamWork.id);
    await handleSetTeamWorks(remainingIds);
  };

  // derived values
  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails.name} - ${t("workspace_settings.settings.members.title")}`
    : undefined;

  // if user is not authorized to view this page
  if (workspaceUserInfo && !canPerformWorkspaceMemberActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<MembersProjectSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <TeamWorkMultiSelectModal
        isOpen={isTeamWorkModalOpen}
        onClose={() => setIsTeamWorkModalOpen(false)}
        teamWorks={allTeamWorks}
        selectedTeamWorkIds={projectTeamWorkIds}
        onSubmit={handleSetTeamWorks}
      />
      <section
        className={cn("size-full", {
          "opacity-60": !canPerformWorkspaceMemberActions,
        })}
      >
        <div className="flex items-center justify-between gap-4 pb-3.5">
          <h4 className="flex items-center gap-2.5 text-h3-medium">
            {t("workspace_settings.settings.members.title")}
            {projectTeamWorkIds.length > 0 && <CountChip count={projectTeamWorkIds.length} className="m-auto h-5" />}
          </h4>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border border-subtle bg-surface-1 px-2.5 py-1.5">
              <SearchIcon className="h-3.5 w-3.5 text-placeholder" />
              <input
                className="w-full max-w-[234px] border-none bg-transparent text-body-xs-regular outline-none placeholder:text-placeholder"
                placeholder={`${t("search")}...`}
                value={searchQuery}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {canPerformWorkspaceAdminActions && (
              <Button variant="primary" size="lg" onClick={() => setIsTeamWorkModalOpen(true)}>
                {t("workspace_settings.settings.members.add_member")}
              </Button>
            )}
          </div>
        </div>
        <ProjectTeamWorkList projectId={projectId} searchQuery={searchQuery} onRemove={handleRemoveTeamWork} />
      </section>
    </SettingsContentWrapper>
  );
});

export default ProjectMembersSettingsPage;
