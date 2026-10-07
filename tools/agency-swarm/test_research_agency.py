"""
Test de integracion para internet_tools.py y Agent-Reach / Jina Reader
"""
import sys
from internet_tools import FetchDocumentation, CodeAndBestPracticesSearch

def test_fetch_documentation():
    print("Probando FetchDocumentation...")
    tool = FetchDocumentation(url="https://react.dev")
    result = tool.run()
    print("FetchDocumentation resultado:", result[:200] if result else "None")
    assert result and len(result) > 50, "FetchDocumentation fallo en retornar contenido"
    print("[OK] FetchDocumentation retorno contenido valido.")

def test_code_search():
    print("\nProbando CodeAndBestPracticesSearch...")
    tool = CodeAndBestPracticesSearch(query="The best implementation of atomic design in React 18 is", scope="all")
    result = tool.run()
    print("CodeAndBestPracticesSearch resultado:", result[:200] if result else "None")
    assert result and len(result) > 20, "CodeAndBestPracticesSearch fallo"
    print("[OK] CodeAndBestPracticesSearch retorno resultados validos.")

if __name__ == "__main__":
    try:
        test_fetch_documentation()
        test_code_search()
        print("\n[EXITO] Todas las herramientas de Agent-Reach operan al 100%.")
    except Exception as e:
        print(f"\n[ERROR] Fallo en la prueba: {e}")
        sys.exit(1)
