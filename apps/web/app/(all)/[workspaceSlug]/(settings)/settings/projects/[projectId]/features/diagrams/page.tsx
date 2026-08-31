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
import { FeaturesDiagramsProjectSettingsHeader } from "./header";

function FeaturesDiagramsSettingsPage(props: Route.ComponentProps) {
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
    ? `${currentProjectDetails?.name} settings - Diagrams`
    : undefined;
  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  if (workspaceUserInfo && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<FeaturesDiagramsProjectSettingsHeader />}>
      <PageHead title={pageTitle} />
      <section className="w-full">
        <SettingsHeading
          title="Diagrams"
          description="Configure Diagrams to create and manage Mermaid UML, architecture, and flowcharts."
        />
        <div className="mt-7">
          <ProjectSettingsFeatureControlItem
            title="Enable Diagrams"
            description="Toggle Diagrams view for this project."
            featureProperty="diagram_view"
            projectId={projectId}
            value={!!currentProjectDetails?.diagram_view}
            workspaceSlug={workspaceSlug}
          />
        </div>
      </section>
    </SettingsContentWrapper>
  );
}

export default observer(FeaturesDiagramsSettingsPage);
