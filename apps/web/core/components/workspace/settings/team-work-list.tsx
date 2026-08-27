/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ITeamWork } from "@plane/types";
// components
import { MembersSettingsLoader } from "@/components/ui/loader/settings/members";
import { TeamWorkListItem } from "./team-work-list-item";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local imports
import { TeamWorkDeleteModal } from "./team-work-delete-modal";

export const TeamWorkList = observer(function TeamWorkList(props: { searchQuery: string; onEdit: (teamWork: ITeamWork) => void }) {
  const { searchQuery, onEdit } = props;
  // states
  const [deleteModal, setDeleteModal] = useState<ITeamWork | null>(null);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    workspace: { fetchTeamWorks, teamWorkIds, getTeamWorkDetails, getSearchedTeamWorkIds, deleteTeamWork },
  } = useMember();
  const { t } = useTranslation();

  // fetching team works
  const { isLoading } = useSWR(
    workspaceSlug ? `WORKSPACE_TEAM_WORKS_${workspaceSlug.toString()}` : null,
    workspaceSlug ? () => fetchTeamWorks(workspaceSlug.toString()) : null
  );

  if (isLoading) return <MembersSettingsLoader />;

  // derived values
  const searchedTeamWorkIds = searchQuery ? getSearchedTeamWorkIds(searchQuery) : teamWorkIds;
  const teamWorks =
    searchedTeamWorkIds
      ?.map((teamWorkId) => getTeamWorkDetails(teamWorkId))
      .filter((teamWork): teamWork is ITeamWork => teamWork !== null) ?? [];

  const handleDelete = async (teamWork: ITeamWork) => {
    if (!workspaceSlug) return;
    try {
      await deleteTeamWork(workspaceSlug.toString(), teamWork.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: t("workspace_settings.settings.members.delete_success"),
      });
    } catch (err: unknown) {
      const error = err as { error?: string };
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.error || t("something_went_wrong_please_try_again"),
      });
    } finally {
      setDeleteModal(null);
    }
  };

  return (
    <>
      <div className="divide-y-[0.5px] divide-subtle overflow-scroll">
        {teamWorks.map((teamWork) => (
          <TeamWorkListItem key={teamWork.id} teamWork={teamWork} onEdit={onEdit} onDelete={setDeleteModal} />
        ))}
        {teamWorks.length === 0 && (
          <h4 className="mt-16 text-center text-body-xs-regular text-placeholder">
            {searchQuery ? t("no_matching_members") : t("workspace_settings.settings.members.empty_state")}
          </h4>
        )}
      </div>
      {deleteModal && (
        <TeamWorkDeleteModal
          isOpen={Boolean(deleteModal)}
          onClose={() => setDeleteModal(null)}
          onSubmit={() => handleDelete(deleteModal)}
          teamWork={deleteModal}
        />
      )}
    </>
  );
});
