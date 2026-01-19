#!/usr/bin/env python3
"""
Gemini Bridge - Python wrapper for Gemini CLI

Provides JSON-based interface for Claude to delegate tasks to Gemini.
Based on GuDaStudio/skills collaborating-with-gemini implementation.

Usage:
    python gemini_bridge.py --PROMPT "task" --cd "/path" [options]

Returns JSON:
    {
        "success": true,
        "SESSION_ID": "uuid",
        "agent_messages": "response content"
    }
"""

import argparse
import json
import os
import platform
import subprocess
import sys
import threading
from typing import Dict, List, Optional, Any


def _get_windows_npm_paths() -> List[str]:
    """Get potential npm installation paths on Windows."""
    paths = []

    npm_prefix = os.environ.get('NPM_CONFIG_PREFIX')
    if npm_prefix:
        paths.append(npm_prefix)

    appdata = os.environ.get('APPDATA')
    if appdata:
        paths.append(os.path.join(appdata, 'npm'))

    return paths


def _augment_path_env(env: Dict[str, str], npm_paths: List[str]) -> Dict[str, str]:
    """Add npm paths to PATH environment variable."""
    current_path = env.get('PATH', '')
    new_paths = [p for p in npm_paths if os.path.exists(p)]

    if new_paths:
        env['PATH'] = os.pathsep.join(new_paths + [current_path])

    return env


def run_shell_command(
    cmd: List[str],
    cwd: Optional[str] = None,
    env: Optional[Dict[str, str]] = None,
    timeout: int = 300
) -> Dict[str, Any]:
    """
    Execute shell command and capture output.
    """
    if env is None:
        env = os.environ.copy()

    # Add npm paths on Windows
    if platform.system() == 'Windows':
        npm_paths = _get_windows_npm_paths()
        env = _augment_path_env(env, npm_paths)

    result = {
        'success': False,
        'SESSION_ID': None,
        'agent_messages': '',
        'all_messages': [],
        'error': None
    }

    try:
        proc = subprocess.Popen(
            cmd,
            cwd=cwd,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )

        output_lines = []

        def read_output():
            for line in proc.stdout:
                output_lines.append(line.rstrip())

        reader = threading.Thread(target=read_output)
        reader.daemon = True
        reader.start()
        reader.join(timeout=timeout)

        proc.wait(timeout=5)

        # Parse output
        agent_messages = []
        session_id = None

        for line in output_lines:
            try:
                msg = json.loads(line)
                result['all_messages'].append(msg)

                # Gemini message format
                if msg.get('type') == 'message' and msg.get('role') == 'assistant':
                    agent_messages.append(msg.get('content', ''))

                # Extract session ID
                if 'session_id' in msg:
                    session_id = msg['session_id']

            except json.JSONDecodeError:
                # Non-JSON output
                if line.strip() and not line.startswith('Warning:'):
                    agent_messages.append(line)

        result['success'] = proc.returncode == 0
        result['SESSION_ID'] = session_id
        result['agent_messages'] = '\n'.join(agent_messages)

    except subprocess.TimeoutExpired:
        result['error'] = f'Command timed out after {timeout}s'
        proc.kill()
    except Exception as e:
        result['error'] = str(e)

    return result


def main():
    parser = argparse.ArgumentParser(
        description='Gemini Bridge - Delegate tasks to Gemini CLI'
    )
    parser.add_argument(
        '--PROMPT',
        required=True,
        help='Task prompt for Gemini'
    )
    parser.add_argument(
        '--cd',
        required=True,
        help='Working directory'
    )
    parser.add_argument(
        '--SESSION_ID',
        help='Resume existing session'
    )
    parser.add_argument(
        '--sandbox',
        action='store_true',
        help='Run in sandbox mode'
    )
    parser.add_argument(
        '--model',
        help='Model override'
    )
    parser.add_argument(
        '--return-all-messages',
        action='store_true',
        help='Include all messages in response'
    )

    args = parser.parse_args()

    # Validate working directory
    if not os.path.isdir(args.cd):
        print(json.dumps({
            'success': False,
            'error': f'Directory not found: {args.cd}'
        }))
        sys.exit(1)

    # Build gemini command
    cmd = ['gemini']

    # Add prompt (gemini uses different syntax)
    cmd.extend(['prompt', args.PROMPT])

    # Add optional arguments
    if args.SESSION_ID:
        cmd.extend(['--resume', args.SESSION_ID])

    if args.sandbox:
        cmd.append('--sandbox')

    if args.model:
        cmd.extend(['--model', args.model])

    # Execute
    result = run_shell_command(cmd, cwd=args.cd)

    # Format output
    output = {
        'success': result['success'],
        'SESSION_ID': result['SESSION_ID'],
        'agent_messages': result['agent_messages'],
    }

    if args.return_all_messages:
        output['all_messages'] = result['all_messages']

    if result['error']:
        output['error'] = result['error']

    print(json.dumps(output, indent=2))


if __name__ == '__main__':
    main()
