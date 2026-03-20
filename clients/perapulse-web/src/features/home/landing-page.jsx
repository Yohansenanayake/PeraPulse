import {
  ArrowRight,
  Bell,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Newspaper,
  Sparkles,
  Star,
  Users,
  UserPlus,
  TrendingUp,
  MessageSquare,
  Calendar,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useAuthState } from "@/auth/use-auth-state";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Users,
    title: "Network & Connect",
    text: "Build meaningful relationships with peers, alumni, and industry professionals in your field.",
    color: "from-blue-500 to-cyan-500",
    lightColor: "from-blue-100 to-cyan-100",
  },
  {
    icon: Briefcase,
    title: "Career Opportunities",
    text: "Discover internships, jobs, and professional growth opportunities curated for you.",
    color: "from-purple-500 to-pink-500",
    lightColor: "from-purple-100 to-pink-100",
  },
  {
    icon: MessageSquare,
    title: "Community Discussions",
    text: "Engage in meaningful conversations and share insights with your academic community.",
    color: "from-emerald-500 to-teal-500",
    lightColor: "from-emerald-100 to-teal-100",
  },
  {
    icon: Newspaper,
    title: "Stay Updated",
    text: "Get real-time updates on department news, achievements, and community highlights.",
    color: "from-orange-500 to-red-500",
    lightColor: "from-orange-100 to-red-100",
  },
  {
    icon: Calendar,
    title: "Event Management",
    text: "Never miss workshops, talks, seminars, or networking events happening near you.",
    color: "from-indigo-500 to-purple-500",
    lightColor: "from-indigo-100 to-purple-100",
  },
  {
    icon: TrendingUp,
    title: "Track Your Growth",
    text: "Showcase your achievements and track your professional development journey.",
    color: "from-rose-500 to-pink-500",
    lightColor: "from-rose-100 to-pink-100",
  },
];

const HOW_IT_WORKS = [
  {
    number: 1,
    title: "Sign Up",
    description: "Create your profile with your university credentials and professional details.",
  },
  {
    number: 2,
    title: "Connect",
    description: "Find and connect with peers, alumni, and professionals in your network.",
  },
  {
    number: 3,
    title: "Grow",
    description: "Discover opportunities and build your career with community support.",
  },
];

const OPPORTUNITIES = [
  { label: "Internships", count: "500+", icon: Briefcase, color: "from-blue-600 to-blue-700" },
  { label: "Job Postings", count: "1000+", icon: TrendingUp, color: "from-purple-600 to-purple-700" },
  { label: "Events", count: "200+", icon: Calendar, color: "from-pink-600 to-pink-700" },
  { label: "Mentors", count: "300+", icon: UserPlus, color: "from-emerald-600 to-emerald-700" },
];

const TESTIMONIALS = [
  {
    name: "Alex Kumar",
    role: "Computer Science Student",
    text: "PeraPulse helped me land my dream internship by connecting me with alumni working at top tech companies.",
    avatar: "AK",
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Sarah Chen",
    role: "Recent Graduate",
    text: "As an alumna, I love sharing opportunities with students. The platform makes it so easy to give back to the community.",
    avatar: "SC",
    color: "from-purple-500 to-pink-500",
  },
  {
    name: "James Wilson",
    role: "Faculty Advisor",
    text: "PeraPulse has transformed how we engage with our students and alumni. It's truly a game-changer for our department.",
    avatar: "JW",
    color: "from-emerald-500 to-teal-500",
  },
];

