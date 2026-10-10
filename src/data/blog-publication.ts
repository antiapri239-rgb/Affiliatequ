interface BlogPublication {
  draft?: boolean;
  publishAt?: Date | string;
  advanced?: {
    publishAt?: Date | string;
  };
}

export function isBlogPostPublished(
  post: BlogPublication,
  now: Date = new Date(),
): boolean {
  if (post.draft) return false;
  const publishAtValue = post.advanced?.publishAt ?? post.publishAt;
  if (!publishAtValue) return true;

  const publishAt = new Date(publishAtValue);
  if (Number.isNaN(publishAt.valueOf())) {
    throw new Error(`Invalid scheduled publication date "${publishAtValue}".`);
  }

  return publishAt <= now;
}
