/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { ProjectSettingsFeatureControlItem } from "@/components/settings/project/content/feature-control-item";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { useParams } from "next/navigation";
import type { Route } from "./+types/page";
import { FeaturesMindmapsProjectSettingsHeader } from "./header";

function FeaturesMindmapsSettingsPage(props: Route.ComponentProps) {
  const routeParams = useParams();
  const workspaceSlug = (props?.params?.workspaceSlug || routeParams?.workspaceSlug) as string;
  const projectId = (props?.params?.projectId || routeParams?.projectId) as string;
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentProjectDetails } = useProject();
  // translation
  const { t } = useTranslation();
  // derived values
  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails?.name} settings - Mindmaps`
    : undefined;
  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  if (workspaceUserInfo && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<FeaturesMindmapsProjectSettingsHeader />}>
      <PageHead title={pageTitle} />
      <section className="w-full">
        <SettingsHeading
          title="Mindmaps"
          description="Configure Mindmaps to brainstorm, structure, and visualize workflows."
        />
        <div className="mt-7">
          <ProjectSettingsFeatureControlItem
            title="Enable Mindmaps"
            description="Toggle Mindmap view for this project."
            featureProperty="mindmap_view"
            projectId={projectId}
            value={!!currentProjectDetails?.mindmap_view}
            workspaceSlug={workspaceSlug}
          />
        </div>
      </section>
    </SettingsContentWrapper>
  );
}

export default observer(FeaturesMindmapsSettingsPage);
