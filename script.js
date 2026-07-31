/**
 * GERENCIADOR DE UUID / IDENTIFICADOR ÚNICO UNIVERSAL
 */
function gerarUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return 'CR-' + crypto.randomUUID().split('-')[0].toUpperCase();
    }
    const hash = 'xxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    return 'CR-' + hash.toUpperCase();
}

/**
 * GERENCIAMENTO DE IDENTIFICAÇÃO DO MOTORISTA (LOGIN DIÁRIO)
 */
document.addEventListener('DOMContentLoaded', () => {
    verificarSessaoDiaria();
});

function verificarSessaoDiaria() {
    const dataSalva = localStorage.getItem('login_data');
    const hoje = new Date().toLocaleDateString('pt-BR');

    if (dataSalva === hoje) {
        carregarDadosBarra();
        mostrarTela('screen-main');
    } else {
        mostrarTela('screen-login');
    }
}

function salvarIdentificacao(event) {
    event.preventDefault();
    const nome = document.getElementById('motorista-nome').value.trim();
    const placa = document.getElementById('motorista-placa').value.trim().toUpperCase();
    const ajudante = document.getElementById('motorista-ajudante').value.trim();

    if (!nome || !placa) {
        exibirToast("Preencha Nome e Placa.");
        return;
    }

    const hoje = new Date().toLocaleDateString('pt-BR');

    localStorage.setItem('motorista_nome', nome);
    localStorage.setItem('motorista_placa', placa);
    localStorage.setItem('motorista_ajudante', ajudante);
    localStorage.setItem('login_data', hoje);

    carregarDadosBarra();
    mostrarTela('screen-main');
    exibirToast("Identificação salva com sucesso!");
}

function alterarIdentificacao() {
    document.getElementById('motorista-nome').value = localStorage.getItem('motorista_nome') || '';
    document.getElementById('motorista-placa').value = localStorage.getItem('motorista_placa') || '';
    document.getElementById('motorista-ajudante').value = localStorage.getItem('motorista_ajudante') || '';

    mostrarTela('screen-login');
}

function carregarDadosBarra() {
    const nome = localStorage.getItem('motorista_nome') || '-';
    const placa = localStorage.getItem('motorista_placa') || '-';

    document.getElementById('bar-motorista').textContent = nome;
    document.getElementById('bar-placa').textContent = placa;
}

function mostrarTela(idTela) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
    });

    const target = document.getElementById(idTela);
    if (target) {
        target.classList.add('active');
    }
}

/**
 * NAVEGAÇÃO E REGRAS DE INTERFACE
 */
function trocarAba(evt, aba) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.form-section').forEach(sec => sec.classList.remove('active'));

    if (evt && evt.target) {
        evt.target.classList.add('active');
    }
    const targetForm = document.getElementById(`form-${aba}`);
    if (targetForm) {
        targetForm.classList.add('active');
    }
}

function adicionarCampoNfRetorno() {
    const container = document.getElementById('container-nfs-retorno');
    const div = document.createElement('div');
    div.className = 'form-group dynamic-row';
    div.style.cssText = 'display: flex; gap: 5px; align-items: flex-end; margin-top: 8px;';
    div.innerHTML = `
        <div style="flex: 1;">
            <input type="text" class="input-nf-retorno" placeholder="Outra NF" inputmode="numeric" pattern="[0-9]*" required>
        </div>
        <button type="button" class="btn-remove" onclick="removerElemento(this)" style="background-color: #ef4444; color: white; border: none; padding: 10px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">✕</button>
    `;
    container.appendChild(div);
}

function adicionarCampoNfReentrega() {
    const container = document.getElementById('container-nfs-reentrega');
    const div = document.createElement('div');
    div.className = 'form-group dynamic-row';
    div.style.cssText = 'display: flex; gap: 5px; align-items: flex-end; margin-top: 8px;';
    div.innerHTML = `
        <div style="flex: 1;">
            <input type="text" class="input-nf-reentrega" placeholder="Outra NF" inputmode="numeric" pattern="[0-9]*" required>
        </div>
        <button type="button" class="btn-remove" onclick="removerElemento(this)" style="background-color: #ef4444; color: white; border: none; padding: 10px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">✕</button>
    `;
    container.appendChild(div);
}

