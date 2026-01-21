"""
Gemini Bridge Script for Claude Agent Skills.
Supports both native Gemini CLI and proxy API (Gemini native format).
"""

import json
import os
import sys
import subprocess
import argparse
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional

# ============= Configuration =============
# 转发 API 配置 (优先使用环境变量)
PROXY_BASE_URL = os.environ.get(
    "GEMINI_PROXY_BASE_URL",
    "https://api.ikuncode.cc"
)
PROXY_API_KEY = os.environ.get(
    "GEMINI_PROXY_API_KEY",
    "sk-x3mS8a65tT1LT74RPCAJiCzjGVDN8rhPftFDvamplQhiuAaG"
)
DEFAULT_MODEL = os.environ.get("GEMINI_PROXY_MODEL", "gemini-2.5-flash")

# 是否使用转发 API (设为 False 则使用原生 Gemini CLI)
USE_PROXY_API = os.environ.get("GEMINI_USE_PROXY", "true").lower() == "true"


def call_gemini_proxy_api(
    prompt: str,
    model: str = DEFAULT_MODEL,
    cwd: str = ".",
    session_id: Optional[str] = None,
) -> dict:
    """Call Gemini proxy API using native Gemini format."""

    # 构建请求 URL
    url = f"{PROXY_BASE_URL}/v1/models/{model}:generateContent"

    # 构建请求体 (Gemini 原生格式)
    # 添加系统指令
    system_instruction = f"You are a helpful AI assistant. Current working directory: {cwd}"

    request_body = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}]
            }
        ],
        "systemInstruction": {
            "parts": [{"text": system_instruction}]
        },
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 8192,
        }
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {PROXY_API_KEY}",
    }

    try:
        data = json.dumps(request_body).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')

        with urllib.request.urlopen(req, timeout=120) as response:
            result = json.loads(response.read().decode('utf-8'))

        # 解析响应
        if "candidates" in result and len(result["candidates"]) > 0:
            candidate = result["candidates"][0]
            content = candidate.get("content", {})
            parts = content.get("parts", [])

            # 提取文本响应
            text_response = ""
            for part in parts:
                if "text" in part:
                    text_response += part["text"]

            # 提取 token 使用信息
            usage = result.get("usageMetadata", {})

            # 生成会话 ID
            new_session_id = session_id or result.get("responseId") or f"gemini-{os.urandom(8).hex()}"

            return {
                "success": True,
                "SESSION_ID": new_session_id,
                "agent_messages": text_response,
                "model": result.get("modelVersion", model),
                "usage": {
                    "prompt_tokens": usage.get("promptTokenCount", 0),
                    "completion_tokens": usage.get("candidatesTokenCount", 0),
                    "total_tokens": usage.get("totalTokenCount", 0),
                }
            }
        else:
            # 检查是否有错误
            error_msg = result.get("error", {}).get("message", "Unknown error")
            return {
                "success": False,
                "error": f"No response from API: {error_msg}",
            }

    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else str(e)
        try:
            error_json = json.loads(error_body)
            error_msg = error_json.get("error", {}).get("message", error_body)
        except:
            error_msg = error_body
        return {
            "success": False,
            "error": f"HTTP Error {e.code}: {error_msg}",
        }
    except urllib.error.URLError as e:
        return {
            "success": False,
            "error": f"Connection Error: {str(e.reason)}",
        }
    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error": f"JSON Decode Error: {str(e)}",
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}",
        }


