import json
import urllib.request
import re
import os

API_KEY = os.environ.get("GEMINI_API_KEY", "")
API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"

def main():
    try:
        with open("graphify-out/graph.json", "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error al leer graph.json: {e}")
        return

    communities = {}
    for node in data.get("nodes", []):
        cid = node.get("community")
        if cid is not None:
            if cid not in communities:
                communities[cid] = []
            if len(communities[cid]) < 20: # Tomar solo los primeros 20 labels para no saturar
                communities[cid].append(node["label"])

    if not communities:
        print("No se encontraron comunidades en graph.json.")
        return

    prompt = (
        "Given the following clusters of files and symbols from a software project, "
        "provide a short, descriptive architectural name for each cluster in Spanish (max 4 words per name). "
        "For example, if you see '01_schema', 'bodegas', 'productos', name it 'Base de Datos'. "
        "Respond ONLY with a valid JSON dictionary where keys are the cluster IDs (as strings) and values are the generated names. "
        "Example: {\"0\": \"Base de Datos\", \"1\": \"Servicios de Auth\"}\n\n"
    )

    for cid, labels in communities.items():
        prompt += f"Cluster {cid}: {', '.join(labels)}\n"

    req_data = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }

    req = urllib.request.Request(API_URL, data=json.dumps(req_data).encode("utf-8"), headers={
        "Content-Type": "application/json",
        "X-goog-api-key": API_KEY
    })

    print("Analizando los nodos y solicitando nombres a la IA (Gemini)...")
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            content = res_json.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            
            # Limpiar por si el LLM incluye markdown
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
                
            new_names = json.loads(content)
            print("\nNombres generados exitosamente:")
            for k, v in new_names.items():
                print(f"  - Comunidad {k} -> {v}")
            
            # Actualizar graph.json
            for node in data.get("nodes", []):
                cid = str(node.get("community"))
                if cid in new_names:
                    node["community_name"] = new_names[cid]
            
            with open("graphify-out/graph.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                
            # Actualizar graph.html
            with open("graphify-out/graph.html", "r", encoding="utf-8") as f:
                html = f.read()
            
            for cid, new_name in new_names.items():
                html = html.replace(f'"Community {cid}"', f'"{new_name}"')
                html = html.replace(f'>Community {cid}<', f'>{new_name}<')

            with open("graphify-out/graph.html", "w", encoding="utf-8") as f:
                f.write(html)
                
            print("\n¡Archivos graph.json y graph.html actualizados con éxito!")
    except Exception as e:
        print(f"Error durante la actualización: {e}")

if __name__ == "__main__":
    main()
