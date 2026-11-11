/** "Find My Perfect Tool" — 3-step wizard rendered inside a native <dialog>. */
import { BUDGETS, GOALS, ROLES, recommend, type Answers, type Option } from './quiz-data';
import { resultsHtml, stepHtml } from './quiz-render';
import { syncCompareButtons } from './compare-buttons';
import { isFreeOnly } from './prefs';
import { readJson } from './util';
import type { ToolLite } from './types';

const tools = readJson<ToolLite[]>('catalog-lite', []);

const dialog = document.getElementById('quiz-dialog') as HTMLDialogElement | null;
const body = document.getElementById('quiz-body');
const progress = document.getElementById('quiz-progress');
const stepLabel = document.getElementById('quiz-step-label');
const backBtn = document.getElementById('quiz-back') as HTMLButtonElement | null;
const nextBtn = document.getElementById('quiz-next') as HTMLButtonElement | null;
const restartBtn = document.getElementById('quiz-restart') as HTMLButtonElement | null;

const STEPS: { key: keyof Answers; title: string; options: Option[] }[] = [
  { key: 'role', title: "What's your role?", options: ROLES },
  { key: 'budget', title: "What's your budget?", options: BUDGETS },
  { key: 'goal', title: "What's your main goal?", options: GOALS },
];

let step = 0;
let answers: Partial<Answers> = {};
let opener: HTMLElement | null = null;

function render(): void {
  if (!body || !progress || !stepLabel || !backBtn || !nextBtn || !restartBtn) return;
  const total = STEPS.length;
  const done = step >= total;
  backBtn.hidden = step === 0;
  nextBtn.hidden = done;
  restartBtn.hidden = !done;

  if (done) {
    const matches = recommend(isFreeOnly() ? tools.filter((t) => t.free) : tools, answers as Answers, 3);
    stepLabel.textContent = 'Your top matches';
    progress.style.width = '100%';
    body.innerHTML = resultsHtml(matches, isFreeOnly());
    syncCompareButtons();
  } else {
    const s = STEPS[step];
    stepLabel.textContent = `Step ${step + 1} of ${total}`;
    progress.style.width = `${((step + 1) / (total + 1)) * 100}%`;
    nextBtn.textContent = step === total - 1 ? 'Show my matches' : 'Next';
    nextBtn.disabled = !answers[s.key];
    body.innerHTML = stepHtml(s.key, s.title, s.options, answers[s.key]);
  }
  document.getElementById('quiz-title')?.setAttribute('tabindex', '-1');
}

function focusStart(): void {
  const el = body?.querySelector<HTMLElement>('input:checked') ?? body?.querySelector<HTMLElement>('input[type="radio"]');
  (el ?? document.getElementById('quiz-title'))?.focus();
}

function go(to: number): void {
  step = Math.max(0, to);
  render();
  focusStart();
}

function openQuiz(trigger: HTMLElement): void {
  if (!dialog) return;
  opener = trigger;
  answers = {};
  step = 0;
  render();
  if (!dialog.open) dialog.showModal();
  focusStart();
}

if (dialog && body && nextBtn && backBtn && restartBtn) {
  body.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.type !== 'radio') return;
    answers[input.name as keyof Answers] = input.value;
    nextBtn.disabled = false;
  });

  nextBtn.addEventListener('click', () => {
    if (answers[STEPS[step].key]) go(step + 1);
  });
  backBtn.addEventListener('click', () => go(step - 1));
  restartBtn.addEventListener('click', () => {
    answers = {};
    go(0);
  });

  dialog.querySelectorAll('[data-quiz-close]').forEach((el) => el.addEventListener('click', () => dialog.close()));
  // A click on the backdrop lands on the <dialog> element itself.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => opener?.focus());

  document.querySelectorAll<HTMLElement>('[data-open-quiz]').forEach((btn) => btn.addEventListener('click', () => openQuiz(btn)));
}
