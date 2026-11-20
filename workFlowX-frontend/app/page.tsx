'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleDollarSign,
  FolderKanban,
  LockKeyhole,
  Menu,
  NotebookPen,
  X,
} from 'lucide-react'

const orange = '#f06442'

function ButtonLink({ children, href = '#start', light = false }: { children: React.ReactNode; href?: string; light?: boolean }) {
  return (
    <a className={`button-link ${light ? 'button-link-light' : ''}`} href={href}>
      {children} <ArrowUpRight size={15} strokeWidth={1.8} />
    </a>
  )
}

function MiniBar({ height, accent = false }: { height: number; accent?: boolean }) {
  return <span className={`mini-bar ${accent ? 'mini-bar-accent' : ''}`} style={{ height: `${height}%` }} />
}

function DashboardPreview({ large = false }: { large?: boolean }) {
  return (
    <div className={`dashboard ${large ? 'dashboard-large' : ''}`} aria-label="WorkFlowX dashboard preview">
      <aside className="dashboard-sidebar">
        <div className="dash-mark">W<span>X</span></div>
        <div className="dash-profile"><span className="avatar">AM</span><span>Alex Morgan</span><ChevronRight size={11} /></div>
        <p className="dash-label">Workspace</p>
        <div className="dash-nav active"><FolderKanban size={14} /> Overview</div>
        <div className="dash-nav"><FolderKanban size={14} /> Projects <span className="count">4</span></div>
        <div className="dash-nav"><Check size={14} /> Tasks <span className="count">12</span></div>
        <div className="dash-nav"><NotebookPen size={14} /> Notes</div>
        <div className="dash-nav"><CircleDollarSign size={14} /> Finances</div>
        <div className="dash-bottom"><p className="dash-label">Personal</p><div className="dash-nav"><LockKeyhole size={14} /> Settings</div></div>
      </aside>
      <div className="dashboard-content">
        <div className="dash-topline"><div><span className="eyebrow-small">MONDAY, OCTOBER 24</span><h3>Good morning, Alex.</h3></div><div className="dash-tools"><span className="search-line" /> <span className="avatar avatar-light">AM</span></div></div>
        <div className="dash-grid dash-summary">
          <div className="dash-card summary-main"><span className="card-kicker">OPEN PROJECTS</span><strong>04</strong><span className="card-note">2 due this week <i>↗</i></span></div>
          <div className="dash-card"><span className="card-kicker">TASKS IN PROGRESS</span><strong>12</strong><span className="card-note">+3 from last week</span></div>
          <div className="dash-card balance-card"><span className="card-kicker">THIS MONTH</span><strong>$4,280</strong><span className="card-note">Net balance <i>+8.4%</i></span></div>
        </div>
        <div className="dash-grid dash-middle">
          <div className="dash-card project-card"><div className="card-heading"><span>Project activity</span><span className="view-link">View all</span></div><div className="project-row"><span className="project-dot orange-dot"/><span>Website redesign</span><span className="project-status">In progress</span><span>72%</span></div><div className="progress"><span style={{ width: '72%' }} /></div><div className="project-row"><span className="project-dot gray-dot"/><span>Q4 planning</span><span className="project-status">Planning</span><span>34%</span></div><div className="progress"><span style={{ width: '34%' }} /></div><div className="project-row"><span className="project-dot dark-dot"/><span>Home office</span><span className="project-status">On track</span><span>58%</span></div><div className="progress"><span style={{ width: '58%' }} /></div></div>
          <div className="dash-card chart-card"><div className="card-heading"><span>Weekly focus</span><BarChart3 size={14} /></div><div className="chart-bars"><MiniBar height={42} /><MiniBar height={61} /><MiniBar height={48} /><MiniBar height={80} accent /><MiniBar height={66} /><MiniBar height={92} accent /><MiniBar height={72} /></div><div className="chart-days"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div></div>
        </div>
        <div className="dash-grid dash-bottom-row"><div className="dash-card task-card"><div className="card-heading"><span>Next up</span><span className="view-link">12 tasks</span></div>{['Review launch notes', 'Send Q4 budget', 'Book design review'].map((task, index) => <div className="task-row" key={task}><span className={`task-check ${index === 1 ? 'task-check-filled' : ''}`}>{index === 1 && '✓'}</span><span>{task}</span><span className="task-date">{index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : 'Oct 27'}</span></div>)}</div><div className="dash-card note-card"><div className="card-heading"><span>Recent note</span><NotebookPen size={14} /></div><strong>Small systems, big clarity</strong><p>A place for the ideas that keep everything moving.</p><span className="note-tag">PERSONAL</span></div></div>
      </div>
    </div>
  )
}

