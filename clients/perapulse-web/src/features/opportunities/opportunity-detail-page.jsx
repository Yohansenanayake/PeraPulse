import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, MapPin, Clock, Building, Briefcase, ExternalLink } from "lucide-react";
import { opportunitiesApi } from "@/api/opportunities";
import { useAuthState } from "@/auth/use-auth-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function OpportunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isStudent, isAdmin, auth } = useAuthState();
  const queryClient = useQueryClient();
  const [showApply, setShowApply] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [applied, setApplied] = useState(false);

  const { data: opp, isLoading, isError, refetch } = useQuery({
    queryKey: ["opportunity", id],
    queryFn: () => opportunitiesApi.getOpportunity(id),
  });

  const applyMutation = useMutation({
    mutationFn: () => opportunitiesApi.applyToOpportunity(id, { coverLetter, resumeUrl }),
    onSuccess: () => { setApplied(true); setShowApply(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: () => opportunitiesApi.deleteOpportunity(id),
    onSuccess: () => navigate("/opportunities"),
  });

  const isOwner = opp?.createdBySub === auth.user?.profile?.sub;

  if (isLoading) return <LoadingSkeleton count={3} />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!opp) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${opp.type === "JOB" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"}`}>
              {opp.type}
            </span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{opp.title}</h1>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building className="size-4" />
              <span className="font-medium">{opp.company}</span>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${opp.status === "OPEN" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
            {opp.status}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          {opp.location && <span className="flex items-center gap-1.5"><MapPin className="size-4" />{opp.location}</span>}
          {opp.deadline && <span className="flex items-center gap-1.5"><Clock className="size-4" />Deadline: {format(new Date(opp.deadline), "MMMM d, yyyy")}</span>}
          <span className="flex items-center gap-1.5"><Briefcase className="size-4" />Posted {format(new Date(opp.createdAt), "MMM d, yyyy")}</span>
        </div>

        {opp.description && (
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-sm font-semibold text-foreground mb-2">Description</p>
            <p className="text-sm leading-7 text-foreground whitespace-pre-wrap">{opp.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
          {isStudent && opp.status === "OPEN" && !applied && (
            <Button onClick={() => setShowApply((s) => !s)}>
              {showApply ? "Cancel" : "Apply Now"}
            </Button>
          )}
          {applied && <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">✓ Applied</span>}
          {(isOwner || isAdmin) && (
            <>
              <Button variant="outline" asChild>
                <Link to={`/opportunities/${id}/applications`}>View Applications</Link>
              </Button>
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                Delete
              </Button>
            </>
          )}
        </div>

        {/* Apply form */}
        {showApply && (
          <form
            onSubmit={(e) => { e.preventDefault(); applyMutation.mutate(); }}
            className="mt-5 space-y-3 rounded-xl border border-border bg-muted/30 p-4"
          >
            <p className="text-sm font-semibold">Your Application</p>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Cover letter (optional)…"
              rows={4}
              className="w-full resize-none rounded-xl bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <input
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              placeholder="Resume URL (optional)"
              className="w-full rounded-xl bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <Button type="submit" disabled={applyMutation.isPending} className="w-full">
              {applyMutation.isPending ? "Submitting…" : "Submit Application"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
