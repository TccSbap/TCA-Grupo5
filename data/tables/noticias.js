// Curadoria verificada em 31/10/2026. Resumos próprios; leitura completa na fonte.
const ANA_NEWS = 'https://www.gov.br/ana/pt-br/assuntos/noticias-e-eventos/noticias-periodo-eleitoral-2026/';

module.exports = () => [
    {
        id: 1,
        title: 'ANA explica como o Brasil acompanha a eficiência no uso da água',
        publishedAt: '2026-10-22',
        description: 'A análise do indicador ODS 6.4.1 relaciona a atividade econômica à retirada de água doce e mostra diferenças entre setores e regiões do país.',
        url: ANA_NEWS + 'do-volume-ao-valor-como-a-ana-mede-a-eficiencia-economica-do-uso-da-agua-no-pais',
        sourceName: 'ANA', topic: 'agua', image: '/images/agua-potavel.webp',
        imageAlt: 'Água limpa, em imagem ilustrativa', iconClass: 'fas fa-tint'
    },
    {
        id: 2,
        title: 'Monitor de Secas aponta avanço da estiagem no Norte e Nordeste',
        publishedAt: '2026-10-19',
        description: 'O levantamento de setembro de 2026 registra intensificação da seca em 14 estados. A publicação compara as condições entre agosto e setembro e destaca as diferenças regionais.',
        url: ANA_NEWS + 'seca-se-intensifica-no-nordeste-e-norte-fenomeno-se-abranda-no-centro-oeste-e-sudeste-e-nao-e-registrado-no-sul-segundo-monitor-de-secas',
        sourceName: 'ANA', topic: 'clima', image: '/images/agua-potavel.webp',
        imageAlt: 'Água potável, em imagem ilustrativa sobre segurança hídrica', iconClass: 'fas fa-sun'
    },
    {
        id: 3,
        title: 'Tarifa Social de Água e Esgoto tem implementação concluída em 1.930 municípios',
        publishedAt: '2026-10-14',
        description: 'Segundo a atualização de agosto divulgada pela ANA, o total de municípios com implementação concluída cresceu em relação a julho. A população das cidades em processo de adesão não equivale ao total de beneficiários.',
        url: ANA_NEWS + 'implementacao-da-tarifa-social-de-agua-e-esgoto-avanca-em-municipios-onde-vivem-mais-de-157-5-milhoes-de-brasileiros',
        sourceName: 'ANA', topic: 'saneamento', image: '/images/saneamento.webp',
        imageAlt: 'Infraestrutura de saneamento, em imagem ilustrativa', iconClass: 'fas fa-hand-holding-water'
    },
    {
        id: 4,
        title: 'Drenagem urbana ganha destaque no debate sobre adaptação das cidades',
        publishedAt: '2026-10-08',
        description: 'Um encontro promovido pela ANA reuniu municípios, reguladores e pesquisadores para discutir prevenção de inundações, planejamento e estruturação dos serviços de águas pluviais.',
        url: ANA_NEWS + 'webinario-da-ana-debate-drenagem-urbana-e-preparacao-das-cidades-para-mudancas-climaticas',
        sourceName: 'ANA', topic: 'saneamento', image: '/images/saneamento.webp',
        imageAlt: 'Sistema de saneamento, em imagem ilustrativa sobre infraestrutura urbana', iconClass: 'fas fa-water'
    },
    {
        id: 5,
        title: 'Municípios da Bahia recebem recursos para reforçar o abastecimento de água',
        publishedAt: '2026-10-06',
        description: 'O governo estadual informa a destinação de R$ 1,42 milhão em assistência humanitária a oito municípios. Os recursos apoiam o uso de caminhões-pipa e a compra de combustível para atender populações afetadas pela estiagem.',
        url: 'https://www.ba.gov.br/comunicacao/noticias/2026-10/384459/articulacao-com-governo-federal-garante-r-142-milhao-para-reforcar',
        sourceName: 'Governo da Bahia', topic: 'agua', image: '/images/agua-potavel.webp',
        imageAlt: 'Água limpa, em imagem ilustrativa sobre abastecimento', iconClass: 'fas fa-truck'
    },
    {
        id: 6,
        title: 'Cantareira: comunicado define operação na Faixa de Atenção em outubro',
        publishedAt: '2026-09-30',
        description: 'ANA e SP Águas anunciaram os limites de retirada para outubro de 2026 e reforçaram a importância de reduzir perdas e usar a água de forma consciente na Grande São Paulo.',
        url: ANA_NEWS + 'sistema-cantareira-passara-a-operar-na-faixa-de-atencao-em-outubro',
        sourceName: 'ANA e SP Águas', topic: 'agua', image: '/images/agua-potavel.webp',
        imageAlt: 'Água potável, em imagem ilustrativa sobre abastecimento de São Paulo', iconClass: 'fas fa-tint'
    }
].map((item, index) => ({
    ...item,
    date: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(item.publishedAt)),
    createdAt: item.publishedAt + 'T12:00:00.000Z',
    sortOrder: index + 1
}));
