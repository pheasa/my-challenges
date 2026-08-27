/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { useEffect } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProject, IUserLite, IWorkspace } from "@plane/types";
import { Avatar, Loader, ToggleSwitch } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// constants
import { PROJECT_DETAILS } from "@plane/constants";
// components
import { LeadDropdown } from "@/components/dropdowns/lead";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { MemberSelect } from "./member-select";

const defaultValues: Partial<IProject> = {
  default_assignee: null,
};

type TDefaultSettingItemProps = {
  title: string;
  description: string;
  children: ReactNode;
};

function DefaultSettingItem({ title, description, children }: TDefaultSettingItemProps) {
  return (
    <div className="flex items-center justify-between gap-x-2">
      <div className="flex flex-col gap-0.5">
        <h4 className="text-13 font-medium">{title}</h4>
        <p className="text-11 text-tertiary">{description}</p>
      </div>
      <div className="w-full max-w-48 sm:max-w-64">{children}</div>
    </div>
  );
}

type TProjectSettingsMemberDefaultsProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectSettingsMemberDefaults = observer(function ProjectSettingsMemberDefaults(
  props: TProjectSettingsMemberDefaultsProps
) {
  const { workspaceSlug, projectId } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();

  const { currentProjectDetails, fetchProjectDetails, updateProject } = useProject();
  // derived values
  const isAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    currentProjectDetails?.id
  );
  // form info
  const { reset, control } = useForm<IProject>({ defaultValues });
  // fetching user members
  useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(workspaceSlug, projectId) : null,
    workspaceSlug && projectId ? () => fetchProjectDetails(workspaceSlug, projectId) : null
  );

  useEffect(() => {
    if (!currentProjectDetails) return;

    reset({
      ...currentProjectDetails,
      default_assignee:
        (currentProjectDetails.default_assignee as IUserLite)?.id ?? currentProjectDetails.default_assignee,
      team_work_lead:
        typeof currentProjectDetails.team_work_lead === "object"
          ? (currentProjectDetails.team_work_lead as { id: string }).id
          : currentProjectDetails.team_work_lead,
      workspace: (currentProjectDetails.workspace as IWorkspace).id,
    });
  }, [currentProjectDetails, reset]);

  const submitChanges = async (formData: Partial<IProject>) => {
    if (!workspaceSlug || !projectId) return;

    reset({
      ...currentProjectDetails,
      default_assignee:
        (currentProjectDetails?.default_assignee as IUserLite)?.id ?? currentProjectDetails?.default_assignee,
      ...formData,
    });

    await updateProject(workspaceSlug, projectId, {
      default_assignee:
        formData.default_assignee === "none"
          ? null
          : (formData.default_assignee ?? currentProjectDetails?.default_assignee),
    })
      .then(() => {
        setToast({
          title: `${t("success")}!`,
          type: TOAST_TYPE.SUCCESS,
          message: t("project_settings.general.toast.success"),
        });
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const toggleGuestViewAllIssues = async (value: boolean) => {
    if (!workspaceSlug || !projectId) return;

    updateProject(workspaceSlug, projectId, {
      guest_view_all_features: value,
    })
      .then(() => {
        setToast({
          title: `${t("success")}!`,
          type: TOAST_TYPE.SUCCESS,
          message: t("project_settings.general.toast.success"),
        });
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return (
    <div className="my-6 flex flex-col gap-y-6">
      <DefaultSettingItem title="Project Lead" description="The user who created this project.">
        {currentProjectDetails ? (
          <div className="flex h-9 items-center gap-2">
            {(() => {
              const lead = currentProjectDetails.lead as IUserLite | undefined;
              return lead ? (
                <>
                  <Avatar
                    name={lead.display_name}
                    src={lead.avatar_url ? getFileURL(lead.avatar_url) : undefined}
                    size="sm"
                  />
                  <span className="text-13 text-secondary">{lead.display_name}</span>
                </>
              ) : (
                <span className="text-13 text-placeholder">Not set</span>
              );
            })()}
          </div>
        ) : (
          <Loader className="h-9 w-full">
            <Loader.Item width="100%" height="100%" />
          </Loader>
        )}
      </DefaultSettingItem>
      <DefaultSettingItem title="Lead / Scrum Master" description="Select the lead or scrum master from TeamWorks.">
        {currentProjectDetails ? (
          <Controller
            control={control}
            name="team_work_lead"
            render={({ field: { value } }) => (
              <LeadDropdown
                value={(value as string | null) ?? null}
                onChange={(val: string | null) => {
                  submitChanges({ team_work_lead: val } as any);
                }}
                placeholder="Lead / Scrum Master"
                buttonVariant="border-with-text"
              />
            )}
          />
        ) : (
          <Loader className="h-9 w-full">
            <Loader.Item width="100%" height="100%" />
          </Loader>
        )}
      </DefaultSettingItem>
      <DefaultSettingItem title="Default Assignee" description="Select the default assignee for the project.">
        {currentProjectDetails ? (
          <Controller
            control={control}
            name="default_assignee"
            render={({ field: { value } }) => (
              <MemberSelect
                value={value}
                onChange={(val: string) => {
                  submitChanges({ default_assignee: val });
                }}
                isDisabled={!isAdmin}
              />
            )}
          />
        ) : (
          <Loader className="h-9 w-full">
            <Loader.Item width="100%" height="100%" />
          </Loader>
        )}
      </DefaultSettingItem>
      {currentProjectDetails && (
        <DefaultSettingItem
          title="Guest access"
          description="This will allow guests to have view access to all the project work items."
        >
          <div className="flex items-center justify-end">
            <ToggleSwitch
              value={!!currentProjectDetails?.guest_view_all_features}
              onChange={() => toggleGuestViewAllIssues(!currentProjectDetails?.guest_view_all_features)}
              disabled={!isAdmin}
              size="sm"
            />
          </div>
        </DefaultSettingItem>
      )}
    </div>
  );
});
