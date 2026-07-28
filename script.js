/**
 * GERENCIAMENTO DE IDENTIFICAÇÃO DO MOTORISTA (LOGIN DIÁRIO)
 */
document.addEventListener('DOMContentLoaded', () => {
    verificarSessaoDiaria();
});

function verificarSessaoDiaria() {
    const dataSalva = localStorage.getItem('login_data');
    const hoje = new Date().toLocaleDateString('pt-BR');

    // Se houver login gravado HOJE, pula a tela de login
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
    // Preenche a tela de login com os valores já salvos para facilitar edição
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
    // Remove a classe ativa de todas as telas
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
    });

    // Ativa apenas a tela correspondente
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

function verificarOutroMotivo(tipo) {
    const select = document.getElementById(`${tipo}-motivo`);
    const groupOutro = document.getElementById(`group-${tipo}-outro`);
    
    if (select.value === 'Outro') {
        groupOutro.classList.remove('hidden');
    } else {
        groupOutro.classList.add('hidden');
    }
}

function adicionarCampoNfReentrega() {
    const container = document.getElementById('container-nfs-reentrega');
    const div = document.createElement('div');
    div.className = 'form-group';
    div.innerHTML = `<input type="text" class="input-nf-reentrega" placeholder="Outra NF" inputmode="numeric">`;
    container.appendChild(div);
}

function adicionarItemCredito() {
    const container = document.getElementById('container-itens-credito');
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `
        <input type="text" class="item-codigo" placeholder="Cód" style="width: 25%;">
        <input type="text" class="item-descricao" placeholder="Descrição *" style="width: 50%;" required>
        <input type="text" class="item-quantidade" placeholder="Qtd *" style="width: 20%;" required>
    `;
    container.appendChild(div);
}

/**
 * CONSTRUÇÃO DAS MENSAGENS DE WHATSAPP (SEM LINHAS VAZIAS E COM NOME/PLACA)
 */
function gerarMensagem(tipo) {
    const motorista = localStorage.getItem('motorista_nome') || '';
    const placa = localStorage.getItem('motorista_placa') || '';

    let cabecalhoUser = '';
    if (motorista || placa) {
        cabecalhoUser = `🚛 *Motorista:* ${motorista} | *Placa:* ${placa}\n`;
    }

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

        return cabecalhoUser +
               `📦 *RETORNO*\n` +
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

        return cabecalhoUser +
               `🚚 *REENTREGA*\n` +
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

        const itemRows = document.querySelectorAll('#container-itens-credito .dynamic-item');
        const itensColetados = [];

        for (let row of itemRows) {
            const cod = row.querySelector('.item-codigo').value.trim();
            const desc = row.querySelector('.item-descricao').value.trim();
            const qtd = row.querySelector('.item-quantidade').value.trim();

            if (!desc || !qtd) {
                exibirToast("Preencha descrição e quantidade dos itens.");
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

        let msg = cabecalhoUser +
               `💳 *CRÉDITO*\n` +
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

function enviarWhatsApp(tipo) {
    const msg = gerarMensagem(tipo);
    if (msg) {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    }
}

function copiarMensagem(tipo) {
    const msg = gerarMensagem(tipo);
    if (msg) {
        navigator.clipboard.writeText(msg).then(() => exibirToast("Mensagem copiada!"));
    }
}

function limparFormulario(tipo) {
    document.getElementById(`form-${tipo}`).reset();
    exibirToast("Campos limpados.");
}

/**
 * GERAÇÃO DO BLOCO DE DÉBITOS DELLY'S (COM MOTORISTA/PLACA/AJUDANTE AUTOMÁTICOS)
 */
function gerarImagemTalao() {
    const nf = document.getElementById('credito-nf').value.trim();
    const cliente = document.getElementById('credito-cliente').value.trim();
    const motivoSelect = document.getElementById('credito-motivo').value;
    const motivoOutro = document.getElementById('credito-outro').value.trim();
    const obs = document.getElementById('credito-obs').value.trim();

    if (!nf || !cliente || !motivoSelect) {
        exibirToast("Preencha NF, Cliente e Motivo para gerar o bloco.");
        return;
    }

    const motivoFinal = motivoSelect === 'Outro' ? motivoOutro : motivoSelect;

    // Preenchimento dos dados do motorista salvos na sessão
    document.getElementById('t-motorista').textContent = localStorage.getItem('motorista_nome') || '-';
    document.getElementById('t-placa').textContent = localStorage.getItem('motorista_placa') || '-';
    document.getElementById('t-ajudante').textContent = localStorage.getItem('motorista_ajudante') || '-';

    document.getElementById('t-nf').textContent = nf;
    document.getElementById('t-cliente').textContent = cliente;
    document.getElementById('t-data').textContent = new Date().toLocaleDateString('pt-BR');
    document.getElementById('t-obs').textContent = obs || '';
    document.getElementById('t-num-talao').textContent = Math.floor(100000 + Math.random() * 900000);

    const itemRows = document.querySelectorAll('#container-itens-credito .dynamic-item');
    const tbody = document.getElementById('t-itens-body');
    tbody.innerHTML = '';

    let totalLinhas = 0;

    itemRows.forEach(row => {
        const cod = row.querySelector('.item-codigo').value.trim();
        const desc = row.querySelector('.item-descricao').value.trim();
        const qtd = row.querySelector('.item-quantidade').value.trim();

        if (desc && qtd) {
            totalLinhas++;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: center;">${cod}</td>
                <td>${desc}</td>
                <td style="text-align: center;">${qtd}</td>
                <td></td>
                <td style="text-align: center;">${motivoFinal}</td>
            `;
            tbody.appendChild(tr);
        }
    });

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
        link.download = `Bloco_Debito_NF_${nf}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        talao.style.display = 'none';
        exibirToast("Imagem gerada com sucesso!");
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