/**
 * LÓGICA PRINCIPAL DO APLICATIVO DE OCORRÊNCIAS DE ENTREGA
 * JavaScript Puro (Vanilla JS)
 */

// Contador para IDs únicos dos campos dinâmicos
let itemCounter = 0;
let nfCounter = 0;

/* ==========================================================================
   1. NAVEGAÇÃO ENTRE TELAS
   ========================================================================== */

/**
 * Exibe a tela correspondente ao tipo de ocorrência selecionado.
 * @param {string} tipo - 'retorno', 'reentrega' ou 'credito'
 */
function abrirFormulario(tipo) {
    ocultarTodasTelas();
    
    const targetScreen = document.getElementById(`form-${tipo}`);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    // Inicialização de listas dinâmicas se estiverem vazias
    if (tipo === 'reentrega') {
        const container = document.getElementById('container-nfs-reentrega');
        if (container.children.length === 0) adicionarNF();
    } else if (tipo === 'credito') {
        const container = document.getElementById('container-itens-credito');
        if (container.children.length === 0) adicionarItem();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Retorna para a tela do menu inicial.
 */
function voltarMenu() {
    ocultarTodasTelas();
    document.getElementById('screen-menu').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Oculta todas as seções marcadas com a classe .screen
 */
function ocultarTodasTelas() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));
}

/* ==========================================================================
   2. TRATAMENTO DE CAMPOS CONDICIONAIS
   ========================================================================== */

/**
 * Exibe ou oculta o campo "Outro" de acordo com a seleção no dropdown.
 * @param {string} tipo - 'retorno', 'reentrega' ou 'credito'
 */
function tratarMotivoOutro(tipo) {
    const select = document.getElementById(`${tipo}-motivo`);
    const groupOutro = document.getElementById(`group-${tipo}-outro`);
    const inputOutro = document.getElementById(`${tipo}-outro`);

    if (select.value === 'Outro') {
        groupOutro.classList.remove('hidden');
        inputOutro.setAttribute('required', 'true');
        inputOutro.focus();
    } else {
        groupOutro.classList.add('hidden');
        inputOutro.removeAttribute('required');
        inputOutro.value = '';
    }
}

/* ==========================================================================
   3. GERENCIAMENTO DADOS DINÂMICOS (REENTREGA & CRÉDITO)
   ========================================================================== */

/**
 * Adiciona um novo campo de NF no formulário de Reentrega
 */
function adicionarNF() {
    nfCounter++;
    const container = document.getElementById('container-nfs-reentrega');
    
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.id = `nf-item-${nfCounter}`;
    
    div.innerHTML = `
        <input type="text" class="input-nf-reentrega" placeholder="Número da NF" inputmode="numeric" required>
        <button type="button" class="btn-remove" onclick="removerNF('nf-item-${nfCounter}')" title="Remover NF">✕</button>
    `;
    
    container.appendChild(div);
}

/**
 * Remove um campo de NF do formulário de Reentrega
 * @param {string} id - ID do elemento container da NF
 */
function removerNF(id) {
    const container = document.getElementById('container-nfs-reentrega');
    if (container.children.length > 1) {
        const item = document.getElementById(id);
        if (item) item.remove();
    } else {
        exibirToast("A reentrega precisa de pelo menos uma NF.");
    }
}

/**
 * Adiciona um conjunto de campos de Item no formulário de Crédito
 */
function adicionarItem() {
    itemCounter++;
    const container = document.getElementById('container-itens-credito');
    
    const div = document.createElement('div');
    div.className = 'dynamic-item dynamic-item-credito';
    div.id = `credit-item-${itemCounter}`;
    
    div.innerHTML = `
        <div class="dynamic-item-row">
            <input type="text" class="item-codigo" placeholder="Código (Opcional)" style="width: 40%;">
            <input type="text" class="item-descricao" placeholder="Descrição do produto *" style="width: 60%;" required>
        </div>
        <div class="dynamic-item-row">
            <input type="text" class="item-quantidade" placeholder="Quantidade *" inputmode="numeric" style="width: 70%;" required>
            <button type="button" class="btn-remove" onclick="removerItem('credit-item-${itemCounter}')" style="width: 30%;" title="Remover Item">✕</button>
        </div>
    `;
    
    container.appendChild(div);
}

