import { useEffect, useMemo, useRef, useState } from 'react';
import {
  clearAdminToken,
  deleteAdminResource,
  getAdminOptions,
  getAdminSession,
  getAdminToken,
  listAdminResource,
  loginAdmin,
  lookupCep,
  saveAdminResource,
  setAdminToken,
} from '../services/adminApi.js';
import styles from './Admin.module.css';

const RESOURCES = {
  instituicoes: {
    label: 'Instituições',
    id: 'id_instituicao',
    fields: [
      { name: 'nome', label: 'Nome', required: true },
      { name: 'tipo', label: 'Tipo' },
      { name: 'cnpj', label: 'CNPJ' },
      { name: 'descricao', label: 'Descrição', kind: 'textarea' },
      { name: 'telefone', label: 'Telefone' },
      { name: 'email', label: 'E-mail', kind: 'email' },
      { name: 'site_url', label: 'Site' },
      { name: 'ativo', label: 'Ativa', kind: 'boolean', default: true },
    ],
  },
  'pontos-coleta': {
    label: 'Pontos de coleta',
    id: 'id_ponto',
    preserveOnEdit: ['fonte_url'],
    fields: [
      { name: 'nome', label: 'Nome', required: true },
      { name: 'id_tipo', label: 'Tipo de ponto', kind: 'select', options: 'tipos_ponto', required: true },
      { name: 'id_instituicao', label: 'Instituição responsável', kind: 'select', options: 'instituicoes', nullable: true },
      { name: 'descricao', label: 'Descrição', kind: 'textarea' },
      { name: 'logradouro', label: 'Logradouro' },
      { name: 'numero', label: 'Número' },
      { name: 'complemento', label: 'Complemento' },
      { name: 'bairro', label: 'Bairro' },
      { name: 'cidade', label: 'Cidade', required: true },
      { name: 'estado', label: 'UF' },
      { name: 'cep', label: 'CEP', kind: 'cep', hint: 'Ao informar 8 dígitos, o endereço e as coordenadas disponíveis serão preenchidos. As coordenadas por CEP são aproximadas; confira a localização.' },
      { name: 'latitude', label: 'Latitude', kind: 'number' },
      { name: 'longitude', label: 'Longitude', kind: 'number' },
      { name: 'telefone', label: 'Telefone' },
      { name: 'email_contato', label: 'E-mail de contato', kind: 'email' },
      { name: 'site_url', label: 'Site' },
      { name: 'horario_descricao', label: 'Observação de horário', kind: 'textarea' },
      { name: 'horarios', label: 'Horários (dia, abertura, fechamento)', kind: 'schedule', hint: 'Uma linha por faixa. Dias: 0 domingo, 1 segunda, ... 6 sábado. Ex.: 1,08:00,17:00' },
      { name: 'materiais', label: 'Materiais aceitos', kind: 'multiSelect', options: 'materiais', hint: 'Use Ctrl ou Cmd para selecionar mais de um.' },
      { name: 'observacoes', label: 'Observações', kind: 'textarea' },
      { name: 'verificado_em', label: 'Verificado em', kind: 'datetime' },
      { name: 'ativo', label: 'Ativo', kind: 'boolean', default: true },
    ],
  },
  materiais: {
    label: 'Materiais',
    id: 'id_material',
    preserveOnEdit: ['palavras_chave', 'fonte_url'],
    fields: [
      { name: 'nome', label: 'Nome', required: true },
      { name: 'id_categoria', label: 'Categoria', kind: 'select', options: 'categorias', required: true },
      { name: 'descricao', label: 'Descrição', kind: 'textarea' },
      { name: 'reciclavel', label: 'Reciclável', kind: 'optionalBoolean' },
      { name: 'tipo_descarte', label: 'Tipo de descarte', required: true },
      { name: 'instrucoes_preparo', label: 'Instruções de preparo', kind: 'textarea' },
      { name: 'cuidados', label: 'Cuidados / descarte', kind: 'textarea' },
      { name: 'verificado_em', label: 'Verificado em', kind: 'datetime' },
      { name: 'ativo', label: 'Ativo', kind: 'boolean', default: true },
    ],
  },
  projetos: {
    label: 'Projetos',
    id: 'id_projeto',
    fields: [
      { name: 'titulo', label: 'Título', required: true },
      { name: 'descricao', label: 'Descrição', kind: 'textarea', required: true },
      { name: 'tipo', label: 'Tipo' },
      { name: 'id_instituicao', label: 'Instituição responsável', kind: 'select', options: 'instituicoes', nullable: true },
      { name: 'data_inicio', label: 'Data de início', kind: 'date' },
      { name: 'data_fim', label: 'Data de término', kind: 'date' },
      { name: 'fonte_url', label: 'Fonte da informação' },
      { name: 'verificado_em', label: 'Verificado em', kind: 'datetime' },
      { name: 'publicado', label: 'Publicado', kind: 'boolean', default: false },
    ],
  },
  conteudos: {
    label: 'Artigos e curiosidades',
    id: 'id_conteudo',
    fields: [
      { name: 'titulo', label: 'Título', required: true },
      { name: 'slug', label: 'Slug (URL)', required: true },
      { name: 'resumo', label: 'Resumo', kind: 'textarea', hint: 'Para conteúdos do tipo curiosidade, este texto aparece no carrossel da Home.' },
      { name: 'corpo', label: 'Conteúdo', kind: 'textarea', rows: 8, required: true },
      { name: 'tipo', label: 'Tipo', hint: 'Use exatamente "curiosidade" para exibir também no carrossel da Home.' },
      { name: 'imagem_url', label: 'Imagem ou ícone (URL)', hint: 'Opcional. Se vazio, artigos e curiosidades usam ícones padrão. Para curiosidades na Home, a imagem aparece no carrossel.' },
      { name: 'materiais', label: 'Materiais relacionados', kind: 'multiSelect', options: 'materiais', hint: 'Use Ctrl ou Cmd para selecionar mais de um.' },
      { name: 'fonte_url', label: 'Fonte da informação' },
      { name: 'verificado_em', label: 'Verificado em', kind: 'datetime' },
      { name: 'publicado', label: 'Publicado', kind: 'boolean', default: false },
    ],
  },
};