function adicionarItemCredito() {
    const container = document.getElementById('container-itens-credito');
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.style.cssText = 'display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; align-items: center;';
    div.innerHTML = `
        <input type="text" class="item-codigo" placeholder="Cód" style="width: 20%;">
        <input type="text" class="item-descricao" placeholder="Descrição *" style="width: 50%; text-transform: uppercase;" required>
        <input type="text" class="item-quantidade" placeholder="Qtd *" style="width: 23%;" required>
        <input type="text" class="item-valor" placeholder="Valor (R$)" style="width: 35%;" inputmode="decimal">
        <select class="item-motivo" style="width: 50%; font-size: 13px;" required>
            <option value="">Selecione o motivo...</option>
            <option value="VENCIMENTO">VENCIMENTO</option>
            <option value="SINISTRO/ROUBO">SINISTRO/ROUBO</option>
            <option value="CLIENTE CANCELOU/DESISTIU">CLIENTE CANCELOU/DESISTIU</option>
            <option value="CLIENTE FECHADO">CLIENTE FECHADO</option>
            <option value="PRODUTO DESCONGELADO/AVARIADO">PRODUTO DESCONGELADO/AVARIADO</option>
            <option value="FALTA MERCADORIA NA CARGA">FALTA MERCADORIA NA CARGA</option>
            <option value="ATRASO NA ENTREGA">ATRASO NA ENTREGA</option>
            <option value="CLIENTE NÃO FEZ PEDIDO">CLIENTE NÃO FEZ PEDIDO</option>
            <option value="PRECO INCORRETO">PRECO INCORRETO</option>
            <option value="FORA DE ROTA/GEOLOCALIZAÇÃO">FORA DE ROTA/GEOLOCALIZAÇÃO</option>
            <option value="PRODUTO FORA PADRÃO CLIENTE">PRODUTO FORA PADRÃO CLIENTE</option>
            <option value="PEDIDO INCORRETO">PEDIDO INCORRETO</option>
            <option value="PEDIDO EM DUPLICIDADE">PEDIDO EM DUPLICIDADE</option>
        </select>
        <button type="button" class="btn-remove" onclick="removerElemento(this)" style="background-color: #ef4444; color: white; border: none; padding: 8px 10px; border-radius: 6px; cursor: pointer; font-weight: bold;">✕</button>
    `;
    container.appendChild(div);
}

function removerElemento(botao) {
    const parent = botao.parentElement;
    if (parent) {
        parent.remove();
    }
}

/**
 * TRAVA CONTRA DUPLO CLIQUE E GERENCIAMENTO DE ENVIO
 */
let enviandoCredito = false;

