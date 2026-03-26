import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Database, Mic, BarChart3, User, LogOut, Clock, Sparkles, Zap, ArrowRight, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import VoiceInput from "@/components/VoiceInput";
import QueryWorkspace from "@/components/QueryWorkspace";
import SchemaBrowserSidebar from "@/components/SchemaBrowserSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { motion, AnimatePresence } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const CARDS = [
  { icon: Database, title: "Connect Database", desc: "Add PostgreSQL or MySQL credentials securely", href: "/connections", gradient: "from-primary/20 via-primary/5 to-transparent", iconBg: "bg-primary/15 text-primary", border: "hover:border-primary/40" },
  { icon: Mic, title: "Voice Query", desc: "Speak your question in any language naturally", href: "/dashboard", gradient: "from-accent/20 via-accent/5 to-transparent", iconBg: "bg-accent/15 text-accent", border: "hover:border-accent/40" },
  { icon: BarChart3, title: "Visualizations", desc: "Auto-generated charts from query results", href: "/dashboard", gradient: "from-destructive/15 via-destructive/5 to-transparent", iconBg: "bg-destructive/15 text-destructive", border: "hover:border-destructive/40" },
  { icon: Clock, title: "Query History", desc: "Review and re-run your past queries", href: "/history", gradient: "from-primary/10 via-secondary/10 to-transparent", iconBg: "bg-secondary text-secondary-foreground", border: "hover:border-secondary-foreground/20" },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [transcript, setTranscript] = useState("");
  const [rerunSql, setRerunSql] = useState("");
  const [rerunConnectionId, setRerunConnectionId] = useState<string | undefined>();
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  useEffect(() => {
    const state = location.state as {
      rerunTranscript?: string;
      rerunSql?: string;
      rerunConnectionId?: string;
    } | null;
    if (state?.rerunSql) {
      setTranscript(state.rerunTranscript || "");
      setRerunSql(state.rerunSql);
      setRerunConnectionId(state.rerunConnectionId);
      setActiveSection("workspace");
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <SchemaBrowserSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl"
          >
            <div className="flex h-14 items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="h-8 w-8" />
                <Link to="/" className="flex items-center gap-2 group">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Zap className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors">VoiceViz</span>
                </Link>
              </div>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link to="/profile"><User className="mr-1.5 h-4 w-4" />Profile</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </div>
            </div>
          </motion.header>

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-5xl px-4 md:px-6 py-8 md:py-12">
              {/* Hero greeting */}
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="relative"
              >
                <motion.div variants={fadeUp} className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-accent">{greeting}</span>
                </motion.div>
                <motion.h1
                  variants={fadeUp}
                  className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text"
                >
                  {displayName}
                </motion.h1>
                <motion.p variants={fadeUp} className="mt-2 text-muted-foreground max-w-lg">
                  Connect a database and start asking questions with your voice. Your data, your language.
                </motion.p>

                {/* Decorative gradient orb */}
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-primary/10 via-accent/5 to-transparent blur-3xl pointer-events-none" />
              </motion.div>

              {/* Action cards */}
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                {CARDS.map((card) => (
                  <motion.div key={card.title} variants={scaleIn}>
                    <Link
                      to={card.href}
                      onClick={() => {
                        if (card.title === "Voice Query") setActiveSection("voice");
                        if (card.title === "Visualizations") setActiveSection("workspace");
                      }}
                      className={`group relative block rounded-xl border border-border/60 bg-card p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${card.border} overflow-hidden`}
                    >
                      {/* Gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                      
                      <div className="relative">
                        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                          <card.icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-card-foreground flex items-center gap-1">
                          {card.title}
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              {/* Voice Input Section */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-10"
              >
                <button
                  onClick={() => setVoiceOpen(!voiceOpen)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Mic className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold tracking-tight">Ask Your Database</h2>
                        <p className="text-xs text-muted-foreground">Tap the mic and speak naturally in any language</p>
                      </div>
                    </div>
                    <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${voiceOpen ? "rotate-90" : "group-hover:translate-x-0.5"}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {voiceOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
                        <VoiceInput onTranscriptChange={setTranscript} />
                      </div>
                      {transcript && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                          Transcript ready — open the workspace below to generate SQL
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>

              {/* Query Workspace */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-6"
              >
                <button
                  onClick={() => setActiveSection(activeSection === "workspace" ? null : "workspace")}
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold tracking-tight">Query Workspace</h2>
                        <p className="text-xs text-muted-foreground">Generate SQL, execute, and visualize results</p>
                      </div>
                    </div>
                    <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${activeSection === "workspace" ? "rotate-90" : "group-hover:translate-x-0.5"}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {activeSection === "workspace" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
                        <QueryWorkspace
                          transcript={transcript}
                          initialSql={rerunSql}
                          initialConnectionId={rerunConnectionId}
                          onConsumeRerun={() => { setRerunSql(""); setRerunConnectionId(undefined); }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>

              {/* Bottom spacer */}
              <div className="h-16" />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
