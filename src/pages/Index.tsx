import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Mic, Database, BarChart3, MessageCircle, Globe, Shield, ArrowRight, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const features = [
  { icon: Mic, title: "Voice-Driven Queries", desc: "Speak naturally in English, Hindi, or other languages — your voice becomes SQL instantly." },
  { icon: Database, title: "One-Click DB Connect", desc: "Connect your PostgreSQL or MySQL database in seconds with a simple credential form." },
  { icon: BarChart3, title: "Smart Visualizations", desc: "Auto-detect the best chart type for your data — bar, line, pie, scatter, and more." },
  { icon: MessageCircle, title: "AI Help Chatbot", desc: "Get instant guidance on features, capabilities, and how to get the most from VoiceViz." },
  { icon: Globe, title: "Multilingual Support", desc: "Speak queries in Hindi, English, Spanish, French — 30+ languages supported." },
  { icon: Shield, title: "Secure by Design", desc: "Your database credentials stay encrypted. Queries run through secure edge functions." },
];

const steps = [
  { num: "01", title: "Connect", desc: "Add your database credentials — PostgreSQL or MySQL." },
  { num: "02", title: "Speak", desc: "Ask a question in plain language using your voice." },
  { num: "03", title: "Visualize", desc: "See results as tables and auto-generated charts." },
];

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">VoiceViz</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {user ? (
              <Button asChild size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center px-6 pt-16">
        {/* Background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px]"
          />
          <motion.div
            animate={{ x: [0, -25, 0], y: [0, 30, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full bg-accent/15 blur-[120px]"
          />
          <motion.div
            animate={{ x: [0, 15, 0], y: [0, -15, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 left-1/2 h-[350px] w-[350px] -translate-x-1/2 rounded-full blur-[120px]"
            style={{ background: "hsl(var(--primary-glow) / 0.1)" }}
          />
        </div>

        {/* Grid pattern overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(hsl(var(--foreground)/0.02)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div
            initial="hidden" animate="visible" custom={0} variants={fadeUp}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Voice-Driven Data Intelligence
          </motion.div>

          <motion.h1
            initial="hidden" animate="visible" custom={1} variants={fadeUp}
            className="text-balance text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl"
          >
            Talk to your database.{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--hero-gradient)" }}>
              See the answers.
            </span>
          </motion.h1>

          <motion.p
            initial="hidden" animate="visible" custom={2} variants={fadeUp}
            className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            Connect any PostgreSQL or MySQL database, ask questions in your voice, and get instant charts and insights — no SQL knowledge needed.
          </motion.p>

          <motion.div
            initial="hidden" animate="visible" custom={3} variants={fadeUp}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Button size="lg" asChild className="h-12 gap-2 px-8 text-base shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-[0.97]">
              <Link to={user ? "/dashboard" : "/signup"}>
                {user ? "Go to Dashboard" : "Start Free"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-12 px-8 text-base backdrop-blur-sm active:scale-[0.97] transition-all">
              <a href="#features">See How It Works</a>
            </Button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial="hidden" animate="visible" custom={4} variants={fadeUp}
            className="mx-auto mt-16 flex max-w-lg items-center justify-center gap-8 text-center sm:gap-12"
          >
            {[
              { value: "30+", label: "Languages" },
              { value: "<1s", label: "SQL Generation" },
              { value: "100%", label: "Read-Only Safe" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-foreground sm:text-3xl">{stat.value}</div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative px-6 py-28">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={0} variants={fadeUp}
            className="text-center"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">How It Works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Three steps to insight
            </h2>
          </motion.div>

          <div className="relative mt-16 grid gap-8 sm:grid-cols-3">
            {/* Connecting line */}
            <div className="pointer-events-none absolute top-12 left-[16.7%] right-[16.7%] hidden h-px bg-border sm:block" />

            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={i + 1} variants={scaleIn}
                className="relative text-center"
              >
                <div className="relative z-10 mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-card shadow-lg">
                  <span className="text-3xl font-extrabold text-primary">{step.num}</span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative px-6 py-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[150px]" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={0} variants={fadeUp}
            className="text-center"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Features</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to explore your data
            </h2>
          </motion.div>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} custom={i + 1} variants={fadeUp}
                className="group relative rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-card-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-28">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={0} variants={scaleIn}
          className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl p-px"
        >
          {/* Gradient border */}
          <div className="absolute inset-0 rounded-3xl" style={{ background: "var(--hero-gradient)" }} />

          <div className="relative rounded-[calc(1.5rem-1px)] bg-card px-8 py-16 text-center sm:px-16">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Zap className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to talk to your data?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              Connect your database in under a minute and start asking questions with your voice.
            </p>
            <Button
              size="lg" asChild
              className="mt-8 h-12 gap-2 px-8 text-base shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-[0.97]"
            >
              <Link to={user ? "/dashboard" : "/signup"}>
                {user ? "Open Dashboard" : "Create Free Account"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Zap className="h-3 w-3" />
            </div>
            <span className="font-medium text-foreground">VoiceViz</span>
          </div>
          <span>© {new Date().getFullYear()} VoiceViz. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
