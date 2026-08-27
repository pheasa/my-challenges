/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { Combobox } from "@headlessui/react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CheckIcon, SearchIcon } from "@plane/propel/icons";
import { Avatar, ComboDropDown } from "@plane/ui";
import { cn, getFileURL } from "@plane/utils";
// hooks
import { useDropdown } from "@/hooks/use-dropdown";
import { useMember } from "@/hooks/store/use-member";
// components
import { DropdownButton } from "../buttons";

type LeadDropdownProps = {
  value: string | null;
  onChange: (val: string | null) => void;
  placeholder?: string;
  multiple?: false;
  buttonVariant?: string;
  tabIndex?: number;
  className?: string;
};

export const LeadDropdown = observer(function LeadDropdown(props: LeadDropdownProps) {
  const {
    value,
    onChange,
    placeholder = "Lead / Scrum Master",
    buttonVariant = "border-with-text",
    tabIndex,
    className = "",
  } = props;

  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  // store hooks
  const {
    workspace: { fetchTeamWorks, teamWorkIds, getTeamWorkDetails },
  } = useMember();

  // useDropdown for open/close management
  const { handleClose, handleKeyDown, handleOnClick } = useDropdown({
    dropdownRef,
    isOpen,
    onClose: () => {
      setIsOpen(false);
      setQuery("");
    },
    setIsOpen,
  });

  // fetch team works on mount and when dropdown opens
  useSWR(
    workspaceSlug ? `WORKSPACE_TEAM_WORKS_${workspaceSlug.toString()}` : null,
    workspaceSlug ? () => fetchTeamWorks(workspaceSlug.toString()) : null
  );

  useEffect(() => {
    if (isOpen && workspaceSlug) {
      fetchTeamWorks(workspaceSlug.toString());
    }
  }, [isOpen, workspaceSlug, fetchTeamWorks]);

  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    modifiers: [{ name: "preventOverflow", options: { padding: 12 } }],
  });

  // build team work options
  type TeamWorkOption = { id: string; name: string; avatar: string | null; role: string | null };

  const options: TeamWorkOption[] = [];

  if (teamWorkIds) {
    for (const teamWorkId of teamWorkIds) {
      const teamWork = getTeamWorkDetails(teamWorkId);
      if (teamWork) {
        options.push({
          id: teamWork.id,
          name: teamWork.name,
          avatar: teamWork.avatar,
          role: teamWork.role,
        });
      }
    }
  }

  // filter options by query
  const filteredOptions = query
    ? options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    : options;

  // sort: selected first
  const sortedOptions = [...filteredOptions].sort((a, b) => {
    if (a.id === value) return -1;
    if (b.id === value) return 1;
    return 0;
  });

  // get display name for button
  const getDisplayValue = () => {
    if (!value) return placeholder;
    const option = options.find((o) => o.id === value);
    if (option) return option.name;
    return placeholder;
  };

  // Get avatar for selected option
  const getSelectedOption = () => {
    if (!value) return undefined;
    return options.find((o) => o.id === value);
  };

  const handleOptionSelect = (optionId: string) => {
    const selectedOption = options.find((o) => o.id === optionId);
    if (!selectedOption) {
      onChange(null);
    } else {
      onChange(selectedOption.id);
    }
    handleClose();
  };

  const comboButton = (
    <button
      ref={setReferenceElement}
      type="button"
      className={cn(
        "clickable block h-full max-w-full outline-none cursor-pointer",
        className
      )}
      onClick={handleOnClick}
      tabIndex={tabIndex}
    >
      <DropdownButton
        className="text-11"
        isActive={isOpen}
        tooltipHeading={placeholder}
        showTooltip={false}
        variant={buttonVariant as any}
        renderToolTipByDefault={true}
      >
        {(() => {
          const selected = getSelectedOption();
          return selected ? (
            <Avatar
              name={selected.name}
              src={selected.avatar ? getFileURL(selected.avatar) : undefined}
              size="xs"
            />
          ) : null;
        })()}
        <span className="flex-grow truncate text-left text-body-xs-medium leading-5">
          {getDisplayValue()}
        </span>
      </DropdownButton>
    </button>
  );

  return (
    <ComboDropDown
      as="div"
      ref={dropdownRef}
      value={value}
      onChange={handleOptionSelect}
      onKeyDown={handleKeyDown}
      button={comboButton}
      className="h-full"
    >
      {isOpen &&
        createPortal(
          <Combobox.Options data-prevent-outside-click static>
            <div
              className="z-30 my-1 w-56 rounded-sm border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200 focus:outline-none"
              ref={setPopperElement}
              style={{ ...styles.popper }}
              {...attributes.popper}
            >
              <div className="flex items-center gap-1.5 rounded-sm border border-subtle bg-surface-2 px-2">
                <SearchIcon className="h-3.5 w-3.5 text-placeholder" strokeWidth={1.5} />
                <input
                  className="w-full bg-transparent py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("search")}
                  onKeyDown={(e) => {
                    if (query !== "" && e.key === "Escape") {
                      e.stopPropagation();
                      setQuery("");
                    }
                  }}
                />
              </div>
              <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
                {sortedOptions.length > 0 ? (
                  sortedOptions.map((option) => (
                    <Combobox.Option
                      key={option.id}
                      value={option.id}
                      className={({ active, selected }) =>
                        cn(
                          "flex w-full items-center justify-between gap-2 truncate rounded-sm px-1 py-1.5 select-none",
                          active && "bg-layer-transparent-hover",
                          selected ? "text-primary" : "text-secondary",
                          "cursor-pointer"
                        )
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className="flex items-center gap-2 flex-grow truncate">
                            <Avatar
                              name={option.name}
                              src={option.avatar ? getFileURL(option.avatar) : undefined}
                              size="xs"
                            />
                            <span className="flex flex-col">
                              <span className="truncate">{option.name}</span>
                              {option.role && (
                                <span className="text-[10px] text-placeholder truncate">{option.role}</span>
                              )}
                            </span>
                          </span>
                          {selected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
                        </>
                      )}
                    </Combobox.Option>
                  ))
                ) : (
                  <p className="px-1.5 py-1 text-placeholder italic">{t("no_matching_results")}</p>
                )}
              </div>
            </div>
          </Combobox.Options>,
          document.body
        )}
    </ComboDropDown>
  );
});
