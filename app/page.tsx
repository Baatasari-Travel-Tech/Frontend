"use client"
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) router.replace('/dashboard')
  })
}, [router])

  return (
    <div className="page landing-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Baatasari – Straight Briefing</p>
          <h1 className="headline">Stop planning. Start going.</h1>
          <p className="subtitle">
            Baatasari is a hyperlocal experience discovery app that helps people decide what to do
            nearby when they have free time, without overthinking or planning.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="btn">Get Started</Link>
            <Link href="/login" className="btn btn-ghost">Login</Link>
          </div>
          <div className="hero-kpis">
            <div>
              <span className="kpi">2–3 mins</span>
              <span className="kpi-label">to choose a plan</span>
            </div>
            <div>
              <span className="kpi">0</span>
              <span className="kpi-label">decision fatigue</span>
            </div>
            <div>
              <span className="kpi">3 steps</span>
              <span className="kpi-label">time → mood → go</span>
            </div>
          </div>
          <div className="hero-note">
            No browsing. No 100 options. Just “here’s what to do now.”
          </div>
        </div>
        <div className="hero-stack">
          <div className="hero-panel">
            <div className="panel-header">
              <span>Right now</span>
              <span className="pill">45 mins free</span>
            </div>
            <h3>Do this. Now.</h3>
            <ul className="panel-list">
              <li>Walk to the lakeside market</li>
              <li>Grab chai + snacks</li>
              <li>Catch sunset at the amphitheatre</li>
            </ul>
            <div className="panel-actions">
              <button className="btn btn-light" type="button">Lock plan</button>
              <button className="btn btn-ghost" type="button">Change mood</button>
            </div>
          </div>
          <div className="micro-card">
            <h4>Today’s vibe</h4>
            <p>Low effort • low spend • 3 friends</p>
            <div className="chip-row">
              <span className="chip">Chill</span>
              <span className="chip">Budget</span>
              <span className="chip">Nearby</span>
            </div>
          </div>
          <div className="micro-card outline">
            <h4>Next up</h4>
            <p>Bookends your free time with a plan you’ll actually do.</p>
          </div>
        </div>
      </section>

      <section className="section-grid">
        <article className="info-card">
          <h2>The problem</h2>
          <p>
            People don’t lack places to go. They lack clarity, energy, decision-making, and time to
            plan. So they scroll, ask friends, argue, then stay home.
          </p>
        </article>
        <article className="info-card accent">
          <h2>The solution</h2>
          <p>
            Baatasari removes planning. It gives a ready-made plan, nearby places, and a simple
            sequence. Decide less, go more.
          </p>
        </article>
        <article className="info-card">
          <h2>Who it’s for</h2>
          <p>Students, locals, and young working people who want to step out with zero effort.</p>
        </article>
      </section>

      <section className="events">
        <div className="section-title">
          <h2>Baatasari events sample</h2>
          <p>Instant, nearby options — curated for right now.</p>
        </div>
        <div className="event-grid">
          <article className="event-card">
            <h3>Sunset Walk</h3>
            <p>15 mins free • Lakeside trail</p>
            <button className="btn btn-light" type="button">Choose</button>
          </article>
          <article className="event-card">
            <h3>Street Food Crawl</h3>
            <p>30 mins free • Market lane</p>
            <button className="btn btn-light" type="button">Choose</button>
          </article>
          <article className="event-card">
            <h3>Open Mic</h3>
            <p>60 mins free • Indie cafe</p>
            <button className="btn btn-light" type="button">Choose</button>
          </article>
        </div>
      </section>

      <section className="cta">
        <div>
          <h2>Let’s go now</h2>
          <p>Turn “Let’s plan something” into “Let’s go now” in minutes.</p>
        </div>
        <Link href="/register" className="btn">Start Now</Link>
      </section>
    </div>
  )
}
