import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Heart, MessageCircle, Trash2, Image, Send } from "lucide-react";
import { feedApi } from "@/api/feed";
import { useAuthState } from "@/auth/use-auth-state";
import { useUiStore } from "@/store/ui-store";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";

export function FeedPage() {
  const { userLabel, isAdmin, auth } = useAuthState();
  const { darkMode } = useUiStore();
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
        className={`mb-6 rounded-2xl border p-4 shadow-lg ${darkMode ? 'border-cyan-500/20 bg-gradient-to-br from-slate-900/50 to-blue-900/30' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-white'}`}
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`What's on your mind, ${userLabel.split("@")[0]}?`}
          rows={3}
          className={`w-full resize-none rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800/50 border-cyan-500/20 text-white placeholder:text-slate-400 focus:ring-cyan-500/40' : 'bg-white border-blue-200 text-slate-900 placeholder:text-slate-500 focus:ring-blue-500/40'}`}
        />
        {showMedia && (
          <input
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://media-url.com/image.jpg"
            className={`mt-2 w-full rounded-xl border px-4 py-2.5 text-sm ${darkMode ? 'bg-slate-800/50 border-cyan-500/20 text-white placeholder:text-slate-400 focus:ring-cyan-500/40' : 'bg-white border-blue-200 text-slate-900 placeholder:text-slate-500 focus:ring-blue-500/40'} focus:outline-none focus:ring-2`}
          />
        )}
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowMedia((s) => !s)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${showMedia ? (darkMode ? "bg-cyan-500/20 text-cyan-300" : "bg-blue-100 text-blue-600") : (darkMode ? "text-slate-400 hover:text-slate-300" : "text-slate-600 hover:text-slate-900")}`}
          >
            <Image className="size-3.5" /> Media URL
          </button>
          <Button type="submit" size="sm" disabled={!content.trim() || createPost.isPending} className={`gap-1.5 text-white shadow-md ${darkMode ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500' : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500'}`}>
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
  const { darkMode } = useUiStore();
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
    <div className={`rounded-2xl border p-5 shadow-lg transition-all duration-300 ${darkMode ? 'border-cyan-500/20 bg-gradient-to-br from-slate-900/50 to-blue-900/30 hover:border-cyan-400/50 hover:shadow-xl' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:border-blue-400 hover:shadow-xl'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${darkMode ? 'bg-gradient-to-br from-cyan-600 to-blue-600' : 'bg-gradient-to-br from-blue-600 to-cyan-600'}`}>
            {(post.authorName ?? post.authorSub ?? "?")[0].toUpperCase()}
          </div>
          <div>
            <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {post.authorName ?? post.authorSub ?? "Unknown"}
            </p>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {post.createdAt ? format(new Date(post.createdAt), "MMM d, yyyy · h:mm a") : ""}
            </p>
          </div>
        </div>
        {(isOwner || isAdmin) && (
          <button
            onClick={() => deleteMutation.mutate()}
            className={`transition-colors ${darkMode ? 'text-slate-400 hover:text-red-400' : 'text-slate-600 hover:text-red-500'}`}
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <p className={`mt-3 whitespace-pre-wrap text-sm leading-7 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{post.content}</p>

      {post.mediaUrl && (
        <img
          src={post.mediaUrl}
          alt="Post media"
          className="mt-3 w-full rounded-xl object-cover max-h-80"
          onError={(e) => e.target.classList.add("hidden")}
        />
      )}

      {/* Actions */}
      <div className={`mt-4 flex items-center gap-4 border-t pt-3 ${darkMode ? 'border-cyan-500/10' : 'border-blue-200'}`}>
        <button
          onClick={() => (post.liked ? unlikeMutation.mutate() : likeMutation.mutate())}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${post.liked ? "text-rose-400" : darkMode ? "text-slate-400 hover:text-rose-400" : "text-slate-600 hover:text-rose-500"}`}
        >
          <Heart className={`size-4 ${post.liked ? "fill-current" : ""}`} />
          {post.likeCount ?? 0}
        </button>
        <button
          onClick={() => setShowComments((s) => !s)}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${darkMode ? 'text-slate-400 hover:text-cyan-400' : 'text-slate-600 hover:text-blue-600'}`}
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
  const { darkMode } = useUiStore();
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
    <div className={`mt-4 space-y-3 border-t pt-4 ${darkMode ? 'border-cyan-500/10' : 'border-blue-200'}`}>
      {isLoading && <div className={`h-4 w-1/3 animate-pulse rounded ${darkMode ? 'bg-slate-800' : 'bg-blue-100'}`} />}
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2.5">
          <div className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${darkMode ? 'bg-gradient-to-br from-cyan-600 to-blue-600' : 'bg-gradient-to-br from-blue-600 to-cyan-600'}`}>
            {(c.authorName ?? c.authorSub ?? "?")[0].toUpperCase()}
          </div>
          <div className={`flex-1 rounded-xl border px-3 py-2 ${darkMode ? 'border-cyan-500/10 bg-slate-800/50' : 'border-blue-200 bg-blue-50'}`}>
            <p className={`text-xs font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{c.authorName ?? c.authorSub}</p>
            <p className={`mt-0.5 text-xs leading-5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{c.text}</p>
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
          className={`flex-1 rounded-xl border px-3 py-2 text-xs focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800/50 border-cyan-500/20 text-white placeholder:text-slate-400 focus:ring-cyan-500/40' : 'bg-white border-blue-200 text-slate-900 placeholder:text-slate-500 focus:ring-blue-500/40'}`}
        />
        <button
          type="submit"
          disabled={!text.trim() || addComment.isPending}
          className={`rounded-xl px-3 py-2 text-xs font-medium text-white disabled:opacity-50 ${darkMode ? 'bg-gradient-to-r from-cyan-600 to-blue-600' : 'bg-gradient-to-r from-blue-600 to-cyan-600'}`}
        >
          <Send className="size-3.5" />
        </button>
      </form>
    </div>
  );
}
