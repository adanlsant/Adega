// ===================================================================================
// INICIALIZAÇÃO DO FIREBASE (VERSÃO MODULAR)
// ===================================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc, writeBatch, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ⚠️ COLE SUAS CHAVES DE CONFIGURAÇÃO DO FIREBASE AQUI ⚠️
const firebaseConfig = {
    apiKey: "AIzaSyAugst6eZJm3gEe9fk4ycttXDF7IrnARv0",
    authDomain: "adega-1602.firebaseapp.com",
    projectId: "adega-1602",
    storageBucket: "adega-1602.firebasestorage.app",
    messagingSenderId: "639795931729",
    appId: "1:639795931729:web:42a0e5c910cdfd4fb3a670"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ===================================================================================
// GUARDA DE AUTENTICAÇÃO
// ===================================================================================
onAuthStateChanged(auth, user => {
    const isOnLoginPage = window.location.pathname.endsWith('login.html');
    if (user && isOnLoginPage) { window.location.href = 'index.html'; }
    else if (!user && !isOnLoginPage) { window.location.href = 'login.html'; }
});

// ===================================================================================
// UTILIDADES GERAIS
// ===================================================================================
const BRL = n => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDateTime = ms => new Date(ms).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function showMessage(msg, type = "success") {
    const box = document.createElement('div');
    box.className = `message-box ${type}`;
    box.textContent = msg;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3000);
}

// ===================================================================================
// LÓGICA DA APLICAÇÃO (SEPARADA POR PÁGINA)
// ===================================================================================
const loginForm = document.querySelector('#login-form');

