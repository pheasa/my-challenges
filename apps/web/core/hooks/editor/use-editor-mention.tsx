/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
// plane editor
import type { TMentionSection, TMentionSuggestion } from "@plane/editor";
// plane types
import type {
  TSearchEntities,
  TSearchEntityRequestPayload,
  TSearchResponse,
  TTeamWorkSearchResponse,
  TUserSearchResponse,
} from "@plane/types";
// plane ui
import { Avatar } from "@plane/ui";
// helpers
import { getFileURL } from "@plane/utils";
// plane web hooks
import { useAdditionalEditorMention } from "@/hooks/use-additional-editor-mention";

type TArgs = {
  enableAdvancedMentions?: boolean;
  searchEntity: (payload: TSearchEntityRequestPayload) => Promise<TSearchResponse>;
};

export const useEditorMention = (args: TArgs) => {
  const { enableAdvancedMentions = false, searchEntity } = args;
  // additional mentions
  const { editorMentionTypes, updateAdditionalSections } = useAdditionalEditorMention({
    enableAdvancedMentions,
  });
  // fetch mentions handler
  const fetchMentions = useCallback(
    async (query: string): Promise<TMentionSection[]> => {
      try {
        const res = await searchEntity({
          count: 5,
          query_type: editorMentionTypes,
          query,
        });
        const suggestionSections: TMentionSection[] = [];
        if (!res) {
          throw new Error("No response found");
        }
        Object.keys(res).map((key) => {
          const responseKey = key as TSearchEntities;
          const response = res[responseKey];
          if (responseKey === "user_mention" && response && response.length > 0) {
            const items: TMentionSuggestion[] = (response as TUserSearchResponse[]).map((user) => ({
              icon: (
                <Avatar
                  className="flex-shrink-0"
                  src={getFileURL(user.member__avatar_url)}
                  name={user.member__display_name}
                />
              ),
              id: user.member__id,
              entity_identifier: user.member__id,
              entity_name: "user_mention",
              title: user.member__display_name,
            }));
            suggestionSections.push({
              key: "users",
              title: "Users",
              items,
            });
          } else if (responseKey === "team_work" && response && response.length > 0) {
            const items: TMentionSuggestion[] = (response as TTeamWorkSearchResponse[]).map((teamWork) => ({
              icon: (
                <Avatar
                  className="flex-shrink-0"
                  src={getFileURL(teamWork.avatar ?? "")}
                  name={teamWork.name}
                />
              ),
              id: teamWork.id,
              entity_identifier: teamWork.id,
              entity_name: "team_work",
              title: teamWork.name,
              subTitle: teamWork.role ?? undefined,
            }));
            suggestionSections.push({
              key: "team-work",
              title: "Team work",
              items,
            });
          }
        });
        const { sections } = updateAdditionalSections({
          response: res,
        });
        return [...suggestionSections, ...sections];
      } catch (error) {
        console.error("Error in fetching mentions:", error);
        throw error;
      }
    },
    [editorMentionTypes, searchEntity, updateAdditionalSections]
  );

  return {
    fetchMentions,
  };
};
