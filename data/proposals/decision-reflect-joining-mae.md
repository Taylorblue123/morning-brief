# Decision Reflect: Joining MAE — through Kahneman's Lens

**Author:** Wenxuan (drafted with Hermes)
**Date:** 2026-04-23, Day 2 of onboarding
**Framework:** *Thinking, Fast and Slow* — System 1 (gut/fast/associative) vs. System 2 (deliberate/slow/analytical)
**Purpose:** Audit a still-fresh decision *before* outcome bias kicks in. Surface which reasons were real, which were narratives, and what signals would re-open the decision.

---

## 0. The decision in one sentence

*Joined the **AI Video Editing — Agent Eval (MAE)** team at TikTok/ByteDance (Apr 2026), under Jerry Tao (manager) and Jun Li (mentor), with Jackson Chen as peer.*

---

## 1. System 1 reads — what my gut said (retrospectively)

These are *fast reactions*. They're not wrong, but they're **not evidence** either. Worth naming so I can tell which are still valid on Day 2 and which were narratives.

| S1 Signal | What it whispered | Still true on Day 2? |
|---|---|---|
| **"Agentic eval is the hot frontier"** | Career momentum — ride the wave | ✅ Yes. Agent-as-Judge (arXiv 2410.10934), Zed parallel agents — the space is live. |
| **"Jackson is a strong peer"** | I won't be alone; learning compounds | ✅ Yes, reinforced — he shipped Ralph Loop demo already. |
| **"Video × Agent is my aesthetic"** | Emotional fit — I *want* to work on this | 🟡 Needs testing in week 2–4 (am I still excited after 50 trace reads?). |
| **"TikTok brand halo"** | Implicit resume / option value | ⚠️ S1-only. Halo effect — not a real reason to join a *team*. |
| **"Jun's eval doc felt right"** | Recognition / taste agreement | ✅ Re-read today at length — the 4-layer Eval + Ralph Loop framing is genuinely rigorous, not vibes. |

**Biases operating in S1 here:**
- **Availability** — agentic AI is *loud* in my feed, so it felt like "the obvious choice."
- **Halo** — Jun's doc being good → team must be great. (Probably true, but I should verify structurally, not aesthetically.)
- **Affect heuristic** — "video + AI" makes me feel creative; pleasure ≠ fit.

---

## 2. System 2 reads — what actually checks out under inspection

Slow-thinking test: if I remove all emotion, **what's the defensible case?**

### 2a. Structural fit
- **Eval is the bottleneck of agentic AI.** Ralph Loop fails without a trustworthy judge. MAE is building exactly that for a high-stakes domain (video). Anywhere agentic AI scales, *someone* is going to need this skillset — I'm arriving early.
- **L3 (LLM-Judge in CI) is a clearly under-owned contribution surface.** Jun's doc literally flags it ⚠️. Sub-agent-level AB diff (Jerry's Q2 O3) is another clean target. **There is room to make a dent in 60 days.** That is rare.
- **MAE's stack (LangGraph + 29 evaluators + PPE + Ralph Loop) compounds into a real skill**, not a firm-specific artifact. If I left in 2 years, the mental model travels.

### 2b. People fit
- **Jerry**: OKRs read as structured, measurable, not vibes-based. Calibrated scoring (0.6–0.7 = on-target) is a healthy org signal.
- **Jun**: eval-driven-dev doc is *written* — already a good sign he can compress and teach. Willing to let me draft a reading 1-pager and iterate.
- **Jackson**: similar career phase, complementary strengths (he ships fast; I think deeply about eval). Healthy asymmetry.

### 2c. Option value
- **Sideways transferable** — agent eval → ML platform → research eng, many doors.
- **Downside bounded** — if MAE pivots or underdelivers, I've still built real infra skills (LangGraph, Rush, distributed trace analysis) on a business that funds itself.

