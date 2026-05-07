/* ============================================================
   TaskFlow — Complete Application JavaScript
   ============================================================ */

// ── Storage helpers ──────────────────────────────────────────
const Store = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

// ── Default seed data ─────────────────────────────────────────
function seedTasks() {
  const today = new Date();
  const d = (offset) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offset);
    return dt.toISOString().split('T')[0];
  };
  return [
    { id: 1, title: 'Design new landing page', description: 'Create wireframes and mockups for the redesigned homepage', priority: 'high', status: 'in-progress', project: 'Design', dueDate: d(2), tags: ['design', 'ui'], createdAt: new Date(today - 86400000 * 3).toISOString(), completedAt: null },
    { id: 2, title: 'Fix authentication bug', description: 'Users are getting logged out unexpectedly on mobile', priority: 'high', status: 'pending', project: 'Development', dueDate: d(1), tags: ['bug', 'auth'], createdAt: new Date(today - 86400000 * 2).toISOString(), completedAt: null },
    { id: 3, title: 'Write Q4 report', description: 'Compile quarterly performance metrics and insights', priority: 'medium', status: 'pending', project: 'Management', dueDate: d(5), tags: ['report', 'q4'], createdAt: new Date(today - 86400000 * 1).toISOString(), completedAt: null },
    { id: 4, title: 'Update API documentation', description: 'Document all new endpoints added in v2.1', priority: 'medium', status: 'completed', project: 'Development', dueDate: d(-1), tags: ['docs', 'api'], createdAt: new Date(today - 86400000 * 5).toISOString(), completedAt: new Date().toISOString() },
    { id: 5, title: 'Team onboarding session', description: 'Prepare materials for new team member onboarding', priority: 'low', status: 'completed', project: 'Management', dueDate: d(-2), tags: ['team', 'hr'], createdAt: new Date(today - 86400000 * 7).toISOString(), completedAt: new Date().toISOString() },
    { id: 6, title: 'Optimize database queries', description: 'Profile and optimize slow queries in the reporting module', priority: 'high', status: 'pending', project: 'Development', dueDate: d(3), tags: ['performance', 'db'], createdAt: new Date().toISOString(), completedAt: null },
    { id: 7, title: 'Social media campaign', description: 'Plan and schedule posts for product launch', priority: 'medium', status: 'in-progress', project: 'Marketing', dueDate: d(7), tags: ['social', 'launch'], createdAt: new Date().toISOString(), completedAt: null },
    { id: 8, title: 'Code review — PR #142', description: 'Review payment integration pull request', priority: 'high', status: 'pending', project: 'Development', dueDate: d(0), tags: ['review', 'payments'], createdAt: new Date().toISOString(), completedAt: null }
  ];
}

function seedProjects() {
  return [
    { id: 1, name: 'Development', color: '#4f46e5', description: 'Engineering and technical tasks', status: 'active' },
    { id: 2, name: 'Design', color: '#ec4899', description: 'UI/UX and visual design work', status: 'active' },
    { id: 3, name: 'Marketing', color: '#f59e0b', description: 'Marketing campaigns and content', status: 'active' },
    { id: 4, name: 'Management', color: '#10b981', description: 'Operations and team management', status: 'active' }
  ];
}
