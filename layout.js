/**
 * TaskFlow — Shared app layout (sidebar + topbar + footer)
 */
(function () {
  const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

  const navSections = [
    {
      title: 'Main',
      links: [
        { href: 'index.html', icon: 'fa-home', label: 'Home' },
        { href: 'dashboard.html', icon: 'fa-gauge-high', label: 'Dashboard' },
        { href: 'tasks.html', icon: 'fa-list-check', label: 'Tasks' },
        { href: 'calendar.html', icon: 'fa-calendar-days', label: 'Calendar' },
        { href: 'projects.html', icon: 'fa-diagram-project', label: 'Projects' },
      ],
    },
    {
      title: 'Insights',
      links: [
        { href: 'analytics.html', icon: 'fa-chart-line', label: 'Analytics' },
        { href: 'reports.html', icon: 'fa-file-lines', label: 'Reports' },
        { href: 'timetracking.html', icon: 'fa-clock', label: 'Time Tracking' },
      ],
    },
    {
      title: 'Collaboration',
      links: [
        { href: 'team.html', icon: 'fa-users', label: 'Team' },
        { href: 'notifications.html', icon: 'fa-bell', label: 'Notifications' },
        { href: 'tags.html', icon: 'fa-tags', label: 'Tags' },
        { href: 'templates.html', icon: 'fa-clone', label: 'Templates' },
      ],
    },
    {
      title: 'Account',
      links: [
        { href: 'profile.html', icon: 'fa-user', label: 'Profile' },
        { href: 'settings.html', icon: 'fa-gear', label: 'Settings' },
      ],
    },
    {
      title: 'Company',
      links: [
        { href: 'pricing.html', icon: 'fa-tags', label: 'Pricing' },
        { href: 'integrations.html', icon: 'fa-plug', label: 'Integrations' },
        { href: 'roadmap.html', icon: 'fa-road', label: 'Roadmap' },
        { href: 'about.html', icon: 'fa-circle-info', label: 'About' },
        { href: 'help.html', icon: 'fa-circle-question', label: 'Help' },
        { href: 'faq.html', icon: 'fa-comments', label: 'FAQ' },
        { href: 'contact.html', icon: 'fa-envelope', label: 'Contact' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { href: 'privacy.html', icon: 'fa-shield-halved', label: 'Privacy' },
        { href: 'terms.html', icon: 'fa-scale-balanced', label: 'Terms' },
      ],
    },
  ];

  const pageTitles = {
    'index.html': 'Home',
    'dashboard.html': 'Dashboard',
    'tasks.html': 'Tasks',
    'calendar.html': 'Calendar',
    'projects.html': 'Projects',
    'analytics.html': 'Analytics',
    'reports.html': 'Reports',
    'team.html': 'Team',
    'timetracking.html': 'Time Tracking',
    'notifications.html': 'Notifications',
    'tags.html': 'Tags',
    'templates.html': 'Templates',
    'profile.html': 'Profile',
    'settings.html': 'Settings',
    'help.html': 'Help Center',
    'about.html': 'About',
    'pricing.html': 'Pricing',
    'integrations.html': 'Integrations',
    'roadmap.html': 'Roadmap',
    'faq.html': 'FAQ',
    'contact.html': 'Contact',
    'privacy.html': 'Privacy Policy',
    'terms.html': 'Terms of Service',
  };

  function isActive(href) {
    return href.toLowerCase() === currentPage;
  }

  function buildNav() {
    return navSections
      .map(
        (section) => `
        <div class="app-nav-section">
          <div class="app-nav-section-title">${section.title}</div>
          ${section.links
            .map(
              (link) => `
            <a href="${link.href}" class="app-nav-link${isActive(link.href) ? ' active' : ''}">
              <i class="fas ${link.icon}"></i>
              <span>${link.label}</span>
            </a>`
            )
            .join('')}
        </div>`
      )
      .join('');
  }

  function buildFooter() {
    return `
      <div class="footer-content" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:2rem;margin-bottom:2rem;">
        <div class="footer-section">
          <h4>TaskFlow</h4>
          <p style="font-size:0.875rem;line-height:1.7;">Professional task management for individuals and teams.</p>
        </div>
        <div class="footer-section">
          <h4>Product</h4>
          <ul class="footer-links" style="list-style:none;padding:0;">
            <li><a href="dashboard.html">Dashboard</a></li>
            <li><a href="tasks.html">Tasks</a></li>
            <li><a href="analytics.html">Analytics</a></li>
            <li><a href="integrations.html">Integrations</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Support</h4>
          <ul class="footer-links" style="list-style:none;padding:0;">
            <li><a href="help.html">Help Center</a></li>
            <li><a href="faq.html">FAQ</a></li>
            <li><a href="contact.html">Contact</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Legal</h4>
          <ul class="footer-links" style="list-style:none;padding:0;">
            <li><a href="privacy.html">Privacy</a></li>
            <li><a href="terms.html">Terms</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:1rem;padding-top:1.5rem;border-top:1px solid rgba(255,255,255,0.1);">
        <p style="margin:0;font-size:0.8125rem;">&copy; 2026 TaskFlow. All rights reserved.</p>
        <p style="margin:0;font-size:0.8125rem;">v2.1.0</p>
      </div>`;
  }

  function initLayout() {
    const legacyHeader = document.querySelector('body > header');
    const legacyFooter = document.querySelector('body > footer.site-footer, body > footer:not(.app-footer)');
    const mainEl = document.querySelector('main');

    if (!mainEl) return;

    document.body.classList.add('app-layout');

    const sidebar = document.createElement('aside');
    sidebar.className = 'app-sidebar';
    sidebar.innerHTML = `
      <div class="app-sidebar-brand">
        <div class="logo-icon">TF</div>
        <span>TaskFlow</span>
      </div>
      <nav class="app-sidebar-nav" aria-label="Main navigation">
        ${buildNav()}
      </nav>
      <div class="app-sidebar-footer">
        <a href="tasks.html" class="btn btn-primary" style="width:100%;justify-content:center;">
          <i class="fas fa-plus"></i> New Task
        </a>
      </div>`;

    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    const wrap = document.createElement('div');
    wrap.className = 'app-main-wrap';

    const topbar = document.createElement('header');
    topbar.className = 'app-topbar';
    topbar.innerHTML = `
      <div style="display:flex;align-items:center;gap:1rem;">
        <button class="mobile-menu-btn" type="button" aria-label="Open menu">
          <i class="fas fa-bars"></i>
        </button>
        <h1 class="app-topbar-title">${pageTitles[currentPage] || 'TaskFlow'}</h1>
      </div>
      <div class="app-topbar-actions">
        <a href="notifications.html" class="btn btn-ghost btn-icon" title="Notifications">
          <i class="fas fa-bell"></i>
        </a>
        <a href="profile.html" class="btn btn-outline btn-sm">
          <i class="fas fa-user"></i> Profile
        </a>
      </div>`;

    const content = document.createElement('div');
    content.className = 'app-content';
    mainEl.parentNode.insertBefore(wrap, mainEl);
    content.appendChild(mainEl);
    wrap.appendChild(topbar);
    wrap.appendChild(content);

    const appFooter = document.createElement('footer');
    appFooter.className = 'app-footer';
    appFooter.innerHTML = buildFooter();
    wrap.appendChild(appFooter);

    document.body.insertBefore(overlay, document.body.firstChild);
    document.body.insertBefore(sidebar, document.body.firstChild);

    if (legacyHeader) legacyHeader.style.display = 'none';
    if (legacyFooter) legacyFooter.style.display = 'none';

    const menuBtn = topbar.querySelector('.mobile-menu-btn');
    menuBtn?.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLayout);
  } else {
    initLayout();
  }
})();
