"use client";

import { useEffect } from "react";
import { quests, reportReasons, rules, tripDetails } from "./content";

function ArrowDown() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="icon icon-arrow">
      <path d="M12 3v16M5.5 13.5 12 20l6.5-6.5" />
    </svg>
  );
}
function ArrowUpRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="icon">
      <path d="M5 19 19 5M8 5h11v11" />
    </svg>
  );
}
function Pin() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="icon icon-pin">
      <path d="M19 10.2c0 5.3-7 10.3-7 10.3s-7-5-7-10.3a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}
function Clock() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="icon">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}
function Tick() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="icon icon-tick">
      <path d="m5 12 4.3 4.3L19 6.7" />
    </svg>
  );
}

function Reveal({
  children,
  className = "",
  delay = "",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: string;
}) {
  return (
    <div
      className={`reveal ${className}`}
      style={{ "--delay": delay } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

export default function Home() {
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -50px" },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <main>
      <a className="skip-link" href="#briefing">
        Skip to briefing
      </a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Suffer home">
          <span className="brand-mark">S</span>
          <span>SUFFER</span>
        </a>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#rules">Rules</a>
          <a className="nav-cta" href="#final-quest">
            Read the fine print <ArrowUpRight />
          </a>
        </nav>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-noise" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
        <div className="hero-content section-shell">
          <Reveal className="hero-copy">
            <p className="kicker">
              <span className="status-dot" /> Invitation / classified
            </p>
            <h1 id="hero-title">
              SUFFER<span className="hero-period">.</span>
            </h1>
            <p className="hero-tagline">A trip that fights back.</p>
            <p className="hero-intro">
              The destination is only half the story. The rest is a game of
              quests, consequences, and the quiet fear of finishing last.
            </p>
            <a className="scroll-cue" href="#briefing">
              <span className="scroll-cue-line" />
              <span>Scroll to accept your fate</span>
              <ArrowDown />
            </a>
          </Reveal>
          <Reveal className="hero-dossier" delay="90ms">
            <div className="dossier-topline">
              <span>Field dossier 001</span>
              <span>Read before departure</span>
            </div>
            <div className="dossier-map" aria-hidden="true">
              <span className="map-route map-route-a" />
              <span className="map-route map-route-b" />
              <span className="map-ring map-ring-a" />
              <span className="map-ring map-ring-b" />
              <span className="map-pin">
                <Pin />
              </span>
              <span className="map-label map-label-a">origin</span>
              <span className="map-label map-label-b">[?]</span>
            </div>
            <div className="dossier-details">
              <div>
                <span className="micro-label">Destination</span>
                <strong>{tripDetails.destination}</strong>
              </div>
              <div>
                <span className="micro-label">When</span>
                <strong>{tripDetails.dates}</strong>
              </div>
            </div>
            <div className="dossier-warning">
              <span>Warning</span>
              <strong>The trip is the easy part.</strong>
            </div>
          </Reveal>
        </div>
        <div className="hero-footer section-shell">
          <span>Signal detected / all players invited</span>
          <span className="hero-footer-line" />
          <span>01—10</span>
        </div>
      </section>

      <section
        className="briefing section-shell section-light"
        id="briefing"
        aria-labelledby="briefing-title"
      >
        <div className="section-label reveal">
          <span>01</span>
          <span>Mission briefing</span>
        </div>
        <div className="briefing-grid">
          <Reveal>
            <h2 id="briefing-title">
              This is not
              <br />
              <em>just</em> a trip.
            </h2>
          </Reveal>
          <Reveal className="briefing-copy" delay="80ms">
            <p className="lede">It is a trip with a game layered on top.</p>
            <p>
              You will travel, eat, wander, and make memories. You will also get
              quests that unlock as the trip unfolds, rules that keep the chaos
              honest, and consequences for anyone who treats the group like a
              loophole.
            </p>
            <p className="muted-copy">
              The point is not to add stress. It is to get everyone off their
              phones, into the moment, and just competitive enough to make the
              story better.
            </p>
          </Reveal>
        </div>
        <Reveal className="briefing-stamp" delay="140ms">
          <span>Designed for maximum participation</span>
          <span className="stamp-x">×</span>
          <span>Minimum screen time</span>
        </Reveal>
      </section>

      <section
        className="workflow section-dark"
        id="how-it-works"
        aria-labelledby="workflow-title"
      >
        <div className="section-shell">
          <div className="section-label section-label-dark reveal">
            <span>02</span>
            <span>Run of show</span>
          </div>
          <div className="section-heading-row">
            <Reveal>
              <h2 id="workflow-title">
                Three tracks.
                <br />
                <span>One last place.</span>
              </h2>
            </Reveal>
            <Reveal className="section-aside" delay="80ms">
              <span className="aside-number">01—03</span>
              <p>
                Two tracks run in parallel. The last one only appears when you
                have earned it.
              </p>
            </Reveal>
          </div>
          <Reveal className="workflow-map" delay="110ms">
            <div className="workflow-track">
              <span className="track-tag">Track A</span>
              <strong>Individual quests</strong>
              <span className="track-note">Your score. Your problem.</span>
            </div>
            <div className="workflow-line" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="workflow-track">
              <span className="track-tag">Track B</span>
              <strong>Group quests</strong>
              <span className="track-note">Shared glory. Shared blame.</span>
            </div>
            <div className="workflow-converge" aria-hidden="true">
              <span>+</span>
            </div>
            <div className="workflow-finale">
              <span className="track-tag">Unlocked last</span>
              <strong>Final quest</strong>
              <span className="track-note">
                Finish last. Sponsor the table.
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      <section
        className="quest-types section-dark"
        id="quest-types"
        aria-labelledby="quest-title"
      >
        <div className="section-shell">
          <div className="section-heading-row quest-heading-row">
            <Reveal>
              <p className="eyebrow-orange">Know your enemy</p>
              <h2 id="quest-title">
                The quest
                <br />
                <span>types.</span>
              </h2>
            </Reveal>
            <Reveal className="quest-heading-note" delay="80ms">
              <p>
                Every quest has a different referee. Sometimes it is a
                satellite. Sometimes it is your friends.
              </p>
            </Reveal>
          </div>
          <div className="quest-grid">
            {quests.map((quest, index) => (
              <Reveal
                key={quest.code}
                className={`quest-card quest-card-${quest.accent}`}
                delay={`${index * 70}ms`}
              >
                <div className="quest-card-topline">
                  <span>0{index + 1}</span>
                  <span>{quest.code}</span>
                </div>
                <div className="quest-card-icon" aria-hidden="true">
                  {quest.code === "LBQ" && <Pin />}
                  {quest.code === "VBQ" && (
                    <span className="vote-icon">
                      <i />
                      <i />
                      <i />
                    </span>
                  )}
                  {quest.code === "TBQ" && <Clock />}
                </div>
                <p className="quest-eyebrow">{quest.eyebrow}</p>
                <h3>{quest.label}</h3>
                <p>{quest.description}</p>
                <span className="quest-card-arrow">
                  <ArrowUpRight />
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        className="trigger section-light"
        id="trigger-points"
        aria-labelledby="trigger-title"
      >
        <div className="section-shell">
          <div className="section-label reveal">
            <span>03</span>
            <span>Timing is everything</span>
          </div>
          <div className="trigger-layout">
            <Reveal>
              <h2 id="trigger-title">
                No quest
                <br />
                before its
                <br />
                <em>moment.</em>
              </h2>
            </Reveal>
            <Reveal className="trigger-explainer" delay="90ms">
              <p className="lede">Trigger points keep the trip alive.</p>
              <p>
                A quest unlocks only when two things are true: the previous
                quest in that track is complete, and its scheduled trigger point
                has arrived.
              </p>
              <div className="trigger-rule">
                <div className="rule-number">
                  04<span>hrs</span>
                </div>
                <div>
                  <strong>Minimum gap between triggers</strong>
                  <p>
                    This is intentional. No speedrunning the whole trip while
                    staring at a screen.
                  </p>
                </div>
              </div>
              <div className="independent-note">
                <span className="mini-dot mini-dot-lime" />
                <span>
                  Individual and Group tracks are independent. One can unlock
                  while the other stays locked.
                </span>
              </div>
            </Reveal>
          </div>
          <Reveal className="timeline" delay="130ms">
            <div className="timeline-line">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="timeline-stop">
              <span>Quest 01</span>
              <strong>Unlock</strong>
              <small>Previous complete</small>
            </div>
            <div className="timeline-stop">
              <span>Trigger point</span>
              <strong>Wait</strong>
              <small>Scheduled time arrives</small>
            </div>
            <div className="timeline-stop">
              <span>Quest 02</span>
              <strong>Go</strong>
              <small>Four hours minimum</small>
            </div>
            <div className="timeline-stop">
              <span>Next unlock</span>
              <strong>Repeat</strong>
              <small>Until the finale</small>
            </div>
          </Reveal>
        </div>
      </section>

      <section
        className="final-quest section-acid"
        id="final-quest"
        aria-labelledby="final-title"
      >
        <div className="section-shell final-shell">
          <div className="section-label section-label-dark reveal">
            <span>04</span>
            <span>The point of no return</span>
          </div>
          <div className="final-grid">
            <Reveal>
              <p className="eyebrow-ink">Everyone gets one.</p>
              <h2 id="final-title">
                The final
                <br />
                <span>quest.</span>
              </h2>
            </Reveal>
            <Reveal className="final-copy" delay="80ms">
              <p className="final-lede">
                One quest. Fifteen possible ways to embarrass yourself.
              </p>
              <p>
                The Final Quest is drawn randomly from a pool of 10–15 equally
                difficult candidates. One candidate is assigned to each person,
                so everyone starts fair and finishes very, very differently.
              </p>
              <div className="final-time">
                <span className="final-time-label">
                  <Clock /> Starts at
                </span>
                <strong>{tripDetails.finalQuestTime}</strong>
                <span className="final-time-note">
                  A stopwatch starts for everyone.
                </span>
              </div>
            </Reveal>
          </div>
          <Reveal className="last-place-card" delay="130ms">
            <div className="last-place-number">
              LAST
              <br />
              <span>PLACE</span>
            </div>
            <div className="last-place-copy">
              <span className="micro-label">The only outcome that matters</span>
              <strong>Whoever finishes last gets punished.</strong>
              <p>There is no appeal. There is only a cafe bill.</p>
            </div>
            <ArrowUpRight />
          </Reveal>
        </div>
      </section>

      <section
        className="consequences section-dark"
        id="consequences"
        aria-labelledby="consequences-title"
      >
        <div className="section-shell">
          <div className="section-label section-label-dark reveal">
            <span>05</span>
            <span>Consequences</span>
          </div>
          <Reveal className="consequences-heading">
            <h2 id="consequences-title">
              Punishment
              <br />
              <span>vs. penalty.</span>
            </h2>
            <p>They sound similar. They feel very different.</p>
          </Reveal>
          <div className="versus-grid">
            <Reveal className="versus-card punishment-card">
              <div className="versus-card-header">
                <span>01</span>
                <strong>Punishment</strong>
              </div>
              <div className="versus-mark">P</div>
              <p>Reserved for one person only.</p>
              <h3>Last in the Final Quest</h3>
              <div className="versus-result">
                <span>Result</span>
                <strong>
                  Sponsor the group&apos;s food and drinks at a cafe.
                </strong>
              </div>
            </Reveal>
            <div className="versus-divider" aria-hidden="true">
              <span>VS</span>
            </div>
            <Reveal className="versus-card penalty-card" delay="100ms">
              <div className="versus-card-header">
                <span>02</span>
                <strong>Penalty</strong>
              </div>
              <div className="versus-mark">+2</div>
              <p>Stackable. Avoidable. Extremely real.</p>
              <h3>Fail a TBQ or receive an approved Report</h3>
              <div className="versus-result">
                <span>Result</span>
                <strong>Add 2 minutes to your Final Quest start time.</strong>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section
        className="reports section-orange"
        id="reports"
        aria-labelledby="reports-title"
      >
        <div className="section-shell reports-grid">
          <Reveal>
            <p className="eyebrow-ink">Keep the game honest</p>
            <h2 id="reports-title">
              See something.
              <br />
              <span>Report something.</span>
            </h2>
          </Reveal>
          <Reveal className="reports-copy" delay="80ms">
            <p className="lede">
              Bribery, sabotage, dirty voting, or anything that ruins the vibe
              is reportable.
            </p>
            <p>
              Anyone can file a Report. If four people approve it, the reported
              player receives a massive five-minute penalty. Four people. No
              revenge reporting. No democracy cosplay.
            </p>
            <div className="report-reasons">
              {reportReasons.map((reason) => (
                <span key={reason}>{reason}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section
        className="rules section-light"
        id="rules"
        aria-labelledby="rules-title"
      >
        <div className="section-shell">
          <div className="section-label reveal">
            <span>06</span>
            <span>The fine print</span>
          </div>
          <div className="rules-heading">
            <Reveal>
              <h2 id="rules-title">
                Terms &amp;
                <br />
                <em>consequences.</em>
              </h2>
            </Reveal>
            <Reveal delay="80ms">
              <p>
                Read this part now. Pretending you did later will not save you.
              </p>
            </Reveal>
          </div>
          <div className="rules-list">
            {rules.map((rule, index) => (
              <Reveal
                className="rule-item"
                key={rule}
                delay={`${index * 35}ms`}
              >
                <span className="rule-index">0{index + 1}</span>
                <span>{rule}</span>
                <Tick />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <footer className="footer section-dark">
        <div className="footer-grid section-shell">
          <Reveal>
            <span className="footer-kicker">End of briefing</span>
            <h2>
              See you
              <br />
              <span>out there.</span>
            </h2>
          </Reveal>
          <Reveal className="footer-aside" delay="100ms">
            <p>
              Come for the trip. Stay for the glory. Try not to pay for
              everyone&apos;s drinks.
            </p>
            <a href="#top" className="back-to-top">
              Back to top <ArrowUpRight />
            </a>
          </Reveal>
        </div>
        <div className="footer-base section-shell">
          <span>SUFFER / [TRIP DATES] / [DESTINATION]</span>
          <span>Don&apos;t say we didn&apos;t warn you.</span>
        </div>
      </footer>
    </main>
  );
}