function gerarMensagem(tipo) {
    const motorista = localStorage.getItem('motorista_nome') || '';
    const placa = localStorage.getItem('motorista_placa') || '';
    const ajudante = localStorage.getItem('motorista_ajudante') || '';

    let cabecalhoUser = '';
    if (motorista || placa) {
        cabecalhoUser = `🚛 *Motorista:* ${motorista} | *Placa:* ${placa}\n`;
    }

    if (tipo === 'retorno') {
        const cliente = document.getElementById('retorno-cliente').value.trim();
        const motivoSelect = document.getElementById('retorno-motivo').value;

        if (!cliente) { exibirToast("Informe o código do cliente."); return null; }
        if (!/^\d+$/.test(cliente)) { exibirToast("O campo cliente deve conter apenas números."); return null; }

        const nfInputs = document.querySelectorAll('.input-nf-retorno');
        let preenchimentoValido = true;
        const nfs = [];

        nfInputs.forEach(input => {
            const val = input.value.trim();
            if (!val) {
                preenchimentoValido = false;
            } else {
                nfs.push(val);
            }
        });

        if (!preenchimentoValido || nfs.length === 0) {
            exibirToast("Preencha todas as NFs de retorno adicionadas.");
            return null;
        }

        if (!motivoSelect) { exibirToast("Informe o motivo."); return null; }

        const listaNfsTexto = nfs.length > 1 ? `*NF(s):*\n${nfs.join('\n')}` : `*NF:* ${nfs[0]}`;

        return cabecalhoUser +
               `📦 *RETORNO*\n` +
               `*CLIENTE:* ${cliente}\n` +
               `${listaNfsTexto}\n` +
               `*MOTIVO:* ${motivoSelect}`;
    }

    if (tipo === 'reentrega') {
        const motivoSelect = document.getElementById('reentrega-motivo').value;
        const nfInputs = document.querySelectorAll('.input-nf-reentrega');
        
        let preenchimentoValido = true;
        const nfs = [];

        nfInputs.forEach(input => {
            const val = input.value.trim();
            if (!val) {
                preenchimentoValido = false;
            } else {
                nfs.push(val);
            }
        });

        if (!preenchimentoValido || nfs.length === 0) { 
            exibirToast("Preencha todas as NFs de reentrega adicionadas."); 
            return null; 
        }
        
        if (!motivoSelect) { exibirToast("Informe o motivo."); return null; }

        const listaNfsTexto = nfs.join('\n');

        return cabecalhoUser +
               `🚚 *REENTREGA*\n` +
               `*NF(s):*\n${listaNfsTexto}\n` +
               `*MOTIVO:* ${motivoSelect}`;
    }

    if (tipo === 'credito') {
        // Trava de segurança para impedir requisições simultâneas
        if (enviandoCredito) {
            exibirToast("Aguarde, processando crédito anterior...");
            return null;
        }

        const nf = document.getElementById('credito-nf').value.trim();
        const cliente = document.getElementById('credito-cliente').value.trim();
        const obs = document.getElementById('credito-obs').value.trim();

        if (!nf) { exibirToast("Informe a NF."); return null; }
        if (!cliente) { exibirToast("Informe o cliente."); return null; }
        if (!/^\d+$/.test(cliente)) { exibirToast("O campo cliente deve conter apenas números."); return null; }

        const itemRows = document.querySelectorAll('#container-itens-credito .dynamic-item');
        const itensColetados = [];
        const registrosParaPlanilha = [];

        const uuidUnico = gerarUUID();

        for (let row of itemRows) {
            const cod = row.querySelector('.item-codigo').value.trim();
            const desc = row.querySelector('.item-descricao').value.trim().toUpperCase();
            const qtd = row.querySelector('.item-quantidade').value.trim();
            const valor = row.querySelector('.item-valor').value.trim();
            const motivo = row.querySelector('.item-motivo').value;

            if (!desc || !qtd || !motivo) {
                exibirToast("Preencha Descrição, Qtd e Motivo de todos os itens.");
                return null;
            }

            itensColetados.push({ cod, desc, qtd, valor, motivo });

            registrosParaPlanilha.push({
                ID: uuidUnico,
                CPF_Motorista: "",
                Motorista: motorista,
                Placa: placa,
                Ajudante: ajudante,
                Cliente: cliente,
                NF: nf,
                CodProduto: cod,
                Descricao: desc,
                Qtd: qtd,
                Valor: valor,
                Motivo: motivo,
                Obs: obs
            });
        }

        if (itensColetados.length === 0) {
            exibirToast("Adicione pelo menos um item.");
            return null;
        }

        // Ativa a trava de processamento por 3 segundos
        enviandoCredito = true;
        setTimeout(() => { enviandoCredito = false; }, 3000);

        // Salva na fila do db.js para envio à planilha
        if (typeof salvarCreditoLocal === "function") {
            salvarCreditoLocal(registrosParaPlanilha);
        }

        let itensTexto = itensColetados.map(i => {
            const codTexto = i.cod ? `[${i.cod}] ` : '';
            const valTexto = i.valor ? ` | *Valor:* R$ ${i.valor}` : '';
            return `• *Produto:* ${codTexto}${i.desc}\n  *Qtd:* ${i.qtd}${valTexto}\n  *Motivo:* ${i.motivo}`;
        }).join('\n');

        let msg = cabecalhoUser +
               `💳 *CRÉDITO*\n` +
               `*NF:* ${nf}\n` +
               `*CLIENTE:* ${cliente}\n` +
               `*ITENS:*\n${itensTexto}`;

        if (obs) {
            msg += `\n*OBS:* ${obs}`;
        }

        return msg;
    }

    return null;
}

