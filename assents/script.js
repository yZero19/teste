document.addEventListener('DOMContentLoaded', function () {
    function fetchAddressByCep(cep) {
        const url = `https://viacep.com.br/ws/${cep}/json/`;
        return fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.erro) {
                    throw new Error('CEP não encontrado');
                }
                return data;
            });
    }

    const cepInput = document.getElementById('cep');
    if (cepInput) {
        cepInput.addEventListener('blur', function () {
            const cep = this.value.replace(/\D/g, '');
            if (cep.length === 8) {
                fetchAddressByCep(cep).then(address => {
                    document.getElementById('endereco').value = address.logradouro || '';
                    document.getElementById('Bairro').value = address.bairro || '';
                    document.getElementById('municipio').value = address.localidade || '';
                    document.getElementById('estado').value = address.uf || '';
                }).catch(error => {
                    alert(error.message);
                });
            }
        });
    }

    document.getElementById('generateFormButton').addEventListener('click', function () {
        const formContainer = document.getElementById('formContainer');
        const formHTML = `
            <div class="fluig-style-guide">
                <i class="flaticon flaticon-open-package icon-thumbnail-lg" aria-hidden="true"></i>
                <form class="product-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="descricao" class="form-label">Descrição</label>
                            <input type="text" class="form-control" name="descricao" required>
                        </div>
                        <div class="form-group">
                            <label for="unidade-medida" class="form-label">Unidade de Medida</label>
                            <select class="form-control" name="unidade-medida" required>
                                <option value="KG">KG</option>
                                <option value="ML">ML</option>
                                <option value="G">G</option>
                                <option value="MG">MG</option>
                                <option value="L">L</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="quantidade" class="form-label">Quantidade em Estoque</label>
                            <input type="number" class="form-control" name="quantidade" required>
                        </div>
                        <div class="form-group">
                            <label for="valor-unitario" class="form-label">Valor Unitário</label>
                            <input type="number" class="form-control" name="valor-unitario" required>
                        </div>
                        <div class="form-group">
                            <label for="valor-total" class="form-label">Valor Total</label>
                            <input type="number" class="form-control" name="valor-total" required readonly>
                        </div>
                    </div>
                    <button type="button" class="btn btn-danger removeFormButton">Excluir</button>
                </form>
                <hr>
            </div>
        `;
        const newForm = document.createElement('div');
        newForm.innerHTML = formHTML;
        formContainer.appendChild(newForm);

        newForm.querySelector('.removeFormButton').addEventListener('click', function () {
            formContainer.removeChild(newForm);
        });

        newForm.querySelector('input[name="valor-unitario"]').addEventListener('input', updateTotal);
        newForm.querySelector('input[name="quantidade"]').addEventListener('input', updateTotal);
    });

    function updateTotal(event) {
        const form = event.target.closest('.product-form');
        const valorUnitario = parseFloat(form.querySelector('input[name="valor-unitario"]').value) || 0;
        const quantidade = parseFloat(form.querySelector('input[name="quantidade"]').value) || 0;
        const valorTotal = valorUnitario * quantidade;
        form.querySelector('input[name="valor-total"]').value = valorTotal.toFixed(2);
    }

    document.getElementById('fileSelectButton').addEventListener('click', function () {
        document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', function () {
        const fileInput = this;
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';

        let fileListStored = JSON.parse(sessionStorage.getItem('files')) || [];
        
        for (const file of fileInput.files) {
            const fileItem = document.createElement('div');
            fileItem.textContent = file.name;

            const viewButton = document.createElement('button');
            viewButton.type = 'button';
            viewButton.classList.add('btn', 'btn-info', 'btn-view');
            viewButton.innerHTML = '<ion-icon name="eye-outline" class="icon"></ion-icon>';
            viewButton.addEventListener('click', function () {
                const url = URL.createObjectURL(file);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url); 
            });

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.classList.add('btn', 'btn-danger', 'btn-delete');
            deleteButton.innerHTML = '<ion-icon name="trash-outline" class="icon"></ion-icon>';
            deleteButton.addEventListener('click', function () {
                const index = fileListStored.findIndex(f => f.name === file.name);
                if (index !== -1) {
                    fileListStored.splice(index, 1);
                    sessionStorage.setItem('files', JSON.stringify(fileListStored));
                    fileItem.remove();
                    if (fileListStored.length === 0) {
                        document.getElementById('fileError').style.display = 'block';
                    }
                }
            });

            fileItem.appendChild(viewButton);
            fileItem.appendChild(deleteButton);
            fileList.appendChild(fileItem);

            fileListStored.push({ name: file.name, blob: URL.createObjectURL(file) });
            sessionStorage.setItem('files', JSON.stringify(fileListStored));
        }

        if (fileInput.files.length > 0) {
            document.getElementById('fileError').style.display = 'none';
        } else {
            document.getElementById('fileError').style.display = 'block';
        }
    });

    document.getElementById('supplierForm').addEventListener('submit', function (event) {
        event.preventDefault(); 

        const productForms = document.querySelectorAll('.product-form');
        const fileListStored = JSON.parse(sessionStorage.getItem('files')) || [];

        let hasProduct = Array.from(productForms).some(form => {
            return form.querySelector('input[name="descricao"]').value.trim() !== '';
        });

        let hasFile = fileListStored.length > 0;

        if (!hasProduct) {
            document.getElementById('productError').style.display = 'block';
            return;
        } else {
            document.getElementById('productError').style.display = 'none';
        }

        if (!hasFile) {
            document.getElementById('fileError').style.display = 'block';
            return;
        } else {
            document.getElementById('fileError').style.display = 'none';
        }

        document.getElementById('loadingModal').style.display = 'block';

        const formData = new FormData(document.getElementById('supplierForm'));
        const json = {
            razaoSocial: formData.get('Social'),
            nomeFantasia: formData.get('nome-fantasia'),
            cnpj: formData.get('cnpj'),
            inscricaoEstadual: formData.get('Inscricao'),
            inscricaoMunicipal: formData.get('Inscricao-municipal'),
            endereco: formData.get('endereco'),
            enderecoNumero: formData.get('endereco-numero'),
            complemento: formData.get('complemento'),
            bairro: formData.get('Bairro'),
            municipio: formData.get('municipio'),
            estado: formData.get('estado'),
            nomeContato: formData.get('nome-contato'),
            telefoneContato: formData.get('telefone'),
            emailContato: formData.get('email'),
            produtos: Array.from(document.querySelectorAll('.product-form')).map((form, index) => ({
                indice: index + 1,
                descricaoProduto: form.querySelector('input[name="descricao"]').value,
                unidadeMedida: form.querySelector('select[name="unidade-medida"]').value,
                qtdeEstoque: form.querySelector('input[name="quantidade"]').value,
                valorUnitario: form.querySelector('input[name="valor-unitario"]').value,
                valorTotal: form.querySelector('input[name="valor-total"]').value,
            })),
            anexos: JSON.parse(sessionStorage.getItem('files')).reduce((acc, file, index) => {
                acc[index + 1] = {
                    nomeArquivo: file.name,
                    blobArquivo: file.blob
                };
                return acc;
            }, {})
        };

        const jsonBlob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(jsonBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formData.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); 

        setTimeout(() => {
            document.getElementById('loadingModal').style.display = 'none';
            alert('Dados enviados com sucesso!');
        }, 2000);
    });
});
