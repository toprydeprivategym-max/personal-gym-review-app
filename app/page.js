"use client";

import { useMemo, useState } from "react";
import { QUESTIONS } from "@/lib/questions";

const TOTAL_STEPS = QUESTIONS.length + 1; // 10問 + 自由入力

export default function Home() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [freeText, setFreeText] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const progress = useMemo(() => {
    return Math.round(((step + 1) / (TOTAL_STEPS + 1)) * 100);
  }, [step]);

  const currentQuestion = QUESTIONS[step];
  const isFreeTextStep = step === QUESTIONS.length;

  // 回答を更新
  const updateAnswer = (questionId, value, type) => {
    setAnswers((prev) => {
      if (type === "multi") {
        const current = prev[questionId] || [];
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        return { ...prev, [questionId]: next };
      }
      return { ...prev, [questionId]: value };
    });
  };

  // 現在の質問に回答済みか
  const isCurrentAnswered = useMemo(() => {
    if (isFreeTextStep) return true; // 自由入力は任意
    const a = answers[currentQuestion?.id];
    if (currentQuestion?.type === "multi") return Array.isArray(a) && a.length > 0;
    return Boolean(a);
  }, [currentQuestion, answers, isFreeTextStep]);

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  };
  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult("");
    setCopied(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          freeText,
          clinicName,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `エラーが発生しました (${res.status})`);
      }
      const data = await res.json();
      setResult(data.review || "");
    } catch (e) {
      setError(e.message || "予期せぬエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setError("コピーに失敗しました。手動で選択してください。");
    }
  };

  const handleReset = () => {
    setStep(0);
    setAnswers({});
    setFreeText("");
    setResult("");
    setError("");
    setCopied(false);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {/* ヘッダー */}
      <header className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1 text-xs font-semibold text-brand-700">
          パーソナルジム向け
        </div>
        <h1 className="mt-3 text-2xl font-bold text-slate-800 sm:text-3xl">
          Google口コミ ジェネレーター
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          10個の質問に答えるだけで、自然な口コミ文を自動生成します。
        </p>
      </header>

      {/* 院名入力（任意・常に表示） */}
      {!result && (
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <label className="block text-xs font-semibold text-slate-500">
            ジム名（任意・口コミ文に含めたい場合）
          </label>
          <input
            type="text"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            placeholder="例: ○○パーソナルジム"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      )}

      {/* 生成結果ビュー */}
      {result ? (
        <section className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-100">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">
              ✨ 生成された口コミ
            </h2>
            <button
              onClick={handleCopy}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                copied
                  ? "bg-emerald-500 text-white"
                  : "bg-brand-600 text-white hover:bg-brand-700"
              }`}
            >
              {copied ? "✓ コピーしました" : "📋 ワンクリックでコピー"}
            </button>
          </div>
          <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
            {result}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50 disabled:opacity-50"
            >
              {loading ? "再生成中..." : "🔄 もう一度生成する"}
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              最初からやり直す
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* プログレスバー */}
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-xs font-medium text-slate-500">
              <span>
                ステップ {step + 1} / {TOTAL_STEPS}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 質問カード or 自由入力 */}
          <section className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-100">
            {isFreeTextStep ? (
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-600">
                  最後に
                </div>
                <h2 className="text-lg font-bold text-slate-800">
                  実際に感じたこと・印象的だったことを自由に教えてください
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  あなたの言葉が入ることで、より自然でリアルな口コミになります。（空欄でもOK）
                </p>
                <textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  rows={6}
                  placeholder="例: 運動が苦手で続いた試しがなかった自分が、3ヶ月続けられたのが本当に驚きでした。トレーナーさんが毎回フォームを丁寧に直してくれて、家でも続けられるストレッチも教えてもらえました。"
                  className="mt-3 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            ) : (
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-600">
                  {currentQuestion.category}
                </div>
                <h2 className="text-lg font-bold text-slate-800">
                  {currentQuestion.label}
                </h2>
                <div className="mt-4 grid gap-2">
                  {currentQuestion.options.map((opt) => {
                    const selected =
                      currentQuestion.type === "multi"
                        ? (answers[currentQuestion.id] || []).includes(opt)
                        : answers[currentQuestion.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          updateAnswer(currentQuestion.id, opt, currentQuestion.type)
                        }
                        className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left text-sm transition ${
                          selected
                            ? "border-brand-500 bg-brand-50 font-semibold text-brand-700"
                            : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/30"
                        }`}
                      >
                        <span
                          className={[
                            "flex h-5 w-5 shrink-0 items-center justify-center border-2",
                            currentQuestion.type === "multi" ? "rounded-md" : "rounded-full",
                            selected
                              ? "border-brand-500 bg-brand-500 text-white"
                              : "border-slate-300 bg-white",
                          ].join(" ")}
                        >
                          {selected && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-3 w-3"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
                {currentQuestion.type === "multi" && (
                  <p className="mt-3 text-xs text-slate-400">
                    ※ 複数選択できます
                  </p>
                )}
              </div>
            )}

            {/* エラー表示 */}
            {error && (
              <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
                {error}
              </div>
            )}

            {/* ナビゲーション */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={step === 0 || loading}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              >
                ← 戻る
              </button>
              {isFreeTextStep ? (
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
                >
                  {loading ? "生成中..." : "✨ 口コミを生成する"}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!isCurrentAnswered}
                  className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  次へ →
                </button>
              )}
            </div>
          </section>
        </>
      )}

      <footer className="mt-10 text-center text-xs text-slate-400">
        ※ 生成された口コミはあくまで参考案です。実際の体験に基づいて編集してから投稿してください。
      </footer>
    </main>
  );
}
