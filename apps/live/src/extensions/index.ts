/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Extension } from "@hocuspocus/server";
// plane imports
import { Database } from "./database";
import { ForceCloseHandler } from "./force-close-handler";
import { Logger } from "./logger";
import { Redis } from "./redis";
import { TitleSyncExtension } from "./title-sync";
// redis
import { redisManager } from "@/redis";

export const getExtensions = (): Extension[] => {
  const extensions: Extension[] = [new Logger(), new Database(), new TitleSyncExtension(), new ForceCloseHandler()];

  // Redis is optional in a single-server (minimal) deployment: the Redis
  // extension constructor throws when no client is available, so only attach
  // it when redis is actually connected. ForceCloseHandler already tolerates
  // its absence (it logs a warning and skips cross-server broadcast).
  if (redisManager.isClientConnected()) {
    extensions.push(new Redis());
  }

  return extensions;
};