### 2d. What S2 *can't* yet verify (data needed)
- Team velocity — do PRs actually merge fast, or is PPE a theater?
- Jun's mentorship bandwidth — is he available 2h/week or 2h/quarter?
- On-call / compliance load — TTP + ROW dual-stack from Jerry's O1 suggests nontrivial ops burden.
- Crunch cadence — Q2 deadline for conversational video (Casper's O2) may spill onto eval team.

---

## 3. Day-2 signals vs. expectations

The *kindest* version of this exercise is: **did Day 2 give me data that S1 was right, or was I romanticizing?**

| Expectation | Day-2 observation | Verdict |
|---|---|---|
| "The eval framework is rigorous" | 4-layer Eval + 29 evaluators + diagnostics v2.2 + compare_runs.py | ✅ Exceeded. More mature than expected. |
| "Jun is a real mentor, not a figurehead" | His doc is personally written, worklog-linked, last updated 2026-03-11 | ✅ Signal is real. Still need to test bandwidth. |
| "Docs are accessible" | All 5 core docs readable on Day 2 via Feishu. | ✅ Lower friction than most teams. |
| "I can contribute in 60 days" | L3→CI looks tractable; bug→eval converter is a real gap; VideoLLMJudge needs an owner | ✅ Contribution surface is visible. |
| "Stack is learnable" | LangGraph + Rush + FastAPI + Thrift — within my reach, maybe 2 weeks to productivity | 🟡 Verify after first real /buddy loop. |
| "Team has velocity" | No data yet (Day 2) | ⏳ TBD — watch merge frequency, PPE turnaround time. |

**Net:** S1 was mostly directionally right. S2 upgrades the confidence. **But the verdict is still provisional** — the fair test is at Day 30, not Day 2.

---

## 4. Biases I should actively fight in the next 90 days

1. **Sunk cost** — I joined; that doesn't obligate the *right* outcome. If Day-30 signals diverge, re-decide.
2. **Commitment & consistency** — publicly telling people I'm on MAE will make me defend it; defensiveness ≠ correctness.
3. **Confirmation bias** — I'll overweight evidence MAE is great (because it rewards my choice). Keep a **kill-criteria list** (§6).
4. **Intensity bias** — busy ≠ valuable. Running 1000 evals is not the same as making the judge better.
5. **Endowment effect on my L3-in-CI contribution** — don't cling to it if Jun says the real lever is elsewhere.

---

## 5. Pre-mortem — the way this ends badly

*Exercise: imagine it's April 2027 and this was a mistake. Why?*

- **Scenario A — Eval becomes low-status infra.** MAE ships product, ops swallows eval, I become a CI janitor.
  - *Mitigation:* ship at least one **publicly legible** artifact (paper, talk, OSS eval tool) within 12 months. Keep an external narrative.
- **Scenario B — Jun leaves.** Mentorship evaporates; I'm orphaned under a PM-heavy org.
  - *Mitigation:* build relationships with Jerry + Jackson + one external senior eng. Don't depend on a single tree.
- **Scenario C — ByteDance reorg.** TTP/ROW split, team name-changes, OKRs reset.
  - *Mitigation:* focus on portable skills (LangGraph, eval framework design) over firm-specific ones.
- **Scenario D — I stop caring about video.** Realize my real draw is agent infra, not video specifically.
  - *Mitigation:* this is fine — MAE → ML platform is a natural internal transfer path. Notice the signal early.
- **Scenario E — Crunch from conversational-video Q2.** Eval team absorbs overflow; I never get L3→CI time.
  - *Mitigation:* negotiate scope with Jun week-2. Surface early.

---

## 6. Kill criteria (re-decision triggers)

**Re-open this decision if any of these hit:**

- [ ] **Day 30:** I haven't read a real trace end-to-end with a real root cause.
- [ ] **Day 60:** No merged commit on MAE repos.
- [ ] **Day 90:** No visible progress on L3→CI *or* a redirected contribution surface.
- [ ] **Any time:** 2+ consecutive 1:1s with Jun get cancelled without reschedule.
- [ ] **Any time:** Jun leaves the team.
- [ ] **Any time:** I haven't learned something new in 14 days.
- [ ] **Any time:** I'm excited to open my laptop < 3 days/week for 2 weeks straight.

These are **tripwires, not verdicts.** Hit one → schedule a 60-min S2 reflection, not an immediate resignation.

---

## 7. Today's context → what this reflection changes

- **LangGraph learning track** (today's plan): *locked in* — it's the literal substrate of every trace I'll read. No re-decision needed.
- **Single-side-project rule (D009):** consistent with narrowing focus — *fight intensity bias*, ship fewer things deeper.
- **R010 (Eval-Driven-Dev 1-pager for Jun):** a forcing function for **S2** thinking about the team's method. Send it.
- **Learn Anything Core framework:** the meta-loop that ensures I *actually* learn in the job, not just attend it.

---

## 8. One sentence I want to remember

> The decision was mostly S1, but the data is upholding it under S2. The job now is not to *defend* the decision — it's to *run honest experiments* that would update me if I were wrong.

---

*Iterate freely. Comments, additions, or a rewrite request all welcome.*