if (loginForm) {
    // --- CÓDIGO DA PÁGINA DE LOGIN ---
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const loginMessageDiv = document.getElementById('login-message');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showMessage('Login bem-sucedido! Redirecionando...', 'success');
        } catch (error) {
            loginMessageDiv.textContent = 'E-mail ou senha inválidos.';
        }
    });
} else {
    // --- CÓDIGO DA PÁGINA DO PAINEL ---

    // --- SELETORES DE ELEMENTOS ---
    const logoutBtn = document.querySelector('#logout-btn'); // NOVO SELETOR
    const stockListDiv = document.querySelector('#stock-list');
    const productSelect = document.querySelector('#product-select');
    const addNewProductBtn = document.querySelector('#add-new-product');
    const modal = document.querySelector('#product-type-modal');
    const newDrinkBtn = document.querySelector('#new-drink-btn');
    const newItemBtn = document.querySelector('#new-item-btn');
    const cancelNewProduct = document.querySelector('#cancel-new-product');
    const addToCartBtn = document.querySelector('#add-to-cart-btn');
    const currentListSalesDiv = document.querySelector('#current-list-sales');
    const totalCostSalesSpan = document.querySelector('#total-cost-sales');
    const finalizePurchaseSalesBtn = document.querySelector('#finalize-purchase-sales');
    const clearCartSalesBtn = document.querySelector('#clear-cart-sales');
    const purchaseHistorySalesDiv = document.querySelector('#purchase-history-sales');
    const toggleStockBtn = document.querySelector('#toggle-stock');
    const stockContentWrapper = document.querySelector('#stock-content-wrapper');
    const toggleHistorySalesBtn = document.querySelector('#toggle-history-sales');
    const historyContentWrapper = document.querySelector('#history-content-wrapper');
    const generatePdfSalesBtn = document.querySelector('#generate-pdf-sales');
    const stockSearchInput = document.querySelector('#stock-search-input');
    const addToCartSearchInput = document.querySelector('#add-to-cart-search');
    
    const expenseForm = document.querySelector('#expense-form');
    const expenseItemNameInput = document.querySelector('#item-name-expense');
    const expenseItemQuantityInput = document.querySelector('#item-quantity-expense');
    const expenseItemCostInput = document.querySelector('#item-cost-expense');
    const currentListExpenseDiv = document.querySelector('#current-list-expense');
    const totalCostExpenseSpan = document.querySelector('#total-cost-expense');
    const finalizePurchaseExpenseBtn = document.querySelector('#finalize-purchase-expense');
    const purchaseHistoryExpenseDiv = document.querySelector('#purchase-history-expense');
    const generatePdfExpenseBtn = document.querySelector('#generate-pdf-expense');
    const toggleHistoryExpenseBtn = document.querySelector('#toggle-history-expense');
    const expenseHistoryContentWrapper = document.querySelector('#expense-history-content-wrapper');

    // --- CONTROLE DE DADOS ---
    let stockDataCache = [];
    let salesCart = [];
    let salesHistoryCache = [];
    let expenseCart = [];
    let expenseHistoryCache = [];

    // --- FUNÇÕES DE LÓGICA ---
    async function getStockData() { try { const snapshot = await getDocs(collection(db, 'estoque')); stockDataCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); } catch (error) { showMessage("Erro ao carregar estoque.", "error"); } }
    async function loadSalesHistory() { try { const q = query(collection(db, "historicoVendas"), orderBy("data", "desc")); const snapshot = await getDocs(q); salesHistoryCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderSalesHistory(); } catch (error) { showMessage("Erro ao carregar histórico de vendas.", "error"); } }
    async function loadExpenseHistory() { try { const q = query(collection(db, "historicoCompras"), orderBy("data", "desc")); const snapshot = await getDocs(q); expenseHistoryCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderExpenseHistory(); } catch (error) { showMessage("Erro ao carregar histórico de despesas.", "error"); } }

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    function renderSalesHistory() { purchaseHistorySalesDiv.innerHTML = ''; if (salesHistoryCache.length === 0) { purchaseHistorySalesDiv.innerHTML = '<p class="text-center text-gray-500">Nenhuma venda registrada ainda.</p>'; return; } salesHistoryCache.forEach(venda => { const vendaDiv = document.createElement('div'); vendaDiv.className = 'p-3 bg-white/90 rounded-lg shadow-sm border border-gray-200/80'; const itemsList = venda.items.map(item => `<li class="flex justify-between text-sm"><span>${item.quantidade}x ${item.nome}</span><span class="text-gray-600">${BRL(item.preco * item.quantidade)}</span></li>`).join(''); vendaDiv.innerHTML = `<div class="flex justify-between items-start mb-2"><div><span class="font-bold text-gray-800">${formatDateTime(venda.data)}</span><span class="font-extrabold text-blue-600 text-lg ml-4">${BRL(venda.total)}</span></div><div class="flex items-center space-x-3"><button data-id="${venda.id}" class="edit-history-btn text-blue-500 hover:text-blue-700" title="Editar Venda">✏️</button><button data-id="${venda.id}" class="delete-history-btn text-red-500 hover:text-red-700" title="Apagar Venda">🗑️</button></div></div><ul class="space-y-1">${itemsList}</ul>`; purchaseHistorySalesDiv.appendChild(vendaDiv); }); document.querySelectorAll('.delete-history-btn').forEach(btn => btn.addEventListener('click', handleDeleteSaleHistory)); document.querySelectorAll('.edit-history-btn').forEach(btn => btn.addEventListener('click', handleEditSaleHistory)); }
    function renderStock() { stockListDiv.innerHTML = ''; const searchTerm = stockSearchInput.value.toLowerCase().trim(); const filteredStock = stockDataCache.filter(item => item.nome.toLowerCase().includes(searchTerm)); if (filteredStock.length === 0) { stockListDiv.innerHTML = `<p class="text-center text-gray-500 p-4">Nenhum produto encontrado.</p>`; return; } const sortedStock = [...filteredStock].sort((a, b) => a.nome.localeCompare(b.nome)); sortedStock.forEach(item => { const div = document.createElement('div'); div.className = "flex justify-between items-center p-3 bg-white/80 rounded shadow flex-col sm:flex-row sm:space-x-4"; const quantityInput = item.quantidadeEstoque === Infinity ? `<span class="py-1">∞</span>` : `<input type="number" value="${item.quantidadeEstoque}" data-id="${item.id}" class="stock-qty-input border rounded px-2 py-1 text-sm w-full" />`; div.innerHTML = `<div class="flex flex-col sm:flex-row sm:space-x-4 w-full"><div class="flex flex-col w-full sm:w-40 mb-1"><span class="text-xs text-gray-500">Produto</span><input type="text" value="${item.nome}" data-id="${item.id}" class="stock-name-input border rounded px-2 py-1 text-sm w-full" /></div><div class="flex flex-col w-full sm:w-20 mb-1"><span class="text-xs text-gray-500">Preço</span><input type="number" value="${item.preco}" step="0.01" data-id="${item.id}" class="stock-price-input border rounded px-2 py-1 text-sm w-full" /></div><div class="flex flex-col w-full sm:w-20 mb-1 text-center"><span class="text-xs text-gray-500">Estoque</span>${quantityInput}</div></div><div class="flex space-x-2 mt-2 text-lg"><button data-id="${item.id}" class="delete-stock-btn text-red-500 hover:text-red-700 font-semibold text-sm">🗑️</button></div>`; stockListDiv.appendChild(div); const nameInput = div.querySelector('.stock-name-input'); const priceInput = div.querySelector('.stock-price-input'); const qtyInput = div.querySelector('.stock-qty-input'); const deleteBtn = div.querySelector('.delete-stock-btn'); const updateItemInDB = async (id, field, value) => { try { await updateDoc(doc(db, 'estoque', id), { [field]: value }); showMessage('Item atualizado!', 'success'); const itemInCache = stockDataCache.find(i => i.id === id); if (itemInCache) itemInCache[field] = value; renderDropdown(); } catch (error) { showMessage('Erro ao atualizar item.', 'error'); } }; nameInput.addEventListener('change', () => updateItemInDB(nameInput.dataset.id, 'nome', nameInput.value)); priceInput.addEventListener('change', () => updateItemInDB(priceInput.dataset.id, 'preco', parseFloat(priceInput.value) || 0)); if (qtyInput) { qtyInput.addEventListener('change', () => updateItemInDB(qtyInput.dataset.id, 'quantidadeEstoque', parseInt(qtyInput.value) || 0)); } deleteBtn.addEventListener('click', async () => { if (confirm(`Tem certeza que deseja apagar o item "${item.nome}"?`)) { try { await deleteDoc(doc(db, 'estoque', deleteBtn.dataset.id)); showMessage('Item apagado com sucesso!', 'success'); await initializePanel(); } catch (error) { showMessage('Erro ao apagar o item.', 'error'); } } }); }); }
    
    function renderDropdown() {
        const lastSelectedId = productSelect.value;
        productSelect.innerHTML = '';
        const searchTerm = addToCartSearchInput.value.toLowerCase().trim();
        const filteredStock = stockDataCache.filter(item => item.nome.toLowerCase().includes(searchTerm));
        const sortedStock = [...filteredStock].sort((a, b) => a.nome.localeCompare(b.nome));
        sortedStock.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            const stockText = item.quantidadeEstoque === Infinity ? '∞' : item.quantidadeEstoque;
            option.textContent = `${item.nome} (${stockText})`;
            if (item.quantidadeEstoque !== Infinity && item.quantidadeEstoque <= 0) {
                option.disabled = true;
            }
            productSelect.appendChild(option);
        });
        if (lastSelectedId) productSelect.value = lastSelectedId;
    }

    function renderSalesCart() { currentListSalesDiv.innerHTML = ''; salesCart.forEach((item, index) => { const div = document.createElement('div'); div.className = "flex justify-between items-center p-2 bg-white rounded"; div.innerHTML = `<div class="flex-grow">${item.nome}</div><div class="flex items-center space-x-2"><span>${item.quantidade}x</span><span class="font-semibold">${BRL(item.preco * item.quantidade)}</span><button data-index="${index}" class="remove-from-cart-btn text-red-500 hover:text-red-700">🗑️</button></div>`; currentListSalesDiv.appendChild(div); }); document.querySelectorAll('.remove-from-cart-btn').forEach(btn => btn.addEventListener('click', handleRemoveFromCart)); updateSalesTotal(); }
    
    function renderExpenseCart() { currentListExpenseDiv.innerHTML = ''; expenseCart.forEach((item, index) => { const div = document.createElement('div'); div.className = "flex justify-between items-center p-2 bg-white rounded"; div.innerHTML = `<div class="flex-grow">${item.quantidade}x ${item.nome}</div><div class="flex items-center space-x-2"><span class="font-semibold">${BRL(item.custo)}</span><button data-index="${index}" class="remove-from-expense-cart-btn text-red-500 hover:text-red-700">🗑️</button></div>`; currentListExpenseDiv.appendChild(div); }); document.querySelectorAll('.remove-from-expense-cart-btn').forEach(btn => { btn.addEventListener('click', (e) => { expenseCart.splice(e.target.dataset.index, 1); renderExpenseCart(); }); }); updateExpenseTotal(); }
    function renderExpenseHistory() { purchaseHistoryExpenseDiv.innerHTML = ''; if (expenseHistoryCache.length === 0) { purchaseHistoryExpenseDiv.innerHTML = '<p class="text-center text-gray-500">Nenhuma despesa registrada.</p>'; return; } expenseHistoryCache.forEach(compra => { const div = document.createElement('div'); div.className = 'p-3 bg-white/90 rounded-lg shadow-sm border border-gray-200/80'; const itemsList = compra.items.map(item => `<li class="flex justify-between text-sm"><span>${item.quantidade}x ${item.nome}</span><span class="text-gray-600">${BRL(item.custo)}</span></li>`).join(''); div.innerHTML = `<div class="flex justify-between items-start mb-2"><div><span class="font-bold text-gray-800">${formatDateTime(compra.data)}</span><span class="font-extrabold text-red-600 text-lg ml-4">${BRL(compra.total)}</span></div><div class="flex items-center space-x-3"><button data-id="${compra.id}" class="edit-expense-history-btn text-blue-500 hover:text-blue-700" title="Editar Compra">✏️</button><button data-id="${compra.id}" class="delete-expense-history-btn text-red-500 hover:text-red-700" title="Apagar Compra">🗑️</button></div></div><ul class="space-y-1">${itemsList}</ul>`; purchaseHistoryExpenseDiv.appendChild(div); }); document.querySelectorAll('.delete-expense-history-btn').forEach(btn => btn.addEventListener('click', handleDeleteExpenseHistory)); document.querySelectorAll('.edit-expense-history-btn').forEach(btn => btn.addEventListener('click', handleEditExpenseHistory)); }

    // --- FUNÇÕES DE LÓGICA ---
    async function handleLogout() { // NOVA FUNÇÃO
        try {
            await signOut(auth);
            showMessage('Você foi desconectado com sucesso.', 'success');
            // O onAuthStateChanged irá redirecionar automaticamente.
        } catch (error) {
            showMessage('Erro ao tentar sair.', 'error');
        }
    }

    function updateSalesTotal() { const total = salesCart.reduce((sum, item) => sum + (item.preco * item.quantidade), 0); totalCostSalesSpan.textContent = `Total: ${BRL(total)}`; }
    function updateExpenseTotal() { const total = expenseCart.reduce((sum, item) => sum + item.custo, 0); totalCostExpenseSpan.textContent = `Total: ${BRL(total)}`; }
    function handleAddToCart() { const lastSelectedId = productSelect.value; if (!lastSelectedId) return; const productInStock = stockDataCache.find(p => p.id === lastSelectedId); if (productInStock.quantidadeEstoque !== Infinity && productInStock.quantidadeEstoque < 1) { showMessage('Produto sem estoque!', 'error'); return; } if (productInStock.quantidadeEstoque !== Infinity) productInStock.quantidadeEstoque--; const itemInCart = salesCart.find(item => item.id === lastSelectedId); if (itemInCart) { itemInCart.quantidade++; } else { const productToAdd = { ...productInStock, quantidade: 1 }; delete productToAdd.quantidadeEstoque; salesCart.push(productToAdd); } renderSalesCart(); renderDropdown(); renderStock(); productSelect.value = lastSelectedId; }
    function handleRemoveFromCart(event) { const index = event.target.dataset.index; const item = salesCart[index]; const productInStock = stockDataCache.find(p => p.id === item.id); if (productInStock && productInStock.quantidadeEstoque !== Infinity) { productInStock.quantidadeEstoque += item.quantidade; } salesCart.splice(index, 1); renderSalesCart(); renderDropdown(); renderStock(); }
    function clearSalesCart() { salesCart.forEach(item => { const productInStock = stockDataCache.find(p => p.id === item.id); if (productInStock && productInStock.quantidadeEstoque !== Infinity) { productInStock.quantidadeEstoque += item.quantidade; } }); salesCart = []; renderSalesCart(); renderDropdown(); renderStock(); }
    async function finalizeSale() { if (salesCart.length === 0) { showMessage('Carrinho está vazio!', 'error'); return; } try { const batch = writeBatch(db); salesCart.forEach(cartItem => { const productInStock = stockDataCache.find(p => p.id === cartItem.id); if (productInStock && productInStock.quantidadeEstoque !== Infinity) { const docRef = doc(db, 'estoque', cartItem.id); batch.update(docRef, { quantidadeEstoque: productInStock.quantidadeEstoque }); } }); await batch.commit(); const total = salesCart.reduce((sum, item) => sum + (item.preco * item.quantidade), 0); await addDoc(collection(db, 'historicoVendas'), { items: salesCart, total: total, data: Date.now() }); showMessage('Venda finalizada com sucesso!', 'success'); salesCart = []; renderSalesCart(); renderStock(); renderDropdown(); await loadSalesHistory(); } catch (error) { showMessage('Erro ao finalizar a venda.', 'error'); await initializePanel(); } }
    async function handleDeleteSaleHistory(event) { if (confirm("Tem certeza? A ação não pode ser desfeita e não retorna itens ao estoque.")) { try { await deleteDoc(doc(db, 'historicoVendas', event.target.dataset.id)); showMessage('Registro de venda apagado.', 'success'); await loadSalesHistory(); } catch (error) { showMessage('Erro ao apagar o registro.', 'error'); } } }
    async function handleEditSaleHistory(event) { if (confirm("Isso irá apagar a venda antiga e carregar os itens no carrinho para edição. Deseja continuar?")) { const saleToEdit = salesHistoryCache.find(v => v.id === event.target.dataset.id); if (!saleToEdit) return; try { await deleteDoc(doc(db, 'historicoVendas', saleToEdit.id)); clearSalesCart(); salesCart = saleToEdit.items; salesCart.forEach(item => { const productInStock = stockDataCache.find(p => p.id === item.id); if (productInStock && productInStock.quantidadeEstoque !== Infinity) { productInStock.quantidadeEstoque -= item.quantidade; } }); renderSalesCart(); renderStock(); renderDropdown(); await loadSalesHistory(); showMessage('Venda carregada no carrinho para edição.', 'success'); } catch (error) { showMessage('Erro ao carregar venda para edição.', 'error'); } } }
    function generateSalesHistoryPDF() { if (salesHistoryCache.length === 0) { showMessage('Não há histórico para gerar PDF.', 'error'); return; } const { jsPDF } = window.jspdf; const doc = new jsPDF(); let y = 15; const pageHeight = doc.internal.pageSize.height; doc.setFontSize(18); doc.text("Histórico de Vendas da Adega", 10, y); y += 10; salesHistoryCache.forEach(venda => { const blockHeight = (venda.items.length + 1) * 7 + 10; if (y + blockHeight > pageHeight - 10) { doc.addPage(); y = 15; } doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text(`${formatDateTime(venda.data)} - Total: ${BRL(venda.total)}`, 10, y); y += 7; doc.setFontSize(10); doc.setFont('helvetica', 'normal'); venda.items.forEach(item => { doc.text(`${item.quantidade}x ${item.nome} .................... ${BRL(item.preco * item.quantidade)}`, 15, y); y += 7; }); y += 5; }); doc.save(`historico_vendas_${new Date().toISOString().slice(0,10)}.pdf`); showMessage('PDF gerado com sucesso!', 'success'); }
    
    function handleAddExpenseItem(event) {
        event.preventDefault();
        const nome = expenseItemNameInput.value.trim();
        const quantidade = parseInt(expenseItemQuantityInput.value);
        const custoUnitario = parseFloat(expenseItemCostInput.value);
        if (!nome || isNaN(quantidade) || isNaN(custoUnitario) || quantidade <= 0 || custoUnitario < 0) { showMessage('Por favor, preencha todos os campos corretamente.', 'error'); return; }
        const custoTotal = quantidade * custoUnitario;
        expenseCart.push({ nome, quantidade, custo: custoTotal });
        renderExpenseCart();
        expenseForm.reset();
        expenseItemNameInput.focus();
    }
    async function finalizeExpensePurchase() { if (expenseCart.length === 0) { showMessage('Não há itens de compra para finalizar.', 'error'); return; } try { const total = expenseCart.reduce((sum, item) => sum + item.custo, 0); await addDoc(collection(db, 'historicoCompras'), { items: expenseCart, total: total, data: Date.now() }); showMessage('Compra/despesa registrada com sucesso!', 'success'); expenseCart = []; renderExpenseCart(); await loadExpenseHistory(); } catch (error) { showMessage('Erro ao registrar a compra.', 'error'); } }
    function generateExpenseHistoryPDF() { if (expenseHistoryCache.length === 0) { showMessage('Não há histórico de despesas para gerar PDF.', 'error'); return; } const { jsPDF } = window.jspdf; const doc = new jsPDF(); let y = 15; doc.setFontSize(18); doc.text("Histórico de Compras e Despesas", 10, y); y += 10; expenseHistoryCache.forEach(compra => { y += 5; doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text(`${formatDateTime(compra.data)} - Custo Total: ${BRL(compra.total)}`, 10, y); y += 7; doc.setFontSize(10); doc.setFont('helvetica', 'normal'); compra.items.forEach(item => { doc.text(`${item.quantidade}x ${item.nome} .................... ${BRL(item.custo)}`, 15, y); y += 7; }); }); doc.save(`historico_despesas_${new Date().toISOString().slice(0,10)}.pdf`); showMessage('PDF de despesas gerado!', 'success'); }

    async function handleDeleteExpenseHistory(event) { if (confirm("Tem certeza que deseja apagar este registro de despesa?")) { try { await deleteDoc(doc(db, 'historicoCompras', event.target.dataset.id)); showMessage('Registro de despesa apagado.', 'success'); await loadExpenseHistory(); } catch (error) { showMessage('Erro ao apagar o registro.', 'error'); } } }

    async function handleEditExpenseHistory(event) {
        const expenseToEdit = expenseHistoryCache.find(e => e.id === event.target.dataset.id);
        if (!expenseToEdit) return;
        if (expenseToEdit.items.length > 1) { showMessage('Compras com múltiplos itens não podem ser editadas. Por favor, apague e crie novamente.', 'error'); return; }
        if (confirm("Isso irá carregar este item no formulário para edição e apagar o registro antigo. Deseja continuar?")) {
            try {
                const itemToEdit = expenseToEdit.items[0];
                expenseItemNameInput.value = itemToEdit.nome;
                expenseItemQuantityInput.value = itemToEdit.quantidade;
                expenseItemCostInput.value = itemToEdit.custo / itemToEdit.quantidade;
                await deleteDoc(doc(db, 'historicoCompras', expenseToEdit.id));
                await loadExpenseHistory();
                showMessage('Item carregado no formulário para edição. Adicione-o novamente após corrigir.', 'success');
                expenseItemNameInput.focus();
            } catch (error) { showMessage('Erro ao carregar compra para edição.', 'error'); }
        }
    }

    // --- LÓGICA DE EVENTOS ---
    if (logoutBtn) { logoutBtn.addEventListener('click', handleLogout); } // NOVO EVENTO
    if (toggleStockBtn) { toggleStockBtn.addEventListener('click', () => { const isHidden = stockContentWrapper.style.display === 'none'; stockContentWrapper.style.display = isHidden ? 'block' : 'none'; toggleStockBtn.textContent = isHidden ? 'Minimizar' : 'Expandir'; }); }
    if (toggleHistorySalesBtn) { toggleHistorySalesBtn.addEventListener('click', () => { const isHidden = historyContentWrapper.style.display === 'none'; historyContentWrapper.style.display = isHidden ? 'block' : 'none'; toggleHistorySalesBtn.textContent = isHidden ? 'Minimizar' : 'Expandir'; }); }
    if (toggleHistoryExpenseBtn) { toggleHistoryExpenseBtn.addEventListener('click', () => { const isHidden = expenseHistoryContentWrapper.style.display === 'none'; expenseHistoryContentWrapper.style.display = isHidden ? 'block' : 'none'; toggleHistoryExpenseBtn.textContent = isHidden ? 'Minimizar' : 'Expandir'; }); }
    if (addNewProductBtn) addNewProductBtn.addEventListener('click', () => modal.classList.remove('hidden'));
    if (cancelNewProduct) cancelNewProduct.addEventListener('click', () => modal.classList.add('hidden'));
    async function addNewItemToDB(itemData) { try { await addDoc(collection(db, 'estoque'), itemData); showMessage('Produto adicionado com sucesso!', 'success'); await initializePanel(); } catch (error) { showMessage('Erro ao adicionar produto.', 'error'); } modal.classList.add('hidden'); }
    if (newDrinkBtn) newDrinkBtn.addEventListener('click', () => addNewItemToDB({ nome: 'Novo Drink', preco: 15.00, quantidadeEstoque: Infinity }));
    if (newItemBtn) newItemBtn.addEventListener('click', () => addNewItemToDB({ nome: 'Novo Item', preco: 10.00, quantidadeEstoque: 0 }));
    if (addToCartBtn) addToCartBtn.addEventListener('click', handleAddToCart);
    if (clearCartSalesBtn) clearCartSalesBtn.addEventListener('click', clearSalesCart);
    if (finalizePurchaseSalesBtn) finalizePurchaseSalesBtn.addEventListener('click', finalizeSale);
    if (generatePdfSalesBtn) generatePdfSalesBtn.addEventListener('click', generateSalesHistoryPDF);
    if (stockSearchInput) { stockSearchInput.addEventListener('input', () => { renderStock(); if (stockContentWrapper.style.display === 'none') { stockContentWrapper.style.display = 'block'; toggleStockBtn.textContent = 'Minimizar'; } }); }
    
    if (addToCartSearchInput) {
        addToCartSearchInput.addEventListener('input', renderDropdown);
    }

    if (expenseForm) expenseForm.addEventListener('submit', handleAddExpenseItem);
    if (finalizePurchaseExpenseBtn) finalizePurchaseExpenseBtn.addEventListener('click', finalizeExpensePurchase);
    if (generatePdfExpenseBtn) generatePdfExpenseBtn.addEventListener('click', generateExpenseHistoryPDF);

    // --- INICIALIZAÇÃO DO PAINEL ---
    async function initializePanel() {
        await getStockData();
        renderStock();
        renderDropdown();
        renderSalesCart();
        await loadSalesHistory();
        renderExpenseCart();
        await loadExpenseHistory();
    }
    initializePanel();
}