function enviarWhatsApp(tipo) {
    const msg = gerarMensagem(tipo);
    if (msg) {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
        
        // Zera o formulário após a confirmação para evitar reenvio
        setTimeout(() => {
            limparFormulario(tipo);
        }, 500);
    }
}

function copiarMensagem(tipo, btnElement) {
    const msg = gerarMensagem(tipo);
    if (msg) {
        navigator.clipboard.writeText(msg).then(() => {
            exibirToast("Mensagem copiada!");
            if (btnElement) {
                const textoOriginal = btnElement.textContent;
                btnElement.textContent = "✓ Copiado!";
                btnElement.style.backgroundColor = "#16a34a";
                setTimeout(() => {
                    btnElement.textContent = textoOriginal;
                    btnElement.style.backgroundColor = "";
                }, 2000);
            }

            // Zera o formulário após copiar
            setTimeout(() => {
                limparFormulario(tipo);
            }, 500);
        });
    }
}

function limparFormulario(tipo) {
    const form = document.getElementById(`form-${tipo}`);
    if (form) form.reset();

    if (tipo === 'retorno') {
        const container = document.getElementById('container-nfs-retorno');
        container.innerHTML = `
            <div class="form-group dynamic-row" style="display: flex; gap: 5px; align-items: flex-end;">
                <div style="flex: 1;">
                    <label>Número da NF *</label>
                    <input type="text" class="input-nf-retorno" placeholder="Ex: 123456" inputmode="numeric" pattern="[0-9]*" required>
                </div>
            </div>
        `;
    }

    if (tipo === 'reentrega') {
        const container = document.getElementById('container-nfs-reentrega');
        container.innerHTML = `
            <div class="form-group dynamic-row" style="display: flex; gap: 5px; align-items: flex-end;">
                <div style="flex: 1;">
                    <label>Número da NF *</label>
                    <input type="text" class="input-nf-reentrega" placeholder="Ex: 123456" inputmode="numeric" pattern="[0-9]*" required>
                </div>
            </div>
        `;
    }

    if (tipo === 'credito') {
        const container = document.getElementById('container-itens-credito');
        container.innerHTML = `
            <div class="dynamic-item" style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; align-items: center;">
                <input type="text" class="item-codigo" placeholder="Cód" style="width: 20%;">
                <input type="text" class="item-descricao" placeholder="Descrição do Produto *" style="width: 50%; text-transform: uppercase;" required>
                <input type="text" class="item-quantidade" placeholder="Qtd *" style="width: 23%;" required>
                <input type="text" class="item-valor" placeholder="Valor (R$)" style="width: 35%;" inputmode="decimal">
                <select class="item-motivo" style="width: 50%; font-size: 13px;" required>
                    <option value="">Selecione o motivo...</option>
                    <option value="VENCIMENTO">VENCIMENTO</option>
                    <option value="SINISTRO/ROUBO">SINISTRO/ROUBO</option>
                    <option value="CLIENTE CANCELOU/DESISTIU">CLIENTE CANCELOU/DESISTIU</option>
                    <option value="CLIENTE FECHADO">CLIENTE FECHADO</option>
                    <option value="PRODUTO DESCONGELADO/AVARIADO">PRODUTO DESCONGELADO/AVARIADO</option>
                    <option value="FALTA MERCADORIA NA CARGA">FALTA MERCADORIA NA CARGA</option>
                    <option value="ATRASO NA ENTREGA">ATRASO NA ENTREGA</option>
                    <option value="CLIENTE NÃO FEZ PEDIDO">CLIENTE NÃO FEZ PEDIDO</option>
                    <option value="PRECO INCORRETO">PRECO INCORRETO</option>
                    <option value="FORA DE ROTA/GEOLOCALIZAÇÃO">FORA DE ROTA/GEOLOCALIZAÇÃO</option>
                    <option value="PRODUTO FORA PADRÃO CLIENTE">PRODUTO FORA PADRÃO CLIENTE</option>
                    <option value="PEDIDO INCORRETO">PEDIDO INCORRETO</option>
                    <option value="PEDIDO EM DUPLICIDADE">PEDIDO EM DUPLICIDADE</option>
                </select>
            </div>
        `;
    }

    exibirToast("Formulário pronto para novo lançamento.");
}

