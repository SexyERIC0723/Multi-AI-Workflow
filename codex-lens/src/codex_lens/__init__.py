"""
CodexLens - Code Search Engine for MAW

Provides full-text and semantic search capabilities for codebases.
Based on Claude-Code-Workflow's CodexLens implementation.
"""

__version__ = "0.1.0"

from .indexer import CodeIndexer
from .search import SearchEngine
from .models import IndexedFile, SearchResult

__all__ = [
    "CodeIndexer",
    "SearchEngine",
    "IndexedFile",
    "SearchResult",
]
