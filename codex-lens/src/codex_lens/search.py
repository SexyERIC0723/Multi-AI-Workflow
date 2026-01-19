"""
Search Engine - Full-text and semantic search for code

Based on Claude-Code-Workflow's CodexLens implementation.
Supports:
- FTS5 full-text search with ranking
- Optional semantic search with embeddings
- Hybrid search with RRF fusion
"""

import sqlite3
import re
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
from dataclasses import dataclass

from .models import SearchResult


class SearchEngine:
    """
    Code search engine with multiple search modes.

    Modes:
    - fulltext: SQLite FTS5 full-text search
    - semantic: Embedding-based similarity search (requires optional deps)
    - hybrid: Combined ranking using Reciprocal Rank Fusion
    """

    def __init__(
        self,
        index_path: str = ".maw/index",
        search_mode: str = "fulltext",  # fulltext, semantic, hybrid
    ):
        self.index_path = Path(index_path)
        self.db_path = self.index_path / "code.db"
        self.search_mode = search_mode

        if not self.db_path.exists():
            raise FileNotFoundError(
                f"Index not found at {self.db_path}. Run 'codex-lens index' first."
            )

    def search(
        self,
        query: str,
        limit: int = 20,
        language: Optional[str] = None,
        path_filter: Optional[str] = None,
    ) -> List[SearchResult]:
        """
        Search the code index.

        Args:
            query: Search query string
            limit: Maximum number of results
            language: Filter by programming language
            path_filter: Filter by path pattern (glob-like)

        Returns:
            List of SearchResult objects sorted by relevance
        """
        if self.search_mode == "semantic":
            return self._semantic_search(query, limit, language, path_filter)
        elif self.search_mode == "hybrid":
            return self._hybrid_search(query, limit, language, path_filter)
        else:
            return self._fulltext_search(query, limit, language, path_filter)

    def _fulltext_search(
        self,
        query: str,
        limit: int,
        language: Optional[str],
        path_filter: Optional[str],
    ) -> List[SearchResult]:
        """Perform FTS5 full-text search."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        # Build query with filters
        where_clauses = []
        params = []

        if language:
            where_clauses.append("f.language = ?")
            params.append(language)

        if path_filter:
            where_clauses.append("f.path LIKE ?")
            params.append(f"%{path_filter}%")

        where_sql = ""
        if where_clauses:
            where_sql = "AND " + " AND ".join(where_clauses)

        # Prepare FTS query - escape special characters
        fts_query = self._prepare_fts_query(query)

        sql = f"""
            SELECT
                f.path,
                f.content,
                f.language,
                bm25(files_fts) as score
            FROM files_fts
            JOIN files f ON files_fts.rowid = f.id
            WHERE files_fts MATCH ?
            {where_sql}
            ORDER BY score
            LIMIT ?
        """

        params = [fts_query] + params + [limit]

        try:
            cursor.execute(sql, params)
            rows = cursor.fetchall()
        except sqlite3.OperationalError as e:
            # FTS query syntax error - fall back to simple LIKE search
            if "fts5" in str(e).lower():
                return self._fallback_search(query, limit, language, path_filter)
            raise

        conn.close()

        results = []
        for path, content, lang, score in rows:
            # Find matching lines and context
            match_info = self._find_matches(content, query)

            results.append(SearchResult(
                path=path,
                content=content[:500],  # Truncate for display
                score=abs(score),  # BM25 returns negative scores
                line_number=match_info["line_number"],
                match_context=match_info["context"],
                search_type="fulltext",
                highlights=match_info["highlights"],
            ))

        return results

    def _prepare_fts_query(self, query: str) -> str:
        """
        Prepare query string for FTS5.
        Handles special characters and query syntax.
        """
        # Remove FTS5 special characters that might cause issues
        special_chars = ['*', '"', "'", '(', ')', '-', '+', ':', '^', '~']

        # If query looks like a phrase (has spaces), wrap in quotes
        if ' ' in query and not query.startswith('"'):
            # Escape any existing quotes
            escaped = query.replace('"', '""')
            return f'"{escaped}"'

        # For single words, just escape special chars
        cleaned = query
        for char in special_chars:
            cleaned = cleaned.replace(char, ' ')

        # Remove extra spaces
        cleaned = ' '.join(cleaned.split())

        return cleaned

    def _fallback_search(
        self,
        query: str,
        limit: int,
        language: Optional[str],
        path_filter: Optional[str],
    ) -> List[SearchResult]:
        """Fallback LIKE-based search when FTS fails."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        where_clauses = ["content LIKE ?"]
        params = [f"%{query}%"]

        if language:
            where_clauses.append("language = ?")
            params.append(language)

        if path_filter:
            where_clauses.append("path LIKE ?")
            params.append(f"%{path_filter}%")

        where_sql = " AND ".join(where_clauses)

        sql = f"""
            SELECT path, content, language
            FROM files
            WHERE {where_sql}
            LIMIT ?
        """
        params.append(limit)

        cursor.execute(sql, params)
        rows = cursor.fetchall()
        conn.close()

        results = []
        for path, content, lang in rows:
            match_info = self._find_matches(content, query)
            results.append(SearchResult(
                path=path,
                content=content[:500],
                score=1.0,  # Simple score for fallback
                line_number=match_info["line_number"],
                match_context=match_info["context"],
                search_type="fulltext",
                highlights=match_info["highlights"],
            ))

        return results

    def _find_matches(
        self,
        content: str,
        query: str,
        context_lines: int = 2,
    ) -> Dict[str, Any]:
        """Find matching lines and extract context."""
        lines = content.split('\n')
        query_lower = query.lower()

        first_match_line = 0
        highlights = []
        context = ""

        for i, line in enumerate(lines):
            if query_lower in line.lower():
                first_match_line = i + 1  # 1-indexed

                # Extract context
                start = max(0, i - context_lines)
                end = min(len(lines), i + context_lines + 1)
                context_lines_list = lines[start:end]
                context = '\n'.join(context_lines_list)

                # Extract highlighted portion
                highlights.append(line.strip())

                if len(highlights) >= 3:
                    break

        return {
            "line_number": first_match_line,
            "context": context,
            "highlights": highlights,
        }

    def _semantic_search(
        self,
        query: str,
        limit: int,
        language: Optional[str],
        path_filter: Optional[str],
    ) -> List[SearchResult]:
        """
        Semantic search using embeddings.
        Requires 'semantic' optional dependencies.
        """
        try:
            from .semantic import SemanticSearcher
            searcher = SemanticSearcher(self.index_path)
            return searcher.search(query, limit, language, path_filter)
        except ImportError:
            print("Semantic search requires 'semantic' extras. Install with:")
            print("  pip install codex-lens[semantic]")
            # Fall back to fulltext
            return self._fulltext_search(query, limit, language, path_filter)

    def _hybrid_search(
        self,
        query: str,
        limit: int,
        language: Optional[str],
        path_filter: Optional[str],
    ) -> List[SearchResult]:
        """
        Hybrid search combining fulltext and semantic results.
        Uses Reciprocal Rank Fusion (RRF) for combining rankings.
        """
        # Get results from both methods
        fulltext_results = self._fulltext_search(query, limit * 2, language, path_filter)

        try:
            semantic_results = self._semantic_search(query, limit * 2, language, path_filter)
        except Exception:
            # If semantic search fails, just return fulltext results
            return fulltext_results[:limit]

        # Apply RRF fusion
        k = 60  # RRF constant
        scores: Dict[str, float] = {}
        results_map: Dict[str, SearchResult] = {}

        for rank, result in enumerate(fulltext_results):
            rrf_score = 1.0 / (k + rank + 1)
            scores[result.path] = scores.get(result.path, 0) + rrf_score
            results_map[result.path] = result

        for rank, result in enumerate(semantic_results):
            rrf_score = 1.0 / (k + rank + 1)
            scores[result.path] = scores.get(result.path, 0) + rrf_score
            if result.path not in results_map:
                results_map[result.path] = result

        # Sort by combined score
        sorted_paths = sorted(scores.keys(), key=lambda p: scores[p], reverse=True)

        results = []
        for path in sorted_paths[:limit]:
            result = results_map[path]
            result.score = scores[path]
            result.search_type = "hybrid"
            results.append(result)

        return results

    def search_symbol(
        self,
        symbol: str,
        symbol_type: Optional[str] = None,
        limit: int = 20,
    ) -> List[SearchResult]:
        """
        Search for code symbols (functions, classes, etc.).

        Args:
            symbol: Symbol name to search for
            symbol_type: Type of symbol (function, class, variable, etc.)
            limit: Maximum results

        Returns:
            List of SearchResult objects
        """
        # Build pattern based on symbol type
        patterns = {
            "function": [
                rf"def\s+{re.escape(symbol)}\s*\(",  # Python
                rf"function\s+{re.escape(symbol)}\s*\(",  # JavaScript
                rf"func\s+{re.escape(symbol)}\s*\(",  # Go
                rf"fn\s+{re.escape(symbol)}\s*\(",  # Rust
            ],
            "class": [
                rf"class\s+{re.escape(symbol)}\s*[:\(]",  # Python, Java, etc.
                rf"struct\s+{re.escape(symbol)}\s*\{{",  # Go, Rust
                rf"interface\s+{re.escape(symbol)}\s*\{{",  # TypeScript
            ],
            "variable": [
                rf"(const|let|var)\s+{re.escape(symbol)}\s*=",  # JavaScript
                rf"{re.escape(symbol)}\s*:=",  # Go
                rf"(let|const)\s+{re.escape(symbol)}\s*:",  # Rust, TypeScript
            ],
        }

        if symbol_type and symbol_type in patterns:
            search_patterns = patterns[symbol_type]
        else:
            # Search all pattern types
            search_patterns = [p for ps in patterns.values() for p in ps]

        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        cursor.execute("SELECT path, content, language FROM files")
        rows = cursor.fetchall()
        conn.close()

        results = []
        for path, content, language in rows:
            for pattern in search_patterns:
                matches = list(re.finditer(pattern, content, re.MULTILINE))
                if matches:
                    # Find line number of first match
                    first_match = matches[0]
                    line_number = content[:first_match.start()].count('\n') + 1

                    # Get context
                    lines = content.split('\n')
                    start = max(0, line_number - 2)
                    end = min(len(lines), line_number + 3)
                    context = '\n'.join(lines[start:end])

                    results.append(SearchResult(
                        path=path,
                        content=content[:500],
                        score=len(matches),  # More matches = higher score
                        line_number=line_number,
                        match_context=context,
                        search_type="symbol",
                        highlights=[m.group() for m in matches[:3]],
                    ))
                    break  # One result per file

            if len(results) >= limit:
                break

        # Sort by score (number of matches)
        results.sort(key=lambda r: r.score, reverse=True)
        return results[:limit]

    def search_file(
        self,
        pattern: str,
        limit: int = 20,
    ) -> List[SearchResult]:
        """
        Search for files by name pattern.

        Args:
            pattern: File name pattern (glob-like)
            limit: Maximum results

        Returns:
            List of SearchResult objects
        """
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        # Convert glob-like pattern to SQL LIKE
        sql_pattern = pattern.replace('*', '%').replace('?', '_')

        cursor.execute("""
            SELECT path, content, language
            FROM files
            WHERE path LIKE ?
            ORDER BY path
            LIMIT ?
        """, (f"%{sql_pattern}%", limit))

        rows = cursor.fetchall()
        conn.close()

        results = []
        for path, content, language in rows:
            line_count = content.count('\n') + 1
            results.append(SearchResult(
                path=path,
                content=f"{line_count} lines, {len(content)} bytes",
                score=1.0,
                line_number=0,
                match_context="",
                search_type="file",
                highlights=[],
            ))

        return results
