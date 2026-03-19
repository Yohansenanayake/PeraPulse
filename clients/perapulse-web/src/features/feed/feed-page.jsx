import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Heart, MessageCircle, Trash2, Image, Send } from "lucide-react";
import { feedApi } from "@/api/feed";
import { useAuthState } from "@/auth/use-auth-state";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";

export function FeedPage() {
  const { userLabel, isAdmin, auth } = useAuthState();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMedia, setShowMedia] = useState(false);
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["posts", page],
    queryFn: () => feedApi.getPosts(page, 20),
  });

  const posts = data?.content ?? data ?? [];

  const createPost = useMutation({
    mutationFn: (body) => feedApi.createPost(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setContent("");
      setMediaUrl("");
      setShowMedia(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    createPost.mutate({ content, mediaUrl: mediaUrl || undefined });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Feed" subtitle="What's happening in the department" />

      {/* Create post */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm"
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`What's on your mind, ${userLabel.split("@")[0]}?`}
          rows={3}
          className="w-full resize-none rounded-xl bg-muted/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {showMedia && (
          <input
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://media-url.com/image.jpg"
            className="mt-2 w-full rounded-xl bg-muted/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        )}
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowMedia((s) => !s)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${showMedia ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Image className="size-3.5" /> Media URL
          </button>
          <Button type="submit" size="sm" disabled={!content.trim() || createPost.isPending} className="gap-1.5">
            <Send className="size-3.5" />
            {createPost.isPending ? "Posting..." : "Post"}
          </Button>
        </div>
      </form>

      {/* Feed list */}
      {isLoading && <LoadingSkeleton count={5} />}
      {isError && <ErrorState onRetry={refetch} />}
      {!isLoading && !isError && posts.length === 0 && (
        <EmptyState title="No posts yet" description="Be the first to post something!" />
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isOwner={post.authorSub === auth.user?.profile?.sub}
            isAdmin={isAdmin}
            onDeleted={() => queryClient.invalidateQueries({ queryKey: ["posts"] })}
          />
        ))}
      </div>

      {/* Pagination */}
      {posts.length === 20 && (
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            Previous
          </Button>
          <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function PostCard({ post, isOwner, isAdmin, onDeleted }) {
  const [showComments, setShowComments] = useState(false);
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () => feedApi.likePost(post.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  const unlikeMutation = useMutation({
    mutationFn: () => feedApi.unlikePost(post.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => feedApi.deletePost(post.id),
    onSuccess: onDeleted,
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
            {(post.authorName ?? post.authorSub ?? "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {post.authorName ?? post.authorSub ?? "Unknown"}
            </p>
            <p className="text-xs text-muted-foreground">
              {post.createdAt ? format(new Date(post.createdAt), "MMM d, yyyy · h:mm a") : ""}
            </p>
          </div>
        </div>
        {(isOwner || isAdmin) && (
          <button
            onClick={() => deleteMutation.mutate()}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <p className="mt-3 text-sm leading-7 text-foreground whitespace-pre-wrap">{post.content}</p>

      {post.mediaUrl && (
        <img
          src={post.mediaUrl}
          alt="Post media"
          className="mt-3 w-full rounded-xl object-cover max-h-80"
          onError={(e) => e.target.classList.add("hidden")}
        />
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-4 border-t border-border/60 pt-3">
        <button
          onClick={() => (post.liked ? unlikeMutation.mutate() : likeMutation.mutate())}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${post.liked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"}`}
        >
          <Heart className={`size-4 ${post.liked ? "fill-current" : ""}`} />
          {post.likeCount ?? 0}
        </button>
        <button
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageCircle className="size-4" />
          {post.commentCount ?? 0} Comments
        </button>
      </div>

      {showComments && <CommentsSection postId={post.id} />}
    </div>
  );
}

function CommentsSection({ postId }) {
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const { data: commentsData, isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => feedApi.getComments(postId),
  });

  const comments = commentsData?.content ?? commentsData ?? [];

  const addComment = useMutation({
    mutationFn: (t) => feedApi.addComment(postId, t),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      setText("");
    },
  });

  return (
    <div className="mt-4 border-t border-border/60 pt-4 space-y-3">
      {isLoading && <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />}
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
            {(c.authorName ?? c.authorSub ?? "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 rounded-xl bg-muted/50 px-3 py-2">
            <p className="text-xs font-semibold text-foreground">{c.authorName ?? c.authorSub}</p>
            <p className="mt-0.5 text-xs leading-5 text-foreground">{c.text}</p>
          </div>
        </div>
      ))}
      <form
        onSubmit={(e) => { e.preventDefault(); if (text.trim()) addComment.mutate(text); }}
        className="flex gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-xl bg-muted/50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="submit"
          disabled={!text.trim() || addComment.isPending}
          className="rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          <Send className="size-3.5" />
        </button>
      </form>
    </div>
  );
}
