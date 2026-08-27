/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { xor } from "lodash-es";
import { observer } from "mobx-react";
import { Combobox } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { SearchIcon, CloseIcon } from "@plane/propel/icons";
import { Checkbox, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import type { ITeamWork } from "@plane/types";
import { cn, getFileURL } from "@plane/utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  teamWorks: ITeamWork[];
  selectedTeamWorkIds: string[];
  onSubmit: (teamWorkIds: string[]) => Promise<void>;
};

export const TeamWorkMultiSelectModal = observer(function TeamWorkMultiSelectModal(props: Props) {
  const { isOpen, onClose, teamWorks, selectedTeamWorkIds: selectedTeamWorkIdsProp, onSubmit } = props;
  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeamWorkIds, setSelectedTeamWorkIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // refs
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const teamWorkDetailsMap = useMemo(() => new Map(teamWorks.map((teamWork) => [teamWork.id, teamWork])), [teamWorks]);
  const areSelectedTeamWorksChanged = xor(selectedTeamWorkIds, selectedTeamWorkIdsProp).length > 0;
  const filteredTeamWorkIds = teamWorks
    .filter((teamWork) => {
      const teamWorkQuery = `${teamWork.name} ${teamWork.role ?? ""}`.toLowerCase();
      return teamWorkQuery.includes(searchTerm.toLowerCase());
    })
    .map((teamWork) => teamWork.id);

  useEffect(() => {
    if (isOpen) setSelectedTeamWorkIds(selectedTeamWorkIdsProp);
  }, [isOpen, selectedTeamWorkIdsProp]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSearchTerm("");
      setSelectedTeamWorkIds([]);
    }, 300);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(selectedTeamWorkIds);
      handleClose();
    } catch {
      // The parent (page) owns the error toast; keep the modal open for retry.
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectedTeamWorkChange = (val: string[]) => {
    setSelectedTeamWorkIds(val);
    setSearchTerm("");
    confirmButtonRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <ModalCore isOpen={isOpen} width={EModalWidth.LG} position={EModalPosition.TOP} handleClose={handleClose}>
      <Combobox as="div" multiple value={selectedTeamWorkIds} onChange={handleSelectedTeamWorkChange}>
        <div className="flex items-center gap-2 border-b border-subtle px-4">
          <SearchIcon className="size-4 flex-shrink-0 text-placeholder" aria-hidden="true" />
          <Combobox.Input
            className="h-12 w-full border-0 bg-transparent text-13 text-primary outline-none placeholder:text-placeholder focus:ring-0"
            placeholder={t("search") + "..."}
            displayValue={() => ""}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {selectedTeamWorkIds.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-2">
            {selectedTeamWorkIds.map((teamWorkId) => {
              const teamWork = teamWorkDetailsMap.get(teamWorkId);
              if (!teamWork) return null;
              return (
                <div
                  key={teamWork.id}
                  className="group flex cursor-pointer items-center gap-1.5 rounded-sm bg-surface-2 px-2 py-1"
                  onClick={() => {
                    handleSelectedTeamWorkChange(selectedTeamWorkIds.filter((id) => id !== teamWork.id));
                  }}
                >
                  {teamWork.avatar && teamWork.avatar.trim() !== "" ? (
                    <img
                      src={getFileURL(teamWork.avatar)}
                      alt={teamWork.name}
                      className="size-3.5 flex-shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-3.5 flex-shrink-0 items-center justify-center rounded-full bg-layer-3 text-8 capitalize">
                      {(teamWork.name ?? "?")[0]}
                    </span>
                  )}
                  <p className="truncate text-11 text-tertiary transition-colors group-hover:text-secondary">
                    {teamWork.name}
                  </p>
                  <CloseIcon className="size-3 flex-shrink-0 text-placeholder transition-colors group-hover:text-secondary" />
                </div>
              );
            })}
          </div>
        )}
        <Combobox.Options
          static
          className="vertical-scrollbar scrollbar-md max-h-80 scroll-py-2 overflow-y-auto py-2 transition-[height] duration-200 ease-in-out"
        >
          {filteredTeamWorkIds.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
              <p className="text-13 text-placeholder">
                {searchTerm ? t("no_matching_members") : t("workspace_settings.settings.members.empty_state")}
              </p>
            </div>
          ) : (
            <ul
              className={cn("text-primary", {
                "px-2": filteredTeamWorkIds.length > 0,
              })}
            >
              {filteredTeamWorkIds.map((teamWorkId) => {
                const teamWork = teamWorkDetailsMap.get(teamWorkId);
                if (!teamWork) return null;
                const isTeamWorkSelected = selectedTeamWorkIds.includes(teamWork.id);
                return (
                  <Combobox.Option
                    key={teamWork.id}
                    value={teamWork.id}
                    className={({ active }) =>
                      cn(
                        "flex w-full cursor-pointer items-center justify-between gap-2 truncate rounded-md p-2 text-secondary transition-colors select-none",
                        {
                          "bg-layer-1": active,
                          "text-primary": isTeamWorkSelected,
                        }
                      )
                    }
                  >
                    <div className="flex min-w-0 items-center gap-2 truncate">
                      <span className="flex flex-shrink-0 items-center gap-2.5">
                        <Checkbox checked={isTeamWorkSelected} />
                        {teamWork.avatar && teamWork.avatar.trim() !== "" ? (
                          <img
                            src={getFileURL(teamWork.avatar)}
                            alt={teamWork.name}
                            className="size-6 flex-shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-layer-3 text-10 capitalize">
                            {(teamWork.name ?? "?")[0]}
                          </span>
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-13 text-primary">{teamWork.name}</p>
                        {teamWork.role && <p className="truncate text-11 text-tertiary">{teamWork.role}</p>}
                      </div>
                    </div>
                  </Combobox.Option>
                );
              })}
            </ul>
          )}
        </Combobox.Options>
      </Combobox>
      <div className="flex items-center justify-end gap-2 border-t border-subtle p-3">
        <Button variant="secondary" size="lg" onClick={handleClose}>
          {t("cancel")}
        </Button>
        <Button
          ref={confirmButtonRef}
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={!areSelectedTeamWorksChanged}
        >
          {isSubmitting ? t("confirming") : t("confirm")}
        </Button>
      </div>
    </ModalCore>
  );
});
