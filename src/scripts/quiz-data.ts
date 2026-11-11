/** Questions + scoring for the "Find My Perfect Tool" wizard (pure functions, no DOM). */
import type { ToolLite } from './types';

export interface Option {
  id: string;
  label: string;
  hint: string;
}
export interface RoleOption extends Option {
  /** Categories this role typically works in (soft boost). */
  categories: string[];
}
export interface BudgetOption extends Option {
  /** Max monthly price for ONE seat, or null for "no limit". 0 = free plan / open source. */
  max: number | null;
}
export interface GoalOption extends Option {
  /** First entry is the primary category. */
  categories: string[];
}

export const ROLES: RoleOption[] = [
  { id: 'founder', label: 'Founder / Executive', hint: 'Running the whole business', categories: ['CRM', 'AI Assistants', 'Project Management', 'Productivity & Docs'] },
  { id: 'developer', label: 'Developer / Engineer', hint: 'Building and shipping software', categories: ['AI Coding', 'Project Management', 'Automation', 'Analytics'] },
  { id: 'designer', label: 'Designer / Creative', hint: 'Visuals, product and brand', categories: ['Design', 'AI Creative'] },
  { id: 'marketer', label: 'Marketer / Content', hint: 'Growth, SEO and campaigns', categories: ['Marketing', 'AI Writing', 'Analytics', 'AI Creative'] },
  { id: 'sales', label: 'Sales / Revenue', hint: 'Pipeline, deals and outreach', categories: ['CRM', 'Communication', 'AI Writing'] },
  { id: 'pm', label: 'Product / Project Manager', hint: 'Planning and coordinating teams', categories: ['Project Management', 'Productivity & Docs', 'Communication'] },
  { id: 'support', label: 'Customer Support', hint: 'Helping customers succeed', categories: ['Customer Support', 'Communication', 'Automation'] },
  { id: 'ops', label: 'Operations / Admin', hint: 'Keeping the business running', categories: ['Automation', 'Productivity & Docs', 'Project Management'] },
];

export const BUDGETS: BudgetOption[] = [
  { id: 'free', label: 'Free or open source', hint: 'A free plan or self-hosting', max: 0 },
  { id: 'low', label: 'Up to $15 / month', hint: 'Per user, starting price', max: 15 },
  { id: 'mid', label: 'Up to $50 / month', hint: 'Per user, starting price', max: 50 },
  { id: 'any', label: 'No limit', hint: 'Show me the best, whatever it costs', max: null },
];

export const GOALS: GoalOption[] = [
  { id: 'chat', label: 'Chat, research & answers', hint: 'An AI assistant for everyday work', categories: ['AI Assistants'] },
  { id: 'code', label: 'Ship code faster', hint: 'AI pair-programming and app building', categories: ['AI Coding'] },
  { id: 'create', label: 'Create images, video or voice', hint: 'Generative creative tools', categories: ['AI Creative'] },
  { id: 'write', label: 'Write better content', hint: 'Copy, editing and tone', categories: ['AI Writing', 'Marketing'] },
  { id: 'projects', label: 'Run projects & tasks', hint: 'Boards, sprints and roadmaps', categories: ['Project Management'] },
  { id: 'customers', label: 'Win & support customers', hint: 'CRM, pipeline and help desk', categories: ['CRM', 'Customer Support'] },
  { id: 'design', label: 'Design products & visuals', hint: 'UI, prototypes and graphics', categories: ['Design'] },
  { id: 'docs', label: 'Organize docs & knowledge', hint: 'Notes, wikis and databases', categories: ['Productivity & Docs'] },
  { id: 'automate', label: 'Automate busy-work', hint: 'Connect apps and build workflows', categories: ['Automation'] },
  { id: 'grow', label: 'Grow traffic & audience', hint: 'SEO, social, email and analytics', categories: ['Marketing', 'Analytics'] },
  { id: 'talk', label: 'Talk to my team & clients', hint: 'Chat, meetings and async video', categories: ['Communication'] },
];

export interface Answers {
  role: string;
  budget: string;
  goal: string;
}

export interface Match {
  tool: ToolLite;
  score: number;
  /** False when the tool's starting price exceeds the chosen budget. */
  fitsBudget: boolean;
  reasons: string[];
}

function fitsBudget(t: ToolLite, max: number | null): boolean {
  if (max === null) return true;
  // A free plan / open-source build lets you start at $0, so it fits any budget.
  if (t.free || t.hasFree) return true;
  return t.price <= max;
}

/** Rank the catalog for the given answers and return the best `limit` matches. */
export function recommend(tools: ToolLite[], answers: Answers, limit = 3): Match[] {
  const role = ROLES.find((r) => r.id === answers.role);
  const budget = BUDGETS.find((b) => b.id === answers.budget);
  const goal = GOALS.find((g) => g.id === answers.goal);
  if (!role || !budget || !goal) return [];

  const matches: Match[] = tools
    .filter((t) => goal.categories.includes(t.category))
    .map((t) => {
      const fits = fitsBudget(t, budget.max);
      const roleFit = role.categories.includes(t.category);
      let score = t.rating * 10;
      score += fits ? 30 : -40;
      if (roleFit) score += 12;
      if (goal.categories[0] === t.category) score += 6;
      if (budget.id === 'free' && t.oss) score += 4;

      const reasons = [`${t.rating.toFixed(1)}/5 rating in ${t.category}`];
      reasons.push(`Matches your goal: ${goal.label.toLowerCase()}`);
      if (roleFit) reasons.push(`Popular with ${role.label.toLowerCase()} teams`);
      if (budget.max === null) reasons.push('Fits any budget');
      else if (t.oss) reasons.push('Open source: free to self-host');
      else if (t.price === 0) reasons.push('Free to use');
      else if (t.hasFree) reasons.push('Free plan available to start');
      else if (fits) reasons.push(`From $${t.price}/mo, inside your budget`);
      else reasons.push(`From $${t.price}/mo, above your ${budget.label.toLowerCase()} budget`);

      return { tool: t, score, fitsBudget: fits, reasons };
    });

  return matches.sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name)).slice(0, limit);
}
