/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { Popover } from "@plane/propel/popover";
import { Avatar } from "@plane/ui";
import { cn, getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";

type Props = {
  id: string;
};

export const EditorTeamWorkMention = observer(function EditorTeamWorkMention(props: Props) {
  const { id } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    workspace: { fetchTeamWorks, getTeamWorkDetails },
  } = useMember();

  // ensure team works are loaded so the mention resolves in display mode
  useSWR(
    workspaceSlug ? `WORKSPACE_TEAM_WORKS_${workspaceSlug.toString()}` : null,
    workspaceSlug ? () => fetchTeamWorks(workspaceSlug.toString()) : null
  );

  // derived values
  const teamWork = getTeamWorkDetails(id);

  if (!teamWork) {
    return (
      <div className="not-prose inline rounded-sm bg-layer-1 px-1 py-0.5 text-tertiary no-underline">
        @suspended team member
      </div>
    );
  }

  return (
    <div
      className={cn(
        "not-prose inline rounded-sm bg-accent-subtle-active px-1 py-0.5 text-accent-primary no-underline"
      )}
    >
      <Popover delay={100} openOnHover>
        <Popover.Button>
          <span className="not-prose">@{teamWork.name}</span>
        </Popover.Button>
        <Popover.Panel side="bottom" align="start">
          <div className="w-60 rounded-lg border-[0.5px] border-strong bg-surface-1 p-3 shadow-raised-200">
            <div className="flex items-center gap-3">
              <div className="grid size-10 flex-shrink-0 place-items-center">
                <Avatar
                  src={getFileURL(teamWork.avatar ?? "")}
                  name={teamWork.name}
                  size={40}
                  className="text-18"
                  showTooltip={false}
                />
              </div>
              <div>
                <p className="not-prose text-13 font-medium text-primary">{teamWork.name}</p>
                {teamWork.role && <p className="text-11 text-secondary">{teamWork.role}</p>}
              </div>
            </div>
          </div>
        </Popover.Panel>
      </Popover>
    </div>
  );
});
