const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzECNzbr4SJYbfMbuxXNmEIedjFeErItj_nmqXoATDkvBrbXrqm-9hI_Jih9GuAaOYy/exec";

const DB_NAME = "DellysLogisticaDB";
const DB_VERSION = 2; // Atualizado para a versão 2 do banco
const STORE_CREDITOS = "creditos_pendentes";
const STORE_PRODUTOS = "produtos_cadastro";

// Função para abrir o IndexedDB
function abrirBanco() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Mantém a estrutura de créditos pendentes
            if (!db.objectStoreNames.contains(STORE_CREDITOS)) {
                const store = db.createObjectStore(STORE_CREDITOS, { keyPath: "local_id", autoIncrement: true });
                store.createIndex("status", "status", { unique: false });
                store.createIndex("uuid", "ID", { unique: false });
            }

            // Cria o armazenamento local de produtos cadastro
            if (!db.objectStoreNames.contains(STORE_PRODUTOS)) {
                const storeProd = db.createObjectStore(STORE_PRODUTOS, { keyPath: "codigo" });
                storeProd.createIndex("descricao", "descricao", { unique: false });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject("Erro ao abrir banco de dados local: " + event.target.error);
    });
}

/**
 * Salva/Atualiza a lista completa de produtos vinda da planilha no banco local do celular
 */
async function atualizarCadastroProdutosLocal(listaProdutos) {
    try {
        const db = await abrirBanco();
        const tx = db.transaction(STORE_PRODUTOS, "readwrite");
        const store = tx.objectStore(STORE_PRODUTOS);

        listaProdutos.forEach(prod => {
            if (prod.codigo) {
                store.put({
                    codigo: prod.codigo.toString().trim(),
                    descricao: prod.descricao ? prod.descricao.toString().trim().toUpperCase() : ""
                });
            }
        });

        tx.oncomplete = () => console.log("Base local de produtos atualizada!");
    } catch (e) {
        console.error("Erro ao salvar cadastro de produtos localmente:", e);
    }
}

/**
 * Pesquisa um produto localmente no celular pelo Código ou Descrição (Funciona 100% Offline)
 */
async function buscarProdutoLocal(termo) {
    if (!termo) return null;
    const termoLimpo = termo.toString().trim().toUpperCase();

    try {
        const db = await abrirBanco();
        const tx = db.transaction(STORE_PRODUTOS, "readonly");
        const store = tx.objectStore(STORE_PRODUTOS);
        
        return new Promise((resolve) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const todos = request.result || [];
                // Busca por código exato ou por parte da descrição
                const encontrado = todos.find(p => 
                    p.codigo === termoLimpo || 
                    p.descricao.includes(termoLimpo)
                );
                resolve(encontrado || null);
            };
            request.onerror = () => resolve(null);
        });
    } catch (e) {
        return null;
    }
}

/**
 * Sincroniza a base de produtos da planilha para o celular sempre que houver internet
 */
async function sincronizarProdutosDoServidor() {
    if (!navigator.onLine) return;

    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?acao=obterProdutos`);
        const resData = await response.json();

        if (Array.isArray(resData) && resData.length > 0) {
            await atualizarCadastroProdutosLocal(resData);
        }
    } catch (err) {
        console.warn("Não foi possível carregar nova lista de produtos do servidor:", err);
    }
}

// Tenta atualizar a lista de produtos imediatamente ao carregar o app e quando a conexão voltar
sincronizarProdutosDoServidor();
window.addEventListener("online", sincronizarProdutosDoServidor);

// Salva o registro no IndexedDB ignorando itens com dados idênticos já gravados
async function salvarCreditoLocal(registrosArray) {
    try {
        const db = await abrirBanco();
        const tx = db.transaction(STORE_CREDITOS, "readwrite");
        const store = tx.objectStore(STORE_CREDITOS);

        const requestGetAll = store.getAll();

        requestGetAll.onsuccess = () => {
            const existentes = requestGetAll.result || [];

            registrosArray.forEach(novoItem => {
                const jaExiste = existentes.some(item => 
                    item.NF === novoItem.NF && 
                    item.Cliente === novoItem.Cliente && 
                    item.CodProduto === novoItem.CodProduto &&
                    item.Descricao === novoItem.Descricao
                );

                if (!jaExiste) {
                    novoItem.status = "PENDENTE";
                    novoItem.criadoEm = new Date().toISOString();
                    store.add(novoItem);
                } else {
                    console.warn(`Registro duplicado bloqueado: NF ${novoItem.NF} - Item ${novoItem.CodProduto}`);
                }
            });
        };

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => {
                atualizarContadorPendentes();
                sincronizarCreditosComServidor();
                resolve(true);
            };
            tx.onerror = (err) => reject(err);
        });
    } catch (e) {
        console.error("Erro ao salvar localmente:", e);
    }
}

async function sincronizarCreditosComServidor() {
    if (!navigator.onLine) {
        console.log("Sem conexão no momento. Sincronização aguardará rede.");
        return;
    }

    try {
        const db = await abrirBanco();
        const tx = db.transaction(STORE_CREDITOS, "readonly");
        const store = tx.objectStore(STORE_CREDITOS);
        const request = store.getAll();

        request.onsuccess = async () => {
            const todos = request.result || [];
            const pendentes = todos.filter(item => item.status === "PENDENTE");

            if (pendentes.length === 0) {
                atualizarContadorPendentes();
                return;
            }

            console.log(`Enviando ${pendentes.length} registro(s) para o Google Sheets...`);

            try {
                const response = await fetch(GOOGLE_SCRIPT_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(pendentes)
                });

                const resData = await response.json();

                if (resData.status === "success") {
                    const txWrite = db.transaction(STORE_CREDITOS, "readwrite");
                    const storeWrite = txWrite.objectStore(STORE_CREDITOS);

                    pendentes.forEach(item => {
                        item.status = "SINCRONIZADO";
                        storeWrite.put(item);
                    });

                    txWrite.oncomplete = () => {
                        console.log("Sincronização concluída com sucesso!");
                        if (typeof exibirToast === "function") {
                            exibirToast("Dados sincronizados com a planilha!");
                        }
                        atualizarContadorPendentes();
                    };
                }
            } catch (errNet) {
                console.warn("Falha na tentativa de envio para o servidor:", errNet);
            }
        };
    } catch (e) {
        console.error("Erro no processo de sync:", e);
    }
}

async function atualizarContadorPendentes() {
    try {
        const db = await abrirBanco();
        const tx = db.transaction(STORE_CREDITOS, "readonly");
        const store = tx.objectStore(STORE_CREDITOS);
        const request = store.getAll();

        request.onsuccess = () => {
            const todos = request.result || [];
            const pendentes = todos.filter(item => item.status === "PENDENTE").length;
            
            const badge = document.getElementById("badge-sync-pendente");
            if (badge) {
                if (pendentes > 0) {
                    badge.textContent = `☁️ ${pendentes} pendente(s)`;
                    badge.style.display = "inline-block";
                } else {
                    badge.style.display = "none";
                }
            }
        };
    } catch (e) {
        // Silencioso se o banco ainda não existir
    }
}

window.addEventListener("online", () => {
    if (typeof exibirToast === "function") {
        exibirToast("Conexão restabelecida! Sincronizando...");
    }
    sincronizarCreditosComServidor();
});
