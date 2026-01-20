/**
 * Dashboard API Routes
 *
 * RESTful API endpoints for the MAW Dashboard.
 * Based on Claude-Code-Workflow's Dashboard implementation.
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DashboardStorage, SessionRecord, WorkflowRun, AIExecutionLog } from '../storage';
import type DashboardServer from '../server';
import type { MAWBridge } from '../maw-bridge';

export function createApiRoutes(
  storage: DashboardStorage,
  server: DashboardServer,
  mawBridge?: MAWBridge
): Router {
  const router = Router();

  // ============= Health & Info =============

  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  router.get('/info', (_req: Request, res: Response) => {
    res.json({
      name: 'MAW Dashboard',
      version: '0.1.0',
      uptime: process.uptime(),
    });
  });

  router.get('/stats', (_req: Request, res: Response) => {
    try {
      const stats = storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // ============= Sessions =============

  router.get('/sessions', (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const sessions = storage.listSessions(status, limit, offset);
      res.json({ sessions, total: sessions.length });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  router.get('/sessions/:id', (req: Request, res: Response) => {
    try {
      const session = storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  router.post('/sessions', (req: Request, res: Response) => {
    try {
      const { name, workflowLevel, metadata } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const session = storage.createSession({
        id: uuidv4(),
        name,
        status: 'active',
        workflowLevel: workflowLevel || 'plan',
        metadata,
      });

      server.broadcast('session:created', session);
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  router.patch('/sessions/:id', (req: Request, res: Response) => {
    try {
      const { name, status, workflowLevel, metadata } = req.body;

      const session = storage.updateSession(req.params.id, {
        name,
        status,
        workflowLevel,
        metadata,
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      server.broadcast('session:updated', session);
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  router.delete('/sessions/:id', (req: Request, res: Response) => {
    try {
      const deleted = storage.deleteSession(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Session not found' });
      }

      server.broadcast('session:deleted', { id: req.params.id });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // ============= Workflow Runs =============

  router.get('/workflows', (req: Request, res: Response) => {
    try {
      const sessionId = req.query.sessionId as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;

      const workflows = storage.listWorkflowRuns(sessionId, limit);
      res.json({ workflows, total: workflows.length });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  router.get('/workflows/:id', (req: Request, res: Response) => {
    try {
      const workflow = storage.getWorkflowRun(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow run not found' });
      }
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  router.post('/workflows', (req: Request, res: Response) => {
    try {
      const { sessionId, level, task } = req.body;

      if (!task) {
        return res.status(400).json({ error: 'Task is required' });
      }

      const workflow = storage.createWorkflowRun({
        id: uuidv4(),
        sessionId: sessionId || '',
        level: level || 'plan',
        task,
        status: 'pending',
      });

      server.broadcast('workflow:created', workflow);
      res.status(201).json(workflow);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  router.patch('/workflows/:id', (req: Request, res: Response) => {
    try {
      const { status, result, error, completedAt } = req.body;

      const workflow = storage.updateWorkflowRun(req.params.id, {
        status,
        result,
        error,
        completedAt,
      });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow run not found' });
      }

      server.broadcast('workflow:updated', workflow);
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // ============= AI Execution Logs =============

  router.get('/ai-logs', (req: Request, res: Response) => {
    try {
      const sessionId = req.query.sessionId as string | undefined;
      const aiProvider = req.query.aiProvider as string | undefined;
      const limit = parseInt(req.query.limit as string) || 100;

      const logs = storage.listAILogs(sessionId, aiProvider, limit);
      res.json({ logs, total: logs.length });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  router.get('/ai-logs/:id', (req: Request, res: Response) => {
    try {
      const log = storage.getAILog(req.params.id);
      if (!log) {
        return res.status(404).json({ error: 'AI log not found' });
      }
      res.json(log);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  router.post('/ai-logs', (req: Request, res: Response) => {
    try {
      const { sessionId, aiProvider, prompt, response, status, tokensUsed } = req.body;

      if (!aiProvider || !prompt) {
        return res.status(400).json({ error: 'aiProvider and prompt are required' });
      }

      const log = storage.createAILog({
        id: uuidv4(),
        sessionId: sessionId || '',
        aiProvider,
        prompt,
        response,
        status: status || 'pending',
        tokensUsed,
      });

      server.broadcast('ai-log:created', log);
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  router.patch('/ai-logs/:id', (req: Request, res: Response) => {
    try {
      const { response, status, completedAt, tokensUsed, error } = req.body;

      const log = storage.updateAILog(req.params.id, {
        response,
        status,
        completedAt,
        tokensUsed,
        error,
      });

      if (!log) {
        return res.status(404).json({ error: 'AI log not found' });
      }

      server.broadcast('ai-log:updated', log);
      res.json(log);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // ============= Preferences =============

  router.get('/preferences/:key', (req: Request, res: Response) => {
    try {
      const value = storage.getPreference(req.params.key);
      if (value === null) {
        return res.status(404).json({ error: 'Preference not found' });
      }
      res.json({ key: req.params.key, value });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  router.put('/preferences/:key', (req: Request, res: Response) => {
    try {
      const { value } = req.body;
      storage.setPreference(req.params.key, value);
      res.json({ key: req.params.key, value });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // ============= Skills (MAW Bridge) =============

  router.get('/skills', (_req: Request, res: Response) => {
    try {
      if (!mawBridge) {
        return res.json({ skills: [], total: 0 });
      }

      const skills = mawBridge.getInstalledSkills();
      res.json({ skills, total: skills.length });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // ============= Enhanced Session Details =============

  router.get('/sessions/:id/details', (req: Request, res: Response) => {
    try {
      if (!mawBridge) {
        // Fallback to basic session info
        const session = storage.getSession(req.params.id);
        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }
        return res.json({
          session,
          aiSessions: {},
          workflows: storage.getWorkflowsBySession(req.params.id),
          aiLogs: storage.getAILogsBySession(req.params.id),
        });
      }

      const details = mawBridge.getSessionDetails(req.params.id);
      if (!details) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json({
        ...details,
        aiLogs: storage.getAILogsBySession(req.params.id),
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // ============= Sync Trigger =============

  router.post('/sync', async (_req: Request, res: Response) => {
    try {
      if (!mawBridge) {
        return res.status(400).json({ error: 'MAW Bridge not initialized' });
      }

      await mawBridge.syncSessions();
      await mawBridge.syncWorkflowPlans();

      res.json({ status: 'ok', message: 'Sync completed' });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  return router;
}

export default createApiRoutes;
