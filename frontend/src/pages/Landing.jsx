import React from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";

const features = [
  {
    title: "Assign & track tasks",
    desc: "Create tasks, assign them to teammates, set priority and due dates, and see status update in real time.",
  },
  {
    title: "Automatic email notifications",
    desc: "Teammates get emailed the moment a task is assigned to them, and you get notified when it's completed.",
  },
  {
    title: "Admin analytics dashboard",
    desc: "See completion rates, overdue tasks, and workload per teammate at a glance.",
  },
  {
    title: "Your own private workspace",
    desc: "Every company gets an isolated workspace — your team's data is never visible to anyone outside it.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-white font-body">
      <header className="flex items-center justify-between px-6 py-5 lg:px-16">
        <Logo light />
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="px-6 py-20 text-center lg:px-16">
        <h1 className="mx-auto max-w-2xl font-display text-4xl font-bold leading-tight text-slate-900 lg:text-5xl">
          Assign work. Track progress. Stay in sync.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-500">
          Simpta Task Manager gives your team one place to assign tasks, get notified by email, and see everything
          on one dashboard — no setup headaches, no learning curve.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/register"
            className="rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Start your free 14-day trial
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Log in
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-400">No credit card required to start.</p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20 lg:px-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 p-6">
              <h3 className="mb-2 font-display text-lg font-bold text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink px-6 py-16 text-center lg:px-16">
        <h2 className="font-display text-2xl font-bold text-white">Ready to get your team organized?</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-teal-100/70">
          Create your workspace in under a minute. You'll be the admin — invite your team once you're in.
        </p>
        <Link
          to="/register"
          className="mt-6 inline-block rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Get started for free
        </Link>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-slate-400 lg:px-16">
        Simpta Task Manager {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Landing;