def call_native_gemini_cli(
    prompt: str,
    cwd: str,
    model: str = "",
    session_id: str = "",
    sandbox: bool = False,
    return_all_messages: bool = False,
) -> dict:
    """Call native Gemini CLI (original implementation)."""
    import queue
    import threading
    import time

    def run_shell_command(cmd, cwd=None):
        env = os.environ.copy()
        process = subprocess.Popen(
            cmd,
            shell=False,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            encoding='utf-8',
            errors='replace',
            cwd=cwd,
            env=env,
        )

        output_queue = queue.Queue()

        def read_output():
            if process.stdout:
                for line in iter(process.stdout.readline, ""):
                    stripped = line.strip()
                    output_queue.put(stripped)
                    try:
                        data = json.loads(stripped)
                        if data.get("type") == "turn.completed":
                            time.sleep(0.3)
                            process.terminate()
                            break
                    except:
                        pass
                process.stdout.close()
            output_queue.put(None)

        thread = threading.Thread(target=read_output)
        thread.start()

        while True:
            try:
                line = output_queue.get(timeout=0.5)
                if line is None:
                    break
                yield line
            except queue.Empty:
                if process.poll() is not None and not thread.is_alive():
                    break

        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
        thread.join(timeout=5)

    cmd = ["gemini", "--prompt", prompt, "-o", "stream-json"]

    if sandbox:
        cmd.extend(["--sandbox"])
    if model:
        cmd.extend(["--model", model])
    if session_id:
        cmd.extend(["--resume", session_id])

    all_messages = []
    agent_messages = ""
    success = True
    err_message = ""
    thread_id = None

    for line in run_shell_command(cmd, cwd=cwd):
        try:
            line_dict = json.loads(line.strip())
            all_messages.append(line_dict)
            item_type = line_dict.get("type", "")
            item_role = line_dict.get("role", "")
            if item_type == "message" and item_role == "assistant":
                if "The --prompt (-p) flag has been deprecated" in line_dict.get("content", ""):
                    continue
                agent_messages += line_dict.get("content", "")
            if line_dict.get("session_id") is not None:
                thread_id = line_dict.get("session_id")
        except json.JSONDecodeError:
            err_message += "\n\n[json decode error] " + line
        except Exception as error:
            err_message += f"\n\n[unexpected error] {error}. Line: {line!r}"
            break

    result = {}

    if thread_id is None:
        success = False
        err_message = "Failed to get `SESSION_ID` from the gemini session.\n\n" + err_message
    else:
        result["SESSION_ID"] = thread_id

    if success and len(agent_messages) == 0:
        success = False
        err_message = "Failed to retrieve `agent_messages` from Gemini session.\n\n" + err_message

    if success:
        result["agent_messages"] = agent_messages
    else:
        result["error"] = err_message

    result["success"] = success

    if return_all_messages:
        result["all_messages"] = all_messages

    return result


def main():
    parser = argparse.ArgumentParser(description="Gemini Bridge - Supports proxy API and native CLI")
    parser.add_argument("--PROMPT", required=True, help="Instruction for the task to send to gemini.")
    parser.add_argument("--cd", required=True, type=Path, help="Set the workspace root for gemini.")
    parser.add_argument("--sandbox", action="store_true", default=False, help="Run in sandbox mode.")
    parser.add_argument("--SESSION_ID", default="", help="Resume the specified session.")
    parser.add_argument("--return-all-messages", action="store_true", help="Return all messages.")
    parser.add_argument("--model", default="", help="The model to use.")
    parser.add_argument("--use-proxy", action="store_true", default=USE_PROXY_API,
                        help="Use proxy API instead of native CLI.")
    parser.add_argument("--use-native", action="store_true", default=False,
                        help="Force use native Gemini CLI.")

    args = parser.parse_args()

    cd: Path = args.cd
    if not cd.exists():
        result = {
            "success": False,
            "error": f"The workspace root directory `{cd.absolute()}` does not exist."
        }
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return

    # 决定使用哪种方式
    use_proxy = args.use_proxy and not args.use_native

    if use_proxy:
        # 使用转发 API
        model = args.model if args.model else DEFAULT_MODEL
        result = call_gemini_proxy_api(
            prompt=args.PROMPT,
            model=model,
            cwd=str(cd.absolute()),
            session_id=args.SESSION_ID if args.SESSION_ID else None,
        )
    else:
        # 使用原生 Gemini CLI
        result = call_native_gemini_cli(
            prompt=args.PROMPT,
            cwd=str(cd.absolute()),
            model=args.model,
            session_id=args.SESSION_ID,
            sandbox=args.sandbox,
            return_all_messages=args.return_all_messages,
        )

    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