const emptyForm = (resource) =>
  Object.fromEntries(RESOURCES[resource].fields.map((field) => {
    if (field.kind === 'multiSelect') return [field.name, []];
    if (field.kind === 'boolean' || field.kind === 'optionalBoolean') {
      return [field.name, field.default == null ? '' : String(field.default)];
    }
    return [field.name, field.default ?? ''];
  }));

function formFromRecord(resource, record) {
  const form = emptyForm(resource);
  RESOURCES[resource].fields.forEach((field) => {
    const value = record[field.name];
    if (field.kind === 'integerList' || field.kind === 'stringList') {
      form[field.name] = Array.isArray(value) ? value.join(', ') : '';
    } else if (field.kind === 'multiSelect') {
      form[field.name] = Array.isArray(value) ? value.map(String) : [];
    } else if (field.kind === 'schedule') {
      form[field.name] = (value ?? [])
        .map((item) => `${item.dia_semana},${item.abertura},${item.fechamento}`)
        .join('\n');
    } else if (field.kind === 'datetime' && value) {
      const date = new Date(value);
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      form[field.name] = localDate.toISOString().slice(0, 16);
    } else {
      form[field.name] = value == null ? '' : String(value);
    }
  });
  return form;
}

function payloadFromForm(resource, form, existingRecord) {
  const payload = {};
  const config = RESOURCES[resource];
  config.fields.forEach((field) => {
    const value = form[field.name];
    if (field.kind === 'integerList') {
      payload[field.name] = value.split(',').map((item) => item.trim()).filter(Boolean).map(Number);
      if (payload[field.name].some((item) => !Number.isInteger(item) || item < 1)) {
        throw new Error(`Confira os IDs no campo "${field.label}".`);
      }
    } else if (field.kind === 'multiSelect') {
      payload[field.name] = value.map(Number);
    } else if (field.kind === 'stringList') {
      payload[field.name] = value.split(',').map((item) => item.trim()).filter(Boolean);
    } else if (field.kind === 'schedule') {
      payload[field.name] = value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
        const [day, abertura, fechamento] = line.split(',').map((part) => part.trim());
        if (!/^[0-6]$/.test(day ?? '') || !abertura || !fechamento) {
          throw new Error('Horário inválido. Use uma linha por faixa no formato dia,HH:MM,HH:MM.');
        }
        return { dia_semana: Number(day), abertura, fechamento };
      });
    } else if (field.kind === 'boolean') {
      payload[field.name] = value === 'true';
    } else if (field.kind === 'optionalBoolean') {
      payload[field.name] = value === '' ? null : value === 'true';
    } else if (field.kind === 'number') {
      payload[field.name] = value === '' ? null : Number(value);
      if (payload[field.name] !== null && !Number.isFinite(payload[field.name])) {
        throw new Error(`Confira o valor do campo "${field.label}".`);
      }
    } else if (field.kind === 'cep') {
      const cep = value.replace(/\D/g, '');
      if (cep && cep.length !== 8) throw new Error('O CEP deve conter 8 dígitos.');
      payload[field.name] = cep || null;
    } else if (field.kind === 'datetime') {
      payload[field.name] = value ? new Date(value).toISOString() : null;
    } else if (field.kind === 'select' && field.nullable) {
      payload[field.name] = value === '' ? null : Number(value);
    } else if (field.kind === 'select') {
      payload[field.name] = Number(value);
    } else {
      payload[field.name] = value.trim() || null;
    }
  });
  if (existingRecord) {
    (config.preserveOnEdit ?? []).forEach((field) => {
      payload[field] = existingRecord[field];
    });
  }
  return payload;
}

