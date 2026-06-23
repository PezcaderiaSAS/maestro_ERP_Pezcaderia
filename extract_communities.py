import json

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

    with open("communities_extracted.json", "w", encoding="utf-8") as f:
        json.dump(communities, f, indent=2, ensure_ascii=False)
        
    print("¡Comunidades extraídas a communities_extracted.json con éxito!")

if __name__ == "__main__":
    main()