function FeaturePreview({ type }: { type: 'projects' | 'tasks' | 'notes' | 'finances' }) {
  if (type === 'projects') return <div className="feature-ui projects-ui"><div className="feature-ui-title">Projects <span>+ New project</span></div>{['Website redesign', 'Q4 planning', 'Home office'].map((name, i) => <div className="feature-project" key={name}><span className={`project-dot ${i === 0 ? 'orange-dot' : 'gray-dot'}`} /><div><strong>{name}</strong><small>{i === 0 ? 'Due Oct 28' : i === 1 ? 'Due Nov 04' : 'No deadline'}</small></div><span className="project-status">{i === 0 ? 'In progress' : 'Planning'}</span></div>)}</div>
  if (type === 'tasks') return <div className="feature-ui tasks-ui"><div className="feature-ui-title">Tasks <span>Filter / Sort</span></div>{['Review launch notes', 'Send Q4 budget', 'Book design review', 'Update project brief'].map((name, i) => <div className="feature-task" key={name}><span className={`task-check ${i === 0 ? 'task-check-filled' : ''}`}>{i === 0 && '✓'}</span><span>{name}</span><b className={i === 1 ? 'high' : ''}>{i === 1 ? 'HIGH' : i === 3 ? 'LOW' : 'MED'}</b><small>{i + 24} OCT</small></div>)}</div>
  if (type === 'notes') return <div className="feature-ui notes-ui"><div className="feature-ui-title">Notes <span>+ New note</span></div><div className="notes-grid"><article><span className="note-pin">PINNED</span><strong>Small systems, big clarity</strong><p>Thoughts on making the everyday work feel lighter.</p><span className="note-tag">PERSONAL</span></article><article><strong>Launch checklist</strong><p>Three things to review before the next handoff.</p><span className="note-tag">WORK</span></article><article><strong>Reading list</strong><p>Books, articles, and references worth returning to.</p><span className="note-tag">IDEAS</span></article></div></div>
  return <div className="feature-ui finances-ui"><div className="feature-ui-title">Finances <span>October 2026</span></div><div className="finance-total"><small>NET THIS MONTH</small><strong>$4,280.00</strong><span>+8.4% vs September</span></div><div className="finance-lines"><div><span>Freelance income</span><b>$5,800</b></div><div><span>Workspace & tools</span><b>−$420</b></div><div><span>Living expenses</span><b>−$1,100</b></div></div></div>
}

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)
  return <main>
    <nav className="site-nav" aria-label="Primary navigation"><a href="#top" className="wordmark">WorkFlow<span>X</span></a><div id="primary-navigation" className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}><a href="#product" onClick={() => setMenuOpen(false)}>Product</a><a href="#features" onClick={() => setMenuOpen(false)}>Features</a><a href="#about" onClick={() => setMenuOpen(false)}>About</a><Link href="/login" onClick={() => setMenuOpen(false)}>Sign in</Link><ButtonLink href="/register">Get started</ButtonLink></div><button className="menu-button" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button></nav>
    <section className="hero section-frame" id="top"><div className="hero-copy"><p className="eyebrow">YOUR WORKSPACE, RECONSIDERED</p><h1>Bring your work <em>into focus.</em></h1><p className="hero-text">Projects, tasks, notes, and personal finances — organized in one considered workspace.</p><div className="hero-actions"><ButtonLink href="/register">Get started</ButtonLink><a className="text-link" href="#product">Explore the workspace <ChevronRight size={15} /></a></div><p className="hero-footnote">A calmer way to keep moving.</p></div><div className="hero-product"><DashboardPreview /></div></section>
    <section className="intro-band" id="product"><div className="section-frame intro-inner"><p className="eyebrow">ONE PLACE. CLEARER DAYS.</p><h2>Everything in its place.<br /><em>Nothing in the way.</em></h2><p>WorkFlowX gives the moving parts of your life a shared rhythm — without asking you to work harder to stay organized.</p></div></section>
    <section className="section-frame features" id="features"><div className="section-heading"><div><p className="eyebrow">THE WORKSPACE</p><h2>Made for the way<br /><em>you actually work.</em></h2></div><p>Four focused views. One steady overview.</p></div><div className="feature-grid"><article className="feature-block feature-dark"><div className="feature-copy"><span className="feature-number">01 / 04</span><h3>See the bigger picture.</h3><p>Projects, deadlines, and progress without the overhead.</p></div><FeaturePreview type="projects" /></article><article className="feature-block feature-light"><div className="feature-copy"><span className="feature-number">02 / 04</span><h3>Make the next step obvious.</h3><p>Know what needs attention, and why it matters.</p></div><FeaturePreview type="tasks" /></article><article className="feature-block feature-light"><div className="feature-copy"><span className="feature-number">03 / 04</span><h3>Give your ideas a place.</h3><p>Notes that stay close to the work they support.</p></div><FeaturePreview type="notes" /></article><article className="feature-block feature-dark"><div className="feature-copy"><span className="feature-number">04 / 04</span><h3>Keep an eye on the numbers.</h3><p>A simple view of what comes in and what goes out.</p></div><FeaturePreview type="finances" /></article></div></section>
    <section className="how-section section-frame"><div className="section-heading"><div><p className="eyebrow">A SIMPLE RHYTHM</p><h2>Less managing.<br /><em>More moving.</em></h2></div></div><div className="steps"><div><span>01</span><h3>Organize</h3><p>Bring projects, tasks, notes, and financial records into a structured workspace.</p></div><div><span>02</span><h3>Prioritize</h3><p>Use statuses, priorities, and deadlines to understand what needs attention.</p></div><div><span>03</span><h3>Move forward</h3><p>Return to a clear overview and continue making progress.</p></div></div></section>
    <section className="showcase-section" id="about"><div className="section-frame"><div className="section-heading showcase-heading"><div><p className="eyebrow">THE OVERVIEW</p><h2>See the whole picture.<br /><em>Keep your focus.</em></h2></div><p>Your work, your way — connected without being crowded.</p></div><DashboardPreview large /></div></section>
    <section className="security section-frame"><div className="security-mark"><LockKeyhole size={28} strokeWidth={1.2} /></div><div><p className="eyebrow">THOUGHTFUL BY DESIGN</p><h2>Built around your<br /><em>attention.</em></h2></div><div className="security-copy"><p>Organized information. A focused workspace. Account and security controls that stay close at hand.</p><a className="text-link" href="#signin">About the approach <ChevronRight size={15} /></a></div></section>
    <section className="final-cta" id="start"><div className="section-frame"><p className="eyebrow">START WITH CLARITY</p><h2>Make room for<br /><em>focused work.</em></h2><p>Bring your projects, tasks, notes, and personal finances into a more organized workspace.</p><div className="hero-actions"><ButtonLink href="/register">Get started</ButtonLink><a className="text-link text-link-light" href="/login">Sign in <ChevronRight size={15} /></a></div></div></section>
    <footer className="site-footer" id="signin"><div className="section-frame footer-inner"><div><a href="#top" className="wordmark">WorkFlow<span>X</span></a><p>Everything in focus.</p></div><div className="footer-links"><div><span>Product</span><a href="#product">Overview</a><a href="#features">Features</a><a href="#about">About</a></div><div><span>Account</span><a href="/login">Sign in</a><a href="/register">Get started</a></div><div><span>Details</span><a href="#privacy">Privacy</a><a href="#terms">Terms</a></div></div></div><div className="section-frame footer-bottom"><span>© 2026 WorkFlowX</span><span>A considered workspace for everyday work.</span></div></footer>
  </main>
}
