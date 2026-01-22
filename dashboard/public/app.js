/**
 * MAW Dashboard Frontend Application
 */

const API_BASE = '/api';
let ws = null;
let currentLang = localStorage.getItem('maw-lang') || 'en';

// ============= Internationalization (i18n) =============

const translations = {
  en: {
    // Header
    subtitle: 'Multi-AI Workflow Dashboard',
    connected: 'Connected',
    disconnected: 'Disconnected',

    // Navigation
    navOverview: 'Overview',
    navSessions: 'Sessions',
    navWorkflows: 'Workflows',
    navAILogs: 'AI Logs',
    navSkills: 'Skills',
    navCodeSearch: 'Code Search',

    // Overview
    titleOverview: 'Overview',
    statTotalSessions: 'Total Sessions',
    statActiveSessions: 'Active Sessions',
    statWorkflowRuns: 'Workflow Runs',
    statAIExecutions: 'AI Executions',
    aiProviderUsage: 'AI Provider Usage',
    recentActivity: 'Recent Activity',
    noAIExecutions: 'No AI executions yet',
    noRecentActivity: 'No recent activity',
    loading: 'Loading...',

    // Sessions
    titleSessions: 'Sessions',
    newSession: '+ New Session',
    allStatus: 'All Status',
    active: 'Active',
    completed: 'Completed',
    paused: 'Paused',
    error: 'Error',
    noSessions: 'No sessions found',
    sessionName: 'Session Name',
    enterSessionName: 'Enter session name',
    workflowLevel: 'Workflow Level',

    // Workflows
    titleWorkflows: 'Workflow Runs',
    noWorkflows: 'No workflow runs found',

    // AI Logs
    titleAILogs: 'AI Execution Logs',
    allProviders: 'All Providers',
    noAILogs: 'No AI execution logs found',

    // Skills
    titleSkills: 'Installed Skills',
    skillsDescription: 'Skills extend MAW with additional AI capabilities.',
    noSkills: 'No skills installed',
    installSkillsHint: 'Install skills using:',
    enabled: 'Enabled',
    disabled: 'Disabled',

    // Code Search
    titleCodeSearch: 'Code Search',
    searchPlaceholder: 'Search code...',
    searchButton: 'Search',
    searchHint: 'Enter a search query to find code',
    searchComingSoon: 'CodexLens search integration coming soon.',
    searchIndexHint: 'Run <code>codex-lens index .</code> to index your codebase first.',

    // Modal
    cancel: 'Cancel',
    confirm: 'Confirm',
    deleteConfirm: 'Are you sure you want to delete this session?',

    // Details
    sessionDetails: 'Session Details',
    sessionInfo: 'Session Info',
    linkedAISessions: 'Linked AI Sessions',
    recentWorkflows: 'Recent Workflows',
    noAISessions: 'No AI sessions linked',
    noWorkflowsLinked: 'No workflows',
    deleteSession: 'Delete Session',

    workflowDetails: 'Workflow Details',
    workflowInfo: 'Workflow Info',
    task: 'Task',
    result: 'Result',

    aiLogDetails: 'AI Log Details',
    executionInfo: 'Execution Info',
    provider: 'Provider',
    status: 'Status',
    started: 'Started',
    tokens: 'Tokens',
    prompt: 'Prompt',
    response: 'Response',
    truncated: '...(truncated)',

    // Time
    justNow: 'Just now',
    minutesAgo: 'm ago',
    hoursAgo: 'h ago',
    daysAgo: 'd ago',

    // Errors
    failedToLoad: 'Failed to load',
    failedToCreate: 'Failed to create session',
    failedToDelete: 'Failed to delete session',
  },

  zh: {
    // Header
    subtitle: '多AI工作流仪表板',
    connected: '已连接',
    disconnected: '未连接',

    // Navigation
    navOverview: '概览',
    navSessions: '会话',
    navWorkflows: '工作流',
    navAILogs: 'AI日志',
    navSkills: '技能',
    navCodeSearch: '代码搜索',

    // Overview
    titleOverview: '概览',
    statTotalSessions: '总会话数',
    statActiveSessions: '活跃会话',
    statWorkflowRuns: '工作流运行',
    statAIExecutions: 'AI执行次数',
    aiProviderUsage: 'AI提供商使用情况',
    recentActivity: '最近活动',
    noAIExecutions: '暂无AI执行记录',
    noRecentActivity: '暂无最近活动',
    loading: '加载中...',

    // Sessions
    titleSessions: '会话',
    newSession: '+ 新建会话',
    allStatus: '全部状态',
    active: '活跃',
    completed: '已完成',
    paused: '已暂停',
    error: '错误',
    noSessions: '暂无会话',
    sessionName: '会话名称',
    enterSessionName: '请输入会话名称',
    workflowLevel: '工作流级别',

    // Workflows
    titleWorkflows: '工作流运行',
    noWorkflows: '暂无工作流运行记录',

    // AI Logs
    titleAILogs: 'AI执行日志',
    allProviders: '全部提供商',
    noAILogs: '暂无AI执行日志',

    // Skills
    titleSkills: '已安装技能',
    skillsDescription: '技能为MAW扩展额外的AI能力。',
    noSkills: '暂无已安装技能',
    installSkillsHint: '安装技能命令：',
    enabled: '已启用',
    disabled: '已禁用',

    // Code Search
    titleCodeSearch: '代码搜索',
    searchPlaceholder: '搜索代码...',
    searchButton: '搜索',
    searchHint: '输入搜索关键词查找代码',
    searchComingSoon: 'CodexLens搜索集成即将推出。',
    searchIndexHint: '请先运行 <code>codex-lens index .</code> 索引代码库。',

    // Modal
    cancel: '取消',
    confirm: '确认',
    deleteConfirm: '确定要删除这个会话吗？',

    // Details
    sessionDetails: '会话详情',
    sessionInfo: '会话信息',
    linkedAISessions: '关联的AI会话',
    recentWorkflows: '最近工作流',
    noAISessions: '暂无关联的AI会话',
    noWorkflowsLinked: '暂无工作流',
    deleteSession: '删除会话',

    workflowDetails: '工作流详情',
    workflowInfo: '工作流信息',
    task: '任务',
    result: '结果',

    aiLogDetails: 'AI日志详情',
    executionInfo: '执行信息',
    provider: '提供商',
    status: '状态',
    started: '开始时间',
    tokens: 'Token数',
    prompt: '提示词',
    response: '响应',
    truncated: '...(已截断)',

    // Time
    justNow: '刚刚',
    minutesAgo: '分钟前',
    hoursAgo: '小时前',
    daysAgo: '天前',

    // Errors
    failedToLoad: '加载失败',
    failedToCreate: '创建会话失败',
    failedToDelete: '删除会话失败',
  }
};