/**
 * Remove um conjunto de campos de Item no formulário de Crédito
 * @param {string} id - ID do container do item
 */
function removerItem(id) {
    const container = document.getElementById('container-itens-credito');
    if (container.children.length > 1) {
        const item = document.getElementById(id);
        if (item) item.remove();
    } else {
        exibirToast("O registro de crédito precisa de pelo menos um item.");
    }
}

/* ==========================================================================
   4. MONTAGEM E VALIDAÇÃO DAS MENSAGENS
   ========================================================================== */

/**
 * Consolida os dados e constrói a mensagem formatada para WhatsApp sem linhas vazias.
 * @param {string} tipo - 'retorno', 'reentrega' ou 'credito'
 * @returns {string|null} Texto formatado ou null em caso de falha na validação.
 */
function gerarMensagem(tipo) {
    if (tipo === 'retorno') {
        const nf = document.getElementById('retorno-nf').value.trim();
        const cliente = document.getElementById('retorno-cliente').value.trim();
        const motivoSelect = document.getElementById('retorno-motivo').value;
        const motivoOutro = document.getElementById('retorno-outro').value.trim();

        if (!nf) { exibirToast("Informe a NF."); return null; }
        if (!cliente) { exibirToast("Informe o cliente."); return null; }
        if (!/^\d+$/.test(cliente)) { exibirToast("O campo cliente deve conter apenas números."); return null; }
        if (!motivoSelect) { exibirToast("Informe o motivo."); return null; }
        if (motivoSelect === 'Outro' && !motivoOutro) { exibirToast("Especifique o motivo."); return null; }

        const motivoFinal = motivoSelect === 'Outro' ? motivoOutro : motivoSelect;

        return `📦 *RETORNO*\n` +
               `*NF:* ${nf}\n` +
               `*CLIENTE:* ${cliente}\n` +
               `*MOTIVO:* ${motivoFinal}`;
    }

    if (tipo === 'reentrega') {
        const motivoSelect = document.getElementById('reentrega-motivo').value;
        const motivoOutro = document.getElementById('reentrega-outro').value.trim();

        const nfInputs = document.querySelectorAll('.input-nf-reentrega');
        const nfs = Array.from(nfInputs).map(input => input.value.trim()).filter(val => val !== '');

        if (nfs.length === 0) { exibirToast("Adicione pelo menos uma NF."); return null; }
        if (!motivoSelect) { exibirToast("Informe o motivo."); return null; }
        if (motivoSelect === 'Outro' && !motivoOutro) { exibirToast("Especifique o motivo."); return null; }

        const motivoFinal = motivoSelect === 'Outro' ? motivoOutro : motivoSelect;
        const listaNfsTexto = nfs.join('\n');

        return `🚚 *REENTREGA*\n` +
               `*NF(s):*\n${listaNfsTexto}\n` +
               `*MOTIVO:* ${motivoFinal}`;
    }

    if (tipo === 'credito') {
        const nf = document.getElementById('credito-nf').value.trim();
        const cliente = document.getElementById('credito-cliente').value.trim();
        const motivoSelect = document.getElementById('credito-motivo').value;
        const motivoOutro = document.getElementById('credito-outro').value.trim();
        const obs = document.getElementById('credito-obs').value.trim();

        if (!nf) { exibirToast("Informe a NF."); return null; }
        if (!cliente) { exibirToast("Informe o cliente."); return null; }
        if (!/^\d+$/.test(cliente)) { exibirToast("O campo cliente deve conter apenas números."); return null; }

        // Coleta dos Itens
        const itemRows = document.querySelectorAll('#container-itens-credito .dynamic-item');
        const itensColetados = [];

        for (let row of itemRows) {
            const cod = row.querySelector('.item-codigo').value.trim();
            const desc = row.querySelector('.item-descricao').value.trim();
            const qtd = row.querySelector('.item-quantidade').value.trim();

            if (!desc || !qtd) {
                exibirToast("Preencha a descrição e quantidade de todos os itens.");
                return null;
            }

            itensColetados.push({ cod, desc, qtd });
        }

        if (itensColetados.length === 0) {
            exibirToast("Adicione pelo menos um item.");
            return null;
        }

        if (!motivoSelect) { exibirToast("Informe o motivo."); return null; }
        if (motivoSelect === 'Outro' && !motivoOutro) { exibirToast("Especifique o motivo."); return null; }

        const motivoFinal = motivoSelect === 'Outro' ? motivoOutro : motivoSelect;

        let itensTexto = itensColetados.map(i => {
            const codTexto = i.cod ? `[${i.cod}] ` : '';
            return `• *Produto:* ${codTexto}${i.desc}\n  *Quantidade:* ${i.qtd}`;
        }).join('\n');

        let msg = `💳 *CRÉDITO*\n` +
               `*NF:* ${nf}\n` +
               `*CLIENTE:* ${cliente}\n` +
               `*ITENS:*\n${itensTexto}\n` +
               `*MOTIVO:* ${motivoFinal}`;

        if (obs) {
            msg += `\n*OBS:* ${obs}`;
        }

        return msg;
    }

    return null;
}

