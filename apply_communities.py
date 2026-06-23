import json

def main():
    new_names = {
        "18": "Optimizador de Prompts",
        "9": "Base de Datos Inicial",
        "16": "Inventario y Producción",
        "10": "Ventas y Facturación",
        "14": "Caja y Finanzas",
        "5": "Políticas y Seguridad",
        "19": "Recursos Humanos",
        "17": "Logística y Devoluciones",
        "2": "Configuración de Paquetes",
        "6": "Utilidades de Refactor",
        "8": "Migración de Datos",
        "20": "Pruebas de API",
        "0": "Aplicación Principal",
        "3": "Servicio de Caja",
        "7": "Nómina y RRHH",
        "15": "Integración de Balanza",
        "1": "Servicios Core",
        "12": "Pedidos B2B",
        "11": "Integración CRM",
        "24": "Pruebas de Compras",
        "13": "Reporte de Compras",
        "25": "Pruebas de Sanidad",
        "21": "Configuración de Pruebas",
        "23": "Hook de Inventario",
        "4": "Configuración TypeScript",
        "26": "Configuración Vite",
        "22": "Reglas de Negocio"
    }

    try:
        with open("graphify-out/graph.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            
        print("Actualizando graph.json...")
        for node in data.get("nodes", []):
            cid = str(node.get("community"))
            if cid in new_names:
                node["community_name"] = new_names[cid]
        
        with open("graphify-out/graph.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print("Actualizando graph.html...")
        with open("graphify-out/graph.html", "r", encoding="utf-8") as f:
            html = f.read()
        
        for cid, new_name in new_names.items():
            html = html.replace(f'"Community {cid}"', f'"{new_name}"')
            html = html.replace(f'>Community {cid}<', f'>{new_name}<')

        with open("graphify-out/graph.html", "w", encoding="utf-8") as f:
            f.write(html)
            
        print("\n¡Archivos graph.json y graph.html actualizados con éxito usando los nombres generados por la IA local!")
            
    except Exception as e:
        print(f"Error durante la actualización: {e}")

if __name__ == "__main__":
    main()
