"""
CodexLens CLI - Command line interface for code search

Commands:
- index: Index a directory
- search: Search the code index
- stats: Show index statistics
- clear: Clear the index
"""

import json
import sys
from pathlib import Path
from typing import Optional

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.syntax import Syntax
from rich.progress import Progress, SpinnerColumn, TextColumn

from . import CodeIndexer, SearchEngine


console = Console()


@click.group()
@click.version_option(version="0.1.0", prog_name="codex-lens")
def main():
    """CodexLens - Code Search Engine for MAW"""
    pass


@main.command()
@click.argument("directory", type=click.Path(exists=True), default=".")
@click.option(
    "--index-path", "-i",
    default=".maw/index",
    help="Path to store the index",
)
@click.option(
    "--ignore", "-x",
    multiple=True,
    help="Additional patterns to ignore",
)
@click.option(
    "--json", "output_json",
    is_flag=True,
    help="Output as JSON",
)
def index(directory: str, index_path: str, ignore: tuple, output_json: bool):
    """Index a directory for searching."""
    ignore_patterns = list(ignore) if ignore else None

    indexer = CodeIndexer(
        index_path=index_path,
        ignore_patterns=ignore_patterns,
    )

    if not output_json:
        console.print(f"[bold blue]Indexing[/bold blue] {directory}")

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
        disable=output_json,
    ) as progress:
        task = progress.add_task("Scanning files...", total=None)
        stats = indexer.index_directory(directory, show_progress=False)
        progress.update(task, description="Done!")

    if output_json:
        print(json.dumps(stats.to_dict(), indent=2))
    else:
        # Display stats table
        table = Table(title="Index Statistics")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="green")

        table.add_row("Total Files", str(stats.total_files))
        table.add_row("Total Lines", f"{stats.total_lines:,}")
        table.add_row("Total Size", f"{stats.total_size:,} bytes")
        table.add_row("Index Path", str(Path(index_path).resolve()))

        if stats.languages:
            langs = ", ".join(f"{k}: {v}" for k, v in sorted(
                stats.languages.items(),
                key=lambda x: x[1],
                reverse=True
            )[:5])
            table.add_row("Top Languages", langs)

        console.print(table)


@main.command()
@click.argument("query")
@click.option(
    "--index-path", "-i",
    default=".maw/index",
    help="Path to the index",
)
@click.option(
    "--limit", "-n",
    default=10,
    type=int,
    help="Maximum number of results",
)
@click.option(
    "--language", "-l",
    help="Filter by programming language",
)
@click.option(
    "--path", "-p",
    help="Filter by path pattern",
)
@click.option(
    "--mode", "-m",
    type=click.Choice(["fulltext", "semantic", "hybrid"]),
    default="fulltext",
    help="Search mode",
)
@click.option(
    "--json", "output_json",
    is_flag=True,
    help="Output as JSON",
)
def search(
    query: str,
    index_path: str,
    limit: int,
    language: Optional[str],
    path: Optional[str],
    mode: str,
    output_json: bool,
):
    """Search the code index."""
    try:
        engine = SearchEngine(index_path=index_path, search_mode=mode)
    except FileNotFoundError as e:
        console.print(f"[red]Error:[/red] {e}")
        sys.exit(1)

    results = engine.search(
        query=query,
        limit=limit,
        language=language,
        path_filter=path,
    )

    if output_json:
        print(json.dumps([r.to_dict() for r in results], indent=2))
        return

    if not results:
        console.print("[yellow]No results found.[/yellow]")
        return

    console.print(f"[bold]Found {len(results)} results for[/bold] '{query}'\n")

    for i, result in enumerate(results, 1):
        # File header
        header = f"[bold cyan]{result.path}[/bold cyan]"
        if result.line_number > 0:
            header += f":[yellow]{result.line_number}[/yellow]"
        header += f" [dim](score: {result.score:.4f})[/dim]"

        console.print(header)

        # Show context with syntax highlighting
        if result.match_context:
            # Try to detect language from path
            ext = Path(result.path).suffix
            lang_map = {
                ".py": "python",
                ".js": "javascript",
                ".ts": "typescript",
                ".tsx": "typescript",
                ".go": "go",
                ".rs": "rust",
                ".java": "java",
                ".cpp": "cpp",
                ".c": "c",
            }
            lang = lang_map.get(ext, "text")

            syntax = Syntax(
                result.match_context,
                lang,
                theme="monokai",
                line_numbers=True,
                start_line=max(1, result.line_number - 2),
            )
            console.print(Panel(syntax, expand=False, border_style="dim"))

        console.print()