export function LandingPage() {
  const { login } = useAuthState();
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotateX(0deg); }
          50% { transform: translateY(-30px) rotateX(5deg); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-fade-in-up { animation: fadeInUp 0.7s ease-out forwards; }
        .animate-slide-down { animation: slideInDown 0.6s ease-out forwards; }
        .card-3d {
          perspective: 1000px;
          transition: transform 0.3s ease-out;
        }
        .card-3d:hover {
          transform: translateY(-8px) scale(1.02);
        }
      `}</style>

      {/* Animated gradient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-float" style={{ animationDelay: "4s" }}></div>
      </div>

      {/* Relative positioned content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="border-b border-cyan-500/30 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 backdrop-blur-xl sticky top-0 z-50 shadow-2xl">
          <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-2xl group-hover:shadow-cyan-500/50 transition duration-300">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-transparent bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-300 bg-clip-text group-hover:from-cyan-200 group-hover:to-cyan-200 transition duration-300">PeraPulse</span>
                <span className="text-xs font-semibold text-cyan-400/70">University Community</span>
              </div>
            </div>

            <Button
              onClick={login}
              className="relative group px-8 py-3 font-bold text-white overflow-hidden rounded-lg shadow-lg hover:shadow-cyan-500/50 transition duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-100 group-hover:opacity-90 transition duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <span className="relative flex items-center gap-2">
                Sign In <ArrowRight className="h-5 w-5" />
              </span>
            </Button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
            <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-cyan-600 rounded-full mix-blend-screen filter blur-3xl opacity-15"></div>
          </div>

          <div className="mx-auto max-w-6xl px-6 relative z-10">
            <div className="text-center">
              <div 
                className="inline-flex items-center gap-3 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-2 mb-8 backdrop-blur-sm hover:border-blue-400/60 hover:bg-blue-500/15 transition-all duration-300 cursor-default"
                style={{ animation: animateIn ? 'slideInDown 0.6s ease-out' : 'none' }}
              >
                <span className="relative flex h-2 w-2 rounded-full bg-blue-400">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                </span>
                <span className="text-sm font-semibold text-blue-200">Now Live for University of Peradeniya</span>
              </div>

              <h1 
                className="mt-8 text-6xl md:text-8xl font-black tracking-tighter leading-tight text-white"
                style={{ animation: animateIn ? 'fadeInUp 0.8s ease-out 0.1s both' : 'none' }}
              >
                <span className="block">Your Connected</span>
                <span className="block mt-3">
                  <span className="relative inline-block">
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 blur-2xl opacity-40"></span>
                    <span className="relative bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                      Community Awaits
                    </span>
                  </span>
                </span>
              </h1>

              <p 
                className="mx-auto mt-8 max-w-3xl text-xl md:text-2xl text-slate-300 leading-relaxed"
                style={{ animation: animateIn ? 'fadeInUp 0.8s ease-out 0.2s both' : 'none' }}
              >
                Connect with thousands of peers, discover life-changing opportunities, and build your future within a thriving university community.
              </p>

              <div 
                className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center"
                style={{ animation: animateIn ? 'fadeInUp 0.8s ease-out 0.3s both' : 'none' }}
              >
                <button
                  onClick={login}
                  className="group relative px-10 py-4 font-bold text-lg text-white rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 opacity-100 group-hover:opacity-110"></div>
                  <span className="relative flex items-center gap-2">
                    Get Started Free <Zap className="h-5 w-5" />
                  </span>
                </button>
                <button
                  onClick={login}
                  className="px-10 py-4 font-bold text-lg text-cyan-300 rounded-xl border-2 border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-500/10 transition-all duration-300"
                >
                  Explore Features
                </button>
              </div>

              {/* Floating stats */}
              <div 
                className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
                style={{ animation: animateIn ? 'fadeInUp 0.8s ease-out 0.4s both' : 'none' }}
              >
                {[
                  { label: "Active Members", value: "5K+" },
                  { label: "Opportunities", value: "1K+" },
                  { label: "Success Stories", value: "500+" },
                ].map((stat, idx) => (
                  <div key={idx} className="relative group cursor-default">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative backdrop-blur-sm border border-blue-500/30 rounded-lg p-4 bg-slate-900/60 hover:border-cyan-400/50 transition duration-300 shadow-lg">
                      <p className="text-sm text-slate-300 font-medium">{stat.label}</p>
                      <p className="mt-2 text-3xl font-bold text-transparent bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 md:py-32 relative bg-gradient-to-b from-slate-950 to-slate-900">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
                <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  Powerful Features
                </span>
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Everything you need to grow, connect, and succeed in your academic and professional journey.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {FEATURES.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={idx}
                    className="card-3d group relative"
                    style={{ animation: animateIn ? `fadeInUp 0.7s ease-out ${0.2 + idx * 0.08}s both` : 'none' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 blur-xl`}></div>
                    
                    <div className="relative border border-blue-500/20 group-hover:border-cyan-400/50 rounded-2xl bg-slate-900/50 backdrop-blur-xl p-8 h-full transition-all duration-300 shadow-lg hover:shadow-xl">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} p-3 shadow-lg group-hover:shadow-2xl transition-all duration-300`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="mt-6 text-2xl font-bold text-white">{feature.title}</h3>
                      <p className="mt-4 text-slate-400 leading-relaxed flex-grow">{feature.text}</p>
                      <div className="mt-6 flex items-center gap-2 text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="font-semibold">Learn More</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 md:py-32 relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
                <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  Three Simple Steps
                </span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative">
              {HOW_IT_WORKS.map((step, idx) => (
                <div
                  key={idx}
                  className="relative"
                  style={{ animation: animateIn ? `fadeInUp 0.7s ease-out ${0.3 + idx * 0.1}s both` : 'none' }}
                >
                  {/* Connection line */}
                  {idx < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden md:block absolute top-24 left-1/2 w-1/2 h-1 bg-gradient-to-r from-blue-500 to-transparent"></div>
                  )}

                  <div className="relative">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white font-bold text-2xl shadow-lg">
                      {step.number}
                    </div>
                    <h3 className="mt-8 text-2xl font-bold text-white">{step.title}</h3>
                    <p className="mt-3 text-slate-400 leading-relaxed text-lg">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Opportunities */}
        <section className="py-24 md:py-32 relative bg-gradient-to-b from-slate-950 to-slate-900">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div style={{ animation: animateIn ? 'fadeInUp 0.8s ease-out 0.2s both' : 'none' }}>
                <span className="inline-block px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-300 text-sm font-semibold mb-6">Your Future Starts Here</span>
                <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-8">
                  <span className="text-white">Discover Your</span>
                  <br />
                  <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">Next Opportunity</span>
                </h2>
                <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                  Access thousands of internships, job postings, and mentorship connections from our network of leading companies and alumni.
                </p>
                <div className="space-y-4 mb-10">
                  {["1000+ job opportunities", "500+ internship placements", "Direct alumni connections", "Personalized recommendations"].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-green-500 rounded-full blur-sm"></div>
                        <CheckCircle2 className="h-6 w-6 text-green-400 relative" />
                      </div>
                      <span className="text-slate-200 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={login}
                  className="group relative px-8 py-4 font-bold text-white rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-100 group-hover:opacity-90"></div>
                  <span className="relative flex items-center gap-2">
                    Explore Opportunities <ArrowRight className="h-5 w-5" />
                  </span>
                </button>
              </div>

              <div 
                className="grid grid-cols-2 gap-6"
                style={{ animation: animateIn ? 'fadeInUp 0.8s ease-out 0.3s both' : 'none' }}
              >
                {OPPORTUNITIES.map((opp, idx) => {
                  const Icon = opp.icon;
                  return (
                    <div
                      key={idx}
                      className="group relative card-3d"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${opp.color} rounded-2xl opacity-10 blur-lg group-hover:opacity-20 transition duration-300`}></div>
                      <div className={`relative border border-blue-500/20 group-hover:border-cyan-400/50 rounded-2xl bg-slate-900/50 backdrop-blur-xl p-8 text-center transition-all duration-300 h-full shadow-lg`}>
                        <Icon className="h-10 w-10 mx-auto text-white group-hover:scale-110 transition-transform duration-300" />
                        <p className="mt-6 text-4xl font-black bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">{opp.count}</p>
                        <p className="mt-3 text-slate-400 font-semibold">{opp.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 md:py-32 relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
                <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  Success Stories
                </span>
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Hear from students and alumni who've transformed their careers through PeraPulse
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((testimonial, idx) => (
                <div
                  key={idx}
                  className="group relative card-3d"
                  style={{ animation: animateIn ? `fadeInUp 0.7s ease-out ${0.3 + idx * 0.1}s both` : 'none' }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.color} rounded-2xl opacity-5 blur-lg group-hover:opacity-15 transition duration-300`}></div>
                  
                  <div className="relative border border-blue-500/20 group-hover:border-cyan-400/50 rounded-2xl bg-slate-900/50 backdrop-blur-xl p-8 transition-all duration-300 h-full flex flex-col shadow-lg">
                    <div className="flex gap-1 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-300 leading-relaxed mb-8 flex-grow italic text-lg">"{testimonial.text}"</p>
                    <div className="flex items-center gap-4 border-t border-blue-500/20 pt-6">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${testimonial.color} text-white font-bold text-sm shadow-lg`}>
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-white">{testimonial.name}</p>
                        <p className="text-sm text-slate-400">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600 rounded-full mix-blend-screen filter blur-3xl opacity-15"></div>
          </div>

          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <h2 
              className="text-5xl md:text-7xl font-black tracking-tight mb-8"
              style={{ animation: animateIn ? 'fadeInUp 0.8s ease-out' : 'none' }}
            >
              <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Ready to Transform Your Future?
              </span>
            </h2>
            <p 
              className="text-xl text-slate-300 mb-10"
              style={{ animation: animateIn ? 'fadeInUp 0.8s ease-out 0.1s both' : 'none' }}
            >
              Join thousands of students and alumni already thriving on PeraPulse. Your community is waiting.
            </p>
            <button
              onClick={login}
              className="group relative px-12 py-5 font-bold text-lg text-white rounded-xl overflow-hidden inline-flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg"
              style={{ animation: animateIn ? 'fadeInUp 0.8s ease-out 0.2s both' : 'none' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 opacity-100 group-hover:opacity-90"></div>
              <span className="relative flex items-center gap-2">
                Start Your Journey <Zap className="h-5 w-5" />
              </span>
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-blue-500/20 bg-slate-950/80 backdrop-blur-xl py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-6 w-6 text-cyan-400" />
                  <span className="font-bold text-white text-lg">PeraPulse</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">Your connected university community platform.</p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-6">Product</h4>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-cyan-300 transition">Features</a></li>
                  <li><a href="#" className="hover:text-cyan-300 transition">Pricing</a></li>
                  <li><a href="#" className="hover:text-cyan-300 transition">Security</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-6">Company</h4>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-cyan-300 transition">About</a></li>
                  <li><a href="#" className="hover:text-cyan-300 transition">Blog</a></li>
                  <li><a href="#" className="hover:text-cyan-300 transition">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-6">Legal</h4>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-cyan-300 transition">Privacy</a></li>
                  <li><a href="#" className="hover:text-cyan-300 transition">Terms</a></li>
                  <li><a href="#" className="hover:text-cyan-300 transition">Cookies</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-blue-500/20 pt-8">
              <p className="text-center text-sm text-slate-500">
                © 2026 PeraPulse by ByteCoders. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