/* ==========================================================================
   5. AÇÕES (ENVIAR, COPIAR, LIMPAR)
   ========================================================================== */

/**
 * Gera a mensagem, aplica a codificação URL e redireciona para o WhatsApp.
 * @param {string} tipo - 'retorno', 'reentrega' ou 'credito'
 */
function enviarWhatsApp(tipo) {
    const mensagem = gerarMensagem(tipo);
    if (!mensagem) return;

    const textoCodificado = encodeURIComponent(mensagem);
    const urlWhatsApp = `https://api.whatsapp.com/send?text=${textoCodificado}`;
    
    window.open(urlWhatsApp, '_blank');
}

/**
 * Copia a mensagem formatada para a área de transferência do dispositivo.
 * @param {string} tipo - 'retorno', 'reentrega' ou 'credito'
 */
function copiarMensagem(tipo) {
    const mensagem = gerarMensagem(tipo);
    if (!mensagem) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mensagem).then(() => {
            exibirToast("Mensagem copiada com sucesso!");
        }).catch(() => {
            copiarFallback(mensagem);
        });
    } else {
        copiarFallback(mensagem);
    }
}

/**
 * Fallback de cópia para navegadores mais antigos/restritivos.
 */
function copiarFallback(texto) {
    const textarea = document.createElement("textarea");
    textarea.value = texto;
    textarea.style.position = "fixed";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
        document.execCommand('copy');
        exibirToast("Mensagem copiada com sucesso!");
    } catch (err) {
        exibirToast("Erro ao copiar mensagem.");
    }
    document.body.removeChild(textarea);
}

/**
 * Limpa todos os campos da tela ativa e reseta as listas dinâmicas.
 * @param {string} tipo - 'retorno', 'reentrega' ou 'credito'
 */
function limparFormulario(tipo) {
    const form = document.getElementById(`form-data-${tipo}`);
    if (form) form.reset();

    const groupOutro = document.getElementById(`group-${tipo}-outro`);
    if (groupOutro) groupOutro.classList.add('hidden');

    if (tipo === 'reentrega') {
        document.getElementById('container-nfs-reentrega').innerHTML = '';
        adicionarNF();
    } else if (tipo === 'credito') {
        document.getElementById('container-itens-credito').innerHTML = '';
        adicionarItem();
    }

    exibirToast("Campos limpados.");
}

/* ==========================================================================
   6. UTILITÁRIOS E FEEDBACK
   ========================================================================== */

let toastTimeout;

/**
 * Exibe uma notificação flutuante rápida na tela.
 * @param {string} texto - Mensagem a ser exibida
 */
function exibirToast(texto) {
    const toast = document.getElementById('toast');
    toast.textContent = texto;
    toast.classList.remove('hidden');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 2500);
}