function recordTitle(resource, record) {
  return record.titulo ?? record.nome;
}

function recordStatus(record) {
  if ('publicado' in record) return record.publicado ? 'Publicado' : 'Rascunho';
  return record.ativo ? 'Ativo' : 'Inativo';
}

export default function Admin() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [resource, setResource] = useState('instituicoes');
  const [records, setRecords] = useState({});
  const [options, setOptions] = useState({ categorias: [], tipos_ponto: [] });
  const [form, setForm] = useState(() => emptyForm('instituicoes'));
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cepLookupStatus, setCepLookupStatus] = useState(null);
  const cepLookupRef = useRef(null);
  const authenticated = Boolean(user);

  const institutions = records.instituicoes ?? [];
  const materials = records.materiais ?? [];
  const fieldOptions = useMemo(() => ({
    categorias: options.categorias,
    tipos_ponto: options.tipos_ponto,
    instituicoes: institutions.map((item) => ({ id_instituicao: item.id_instituicao, nome: item.nome })),
    materiais: (records.materiais ?? []).map((item) => ({
      id_material: item.id_material,
      nome: `${item.nome}${item.ativo ? '' : ' (inativo)'}`,
    })),
  }), [options, institutions, records.materiais]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [nextOptions, ...lists] = await Promise.all([
        getAdminOptions(),
        ...Object.keys(RESOURCES).map((key) => listAdminResource(key)),
      ]);
      setOptions(nextOptions);
      setRecords(Object.fromEntries(Object.keys(RESOURCES).map((key, index) => [key, lists[index]])));
    } catch (e) {
      setError(e.message);
      if (!getAdminToken()) setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getAdminToken()) return;
    getAdminSession()
      .then((session) => {
        setUser(session);
        return loadData();
      })
      .catch((e) => {
        clearAdminToken();
        setError(e.message);
      });
  }, []);

  useEffect(() => () => cepLookupRef.current?.abort(), []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const session = await loginAdmin(email, senha);
      setAdminToken(session.access_token);
      setUser(session.usuario);
      setSenha('');
      await loadData();
    } catch (e) {
      setError(e.message);
      if (!getAdminToken()) setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const chooseResource = (key) => {
    cepLookupRef.current?.abort();
    setCepLookupStatus(null);
    setResource(key);
    setEditingId(null);
    setForm(emptyForm(key));
    setNotice('');
    setError('');
  };

  const handleEdit = (record) => {
    cepLookupRef.current?.abort();
    setCepLookupStatus(null);
    setEditingId(record[RESOURCES[resource].id]);
    setForm(formFromRecord(resource, record));
    setNotice('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFieldChange = (field, value) => {
    if (field.kind !== 'cep') {
      setForm((current) => ({ ...current, [field.name]: value }));
      return;
    }

    const cep = value.replace(/\D/g, '').slice(0, 8);
    setForm((current) => ({ ...current, cep }));
    cepLookupRef.current?.abort();
    setCepLookupStatus(null);
    if (cep.length !== 8) return;

    const controller = new AbortController();
    cepLookupRef.current = controller;
    setCepLookupStatus('Consultando CEP...');
    lookupCep(cep, controller.signal)
      .then((address) => {
        if (cepLookupRef.current !== controller) return;
        const coordinates = address.location?.coordinates;
        const latitude = coordinates?.latitude == null ? null : Number(coordinates.latitude);
        const longitude = coordinates?.longitude == null ? null : Number(coordinates.longitude);
        const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
        setForm((current) => ({
          ...current,
          logradouro: address.street ?? '',
          bairro: address.neighborhood ?? '',
          cidade: address.city ?? '',
          estado: address.state ?? '',
          latitude: hasCoordinates ? String(latitude) : '',
          longitude: hasCoordinates ? String(longitude) : '',
        }));
        setCepLookupStatus({
          message: hasCoordinates
            ? 'Endereço e coordenadas preenchidos. Confira a localização antes de salvar.'
            : 'Endereço preenchido; este CEP não possui coordenadas. Informe-as manualmente.',
          error: false,
        });
      })
      .catch((lookupError) => {
        if (lookupError.name !== 'AbortError' && cepLookupRef.current === controller) {
          setCepLookupStatus({ message: lookupError.message, error: true });
        }
      });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const existingRecord = editingId == null
        ? null
        : records[resource]?.find((record) => record[activeResource.id] === editingId);
      if (editingId != null && !existingRecord) {
        throw new Error('Não foi possível carregar o registro atual para preservar os campos ocultos. Atualize a lista e tente novamente.');
      }
      await saveAdminResource(resource, editingId, payloadFromForm(resource, form, existingRecord));
      setNotice(editingId == null ? 'Registro criado.' : 'Alterações salvas.');
      setEditingId(null);
      setForm(emptyForm(resource));
      await loadData();
    } catch (e) {
      setError(e.message);
      if (!getAdminToken()) setUser(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    const id = record[RESOURCES[resource].id];
    const verb = ['projetos', 'conteudos'].includes(resource) ? 'excluir permanentemente' : 'desativar';
    if (!window.confirm(`Deseja ${verb} "${recordTitle(resource, record)}"?`)) return;
    setError('');
    setNotice('');
    try {
      await deleteAdminResource(resource, id);
      setNotice(['projetos', 'conteudos'].includes(resource) ? 'Registro excluído.' : 'Registro desativado.');
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm(resource));
      }
      await loadData();
    } catch (e) {
      setError(e.message);
      if (!getAdminToken()) setUser(null);
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    setUser(null);
    setRecords({});
    setError('');
    setNotice('');
  };

  if (!authenticated) {
    return (
      <div className={styles.loginPage}>
        <form className={styles.loginCard} onSubmit={handleLogin}>
          <span className={styles.eyebrow}>RECYCLEFLOW · PAINEL</span>
          <h1>Área administrativa</h1>
          <p>Acesse com a conta de administrador da plataforma.</p>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <label className={styles.field}>
            <span>E-mail</span>
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className={styles.field}>
            <span>Senha</span>
            <input type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </label>
          <button className={styles.primary} type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    );
  }

  const activeResource = RESOURCES[resource];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>RECYCLEFLOW · ADMINISTRAÇÃO</span>
          <h1>Gerenciar conteúdo</h1>
          <p>Olá, {user.nome}. Gerencie os dados publicados na plataforma.</p>
        </div>
        <button type="button" className={styles.secondary} onClick={handleLogout}>Sair</button>
      </header>

      <nav className={styles.tabs} aria-label="Seções administrativas">
        {Object.entries(RESOURCES).map(([key, item]) => (
          <button
            type="button"
            key={key}
            className={key === resource ? styles.tabActive : styles.tab}
            onClick={() => chooseResource(key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className={styles.workspace}>
        <section className={styles.formCard}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>{editingId == null ? 'NOVO REGISTRO' : 'EDIÇÃO'}</span>
              <h2>{editingId == null ? `Adicionar ${activeResource.label.toLowerCase()}` : `Editar ${activeResource.label.toLowerCase()}`}</h2>
            </div>
            {editingId != null && (
              <button
                type="button"
                className={styles.textButton}
                onClick={() => { setEditingId(null); setForm(emptyForm(resource)); }}
              >
                Cancelar edição
              </button>
            )}
          </div>
          <form onSubmit={handleSave} className={styles.formGrid}>
            {activeResource.fields.map((field) => (
              <label key={field.name} className={`${styles.field} ${field.kind === 'textarea' || field.kind === 'schedule' ? styles.wide : ''}`}>
                <span>{field.label}{field.required && ' *'}</span>
                {field.kind === 'textarea' || field.kind === 'schedule' ? (
                  <textarea
                    rows={field.rows ?? (field.kind === 'schedule' ? 3 : 3)}
                    value={form[field.name] ?? ''}
                    required={field.required}
                    onChange={(e) => setForm((current) => ({ ...current, [field.name]: e.target.value }))}
                  />
                ) : field.kind === 'boolean' || field.kind === 'optionalBoolean' ? (
                  <select
                    value={form[field.name] ?? ''}
                    required={field.kind === 'boolean'}
                    onChange={(e) => setForm((current) => ({ ...current, [field.name]: e.target.value }))}
                  >
                    {field.kind === 'optionalBoolean' && <option value="">Não informado</option>}
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                ) : field.kind === 'select' || field.kind === 'multiSelect' ? (
                  <select
                    multiple={field.kind === 'multiSelect'}
                    value={form[field.name] ?? ''}
                    required={field.required}
                    onChange={(e) => setForm((current) => ({
                      ...current,
                      [field.name]: field.kind === 'multiSelect'
                        ? Array.from(e.target.selectedOptions, (option) => option.value)
                        : e.target.value,
                    }))}
                  >
                    {field.kind !== 'multiSelect' && <option value="">{field.nullable ? 'Nenhuma' : 'Selecione'}</option>}
                    {(fieldOptions[field.options] ?? []).map((option) => (
                      <option
                        key={option.id_categoria ?? option.id_tipo ?? option.id_instituicao ?? option.id_material}
                        value={option.id_categoria ?? option.id_tipo ?? option.id_instituicao ?? option.id_material}
                      >
                        {option.nome}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.kind === 'date' ? 'date' : field.kind === 'datetime' ? 'datetime-local' : field.kind === 'number' ? 'number' : field.kind === 'cep' ? 'text' : field.kind ?? 'text'}
                    inputMode={field.kind === 'cep' ? 'numeric' : undefined}
                    maxLength={field.kind === 'cep' ? 8 : undefined}
                    step={field.kind === 'number' ? 'any' : undefined}
                    value={form[field.name] ?? ''}
                    required={field.required}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                  />
                )}
                {field.hint && <small>{field.hint}</small>}
                {field.kind === 'cep' && cepLookupStatus && (
                  <small className={cepLookupStatus.error ? styles.fieldLookupError : styles.fieldLookupStatus} role="status">
                    {cepLookupStatus.message}
                  </small>
                )}
              </label>
            ))}
            {error && <p className={`${styles.error} ${styles.wide}`} role="alert">{error}</p>}
            {notice && <p className={`${styles.success} ${styles.wide}`} role="status">{notice}</p>}
            <div className={`${styles.formActions} ${styles.wide}`}>
              <button className={styles.primary} type="submit" disabled={saving}>
                {saving ? 'Salvando...' : editingId == null ? 'Criar registro' : 'Salvar alterações'}
              </button>
              <span>* Campos obrigatórios</span>
            </div>
          </form>
        </section>

        <section className={styles.listCard}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>CADASTROS</span>
              <h2>{activeResource.label}</h2>
            </div>
            <button type="button" className={styles.secondary} onClick={loadData} disabled={loading}>
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
          {loading && !records[resource] ? (
            <p className={styles.empty}>Carregando registros...</p>
          ) : records[resource]?.length ? (
            <ul className={styles.recordList}>
              {records[resource].map((record) => {
                const id = record[activeResource.id];
                const subtitle = record.instituicao ?? record.categoria ?? record.tipo ?? record.slug ?? '';
                return (
                  <li className={styles.record} key={id}>
                    <div className={styles.recordInfo}>
                      <strong>{recordTitle(resource, record)}</strong>
                      <span>{subtitle ? `${subtitle} · ` : ''}ID ${id}</span>
                    </div>
                    <span className={record.publicado || record.ativo ? styles.statusActive : styles.statusInactive}>
                      {recordStatus(record)}
                    </span>
                    <div className={styles.recordActions}>
                      <button type="button" className={styles.textButton} onClick={() => handleEdit(record)}>Editar</button>
                      {['projetos', 'conteudos'].includes(resource) || record.ativo ? (
                        <button type="button" className={styles.dangerButton} onClick={() => handleDelete(record)}>
                          {['projetos', 'conteudos'].includes(resource) ? 'Excluir' : 'Desativar'}
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.empty}>{loading ? 'Carregando registros...' : 'Nenhum registro cadastrado.'}</p>
          )}
        </section>
      </div>
    </div>
  );
}
