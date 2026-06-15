'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function TestRunner({ test, questions }) {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> optionIndex
  const [secondsLeft, setSecondsLeft] = useState(test.duration_minutes * 60);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!started || result) return;
    const t = setInterval(() => setSecondsLeft((s) => {
      if (s <= 1) { clearInterval(t); submit(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [started, result]);

  async function submit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    const res = await fetch('/api/tests/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testId: test.id, answers })
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) setResult(data);
    else { submittedRef.current = false; alert(data.error || 'Submission failed'); }
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  if (!questions.length) return <div className="container-x py-24 text-center text-ink/50">No questions added yet.</div>;

  if (!started) return (
    <div className="container-x flex justify-center py-24">
      <div className="card max-w-md !p-8 text-center">
        <h1 className="text-2xl font-bold">{test.title}</h1>
        <p className="mt-3 text-sm text-ink/60">{questions.length} questions · {test.duration_minutes} minutes · negative marking applies</p>
        <button onClick={() => setStarted(true)} className="btn-primary mt-6 w-full">Start Test</button>
      </div>
    </div>
  );

  if (result) return (
    <div className="container-x py-16">
      <div className="card mx-auto max-w-2xl !p-8 text-center">
        <p className="text-5xl">{result.score >= result.total / 2 ? '🎉' : '💪'}</p>
        <h1 className="mt-3 text-3xl font-bold">{result.score} / {result.total}</h1>
        <p className="mt-1 text-ink/60">{result.correctCount} correct · {result.wrongCount} wrong · {result.skipped} skipped</p>
      </div>
      <div className="mx-auto mt-8 max-w-2xl space-y-4">
        {questions.map((q, i) => {
          const picked = answers[q.id];
          const info = result.correctMap[q.id];
          const correct = info?.correct ?? info;
          const explanation = info?.explanation;
          return (
            <div key={q.id} className="card !p-5">
              <p className="font-medium">{i + 1}. {q.question}</p>
              <div className="mt-3 space-y-2 text-sm">
                {q.options.map((opt, oi) => (
                  <div key={oi} className={`rounded-lg border px-3 py-2 ${oi === correct ? 'border-green-400 bg-green-50' : oi === picked ? 'border-red-300 bg-red-50' : 'border-ink/10'}`}>
                    {opt} {oi === correct && '✓'} {oi === picked && oi !== correct && '✗'}
                  </div>
                ))}
              </div>
              {explanation && (
                <div className="mt-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-ink/70">
                  <span className="font-semibold text-accent">💡 Explanation:</span> {explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-8 text-center">
        <Link href="/dashboard" className="btn-primary">Back to Dashboard</Link>
      </div>
    </div>
  );

  const q = questions[current];
  return (
    <div className="container-x py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold">{test.title}</h1>
          <span className={`tag ${secondsLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-ink/5'}`}>⏱ {mm}:{ss}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {questions.map((qq, i) => (
            <button key={qq.id} onClick={() => setCurrent(i)}
              className={`h-8 w-8 rounded-full text-xs font-medium transition ${i === current ? 'bg-ink text-white' : answers[qq.id] !== undefined ? 'bg-accent/15 text-accent' : 'bg-ink/5 text-ink/50'}`}>
              {i + 1}
            </button>
          ))}
        </div>

        <div className="card mt-6 !p-6">
          <p className="text-xs text-ink/50">Question {current + 1} of {questions.length} · +{q.marks} / -{q.negative_marks}</p>
          <p className="mt-2 text-lg font-medium">{q.question}</p>
          <div className="mt-4 space-y-2">
            {q.options.map((opt, oi) => (
              <button key={oi}
                onClick={() => setAnswers({ ...answers, [q.id]: answers[q.id] === oi ? undefined : oi })}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${answers[q.id] === oi ? 'border-accent bg-accent/10' : 'border-ink/10 hover:border-ink/30'}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <button disabled={current === 0} onClick={() => setCurrent(current - 1)} className="btn-ghost disabled:opacity-40">← Previous</button>
          {current < questions.length - 1
            ? <button onClick={() => setCurrent(current + 1)} className="btn-primary">Next →</button>
            : <button onClick={submit} disabled={submitting} className="btn-primary !bg-green-600">{submitting ? 'Submitting...' : 'Submit Test'}</button>}
        </div>
      </div>
    </div>
  );
}
