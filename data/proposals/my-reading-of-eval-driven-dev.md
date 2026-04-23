# My reading of Eval-Driven-Development

**Author:** Wenxuan (drafted by Hermes from Jun's doc, v2026-03-11)
**Status:** draft — for alignment with Jun before Week-2 standup
**Source doc:** [Feishu — Evaluation-Driven-Development](https://bytedance.larkoffice.com/docx/TztEdB3nNoijXZxYeJSuxW5TsOg)

---

## 1. The one-line I took away

> **Eval defines the problem; AI executes the loop; humans only make decisions.**
> The Ralph Loop only works when the judge is trustworthy — Eval *is* that judge.

Coding is no longer the bottleneck in the Agent era; **"knowing whether the change was correct"** is. EDD is the discipline that turns that question from a human gut-check into an executable, statistical judgment.

---

## 2. What I think Eval actually is (vs. traditional tests)

A 4-layer definition of "how the system *should* behave":

| Layer | Content | Role |
|---|---|---|
| **Input** | user assets + instruction | fixture |
| **Expectation** | desired output / constraints | spec |
| **Rule evaluators** | hard pass/fail | deterministic gate |
| **LLM Judge** | soft 1–5 quality scores | distributional gate |

Three things that make it *not* a unit test:
1. **End-to-end**, not per-function.
2. **Tolerates non-determinism** — runs N times, takes statistics.
3. **Authored across roles** — RD + PM + Designer (rules from RD, quality dims from PM/Designer).

---

## 3. Current coverage — where I see the opportunity

| Level | What it checks | State |
|---|---|---|
| L1 Availability | no crash / timeout / infinite loop | ✅ complete |
| L2 Correctness | picked music / added captions | ✅ complete |
| L3 Quality | *is the video actually good* | ⚠️ **Framework exists, not yet in CI** |
| L4 User satisfaction | online A/B | ❌ TODO |

**My read:** L3 is the near-term leverage point, and it maps directly to Jerry's O3: "AB-quality diffs at the sub-agent or single-prompt level." Getting `VideoLLMJudgeEvaluator` into CI is the unlock.

---

## 4. The loop I plan to follow

```
problem source (eval / bug / 巡检)
   ↓
/analyze-eval   → failure classification + thread_id list
   ↓
/buddy trace    → root cause
   ↓
AI writes fix + test (pytest reproduce → fix → verify)
   ↓
local eval --skip-render
   ↓
/ppe push → remote eval
   ↓
compare_runs → pass rate / regression / cost
   ↓
pass? → git push → human code review → merge
fail? → loop back to step 3
```

Every bug becomes a permanent eval case at `eval/dataset/bugs/<id>.json` — regressions are prevented by construction, not by memory.

---

## 5. What I learned from the 56% → 100% TextAgent case

The real lesson isn't the fix — it's the **division of labor**:

| AI did | Human did |
|---|---|
| Downloaded traces | Confirmed root cause was correct |
| Detected Type A / Type B / FC400 patterns | Reviewed the fix |
| Wrote fix + test | Set the business threshold (15% auto-clamp; AI suggested 10% — too strict) |

Total time: ~2h (≈45 min of human work). Manual estimate: 1–2 days.

**Takeaway:** the humans-set-thresholds part is non-delegable. This is where domain judgment lives, and it's where I want to invest my first weeks of context.

---

## 6. Known limits I want to respect

- **AI ≠ business judgment.** Thresholds, creative decisions, and edge priorities stay human.
- **LLM flakiness is real.** 3-of-3 fail = true failure; 1–2 = flaky. Always run `remote_eval_retry.py --max-rounds 3` before drawing conclusions.
- **Spec blind spots:** long video / pure-image / multilingual / cross-version regression — all currently uncovered.

---

## 7. Questions for Jun (Week-2 alignment)

1. **L3 in CI — where should I start?** Is bringing `VideoLLMJudgeEvaluator` into the daily CI run a good Week-3 goal, or is there a precursor (flaky-rate baseline via `BenchmarkRunner N=3`) you'd sequence first?
2. **Sub-agent / single-prompt AB granularity (Q2 O3).** Is the plan to extend `compare_runs.py` with per-agent / per-prompt filtering, or to build a new `diff_prompt_versions.py`?
3. **Bug→eval conversion SLA.** Should I treat "every bug I fix produces an `eval/dataset/bugs/<id>.json` before merge" as a hard rule from day one?
4. **PM/Designer eval authoring UI** — is this on the Q2 roadmap, or Q3+? Affects whether I should invest in the Python APIs or the Web UI side first.
5. **Cost discipline.** Is there a per-loop token / dollar budget I should internalize (the doc suggests ~$2–5 Claude + ~$3 eval)?

---

## 8. My first contribution targets (proposals, not commitments)

1. **Shadow /buddy** on 2–3 real tickets this week to build trace-reading muscle.
2. **Ship a bug→eval converter script** — automate the `prepare_batch_dataset.py upload` + dataset scaffolding, because this is a friction point that slows the Ralph Loop.
3. **Help land L3 into CI** — pair with whoever owns `VideoLLMJudgeEvaluator`.

---

*Ready to discuss live whenever works for you. Happy to iterate this doc before sending it up.*
