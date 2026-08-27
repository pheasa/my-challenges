/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
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
import { TeamWorkList } from "@/components/workspace/settings/team-work-list";
import { TeamWorkModal } from "@/components/workspace/team-work-modal";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import type { Route } from "./+types/page";
import { MembersWorkspaceSettingsHeader } from "./header";

const WorkspaceMembersSettingsPage = observer(function WorkspaceMembersSettingsPage({ params }: Route.ComponentProps) {
  // states
  const [teamWorkModal, setTeamWorkModal] = useState<{ isOpen: boolean; teamWork: ITeamWork | null }>({
    isOpen: false,
    teamWork: null,
  });
  const [searchQuery, setSearchQuery] = useState<string>("");
  // router
  const { workspaceSlug } = params;
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const {
    workspace: { teamWorkIds, createTeamWork, updateTeamWork },
  } = useMember();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const handleTeamWorkSubmit = async (data: Partial<ITeamWork>) => {
    try {
      if (teamWorkModal.teamWork) {
        await updateTeamWork(workspaceSlug, teamWorkModal.teamWork.id, data);
      } else {
        await createTeamWork(workspaceSlug, data);
      }

      setTeamWorkModal({ isOpen: false, teamWork: null });

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: teamWorkModal.teamWork
          ? t("workspace_settings.settings.members.update_success")
          : t("workspace_settings.settings.members.create_success"),
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

  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - ${t("workspace_settings.settings.members.title")}` : undefined;

  // if user is not authorized to view this page
  if (workspaceUserInfo && !canPerformWorkspaceMemberActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<MembersWorkspaceSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <TeamWorkModal
        key={teamWorkModal.teamWork?.id ?? "create"}
        isOpen={teamWorkModal.isOpen}
        onClose={() => setTeamWorkModal({ isOpen: false, teamWork: null })}
        onSubmit={handleTeamWorkSubmit}
        workspaceSlug={workspaceSlug}
        teamWork={teamWorkModal.teamWork}
      />
      <section
        className={cn("size-full", {
          "opacity-60": !canPerformWorkspaceMemberActions,
        })}
      >
        <div className="flex items-center justify-between gap-4 pb-3.5">
          <h4 className="flex items-center gap-2.5 text-h3-medium">
            {t("workspace_settings.settings.members.title")}
            {teamWorkIds && teamWorkIds.length > 0 && <CountChip count={teamWorkIds.length} className="m-auto h-5" />}
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
              <Button variant="primary" size="lg" onClick={() => setTeamWorkModal({ isOpen: true, teamWork: null })}>
                {t("workspace_settings.settings.members.add_member")}
              </Button>
            )}
          </div>
        </div>
        <TeamWorkList
          searchQuery={searchQuery}
          onEdit={(teamWork) => setTeamWorkModal({ isOpen: true, teamWork })}
        />
      </section>
    </SettingsContentWrapper>
  );
});

export default WorkspaceMembersSettingsPage;
