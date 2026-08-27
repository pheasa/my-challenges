/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useDropzone } from "react-dropzone";
// plane imports
import { ACCEPTED_AVATAR_IMAGE_MIME_TYPES_FOR_REACT_DROPZONE, MAX_FILE_SIZE } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { UserCirclePropertyIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EFileAssetType, type ITeamWork } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// services
import { FileService } from "@/services/file.service";
const fileService = new FileService();

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ITeamWork>) => Promise<void>;
  workspaceSlug: string;
  teamWork: ITeamWork | null;
};

export const TeamWorkModal = observer(function TeamWorkModal(props: Props) {
  const { isOpen, onClose, onSubmit, workspaceSlug, teamWork } = props;
  // states
  const [name, setName] = useState<string>(teamWork?.name ?? "");
  const [role, setRole] = useState<string>(teamWork?.role ?? "");
  const [avatar, setAvatar] = useState<string | null>(teamWork?.avatar ?? null);
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  // translation
  const { t } = useTranslation();

  const isEditMode = teamWork !== null;

  const onDrop = (acceptedFiles: File[]) => setImage(acceptedFiles[0]);

  const { getRootProps, getInputProps, isDragActive, fileRejections, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_AVATAR_IMAGE_MIME_TYPES_FOR_REACT_DROPZONE,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    noClick: true,
  });

  const handleClose = () => {
    setName(teamWork?.name ?? "");
    setRole(teamWork?.role ?? "");
    setAvatar(teamWork?.avatar ?? null);
    setImage(null);
    setIsSubmitting(false);
    setIsImageUploading(false);
    onClose();
  };

  const handleAvatarUpload = async () => {
    if (!image) return avatar;
    setIsImageUploading(true);
    try {
      const { asset_url } = await fileService.uploadWorkspaceAsset(
        workspaceSlug,
        {
          entity_identifier: teamWork?.id ?? "",
          entity_type: EFileAssetType.TEAM_WORK_AVATAR,
        },
        image
      );
      setAvatar(asset_url);
      setImage(null);
      return asset_url;
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.toString() ?? t("something_went_wrong_please_try_again"),
      });
      throw new Error("Error in uploading file.");
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: t("name_is_required"),
      });
      return;
    }
    setIsSubmitting(true);
    try {
      let avatarUrl = avatar;
      if (image) {
        avatarUrl = await handleAvatarUpload();
      }
      await onSubmit({
        name: name.trim(),
        role: role.trim() || null,
        avatar: avatarUrl,
      });
      handleClose();
    } catch {
      // The parent (page) owns the error toast for submit failures, so the
      // modal simply stays open for the user to retry.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <div className="space-y-5 px-5 py-8 sm:p-6">
        <h3 className="text-16 leading-6 font-medium text-primary">
          {isEditMode
            ? t("workspace_settings.settings.members.modal.edit_title")
            : t("workspace_settings.settings.members.modal.title")}
        </h3>

        {/* Profile image */}
        <div className="space-y-2">
          <p className="text-body-xs-regular text-secondary">
            {t("workspace_settings.settings.members.profile_image")}
          </p>
          <div className="flex items-center gap-3">
            <div
              {...getRootProps()}
              className={`relative grid size-20 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full focus:ring-2 focus:ring-accent-strong focus:outline-none ${
                (image === null && isDragActive) || !avatar
                  ? "border-2 border-dashed border-subtle bg-surface-2 hover:bg-surface-3"
                  : ""
              }`}
            >
              {image !== null || (avatar && avatar !== "") ? (
                <img
                  src={image ? URL.createObjectURL(image) : getFileURL(avatar ?? "")}
                  alt="team work avatar"
                  className="absolute top-0 left-0 h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <UserCirclePropertyIcon className="h-8 w-8 text-secondary" />
                  <span className="mt-1 text-10 font-medium text-secondary">
                    {isDragActive ? "Drop" : t("workspace_settings.settings.members.upload_image")}
                  </span>
                </div>
              )}
              <input {...getInputProps()} />
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="secondary" size="base" onClick={open}>
                {t("workspace_settings.settings.members.browse_image")}
              </Button>
              {avatar && (
                <Button variant="error-fill" size="base" onClick={() => setAvatar(null)}>
                  {t("workspace_settings.settings.members.remove_image")}
                </Button>
              )}
            </div>
          </div>
          {fileRejections.length > 0 && (
            <p className="text-13 text-danger-primary">
              {fileRejections[0].errors[0].code === "file-too-large"
                ? "The image size cannot exceed 5 MB."
                : "Please upload a file in a valid format."}
            </p>
          )}
          {isImageUploading && <p className="text-13 text-secondary">{t("workspace_settings.settings.members.uploading")}</p>}
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-body-xs-regular text-secondary">{t("common.name")}</label>
          <input
            className="w-full rounded-md border border-subtle bg-surface-1 px-3 py-2 text-body-xs-regular outline-none placeholder:text-placeholder focus:border-accent-primary"
            placeholder={t("workspace_settings.settings.members.name_placeholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Role / position */}
        <div className="space-y-1.5">
          <label className="text-body-xs-regular text-secondary">{t("common.role")}</label>
          <input
            className="w-full rounded-md border border-subtle bg-surface-1 px-3 py-2 text-body-xs-regular outline-none placeholder:text-placeholder focus:border-accent-primary"
            placeholder={t("workspace_settings.settings.members.role_placeholder")}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" size="lg" onClick={handleSubmit} loading={isSubmitting || isImageUploading}>
            {isSubmitting ? t("common.saving") : isEditMode ? t("common.update") : t("workspace_settings.settings.members.add_member")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
