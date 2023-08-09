import { casts } from '@prisma/client';
import { replaceOccurrencesMultiple } from '../utils';
import { isValidImageExtension } from '../validation';
import type { ImagesPreview } from './file';
import { BaseResponse } from './responses';
import type { User } from './user';

export type Tweet = {
  id: string;
  text: string | null;
  images: ImagesPreview | null;
  parent: { id: string; username?: string; userId?: string } | null;
  userLikes: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date | null;
  userReplies: number;
  userRetweets: string[];
};

export type TweetWithUser = Tweet & { user: User };

export type TweetResponse = BaseResponse<TweetWithUser>;
export interface TweetRepliesResponse
  extends BaseResponse<{
    tweets: Tweet[];
    nextPageCursor: string | null;
    // fid -> User
    users: { [key: string]: User };
  }> {}

export const tweetConverter = {
  toTweet(cast: casts): Tweet {
    // Check if cast.hash is a buffer
    const isBuffer = Buffer.isBuffer(cast.hash);

    let parent: { id: string; userId?: string } | null = null;
    if (cast.parent_hash) {
      parent = {
        id: cast.parent_hash.toString('hex'),
        userId: cast.parent_fid?.toString()
      };
    }

    const images =
      cast.embeds.length > 0
        ? cast.embeds
            .filter((embed) => isValidImageExtension(embed))
            .map((url) => ({
              src: url,
              alt: '',
              id: url
            }))
        : null;

    // Remove images links that will be embedded from text
    const formattedText = replaceOccurrencesMultiple(
      cast.text,
      images?.map((img) => img.src) ?? [],
      ''
    );

    return {
      id: isBuffer
        ? cast.hash.toString('hex')
        : Buffer.from((cast.hash as any).data).toString('hex'),
      text: formattedText,
      images,
      parent,
      userLikes: [],
      createdBy: cast.fid.toString(),
      createdAt: cast.created_at,
      updatedAt: null,
      userReplies: 0,
      userRetweets: []
    } as Tweet;
  }
};