@main.command()
@click.argument("symbol")
@click.option(
    "--index-path", "-i",
    default=".maw/index",
    help="Path to the index",
)
@click.option(
    "--type", "-t", "symbol_type",
    type=click.Choice(["function", "class", "variable"]),
    help="Symbol type to search for",
)
@click.option(
    "--limit", "-n",
    default=10,
    type=int,
    help="Maximum number of results",
)
@click.option(
    "--json", "output_json",
    is_flag=True,
    help="Output as JSON",
)
def symbol(
    symbol: str,
    index_path: str,
    symbol_type: Optional[str],
    limit: int,
    output_json: bool,
):
    """Search for code symbols (functions, classes, etc.)."""
    try:
        engine = SearchEngine(index_path=index_path)
    except FileNotFoundError as e:
        console.print(f"[red]Error:[/red] {e}")
        sys.exit(1)

    results = engine.search_symbol(
        symbol=symbol,
        symbol_type=symbol_type,
        limit=limit,
    )

    if output_json:
        print(json.dumps([r.to_dict() for r in results], indent=2))
        return

    if not results:
        console.print("[yellow]No symbols found.[/yellow]")
        return

    console.print(f"[bold]Found {len(results)} symbols matching[/bold] '{symbol}'\n")

    for result in results:
        console.print(
            f"[bold cyan]{result.path}[/bold cyan]:"
            f"[yellow]{result.line_number}[/yellow]"
        )
        if result.highlights:
            for h in result.highlights:
                console.print(f"  [green]{h}[/green]")
        console.print()


@main.command()
@click.argument("pattern")
@click.option(
    "--index-path", "-i",
    default=".maw/index",
    help="Path to the index",
)
@click.option(
    "--limit", "-n",
    default=20,
    type=int,
    help="Maximum number of results",
)
def files(pattern: str, index_path: str, limit: int):
    """Search for files by name pattern."""
    try:
        engine = SearchEngine(index_path=index_path)
    except FileNotFoundError as e:
        console.print(f"[red]Error:[/red] {e}")
        sys.exit(1)

    results = engine.search_file(pattern=pattern, limit=limit)

    if not results:
        console.print("[yellow]No files found.[/yellow]")
        return

    console.print(f"[bold]Found {len(results)} files matching[/bold] '{pattern}'\n")

    for result in results:
        console.print(f"  [cyan]{result.path}[/cyan] - [dim]{result.content}[/dim]")


@main.command()
@click.option(
    "--index-path", "-i",
    default=".maw/index",
    help="Path to the index",
)
@click.option(
    "--json", "output_json",
    is_flag=True,
    help="Output as JSON",
)
def stats(index_path: str, output_json: bool):
    """Show index statistics."""
    indexer = CodeIndexer(index_path=index_path)
    stats = indexer.get_stats()

    if stats is None:
        if output_json:
            print(json.dumps({"error": "No index found"}))
        else:
            console.print("[yellow]No index found. Run 'codex-lens index' first.[/yellow]")
        return

    if output_json:
        print(json.dumps(stats.to_dict(), indent=2))
        return

    table = Table(title="Index Statistics")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="green")

    table.add_row("Total Files", str(stats.total_files))
    table.add_row("Total Lines", f"{stats.total_lines:,}")
    table.add_row("Total Size", f"{stats.total_size:,} bytes")
    table.add_row("Index Version", stats.index_version)

    if stats.last_indexed:
        table.add_row("Last Indexed", stats.last_indexed.strftime("%Y-%m-%d %H:%M:%S"))

    console.print(table)

    if stats.languages:
        console.print("\n[bold]Languages:[/bold]")
        lang_table = Table(show_header=False)
        lang_table.add_column("Language", style="cyan")
        lang_table.add_column("Files", style="green", justify="right")

        for lang, count in sorted(
            stats.languages.items(),
            key=lambda x: x[1],
            reverse=True
        ):
            lang_table.add_row(lang, str(count))

        console.print(lang_table)


@main.command()
@click.option(
    "--index-path", "-i",
    default=".maw/index",
    help="Path to the index",
)
@click.option(
    "--force", "-f",
    is_flag=True,
    help="Skip confirmation",
)
def clear(index_path: str, force: bool):
    """Clear the index."""
    if not force:
        if not click.confirm("This will delete all indexed data. Continue?"):
            return

    indexer = CodeIndexer(index_path=index_path)
    indexer.clear_index()
    console.print("[green]Index cleared.[/green]")


@main.command()
@click.option(
    "--index-path", "-i",
    default=".maw/index",
    help="Path to the index",
)
@click.option(
    "--language", "-l",
    help="Filter by programming language",
)
def list_files(index_path: str, language: Optional[str]):
    """List all indexed files."""
    indexer = CodeIndexer(index_path=index_path)
    files = indexer.get_indexed_files(language=language)

    if not files:
        console.print("[yellow]No files indexed.[/yellow]")
        return

    console.print(f"[bold]Indexed files ({len(files)}):[/bold]\n")
    for f in files:
        console.print(f"  [cyan]{f}[/cyan]")


if __name__ == "__main__":
    main()
