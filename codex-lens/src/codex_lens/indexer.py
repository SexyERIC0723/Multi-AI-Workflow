"""
Code Indexer - Indexes source files into SQLite FTS5

Based on Claude-Code-Workflow's CodexLens implementation.
Uses SQLite FTS5 for full-text search capabilities.
"""

import os
import sqlite3
import fnmatch
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Generator, Set
import json

from .models import (
    IndexedFile,
    IndexStats,
    LANGUAGE_MAP,
    DEFAULT_IGNORE_PATTERNS,
)


class CodeIndexer:
    """
    Indexes source code files using SQLite FTS5.

    Provides:
    - Full-text search indexing with FTS5
    - Incremental updates based on file hashes
    - Language detection
    - Configurable ignore patterns
    """

    def __init__(
        self,
        index_path: str = ".maw/index",
        ignore_patterns: Optional[List[str]] = None,
    ):
        self.index_path = Path(index_path)
        self.index_path.mkdir(parents=True, exist_ok=True)

        self.db_path = self.index_path / "code.db"
        self.ignore_patterns = ignore_patterns or DEFAULT_IGNORE_PATTERNS

        self._init_database()

    def _init_database(self):
        """Initialize SQLite database with FTS5 tables."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        # Main files table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                path TEXT UNIQUE NOT NULL,
                content TEXT NOT NULL,
                language TEXT,
                size INTEGER,
                last_modified TEXT,
                content_hash TEXT,
                indexed_at TEXT
            )
        """)

        # FTS5 virtual table for full-text search
        cursor.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS files_fts USING fts5(
                path,
                content,
                language,
                content='files',
                content_rowid='id',
                tokenize='porter unicode61'
            )
        """)

        # Triggers to keep FTS index in sync
        cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS files_ai AFTER INSERT ON files BEGIN
                INSERT INTO files_fts(rowid, path, content, language)
                VALUES (new.id, new.path, new.content, new.language);
            END
        """)

        cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS files_ad AFTER DELETE ON files BEGIN
                INSERT INTO files_fts(files_fts, rowid, path, content, language)
                VALUES ('delete', old.id, old.path, old.content, old.language);
            END
        """)

        cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS files_au AFTER UPDATE ON files BEGIN
                INSERT INTO files_fts(files_fts, rowid, path, content, language)
                VALUES ('delete', old.id, old.path, old.content, old.language);
                INSERT INTO files_fts(rowid, path, content, language)
                VALUES (new.id, new.path, new.content, new.language);
            END
        """)

        # Index stats table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS index_stats (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        """)

        conn.commit()
        conn.close()

    def _should_ignore(self, path: Path, root: Path) -> bool:
        """Check if a path should be ignored."""
        rel_path = str(path.relative_to(root))

        for pattern in self.ignore_patterns:
            # Check if any part of the path matches
            if fnmatch.fnmatch(path.name, pattern):
                return True
            if fnmatch.fnmatch(rel_path, pattern):
                return True
            # Check parent directories
            for parent in path.relative_to(root).parents:
                if fnmatch.fnmatch(str(parent), pattern):
                    return True
                if str(parent) == pattern:
                    return True

        return False

    def _detect_language(self, path: Path) -> str:
        """Detect programming language from file extension."""
        return LANGUAGE_MAP.get(path.suffix.lower(), "unknown")

    def _scan_files(self, root: Path) -> Generator[Path, None, None]:
        """Scan directory for indexable files."""
        for path in root.rglob("*"):
            if path.is_file() and not self._should_ignore(path, root):
                # Only index known file types
                if path.suffix.lower() in LANGUAGE_MAP:
                    yield path

    def _get_file_hash(self, path: Path) -> Optional[str]:
        """Get stored hash for a file."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        cursor.execute(
            "SELECT content_hash FROM files WHERE path = ?",
            (str(path),)
        )
        result = cursor.fetchone()
        conn.close()
        return result[0] if result else None

    def index_file(self, file_path: Path, root: Path) -> Optional[IndexedFile]:
        """Index a single file."""
        try:
            rel_path = str(file_path.relative_to(root))

            # Read file content
            try:
                content = file_path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                # Try with latin-1 for binary-like files
                try:
                    content = file_path.read_text(encoding="latin-1")
                except Exception:
                    return None

            stat = file_path.stat()

            indexed_file = IndexedFile(
                path=rel_path,
                content=content,
                language=self._detect_language(file_path),
                size=stat.st_size,
                last_modified=datetime.fromtimestamp(stat.st_mtime),
            )

            # Check if file needs re-indexing
            stored_hash = self._get_file_hash(rel_path)
            if stored_hash == indexed_file.content_hash:
                return None  # File unchanged

            return indexed_file

        except Exception as e:
            print(f"Error indexing {file_path}: {e}")
            return None

    def _save_file(self, indexed_file: IndexedFile):
        """Save indexed file to database."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        cursor.execute("""
            INSERT OR REPLACE INTO files
            (path, content, language, size, last_modified, content_hash, indexed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            indexed_file.path,
            indexed_file.content,
            indexed_file.language,
            indexed_file.size,
            indexed_file.last_modified.isoformat(),
            indexed_file.content_hash,
            datetime.now().isoformat(),
        ))

        conn.commit()
        conn.close()

    def index_directory(
        self,
        directory: str,
        show_progress: bool = True,
    ) -> IndexStats:
        """
        Index all files in a directory.

        Args:
            directory: Path to directory to index
            show_progress: Whether to print progress

        Returns:
            IndexStats with indexing results
        """
        root = Path(directory).resolve()
        if not root.is_dir():
            raise ValueError(f"Not a directory: {directory}")

        stats = IndexStats()
        languages: dict = {}
        indexed_count = 0
        skipped_count = 0

        files = list(self._scan_files(root))
        total_files = len(files)

        if show_progress:
            print(f"Found {total_files} files to index in {root}")

        for i, file_path in enumerate(files):
            indexed_file = self.index_file(file_path, root)

            if indexed_file:
                self._save_file(indexed_file)
                indexed_count += 1

                stats.total_lines += indexed_file.content.count("\n") + 1
                stats.total_size += indexed_file.size

                lang = indexed_file.language
                languages[lang] = languages.get(lang, 0) + 1

                if show_progress and (i + 1) % 100 == 0:
                    print(f"  Indexed {i + 1}/{total_files} files...")
            else:
                skipped_count += 1

        stats.total_files = indexed_count
        stats.languages = languages
        stats.last_indexed = datetime.now()

        # Save stats
        self._save_stats(stats)

        if show_progress:
            print(f"Indexing complete: {indexed_count} indexed, {skipped_count} skipped")

        return stats

    def _save_stats(self, stats: IndexStats):
        """Save index statistics."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        cursor.execute(
            "INSERT OR REPLACE INTO index_stats (key, value) VALUES (?, ?)",
            ("stats", json.dumps(stats.to_dict()))
        )

        conn.commit()
        conn.close()

    def get_stats(self) -> Optional[IndexStats]:
        """Get current index statistics."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        cursor.execute("SELECT value FROM index_stats WHERE key = 'stats'")
        result = cursor.fetchone()
        conn.close()

        if result:
            data = json.loads(result[0])
            return IndexStats(
                total_files=data.get("total_files", 0),
                total_lines=data.get("total_lines", 0),
                total_size=data.get("total_size", 0),
                languages=data.get("languages", {}),
                last_indexed=datetime.fromisoformat(data["last_indexed"]) if data.get("last_indexed") else None,
                index_version=data.get("index_version", "1.0"),
            )
        return None

    def clear_index(self):
        """Clear all indexed data."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        cursor.execute("DELETE FROM files")
        cursor.execute("DELETE FROM files_fts")
        cursor.execute("DELETE FROM index_stats")

        conn.commit()
        conn.close()

    def remove_file(self, path: str):
        """Remove a file from the index."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        cursor.execute("DELETE FROM files WHERE path = ?", (path,))
        conn.commit()
        conn.close()

    def get_indexed_files(self, language: Optional[str] = None) -> List[str]:
        """Get list of indexed file paths."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        if language:
            cursor.execute(
                "SELECT path FROM files WHERE language = ? ORDER BY path",
                (language,)
            )
        else:
            cursor.execute("SELECT path FROM files ORDER BY path")

        paths = [row[0] for row in cursor.fetchall()]
        conn.close()
        return paths
