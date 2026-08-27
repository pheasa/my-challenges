# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import mimetypes
import os
from urllib.parse import quote

# Django imports
from django.conf import settings
from django.http import FileResponse

# Third party imports
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

# Module imports
from ..base import BaseAPIView
from plane.db.models import FileAsset
from plane.settings.storage import S3Storage


class LocalAssetUploadEndpoint(BaseAPIView):
    """
    Receives file bytes for the local (no-S3) storage mode.

    Mirrors the S3 presigned-POST contract: the client posts the fields returned
    by the asset endpoint (the unguessable asset key) together with the file.
    Possession of the key is the bearer credential, exactly like a signed POST.
    """

    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]

    def post(self, request):
        key = request.data.get("key")
        file = request.FILES.get("file")
        if not key or not file:
            return Response(
                {"error": "key and file are required.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if file.size > settings.FILE_SIZE_LIMIT:
            return Response(
                {"error": "File too large.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # The unguessable asset key acts as the upload credential; require the
        # matching asset row so random bytes cannot be written to disk.
        asset = FileAsset.objects.filter(asset=key, is_deleted=False).first()
        if asset is None:
            return Response(
                {"error": "Asset not found.", "status": False},
                status=status.HTTP_404_NOT_FOUND,
            )
        storage = S3Storage()
        if not storage.upload_file(file_obj=file, object_name=key, content_type=file.content_type):
            return Response(
                {"error": "Failed to store the file.", "status": False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class LocalAssetServeEndpoint(BaseAPIView):
    """
    Streams a file stored by the local (no-S3) storage mode.

    The asset key is the bearer credential (like a presigned GET URL), so the
    endpoint is intentionally public.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        key = request.GET.get("key")
        if not key:
            return Response(
                {"error": "key is required.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )
        storage = S3Storage()
        try:
            path = storage._local_path(key)
        except ValueError:
            return Response(
                {"error": "Invalid asset key.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not os.path.isfile(path):
            return Response(
                {"error": "The requested asset could not be found.", "status": False},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Resolve the content type from the asset row, falling back to the
        # filename extension and finally to octet-stream.
        asset = FileAsset.objects.filter(asset=key, is_deleted=False).first()
        content_type = None
        filename = request.GET.get("filename")
        if asset and asset.attributes.get("type"):
            content_type = asset.attributes.get("type")
        if not content_type:
            content_type, _ = mimetypes.guess_type(filename or key)
        response = FileResponse(open(path, "rb"), content_type=content_type or "application/octet-stream")

        # Force attachment for script-capable MIME types (defense in depth,
        # mirroring StaticFileAssetEndpoint) so a public streaming endpoint can
        # never be used for same-origin XSS, regardless of the requested
        # disposition in the URL.
        asset_mime_type = (content_type or "").split(";")[0].strip().lower()
        if asset_mime_type in settings.SCRIPT_CAPABLE_MIME_TYPES:
            disposition = "attachment"
        else:
            disposition = request.GET.get("disposition", "inline")

        # Honor the requested disposition (inline/attachment) with an encoded
        # filename, mirroring the S3 presigned-URL content disposition.
        if filename:
            response["Content-Disposition"] = f"{disposition}; filename*=UTF-8''{quote(filename)}"
        else:
            response["Content-Disposition"] = disposition
        return response