function t(key) {
  return translations[currentLang][key] || translations['en'][key] || key;
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('maw-lang', lang);
  updateUILanguage();
}

function updateUILanguage() {
  // Update all translatable elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (el.tagName === 'INPUT') {
      el.placeholder = t(key);
    } else {
      el.textContent = t(key);
    }
  });

  // Update language selector
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });

  // Reload current view to update dynamic content
  const activeNav = document.querySelector('.nav-item.active');
  if (activeNav) {
    switchView(activeNav.dataset.view);
  }
}

// ============= WebSocket =============

function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${window.location.host}`);

  ws.onopen = () => {
    console.log('WebSocket connected');
    updateConnectionStatus(true);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    updateConnectionStatus(false);
    // Reconnect after 3 seconds
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    } catch (e) {
      console.error('Invalid WebSocket message:', e);
    }
  };
}

function updateConnectionStatus(connected) {
  const badge = document.getElementById('connection-status');
  if (connected) {
    badge.textContent = t('connected');
    badge.className = 'status-badge connected';
  } else {
    badge.textContent = t('disconnected');
    badge.className = 'status-badge disconnected';
  }
}

function handleWebSocketMessage(message) {
  console.log('WebSocket message:', message);

  switch (message.event) {
    case 'session:created':
    case 'session:updated':
    case 'session:deleted':
      loadSessions();
      loadStats();
      break;

    case 'workflow:created':
    case 'workflow:updated':
      loadWorkflows();
      loadStats();
      break;

    case 'ai-log:created':
    case 'ai-log:updated':
      loadAILogs();
      loadStats();
      break;
  }
}

// ============= API Functions =============

async function apiGet(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

async function apiPost(endpoint, data) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

async function apiPatch(endpoint, data) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

async function apiDelete(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
}

// ============= Data Loading =============

async function loadStats() {
  try {
    const stats = await apiGet('/stats');

    document.getElementById('stat-sessions').textContent = stats.totalSessions;
    document.getElementById('stat-active').textContent = stats.activeSessions;
    document.getElementById('stat-workflows').textContent = stats.totalWorkflows;
    document.getElementById('stat-ai').textContent = stats.totalAIExecutions;

    // AI Provider Usage
    const usageContainer = document.getElementById('ai-usage');
    if (Object.keys(stats.aiProviderUsage).length === 0) {
      usageContainer.innerHTML = `<p class="placeholder">${t('noAIExecutions')}</p>`;
    } else {
      usageContainer.innerHTML = Object.entries(stats.aiProviderUsage)
        .map(([provider, count]) => `
          <div class="ai-provider-card">
            <div class="provider">${provider}</div>
            <div class="count">${count}</div>
          </div>
        `)
        .join('');
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

async function loadRecentActivity() {
  try {
    const [sessionsData, workflowsData] = await Promise.all([
      apiGet('/sessions?limit=5'),
      apiGet('/workflows?limit=5'),
    ]);

    const activities = [];

    sessionsData.sessions.forEach(s => {
      activities.push({
        icon: '📁',
        title: `${t('navSessions')}: ${s.name}`,
        time: s.updatedAt,
        type: 'session',
      });
    });

    workflowsData.workflows.forEach(w => {
      activities.push({
        icon: '🔄',
        title: `${t('navWorkflows')}: ${w.task.substring(0, 50)}...`,
        time: w.startedAt,
        type: 'workflow',
      });
    });

    // Sort by time
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    const container = document.getElementById('recent-activity');
    if (activities.length === 0) {
      container.innerHTML = `<p class="placeholder">${t('noRecentActivity')}</p>`;
    } else {
      container.innerHTML = activities.slice(0, 10).map(a => `
        <div class="activity-item">
          <span class="activity-icon">${a.icon}</span>
          <div class="activity-content">
            <div class="activity-title">${escapeHtml(a.title)}</div>
            <div class="activity-time">${formatTime(a.time)}</div>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load activity:', error);
    document.getElementById('recent-activity').innerHTML =
      `<p class="placeholder">${t('failedToLoad')}</p>`;
  }
}

