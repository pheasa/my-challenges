/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { ETabIndices } from "@plane/constants";
import type { IProject } from "@plane/types";
import { getTabIndex } from "@plane/utils";
// components
import { LeadDropdown } from "@/components/dropdowns/lead";

type Props = {
  isMobile?: boolean;
};

function ProjectAttributes(props: Props) {
  const { isMobile = false } = props;
  const { control, setValue } = useFormContext<IProject>();
  const { getIndex } = getTabIndex(ETabIndices.PROJECT_CREATE, isMobile);

  const handleLeadChange = (val: string | null) => {
    setValue("team_work_lead", val);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Controller
        name="team_work_lead"
        control={control}
        render={({ field: { value } }) => (
          <div className="h-7 flex-shrink-0" tabIndex={getIndex("lead")}>
            <LeadDropdown
              value={(value as string | null) ?? null}
              onChange={handleLeadChange}
              placeholder="Lead / Scrum Master"
              multiple={false}
              buttonVariant="border-with-text"
              tabIndex={getIndex("lead")}
            />
          </div>
        )}
      />
    </div>
  );
}

export default ProjectAttributes;

export { ProjectAttributes };
