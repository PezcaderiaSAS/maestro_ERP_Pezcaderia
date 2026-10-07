import subprocess
import urllib.request
import urllib.parse
import json
from agency_swarm.tools import BaseTool
from pydantic import Field

class FetchDocumentation(BaseTool):
    """
    Lee y extrae el contenido completo de una URL de documentación oficial o blog técnico
    (ej. documentación de React, Tailwind, Figma, guías de UI/UX) en formato Markdown limpio.
    Utiliza el canal web de Agent-Reach (con fallback directo a Jina Reader).
    """
    url: str = Field(..., description="La URL exacta de la documentación o artículo que se desea leer.")

    def run(self):
        # 1. Intento primario: Canal web de Agent-Reach (Jina Reader CLI)
        cmd = ["agent-reach", "web", "read", self.url]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return result.stdout
        except (subprocess.CalledProcessError, FileNotFoundError):
            # 2. Fallback resiliente: Canal directo Jina Reader (cero configuración y sin API keys)
            try:
                jina_url = f"https://r.jina.ai/{self.url}"
                req = urllib.request.Request(
                    jina_url,
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Agent-Reach/1.0"}
                )
                with urllib.request.urlopen(req, timeout=25) as resp:
                    return resp.read().decode("utf-8")
            except Exception as e:
                return f"Error leyendo la documentación via Jina Reader: {str(e)}"

class CodeAndBestPracticesSearch(BaseTool):
    """
    Busca soluciones de desarrollo, patrones de diseño UI/UX, arquitectura de software y código comprobado
    en la web y repositorios de GitHub mediante Agent-Reach (Exa / GitHub).
    """
    query: str = Field(..., description="Término técnico de búsqueda semántica o error específico de código.")
    scope: str = Field("all", description="Ámbito de búsqueda: 'all' (toda la web técnica) o 'github' (solo repositorios).")

    def run(self):
        # 1. Intento primario: CLI de Agent-Reach
        if self.scope == "github":
            cmd = ["agent-reach", "github", "search", self.query]
        else:
            cmd = ["agent-reach", "web", "search", self.query]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return result.stdout
        except (subprocess.CalledProcessError, FileNotFoundError):
            # 2. Fallback resiliente: Búsqueda en GitHub API y recursos técnicos
            try:
                encoded = urllib.parse.quote(self.query)
                gh_url = f"https://api.github.com/search/repositories?q={encoded}&per_page=5"
                req = urllib.request.Request(gh_url, headers={"User-Agent": "Agent-Reach-Swarm/1.0"})
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    items = data.get("items", [])
                    if items:
                        output = [f"Resultados de repositorios encontrados para '{self.query}':\n"]
                        for it in items:
                            output.append(f"- Repositorio: {it.get('full_name')} (Stars: {it.get('stargazers_count')})")
                            output.append(f"  URL: {it.get('html_url')}")
                            output.append(f"  Descripción: {it.get('description')}\n")
                        return "\n".join(output)
                    return f"No se encontraron repositorios relevantes para '{self.query}'."
            except Exception as e:
                return f"Error en búsqueda técnica alternativa: {str(e)}"
