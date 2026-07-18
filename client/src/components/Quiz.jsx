import { useState } from 'react';
import { CheckCircle2, XCircle, Award, RotateCcw } from 'lucide-react';

// 交互式随堂小测：点击选项即时判分并展示解析，顶部显示已答对进度。
// quizzes: [{ question, options:[{key,text}], answer, explanation }]
export default function Quiz({ quizzes = [] }) {
  const [selected, setSelected] = useState({}); // idx -> key
  const [revealed, setRevealed] = useState({}); // idx -> bool

  if (!quizzes.length) return null;

  const answered = Object.keys(revealed).length;
  const correct = quizzes.reduce(
    (n, q, i) => n + (revealed[i] && selected[i] === q.answer ? 1 : 0),
    0
  );
  const allDone = answered === quizzes.length;

  const choose = (i, key) => {
    if (revealed[i]) return;
    setSelected((s) => ({ ...s, [i]: key }));
    setRevealed((r) => ({ ...r, [i]: true }));
  };

  const reset = () => {
    setSelected({});
    setRevealed({});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl bg-brand-50 px-4 py-2.5 text-sm">
        <span className="inline-flex items-center gap-2 text-brand-700">
          <Award size={16} className="text-brand-500" />
          已答对 <b className="text-text-primary">{correct}</b> / {quizzes.length}
          <span className="text-text-muted">（已做 {answered} 题）</span>
        </span>
        {answered > 0 && (
          <button
            onClick={reset}
            className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 transition cursor-pointer"
          >
            <RotateCcw size={14} /> 重做
          </button>
        )}
      </div>

      {quizzes.map((q, i) => {
        const isRevealed = revealed[i];
        const picked = selected[i];
        const isRight = picked === q.answer;
        return (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-5 shadow-card"
          >
            <p className="font-semibold text-text-primary mb-3">
              <span className="text-brand-600 mr-1">{i + 1}.</span>
              {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt) => {
                const isPicked = picked === opt.key;
                const isCorrect = q.answer === opt.key;
                let cls = 'border-border bg-surface hover:border-brand-300 hover:bg-brand-50';
                if (isRevealed) {
                  if (isCorrect) cls = 'border-green-300 bg-green-50 text-green-700';
                  else if (isPicked) cls = 'border-red-300 bg-red-50 text-red-700';
                  else cls = 'border-border bg-surface opacity-70';
                }
                return (
                  <button
                    key={opt.key}
                    onClick={() => choose(i, opt.key)}
                    disabled={isRevealed}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition flex items-center gap-2 cursor-pointer ${cls}`}
                  >
                    <span className="font-semibold">{opt.key}.</span>
                    <span className="flex-1">{opt.text}</span>
                    {isRevealed && isCorrect && (
                      <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                    )}
                    {isRevealed && isPicked && !isCorrect && (
                      <XCircle size={16} className="text-red-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
            {isRevealed && (
              <div
                className={`mt-3 text-sm rounded-xl px-3 py-2 ${
                  isRight ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                }`}
              >
                {isRight ? '✅ 回答正确！' : `❌ 正确答案：${q.answer}`}
                {q.explanation && (
                  <p className="mt-1 text-text-secondary leading-relaxed">
                    {q.explanation}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {allDone && (
        <p className="text-center text-sm text-text-secondary">
          {correct === quizzes.length
            ? '🎉 全部答对，掌握得很扎实！'
            : `本章小测完成，答错 ${quizzes.length - correct} 题，回顾对应小节再巩固一下。`}
        </p>
      )}
    </div>
  );
}
