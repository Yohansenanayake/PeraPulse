import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Newspaper,
  Briefcase,
  CalendarDays,
  Bell,
  ShieldCheck,
  ArrowRight,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/auth/use-auth-state";

const FEATURES = [
  {
    icon: Newspaper,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    title: "Social Feed",
    desc: "Share updates, post announcements, and engage with your department community.",
  },
  {
    icon: Briefcase,
    color: "text-amber-600",
    bg: "bg-amber-50",
    title: "Jobs & Internships",
    desc: "Alumni post opportunities; students apply and track their applications.",
  },
  {
    icon: CalendarDays,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    title: "Events & RSVPs",
    desc: "Discover department workshops, seminars, and networking events.",
  },
  {
    icon: Bell,
    color: "text-purple-600",
    bg: "bg-purple-50",
    title: "Notifications",
    desc: "Real-time alerts for likes, comments, applications, and new opportunities.",
  },
  {
    icon: Users,
    color: "text-rose-600",
    bg: "bg-rose-50",
    title: "Alumni Network",
    desc: "Connect with graduates, request Alumni status, and grow your professional network.",
  },
  {
    icon: ShieldCheck,
    color: "text-sky-600",
    bg: "bg-sky-50",
    title: "Secure & Role-based",
    desc: "Keycloak OIDC authentication with fine-grained student / alumni / admin access control.",
  },
];

export function LandingPage() {
  const { login } = useAuthState();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_oklch(0.9_0.06_264/30%)_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_oklch(0.95_0.05_85/25%)_0%,_transparent_55%)] bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4.5" />
            </div>
            <span className="text-lg font-bold tracking-tight">PeraPulse</span>
          </div>
          <Button onClick={login} size="sm" className="gap-1.5">
            Sign in <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-4 py-1.5 text-sm font-medium text-primary mb-6">
          <ShieldCheck className="size-3.5" />
          Secured by Keycloak OIDC · Dept. of Computer Engineering, UoP
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl leading-[1.08]">
          Connect. Grow.{" "}
          <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
            Thrive.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          PeraPulse is the department engagement &amp; career platform for
          students and alumni of the Department of Computer Engineering,
          University of Peradeniya.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={login} className="gap-2 px-8">
            Get started <ArrowRight className="size-4" />
          </Button>
          <Button variant="outline" size="lg" className="px-8">
            Learn more
          </Button>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg hover:shadow-primary/5"
            >
              <div className={`mb-4 inline-flex size-11 items-center justify-center rounded-xl ${bg} ${color}`}>
                <Icon className="size-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-indigo-500 px-10 py-14 text-center text-white shadow-xl shadow-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_white/8%,_transparent_50%)]" />
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to join the community?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base text-white/80">
            Sign in with your Keycloak account to access the full platform.
          </p>
          <Button
            onClick={login}
            size="lg"
            className="mt-8 gap-2 bg-white text-primary hover:bg-white/90 px-8 font-semibold"
          >
            Sign in with Keycloak <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
