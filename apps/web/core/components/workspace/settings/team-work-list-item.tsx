/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EditIcon, TrashIcon } from "@plane/propel/icons";
import type { ITeamWork } from "@plane/types";
import { getFileURL } from "@plane/utils";

type Props = {
  teamWork: ITeamWork;
  onEdit: (teamWork: ITeamWork) => void;
  onDelete: (teamWork: ITeamWork) => void;
};

export const TeamWorkListItem = observer(function TeamWorkListItem(props: Props) {
  const { teamWork, onEdit, onDelete } = props;
  const { t } = useTranslation();

  return (
    <div className="group flex w-full items-center justify-between gap-x-4 gap-y-2 px-3 py-4">
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
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(teamWork)}
          className="grid size-7 place-items-center rounded-md text-secondary opacity-0 transition-opacity hover:bg-surface-2 group-hover:opacity-100"
          aria-label={t("edit")}
        >
          <EditIcon className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(teamWork)}
          className="grid size-7 place-items-center rounded-md text-secondary opacity-0 transition-opacity hover:bg-danger-subtle hover:text-danger-primary group-hover:opacity-100"
          aria-label={t("delete")}
        >
          <TrashIcon className="size-3.5" />
        </button>
      </div>
    </div>
  );
});
