/**
 * MAW Dashboard Frontend Application
 */

const API_BASE = '/api';
let ws = null;

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
    badge.textContent = 'Connected';
    badge.className = 'status-badge connected';
  } else {
    badge.textContent = 'Disconnected';
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
      usageContainer.innerHTML = '<p class="placeholder">No AI executions yet</p>';
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
        title: `Session: ${s.name}`,
        time: s.updatedAt,
        type: 'session',
      });
    });

    workflowsData.workflows.forEach(w => {
      activities.push({
        icon: '🔄',
        title: `Workflow: ${w.task.substring(0, 50)}...`,
        time: w.startedAt,
        type: 'workflow',
      });
    });

    // Sort by time
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    const container = document.getElementById('recent-activity');
    if (activities.length === 0) {
      container.innerHTML = '<p class="placeholder">No recent activity</p>';
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
      '<p class="placeholder">Failed to load activity</p>';
  }
}

async function loadSessions() {
  try {
    const status = document.getElementById('session-status-filter')?.value || '';
    const data = await apiGet(`/sessions?status=${status}`);

    const container = document.getElementById('sessions-list');
    if (data.sessions.length === 0) {
      container.innerHTML = '<div class="empty-state">No sessions found</div>';
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
      '<p class="placeholder">Failed to load sessions</p>';
  }
}

async function loadWorkflows() {
  try {
    const data = await apiGet('/workflows');

    const container = document.getElementById('workflows-list');
    if (data.workflows.length === 0) {
      container.innerHTML = '<div class="empty-state">No workflow runs found</div>';
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
      '<p class="placeholder">Failed to load workflows</p>';
  }
}

async function loadAILogs() {
  try {
    const provider = document.getElementById('ai-provider-filter')?.value || '';
    const data = await apiGet(`/ai-logs?aiProvider=${provider}`);

    const container = document.getElementById('ai-logs-list');
    if (data.logs.length === 0) {
      container.innerHTML = '<div class="empty-state">No AI execution logs found</div>';
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
      '<p class="placeholder">Failed to load AI logs</p>';
  }
}

// ============= Actions =============

function createSession() {
  openModal('New Session', `
    <form id="create-session-form">
      <div class="form-group">
        <label>Session Name</label>
        <input type="text" name="name" required placeholder="Enter session name">
      </div>
      <div class="form-group">
        <label>Workflow Level</label>
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
      alert('Failed to create session: ' + error.message);
    }
  });
}

function viewSession(id) {
  // Load and display session details
  openModal('Session Details', '<p class="loading">Loading...</p>', null);

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
        .join('') || '<p class="placeholder">No AI sessions linked</p>';

      const workflowsHtml = workflows?.length ? workflows.slice(0, 5).map(w => `
        <div class="mini-item">
          <span class="data-item-status ${w.status}">${w.status}</span>
          <span class="mini-title">${escapeHtml(w.task.substring(0, 40))}${w.task.length > 40 ? '...' : ''}</span>
        </div>
      `).join('') : '<p class="placeholder">No workflows</p>';

      document.getElementById('modal-body').innerHTML = `
        <div class="detail-section">
          <h4>Session Info</h4>
          <div class="detail-item">
            <span class="detail-label">ID:</span>
            <code>${session.id}</code>
          </div>
          <div class="detail-item">
            <span class="detail-label">Name:</span>
            <span>${escapeHtml(session.name)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Status:</span>
            <span class="data-item-status ${session.status}">${session.status}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Level:</span>
            <span>${session.workflowLevel || 'plan'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Created:</span>
            <span>${formatTime(session.createdAt)}</span>
          </div>
        </div>

        <div class="detail-section">
          <h4>Linked AI Sessions</h4>
          ${aiSessionsHtml}
        </div>

        <div class="detail-section">
          <h4>Recent Workflows</h4>
          ${workflowsHtml}
        </div>

        <div class="detail-actions">
          <button class="btn btn-danger" onclick="deleteSession('${session.id}')">Delete Session</button>
        </div>
      `;

      // Hide confirm button for view-only modal
      document.getElementById('modal-confirm').style.display = 'none';
    })
    .catch(error => {
      document.getElementById('modal-body').innerHTML = `
        <p class="error">Failed to load session: ${error.message}</p>
      `;
    });
}

function viewWorkflow(id) {
  openModal('Workflow Details', '<p class="loading">Loading...</p>', null);

  apiGet(`/workflows/${id}`)
    .then(workflow => {
      document.getElementById('modal-body').innerHTML = `
        <div class="detail-section">
          <h4>Workflow Info</h4>
          <div class="detail-item">
            <span class="detail-label">ID:</span>
            <code>${workflow.id}</code>
          </div>
          <div class="detail-item">
            <span class="detail-label">Level:</span>
            <span class="level-badge">${workflow.level}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Status:</span>
            <span class="data-item-status ${workflow.status}">${workflow.status}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Started:</span>
            <span>${formatTime(workflow.startedAt)}</span>
          </div>
          ${workflow.completedAt ? `
          <div class="detail-item">
            <span class="detail-label">Completed:</span>
            <span>${formatTime(workflow.completedAt)}</span>
          </div>
          ` : ''}
        </div>

        <div class="detail-section">
          <h4>Task</h4>
          <pre class="code-block">${escapeHtml(workflow.task)}</pre>
        </div>

        ${workflow.result ? `
        <div class="detail-section">
          <h4>Result</h4>
          <pre class="code-block">${escapeHtml(workflow.result)}</pre>
        </div>
        ` : ''}

        ${workflow.error ? `
        <div class="detail-section">
          <h4>Error</h4>
          <pre class="code-block error">${escapeHtml(workflow.error)}</pre>
        </div>
        ` : ''}
      `;

      document.getElementById('modal-confirm').style.display = 'none';
    })
    .catch(error => {
      document.getElementById('modal-body').innerHTML = `
        <p class="error">Failed to load workflow: ${error.message}</p>
      `;
    });
}

function viewAILog(id) {
  openModal('AI Log Details', '<p class="loading">Loading...</p>', null);

  apiGet(`/ai-logs/${id}`)
    .then(log => {
      document.getElementById('modal-body').innerHTML = `
        <div class="detail-section">
          <h4>Execution Info</h4>
          <div class="detail-item">
            <span class="detail-label">Provider:</span>
            <span class="ai-provider-badge">${log.aiProvider}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Status:</span>
            <span class="data-item-status ${log.status}">${log.status}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Started:</span>
            <span>${formatTime(log.startedAt)}</span>
          </div>
          ${log.tokensUsed ? `
          <div class="detail-item">
            <span class="detail-label">Tokens:</span>
            <span>${log.tokensUsed}</span>
          </div>
          ` : ''}
        </div>

        <div class="detail-section">
          <h4>Prompt</h4>
          <pre class="code-block">${escapeHtml(log.prompt)}</pre>
        </div>

        ${log.response ? `
        <div class="detail-section">
          <h4>Response</h4>
          <pre class="code-block">${escapeHtml(log.response.substring(0, 2000))}${log.response.length > 2000 ? '\n...(truncated)' : ''}</pre>
        </div>
        ` : ''}

        ${log.error ? `
        <div class="detail-section">
          <h4>Error</h4>
          <pre class="code-block error">${escapeHtml(log.error)}</pre>
        </div>
        ` : ''}
      `;

      document.getElementById('modal-confirm').style.display = 'none';
    })
    .catch(error => {
      document.getElementById('modal-body').innerHTML = `
        <p class="error">Failed to load AI log: ${error.message}</p>
      `;
    });
}

async function deleteSession(id) {
  if (!confirm('Are you sure you want to delete this session?')) return;

  try {
    await apiDelete(`/sessions/${id}`);
    closeModal();
    loadSessions();
    loadStats();
  } catch (error) {
    alert('Failed to delete session: ' + error.message);
  }
}

async function loadSkills() {
  try {
    const data = await apiGet('/skills');
    const container = document.getElementById('skills-list');

    if (data.skills.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No skills installed</p>
          <p class="hint">Install skills using: <code>maw skill install &lt;source&gt;</code></p>
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
            <span class="data-item-status ${skill.enabled ? 'active' : 'paused'}">${skill.enabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load skills:', error);
    document.getElementById('skills-list').innerHTML =
      '<p class="placeholder">Failed to load skills</p>';
  }
}

async function performSearch() {
  const query = document.getElementById('search-query').value.trim();
  if (!query) return;

  const container = document.getElementById('search-results');
  container.innerHTML = '<p class="loading">Searching...</p>';

  // Note: This would need CodexLens integration
  // For now, show a placeholder
  setTimeout(() => {
    container.innerHTML = `
      <div class="empty-state">
        <p>CodexLens search integration coming soon.</p>
        <p>Run <code>codex-lens index .</code> to index your codebase first.</p>
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

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

  return date.toLocaleDateString();
}

// ============= Initialization =============

document.addEventListener('DOMContentLoaded', () => {
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