async function loadSessions() {
  try {
    const status = document.getElementById('session-status-filter')?.value || '';
    const data = await apiGet(`/sessions?status=${status}`);

    const container = document.getElementById('sessions-list');
    if (data.sessions.length === 0) {
      container.innerHTML = `<div class="empty-state">${t('noSessions')}</div>`;
    } else {
      container.innerHTML = data.sessions.map(s => `
        <div class="data-item" onclick="viewSession('${s.id}')">
          <div class="data-item-main">
            <div class="data-item-title">${escapeHtml(s.name)}</div>
            <div class="data-item-subtitle">Level: ${s.workflowLevel || 'plan'}</div>
          </div>
          <div class="data-item-meta">
            <span class="data-item-status ${s.status}">${s.status}</span>
            <div class="data-item-time">${formatTime(s.updatedAt)}</div>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load sessions:', error);
    document.getElementById('sessions-list').innerHTML =
      `<p class="placeholder">${t('failedToLoad')}</p>`;
  }
}

async function loadWorkflows() {
  try {
    const data = await apiGet('/workflows');

    const container = document.getElementById('workflows-list');
    if (data.workflows.length === 0) {
      container.innerHTML = `<div class="empty-state">${t('noWorkflows')}</div>`;
    } else {
      container.innerHTML = data.workflows.map(w => `
        <div class="data-item" onclick="viewWorkflow('${w.id}')">
          <div class="data-item-main">
            <div class="data-item-title">${escapeHtml(w.task.substring(0, 80))}${w.task.length > 80 ? '...' : ''}</div>
            <div class="data-item-subtitle">Level: ${w.level}</div>
          </div>
          <div class="data-item-meta">
            <span class="data-item-status ${w.status}">${w.status}</span>
            <div class="data-item-time">${formatTime(w.startedAt)}</div>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load workflows:', error);
    document.getElementById('workflows-list').innerHTML =
      `<p class="placeholder">${t('failedToLoad')}</p>`;
  }
}

async function loadAILogs() {
  try {
    const provider = document.getElementById('ai-provider-filter')?.value || '';
    const data = await apiGet(`/ai-logs?aiProvider=${provider}`);

    const container = document.getElementById('ai-logs-list');
    if (data.logs.length === 0) {
      container.innerHTML = `<div class="empty-state">${t('noAILogs')}</div>`;
    } else {
      container.innerHTML = data.logs.map(log => `
        <div class="data-item" onclick="viewAILog('${log.id}')">
          <div class="data-item-main">
            <div class="data-item-title">
              <span class="ai-provider-badge">${log.aiProvider}</span>
              ${escapeHtml(log.prompt.substring(0, 60))}${log.prompt.length > 60 ? '...' : ''}
            </div>
            <div class="data-item-subtitle">
              ${log.tokensUsed ? `${log.tokensUsed} tokens` : 'Tokens: -'}
            </div>
          </div>
          <div class="data-item-meta">
            <span class="data-item-status ${log.status}">${log.status}</span>
            <div class="data-item-time">${formatTime(log.startedAt)}</div>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load AI logs:', error);
    document.getElementById('ai-logs-list').innerHTML =
      `<p class="placeholder">${t('failedToLoad')}</p>`;
  }
}

// ============= Actions =============

function createSession() {
  openModal(t('newSession'), `
    <form id="create-session-form">
      <div class="form-group">
        <label>${t('sessionName')}</label>
        <input type="text" name="name" required placeholder="${t('enterSessionName')}">
      </div>
      <div class="form-group">
        <label>${t('workflowLevel')}</label>
        <select name="workflowLevel">
          <option value="lite">Lite</option>
          <option value="lite-plan">Lite Plan</option>
          <option value="plan" selected>Plan</option>
          <option value="tdd-plan">TDD Plan</option>
          <option value="brainstorm">Brainstorm</option>
          <option value="delegate">Delegate</option>
          <option value="collaborate">Collaborate</option>
        </select>
      </div>
    </form>
  `, async () => {
    const form = document.getElementById('create-session-form');
    const formData = new FormData(form);

    try {
      await apiPost('/sessions', {
        name: formData.get('name'),
        workflowLevel: formData.get('workflowLevel'),
      });
      closeModal();
      loadSessions();
      loadStats();
    } catch (error) {
      alert(t('failedToCreate') + ': ' + error.message);
    }
  });
}

function viewSession(id) {
  // Load and display session details
  openModal(t('sessionDetails'), `<p class="loading">${t('loading')}</p>`, null);

  apiGet(`/sessions/${id}/details`)
    .then(data => {
      const { session, aiSessions, workflows, aiLogs } = data;

      const aiSessionsHtml = Object.entries(aiSessions || {})
        .filter(([_, v]) => v)
        .map(([ai, sessionId]) => `
          <div class="detail-item">
            <span class="detail-label">${ai}:</span>
            <code class="session-id">${sessionId}</code>
          </div>
        `)
        .join('') || `<p class="placeholder">${t('noAISessions')}</p>`;

      const workflowsHtml = workflows?.length ? workflows.slice(0, 5).map(w => `
        <div class="mini-item">
          <span class="data-item-status ${w.status}">${w.status}</span>
          <span class="mini-title">${escapeHtml(w.task.substring(0, 40))}${w.task.length > 40 ? '...' : ''}</span>
        </div>
      `).join('') : `<p class="placeholder">${t('noWorkflowsLinked')}</p>`;

      document.getElementById('modal-body').innerHTML = `
        <div class="detail-section">
          <h4>${t('sessionInfo')}</h4>
          <div class="detail-item">
            <span class="detail-label">ID:</span>
            <code>${session.id}</code>
          </div>
          <div class="detail-item">
            <span class="detail-label">${t('sessionName')}:</span>
            <span>${escapeHtml(session.name)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">${t('status')}:</span>
            <span class="data-item-status ${session.status}">${session.status}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Level:</span>
            <span>${session.workflowLevel || 'plan'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">${t('started')}:</span>
            <span>${formatTime(session.createdAt)}</span>
          </div>
        </div>

        <div class="detail-section">
          <h4>${t('linkedAISessions')}</h4>
          ${aiSessionsHtml}
        </div>

        <div class="detail-section">
          <h4>${t('recentWorkflows')}</h4>
          ${workflowsHtml}
        </div>

        <div class="detail-actions">
          <button class="btn btn-danger" onclick="deleteSession('${session.id}')">${t('deleteSession')}</button>
        </div>
      `;

      // Hide confirm button for view-only modal
      document.getElementById('modal-confirm').style.display = 'none';
    })
    .catch(error => {
      document.getElementById('modal-body').innerHTML = `
        <p class="error">${t('failedToLoad')}: ${error.message}</p>
      `;
    });
}

function viewWorkflow(id) {
  openModal(t('workflowDetails'), `<p class="loading">${t('loading')}</p>`, null);

  apiGet(`/workflows/${id}`)
    .then(workflow => {
      document.getElementById('modal-body').innerHTML = `
        <div class="detail-section">
          <h4>${t('workflowInfo')}</h4>
          <div class="detail-item">
            <span class="detail-label">ID:</span>
            <code>${workflow.id}</code>
          </div>
          <div class="detail-item">
            <span class="detail-label">Level:</span>
            <span class="level-badge">${workflow.level}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">${t('status')}:</span>
            <span class="data-item-status ${workflow.status}">${workflow.status}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">${t('started')}:</span>
            <span>${formatTime(workflow.startedAt)}</span>
          </div>
          ${workflow.completedAt ? `
          <div class="detail-item">
            <span class="detail-label">${t('completed')}:</span>
            <span>${formatTime(workflow.completedAt)}</span>
          </div>
          ` : ''}
        </div>

        <div class="detail-section">
          <h4>${t('task')}</h4>
          <pre class="code-block">${escapeHtml(workflow.task)}</pre>
        </div>

        ${workflow.result ? `
        <div class="detail-section">
          <h4>${t('result')}</h4>
          <pre class="code-block">${escapeHtml(workflow.result)}</pre>
        </div>
        ` : ''}

        ${workflow.error ? `
        <div class="detail-section">
          <h4>${t('error')}</h4>
          <pre class="code-block error">${escapeHtml(workflow.error)}</pre>
        </div>
        ` : ''}
      `;

      document.getElementById('modal-confirm').style.display = 'none';
    })
    .catch(error => {
      document.getElementById('modal-body').innerHTML = `
        <p class="error">${t('failedToLoad')}: ${error.message}</p>
      `;
    });
}

function viewAILog(id) {
  openModal(t('aiLogDetails'), `<p class="loading">${t('loading')}</p>`, null);

  apiGet(`/ai-logs/${id}`)
    .then(log => {
      document.getElementById('modal-body').innerHTML = `
        <div class="detail-section">
          <h4>${t('executionInfo')}</h4>
          <div class="detail-item">
            <span class="detail-label">${t('provider')}:</span>
            <span class="ai-provider-badge">${log.aiProvider}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">${t('status')}:</span>
            <span class="data-item-status ${log.status}">${log.status}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">${t('started')}:</span>
            <span>${formatTime(log.startedAt)}</span>
          </div>
          ${log.tokensUsed ? `
          <div class="detail-item">
            <span class="detail-label">${t('tokens')}:</span>
            <span>${log.tokensUsed}</span>
          </div>
          ` : ''}
        </div>

        <div class="detail-section">
          <h4>${t('prompt')}</h4>
          <pre class="code-block">${escapeHtml(log.prompt)}</pre>
        </div>

        ${log.response ? `
        <div class="detail-section">
          <h4>${t('response')}</h4>
          <pre class="code-block">${escapeHtml(log.response.substring(0, 2000))}${log.response.length > 2000 ? t('truncated') : ''}</pre>
        </div>
        ` : ''}

        ${log.error ? `
        <div class="detail-section">
          <h4>${t('error')}</h4>
          <pre class="code-block error">${escapeHtml(log.error)}</pre>
        </div>
        ` : ''}
      `;

      document.getElementById('modal-confirm').style.display = 'none';
    })
    .catch(error => {
      document.getElementById('modal-body').innerHTML = `
        <p class="error">${t('failedToLoad')}: ${error.message}</p>
      `;
    });
}

async function deleteSession(id) {
  if (!confirm(t('deleteConfirm'))) return;

  try {
    await apiDelete(`/sessions/${id}`);
    closeModal();
    loadSessions();
    loadStats();
  } catch (error) {
    alert(t('failedToDelete') + ': ' + error.message);
  }
}

async function loadSkills() {
  try {
    const data = await apiGet('/skills');
    const container = document.getElementById('skills-list');

    if (data.skills.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>${t('noSkills')}</p>
          <p class="hint">${t('installSkillsHint')} <code>maw skill install &lt;source&gt;</code></p>
        </div>
      `;
    } else {
      container.innerHTML = data.skills.map(skill => `
        <div class="data-item skill-item">
          <div class="data-item-main">
            <div class="data-item-title">
              <span class="skill-type-badge ${skill.type}">${skill.type}</span>
              ${escapeHtml(skill.name)}
            </div>
            <div class="data-item-subtitle">${escapeHtml(skill.description || 'No description')}</div>
            ${skill.bridge ? `
            <div class="skill-bridge">
              Target AI: <span class="ai-provider-badge">${skill.bridge.targetAI}</span>
            </div>
            ` : ''}
          </div>
          <div class="data-item-meta">
            <div class="skill-version">v${skill.version}</div>
            <span class="data-item-status ${skill.enabled ? 'active' : 'paused'}">${skill.enabled ? t('enabled') : t('disabled')}</span>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load skills:', error);
    document.getElementById('skills-list').innerHTML =
      `<p class="placeholder">${t('failedToLoad')}</p>`;
  }
}

async function performSearch() {
  const query = document.getElementById('search-query').value.trim();
  if (!query) return;

  const container = document.getElementById('search-results');
  container.innerHTML = `<p class="loading">${t('loading')}</p>`;

  // Note: This would need CodexLens integration
  // For now, show a placeholder
  setTimeout(() => {
    container.innerHTML = `
      <div class="empty-state">
        <p>${t('searchComingSoon')}</p>
        <p>${t('searchIndexHint')}</p>
      </div>
    `;
  }, 500);
}

// ============= Navigation =============

function switchView(viewId) {
  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewId);
  });

  // Update views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.toggle('active', view.id === `view-${viewId}`);
  });

  // Load view data
  switch (viewId) {
    case 'overview':
      loadStats();
      loadRecentActivity();
      break;
    case 'sessions':
      loadSessions();
      break;
    case 'workflows':
      loadWorkflows();
      break;
    case 'ai-logs':
      loadAILogs();
      break;
    case 'skills':
      loadSkills();
      break;
  }
}

// ============= Modal =============

function openModal(title, content, onConfirm) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = content;
  document.getElementById('modal').classList.add('active');

  const confirmBtn = document.getElementById('modal-confirm');
  confirmBtn.onclick = onConfirm;
}

function closeModal() {
  document.getElementById('modal').classList.remove('active');
}

// ============= Utilities =============

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return t('justNow');
  if (diff < 3600000) return `${Math.floor(diff / 60000)}${t('minutesAgo')}`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}${t('hoursAgo')}`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}${t('daysAgo')}`;

  return date.toLocaleDateString();
}

// ============= Initialization =============

document.addEventListener('DOMContentLoaded', () => {
  // Apply saved language
  updateUILanguage();

  // Setup navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(item.dataset.view);
    });
  });

  // Close modal on background click
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') {
      closeModal();
    }
  });

  // Initial load
  loadStats();
  loadRecentActivity();

  // Connect WebSocket
  connectWebSocket();
});
