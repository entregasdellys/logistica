const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzECNzbr4SJYbfMbuxXNmEIedjFeErItj_nmqXoATDkvBrbXrqm-9hI_Jih9GuAaOYy/exec";

const DB_NAME = "DellysLogisticaDB";
const DB_VERSION = 1;
const STORE_CREDITOS = "creditos_pendentes";

function abrirBanco() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_CREDITOS)) {
                const store = db.createObjectStore(STORE_CREDITOS, { keyPath: "local_id", autoIncrement: true });
                store.createIndex("status", "status", { unique: false });
                store.createIndex("uuid", "ID", { unique: false });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject("Erro ao abrir banco de dados local: " + event.target.error);
    });
}

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
                // Checa duplicidade por NF + Cliente + Código de Produto + Descrição
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