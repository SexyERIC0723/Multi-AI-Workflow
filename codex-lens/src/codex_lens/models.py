"""
Data models for CodexLens
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime
import hashlib


@dataclass
class IndexedFile:
    """Represents an indexed source file."""

    path: str
    content: str
    language: str
    size: int
    last_modified: datetime
    content_hash: str = field(default="")
    embedding: Optional[List[float]] = None

    def __post_init__(self):
        if not self.content_hash:
            self.content_hash = hashlib.sha256(self.content.encode()).hexdigest()[:16]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "path": self.path,
            "language": self.language,
            "size": self.size,
            "last_modified": self.last_modified.isoformat(),
            "content_hash": self.content_hash,
        }


@dataclass
class SearchResult:
    """Represents a search result."""

    path: str
    content: str
    score: float
    line_number: int = 0
    match_context: str = ""
    search_type: str = "fulltext"  # fulltext, semantic, hybrid
    highlights: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "path": self.path,
            "score": self.score,
            "line_number": self.line_number,
            "match_context": self.match_context,
            "search_type": self.search_type,
            "highlights": self.highlights,
        }


@dataclass
class IndexStats:
    """Statistics about the code index."""

    total_files: int = 0
    total_lines: int = 0
    total_size: int = 0
    languages: Dict[str, int] = field(default_factory=dict)
    last_indexed: Optional[datetime] = None
    index_version: str = "1.0"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_files": self.total_files,
            "total_lines": self.total_lines,
            "total_size": self.total_size,
            "languages": self.languages,
            "last_indexed": self.last_indexed.isoformat() if self.last_indexed else None,
            "index_version": self.index_version,
        }


# Language detection based on file extension
LANGUAGE_MAP = {
    ".py": "python",
    ".js": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".jsx": "javascript",
    ".java": "java",
    ".c": "c",
    ".cpp": "cpp",
    ".cc": "cpp",
    ".h": "c",
    ".hpp": "cpp",
    ".go": "go",
    ".rs": "rust",
    ".rb": "ruby",
    ".php": "php",
    ".swift": "swift",
    ".kt": "kotlin",
    ".scala": "scala",
    ".cs": "csharp",
    ".m": "objectivec",
    ".sh": "shell",
    ".bash": "shell",
    ".zsh": "shell",
    ".ps1": "powershell",
    ".sql": "sql",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".less": "less",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".xml": "xml",
    ".md": "markdown",
    ".toml": "toml",
    ".ini": "ini",
    ".cfg": "ini",
    ".vue": "vue",
    ".svelte": "svelte",
}


# Default ignore patterns
DEFAULT_IGNORE_PATTERNS = [
    "node_modules",
    "__pycache__",
    ".git",
    ".svn",
    ".hg",
    "venv",
    ".venv",
    "env",
    ".env",
    "dist",
    "build",
    "target",
    ".idea",
    ".vscode",
    "*.pyc",
    "*.pyo",
    "*.class",
    "*.o",
    "*.so",
    "*.dll",
    "*.exe",
    "*.min.js",
    "*.min.css",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "Cargo.lock",
    "*.map",
]