/**
 * GERAÇÃO DO BLOCO DE DÉBITOS DELLY'S
 */
function gerarImagemTalao() {
    const nf = document.getElementById('credito-nf').value.trim();
    const cliente = document.getElementById('credito-cliente').value.trim();
    const obs = document.getElementById('credito-obs').value.trim();

    if (!nf || !cliente) {
        exibirToast("Preencha NF e Cliente para gerar o bloco.");
        return;
    }

    document.getElementById('t-motorista').textContent = localStorage.getItem('motorista_nome') || '-';
    document.getElementById('t-placa').textContent = localStorage.getItem('motorista_placa') || '-';
    document.getElementById('t-ajudante').textContent = localStorage.getItem('motorista_ajudante') || '-';

    document.getElementById('t-nf').textContent = nf;
    document.getElementById('t-cliente').textContent = cliente;
    document.getElementById('t-data').textContent = new Date().toLocaleDateString('pt-BR');
    document.getElementById('t-obs').textContent = obs || '';
    
    const codigoUnicoBloco = gerarUUID();
    document.getElementById('t-num-talao').textContent = codigoUnicoBloco;

    const itemRows = document.querySelectorAll('#container-itens-credito .dynamic-item');
    const tbody = document.getElementById('t-itens-body');
    tbody.innerHTML = '';

    let totalLinhas = 0;
    let possuiItemValido = false;
    let somaTotalValores = 0;

    itemRows.forEach(row => {
        const cod = row.querySelector('.item-codigo').value.trim();
        const desc = row.querySelector('.item-descricao').value.trim().toUpperCase();
        const qtd = row.querySelector('.item-quantidade').value.trim();
        const valorRaw = row.querySelector('.item-valor').value.trim();
        const motivo = row.querySelector('.item-motivo').value;

        if (desc && qtd && motivo) {
            possuiItemValido = true;
            totalLinhas++;

            const valorNum = parseFloat(valorRaw.replace(',', '.')) || 0;
            somaTotalValores += valorNum;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: center;">${cod}</td>
                <td>${desc}</td>
                <td style="text-align: center;">${qtd}</td>
                <td style="text-align: right;">${valorRaw ? 'R$ ' + valorRaw : '-'}</td>
                <td style="text-align: center;">${motivo}</td>
            `;
            tbody.appendChild(tr);
        }
    });

    if (!possuiItemValido) {
        exibirToast("Preencha Descrição, Quantidade e Motivo de pelo menos um item.");
        return;
    }

    document.getElementById('t-valor-total').textContent = `R$ ${somaTotalValores.toFixed(2).replace('.', ',')}`;

    while (totalLinhas < 5) {
        totalLinhas++;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td></td><td></td><td></td><td></td><td></td>`;
        tbody.appendChild(tr);
    }

    const talao = document.getElementById('talao-digital');
    talao.style.display = 'block';

    exibirToast("Gerando imagem do bloco...");

    html2canvas(talao, { scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Bloco_Debito_NF_${nf}_${codigoUnicoBloco}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        talao.style.display = 'none';
        
        // Zera o formulário após a criação da imagem
        setTimeout(() => {
            limparFormulario('credito');
        }, 500);

    }).catch(err => {
        talao.style.display = 'none';
        exibirToast("Erro ao gerar imagem.");
    });
}

function exibirToast(mensagem) {
    const toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
