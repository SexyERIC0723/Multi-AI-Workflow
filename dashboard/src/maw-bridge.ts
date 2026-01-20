/**
 * MAW Bridge - Integrates MAW CLI data with Dashboard
 *
 * Reads session data from MAW's file-based storage and syncs with Dashboard SQLite.
 */

import { existsSync, readFileSync, readdirSync, watchFile, unwatchFile } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DashboardStorage } from './storage';

interface MAWSession {
  mawSessionId: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  workflowLevel?: string;
  aiSessions: {
    claude?: string;
    codex?: string;
    gemini?: string;
  };
  sharedContext: {
    projectRoot: string;
    relevantFiles: string[];
    taskHistory: Array<{
      id: string;
      description: string;
      assignedAI: string;
      status: string;
      timestamp: string;
      result?: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

interface MAWSessionsFile {
  sessions: MAWSession[];
  lastUpdated: string;
}

interface ImplPlan {
  sessionId: string;
  plan: string;
  timestamp: string;
}

interface SkillManifest {
  name: string;
  version: string;
  description: string;
  type: 'built-in' | 'ai-bridge' | 'custom';
  path: string;
  bridge?: {
    targetAI: string;
    scriptPath: string;
    supportsSession: boolean;
  };
  enabled: boolean;
}

// Map MAW status to Dashboard status
function mapStatus(status: string): 'active' | 'completed' | 'paused' | 'error' {
  switch (status) {
    case 'active': return 'active';
    case 'completed': return 'completed';
    case 'paused': return 'paused';
    case 'archived': return 'completed'; // Map archived to completed
    case 'error': return 'error';
    default: return 'active';
  }
}

export class MAWBridge {
  private dataDir: string;
  private storage: DashboardStorage;
  private watchers: Map<string, ReturnType<typeof watchFile>> = new Map();

  constructor(dataDir: string, storage: DashboardStorage) {
    this.dataDir = dataDir;
    this.storage = storage;
  }

  /**
   * Initialize bridge and sync existing data
   */
  async initialize(): Promise<void> {
    console.log('[MAW Bridge] Initializing...');
    await this.syncSessions();
    await this.syncWorkflowPlans();
    this.startWatching();
  }

  /**
   * Sync MAW sessions to Dashboard
   */
  async syncSessions(): Promise<void> {
    const sessionsPath = join(this.dataDir, 'sessions.json');

    if (!existsSync(sessionsPath)) {
      console.log('[MAW Bridge] No sessions.json found');
      return;
    }

    try {
      const content = readFileSync(sessionsPath, 'utf-8');
      const data: MAWSessionsFile = JSON.parse(content);

      for (const session of data.sessions) {
        // Check if session exists in dashboard
        const existing = this.storage.getSession(session.mawSessionId);

        if (!existing) {
          // Create new session in dashboard
          this.storage.createSession({
            id: session.mawSessionId,
            name: session.name,
            status: mapStatus(session.status),
            workflowLevel: session.workflowLevel || 'plan',
            metadata: {
              aiSessions: session.aiSessions,
              projectRoot: session.sharedContext.projectRoot,
            },
          });
          console.log(`[MAW Bridge] Synced session: ${session.name}`);
        } else {
          // Update existing session
          this.storage.updateSession(session.mawSessionId, {
            status: mapStatus(session.status),
            metadata: {
              aiSessions: session.aiSessions,
              projectRoot: session.sharedContext.projectRoot,
            },
          });
        }

        // Sync task history as workflow runs
        for (const task of session.sharedContext.taskHistory) {
          const existingWorkflow = this.storage.getWorkflowByTaskId(task.id);

          if (!existingWorkflow) {
            this.storage.createWorkflowRun({
              id: task.id || uuidv4(),
              sessionId: session.mawSessionId,
              task: task.description,
              level: session.workflowLevel || 'plan',
              status: mapStatus(task.status) as 'pending' | 'running' | 'completed' | 'failed',
              result: task.result,
            });
          }
        }
      }
    } catch (error) {
      console.error('[MAW Bridge] Error syncing sessions:', error);
    }
  }

  /**
   * Sync workflow plans from .task directory
   */
  async syncWorkflowPlans(): Promise<void> {
    const taskDir = join(this.dataDir, '..', '.task');

    if (!existsSync(taskDir)) {
      console.log('[MAW Bridge] No .task directory found');
      return;
    }

    try {
      const files = readdirSync(taskDir).filter(f => f.startsWith('IMPL_PLAN-') && f.endsWith('.json'));

      for (const file of files) {
        const content = readFileSync(join(taskDir, file), 'utf-8');
        const plan: ImplPlan = JSON.parse(content);

        // Create AI log for the plan
        this.storage.createAILog({
          id: uuidv4(),
          sessionId: plan.sessionId,
          aiProvider: 'claude',
          prompt: 'Generate implementation plan',
          response: plan.plan,
          status: 'completed',
        });
      }
    } catch (error) {
      console.error('[MAW Bridge] Error syncing workflow plans:', error);
    }
  }

  /**
   * Get installed skills from skill directories
   */
  getInstalledSkills(): SkillManifest[] {
    const skills: SkillManifest[] = [];
    const skillPaths = [
      join(this.dataDir, 'skills'),
      join(process.env.HOME || '~', '.maw', 'skills'),
    ];

    for (const skillPath of skillPaths) {
      if (!existsSync(skillPath)) continue;

      try {
        const entries = readdirSync(skillPath, { withFileTypes: true });

        for (const entry of entries) {
          if (!entry.isDirectory() || entry.name.startsWith('_')) continue;

          const manifestPath = join(skillPath, entry.name, 'skill.json');
          const skillMdPath = join(skillPath, entry.name, 'SKILL.md');

          let manifest: Partial<SkillManifest> = {
            name: entry.name,
            path: join(skillPath, entry.name),
            enabled: true,
          };

          // Read skill.json if exists
          if (existsSync(manifestPath)) {
            try {
              const json = JSON.parse(readFileSync(manifestPath, 'utf-8'));
              manifest = { ...manifest, ...json };
            } catch {
              // Continue with defaults
            }
          }

          // Read description from SKILL.md if exists
          if (existsSync(skillMdPath)) {
            try {
              const content = readFileSync(skillMdPath, 'utf-8');
              const descMatch = content.match(/description:\s*(.+)/i);
              if (descMatch) {
                manifest.description = descMatch[1].trim();
              }
            } catch {
              // Continue
            }
          }

          // Detect AI bridge type
          if (entry.name.includes('codex')) {
            manifest.type = 'ai-bridge';
            manifest.bridge = { targetAI: 'codex', scriptPath: 'scripts/codex_bridge.py', supportsSession: true };
          } else if (entry.name.includes('gemini')) {
            manifest.type = 'ai-bridge';
            manifest.bridge = { targetAI: 'gemini', scriptPath: 'scripts/gemini_bridge.py', supportsSession: true };
          } else {
            manifest.type = 'custom';
          }

          manifest.version = manifest.version || '1.0.0';
          manifest.description = manifest.description || `Skill: ${entry.name}`;

          skills.push(manifest as SkillManifest);
        }
      } catch (error) {
        console.error(`[MAW Bridge] Error reading skills from ${skillPath}:`, error);
      }
    }

    return skills;
  }

  /**
   * Get session with full details including AI sessions
   */
  getSessionDetails(sessionId: string): {
    session: ReturnType<DashboardStorage['getSession']>;
    aiSessions: Record<string, string>;
    workflows: ReturnType<DashboardStorage['getWorkflowsBySession']>;
  } | null {
    const session = this.storage.getSession(sessionId);
    if (!session) return null;

    let aiSessions: Record<string, string> = {};
    try {
      const metadata = session.metadata || {};
      aiSessions = (metadata as Record<string, unknown>).aiSessions as Record<string, string> || {};
    } catch {
      // Empty metadata
    }

    const workflows = this.storage.getWorkflowsBySession(sessionId);

    return { session, aiSessions, workflows };
  }

  /**
   * Start watching for file changes
   */
  private startWatching(): void {
    const sessionsPath = join(this.dataDir, 'sessions.json');

    if (existsSync(sessionsPath)) {
      watchFile(sessionsPath, { interval: 2000 }, () => {
        console.log('[MAW Bridge] sessions.json changed, resyncing...');
        this.syncSessions();
      });
      this.watchers.set(sessionsPath, sessionsPath as any);
    }
  }

  /**
   * Stop watching files
   */
  stopWatching(): void {
    for (const path of this.watchers.keys()) {
      unwatchFile(path);
    }
    this.watchers.clear();
  }
}

export default MAWBridge;
