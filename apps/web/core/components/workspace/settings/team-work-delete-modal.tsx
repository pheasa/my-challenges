/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { AlertTriangle } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { ITeamWork } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  teamWork: ITeamWork;
};

export const TeamWorkDeleteModal = observer(function TeamWorkDeleteModal(props: Props) {
  const { isOpen, onClose, onSubmit, teamWork } = props;
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // translation
  const { t } = useTranslation();

  const handleClose = () => {
    onClose();
    setIsDeleting(false);
  };

  const handleDeletion = async () => {
    setIsDeleting(true);
    try {
      await onSubmit();
    } finally {
      handleClose();
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-danger-subtle sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle className="h-6 w-6 text-danger-primary" aria-hidden="true" />
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 className="text-h5-medium leading-6 text-primary">
              {t("workspace_settings.settings.members.delete_title")}
            </h3>
            <div className="mt-2">
              <p className="text-body-xs-regular text-secondary">
                {t("workspace_settings.settings.members.delete_description", { name: teamWork.name })}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 p-4 sm:px-6">
        <Button variant="secondary" size="lg" onClick={handleClose}>
          {t("cancel")}
        </Button>
        <Button variant="error-fill" size="lg" tabIndex={1} onClick={handleDeletion} loading={isDeleting}>
          {isDeleting ? t("deleting") : t("delete")}
        </Button>
      </div>
    </ModalCore>
  );
});
