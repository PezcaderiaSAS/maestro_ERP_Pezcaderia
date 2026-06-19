const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'views', 'InventoryView.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Replace PurchaseOrderForm
const poStart = content.indexOf('{/* Entrada de Compra (Replenishment) */}');
const poEnd = content.indexOf('{/* Sección de Traslados */}');
if (poStart > -1 && poEnd > -1) {
  content = content.slice(0, poStart) +
    `<PurchaseOrderForm 
                compra={compra} 
                setCompra={setCompra} 
                proveedores={proveedores} 
                activeProducts={activeProducts} 
                handleProcesarCompra={handleProcesarCompra} 
              />\n              ` +
    content.slice(poEnd);
}

// 2. Replace TransferForm
const trStart = content.indexOf('{/* Sección de Traslados */}');
const trEnd = content.indexOf('</div>\n\n            {/* Columna Derecha: Control de Producción */}');
if (trStart > -1 && trEnd > -1) {
  content = content.slice(0, trStart) +
    `<TransferForm 
                traslado={traslado} 
                setTraslado={setTraslado} 
                activeProducts={activeProducts} 
                handleTraslado={handleTraslado} 
              />\n            ` +
    content.slice(trEnd);
}

// 3. Replace ProductionForm
const prStart = content.indexOf('<div className="hr-table-card" style={{ padding: \'24px\', flex: 1 }}>\n                <h3 style={{ fontSize: \'16px\', fontWeight: 800, marginBottom: \'20px\', display: \'flex\', alignItems: \'center\', gap: \'8px\' }}>\n                  <Package size={18} color="#00B171" /> Procesar Orden de Producción\n                </h3>');
const prEnd = content.indexOf('</div>\n            </div>\n          </div> {/* Fin del Grid de Operaciones */}');
if (prStart > -1 && prEnd > -1) {
  content = content.slice(0, prStart) +
    `<ProductionForm 
                prodMateriaPrima={prodMateriaPrima} 
                setProdMateriaPrima={setProdMateriaPrima} 
                prodMateriaCant={prodMateriaCant} 
                setProdMateriaCant={setProdMateriaCant} 
                prodTerminado={prodTerminado} 
                setProdTerminado={setProdTerminado} 
                prodTerminadoCant={prodTerminadoCant} 
                setProdTerminadoCant={setProdTerminadoCant} 
                mermaPct={mermaPct} 
                activeProducts={activeProducts} 
                handleProcesarProduccion={handleProcesarProduccion} 
              />\n              ` +
    content.slice(prEnd);
}

// 4. Replace ColdRoomPreparation
const crStart = content.indexOf('{viewMode === \'cuarto_frio\' && (\n        <div style={{ display: \'grid\', gridTemplateColumns: \'1fr 2fr\', gap: \'24px\', minHeight: \'500px\' }}>\n          {/* COLUMNA IZQUIERDA: LISTADO DE PEDIDOS PENDIENTES */}');
const crEnd = content.indexOf('{viewMode === \'recepcion_devoluciones\' && (');
if (crStart > -1 && crEnd > -1) {
  content = content.slice(0, crStart) +
    `{viewMode === 'cuarto_frio' && (
        <ColdRoomPreparation 
          quotations={quotations} 
          selectedQuoteId={selectedQuoteId} 
          setSelectedQuoteId={setSelectedQuoteId} 
          preparedWeights={preparedWeights} 
          setPreparedWeights={setPreparedWeights} 
          handleFinalizarAlistamiento={handleFinalizarAlistamiento} 
        />
      )}\n\n      ` +
    content.slice(crEnd);
}

// 5. Replace ReturnsReceiver
const rrStart = content.indexOf('{viewMode === \'recepcion_devoluciones\' && (\n        <div style={{ display: \'grid\', gridTemplateColumns: \'1fr 2fr\', gap: \'24px\', minHeight: \'500px\' }}>\n          {/* COLUMNA IZQUIERDA: LISTADO DE DEVOLUCIONES PROGRAMADAS */}');
const rrEnd = content.indexOf('{viewMode === \'catalogo\' && (');
if (rrStart > -1 && rrEnd > -1) {
  content = content.slice(0, rrStart) +
    `{viewMode === 'recepcion_devoluciones' && (
        <ReturnsReceiver 
          devoluciones={devoluciones} 
          selectedDevId={selectedDevId} 
          setSelectedDevId={setSelectedDevId} 
          receivedDevItems={receivedDevItems} 
          setReceivedDevItems={setReceivedDevItems} 
          handleProcesarRecepcionDevolucion={handleProcesarRecepcionDevolucion} 
        />
      )}\n\n      ` +
    content.slice(rrEnd);
}

// 6. Replace Catalogo
const catStart = content.indexOf('{viewMode === \'catalogo\' && (');
const catEnd = content.indexOf('{viewMode === \'categorias\' && (');
if (catStart > -1 && catEnd > -1) {
  content = content.slice(0, catStart) +
    `{viewMode === 'catalogo' && (
        <div>
          {(editingProductId || isCreating) ? (
            <ProductForm 
              editingProductId={editingProductId} 
              isCreating={isCreating} 
              productForm={productForm} 
              setProductForm={setProductForm} 
              customTipo={customTipo} 
              setCustomTipo={setCustomTipo} 
              customLinea={customLinea} 
              setCustomLinea={setCustomLinea} 
              customClase={customClase} 
              setCustomClase={setCustomClase} 
              isGeneratingImage={isGeneratingImage} 
              handleGenerateAIImage={handleGenerateAIImage} 
              handleSaveProduct={handleSaveProduct} 
              setEditingProductId={setEditingProductId} 
              setIsCreating={setIsCreating} 
              uniqueTipos={uniqueTipos} 
              uniqueLineas={uniqueLineas} 
              uniqueClases={uniqueClases} 
              stock={stock} 
            />
          ) : (
            <ProductTable 
              products={products} 
              stock={stock} 
              searchTerm={searchTerm} 
              setSearchTerm={setSearchTerm} 
              statusFilter={statusFilter} 
              setStatusFilter={setStatusFilter} 
              setEditingProductId={setEditingProductId} 
              setIsCreating={setIsCreating} 
              setProductForm={setProductForm} 
              setCustomTipo={setCustomTipo} 
              setCustomLinea={setCustomLinea} 
              setCustomClase={setCustomClase} 
              productsCatalog={productsCatalog} 
              setProductsCatalog={setProductsCatalog} 
            />
          )}
        </div>
      )}\n\n      ` +
    content.slice(catEnd);
}

// 7. Replace Categorias
const cateStart = content.indexOf('{viewMode === \'categorias\' && (');
const cateEnd = content.lastIndexOf('</div>\n  );\n}');
if (cateStart > -1 && cateEnd > -1) {
  content = content.slice(0, cateStart) +
    `{viewMode === 'categorias' && (
        <CategoryManager 
          categorias={categorias} 
          categorySearch={categorySearch} 
          setCategorySearch={setCategorySearch} 
          categoryForm={categoryForm} 
          setCategoryForm={setCategoryForm} 
          editingCategoryId={editingCategoryId} 
          setEditingCategoryId={setEditingCategoryId} 
          handleSaveCategory={handleSaveCategory} 
          handleDeleteCategory={handleDeleteCategory} 
        />
      )}\n    ` +
    content.slice(cateEnd);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Refactor completed successfully!');
