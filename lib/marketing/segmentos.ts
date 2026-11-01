// Sugestões de grupos de produtos, produtos e marcas por categoria de empresa.
// Alimenta a trilha de cadastro da página de Marketing.
// Para incluir uma categoria nova, basta acrescentar em SEGMENTOS e mapear
// os produtos e as marcas dos seus grupos.

export interface Segmento {
  id: string
  nome: string
  nomeCurto?: string   // usado como título dos blocos de seleção
  grupos: string[]
}

// título curto que aparece acima dos botões nas etapas de seleção
export const tituloCurto = (id: string): string => {
  const seg = SEGMENTOS.find(s => s.id === id)
  return seg?.nomeCurto ?? seg?.nome ?? id
}

export const SEGMENTOS: Segmento[] = [
  {
    id: 'moda-infantil',
    nome: 'Moda Infantil',
    grupos: [
      'Bebê', 'Infantil', 'Juvenil', 'Conjuntos infantis', 'Pijamas infantis',
      'Calçados infantis', 'Acessórios infantis'
    ]
  },
  {
    id: 'moda-intima',
    nome: 'Moda Íntima',
    grupos: [
      'Sutiãs', 'Calcinhas', 'Cuecas', 'Pijamas', 'Camisolas',
      'Modeladores', 'Meias'
    ]
  },
  {
    id: 'moda-fitness',
    nome: 'Moda Fitness',
    grupos: [
      'Tops', 'Leggings', 'Shorts fitness', 'Macaquinhos', 'Conjuntos fitness',
      'Regatas', 'Agasalhos'
    ]
  },
  {
    id: 'moda-evangelica',
    nome: 'Moda Evangélica',
    grupos: [
      'Vestidos longos', 'Saias midi', 'Saias longas', 'Blusas manga longa',
      'Conjuntos evangélicos', 'Camisas'
    ]
  },
  {
    id: 'plus-size',
    nome: 'Plus Size',
    grupos: [
      'Blusas plus', 'Calças plus', 'Vestidos plus', 'Saias plus',
      'Lingerie plus', 'Moda praia plus'
    ]
  },
  {
    id: 'alta-costura',
    nome: 'Alta Costura',
    grupos: [
      'Vestidos de festa', 'Vestidos de noiva', 'Madrinhas', 'Debutante',
      'Trajes masculinos', 'Sob medida'
    ]
  },
  {
    id: 'alfaiataria',
    nome: 'Alfaiataria',
    grupos: [
      'Ternos', 'Blazers', 'Calças de alfaiataria', 'Coletes',
      'Camisas sociais', 'Ajustes e sob medida'
    ]
  },
  {
    id: 'loja-roupas',
    nome: 'Loja de Roupas',
    nomeCurto: 'Roupas',
    grupos: [
      'Feminino', 'Masculino', 'Jeans', 'Camisetas', 'Vestidos',
      'Saias', 'Casacos e jaquetas', 'Shorts'
    ]
  },
  {
    id: 'loja-calcados',
    nome: 'Loja de Calçados',
    nomeCurto: 'Calçados',
    grupos: [
      'Tênis', 'Sandálias', 'Botas', 'Sapatilhas', 'Chinelos',
      'Sapatos sociais', 'Calçados esportivos'
    ]
  },
  {
    id: 'loja-bolsas',
    nome: 'Loja de Bolsas',
    nomeCurto: 'Bolsas',
    grupos: [
      'Bolsas femininas', 'Mochilas', 'Carteiras', 'Necessaires',
      'Malas de viagem', 'Pochetes'
    ]
  },
  {
    id: 'moda-praia',
    nome: 'Moda Praia',
    grupos: [
      'Biquínis', 'Maiôs', 'Sungas', 'Saídas de praia',
      'Shorts de praia', 'Acessórios de praia'
    ]
  },
  {
    id: 'moda-country',
    nome: 'Moda Country',
    grupos: [
      'Camisas country', 'Botas country', 'Chapéus', 'Cintos e fivelas',
      'Jeans country', 'Acessórios country'
    ]
  },
  {
    id: 'semijoias',
    nome: 'Semijoias',
    grupos: [
      'Brincos', 'Colares', 'Pulseiras', 'Anéis',
      'Tornozeleiras', 'Berloques', 'Conjuntos'
    ]
  },
  {
    id: 'relojoaria',
    nome: 'Relojoaria',
    grupos: [
      'Relógios femininos', 'Relógios masculinos', 'Smartwatches',
      'Pulseiras e correias', 'Assistência técnica'
    ]
  },
  {
    id: 'perfumaria',
    nome: 'Perfumaria',
    grupos: [
      'Perfumes importados', 'Perfumes nacionais', 'Body splash',
      'Maquiagem', 'Cuidados com a pele', 'Kits e presentes'
    ]
  },
  {
    id: 'joalheria',
    nome: 'Joalheria',
    grupos: [
      'Alianças', 'Anéis de ouro', 'Colares de ouro', 'Brincos de ouro',
      'Pulseiras de ouro', 'Pedras preciosas'
    ]
  },
  {
    id: 'otica',
    nome: 'Ótica',
    grupos: [
      'Óculos solares', 'Óculos de grau', 'Armações', 'Lentes de grau',
      'Lentes de contato', 'Acessórios de ótica'
    ]
  }
]

// Produtos sugeridos dentro de cada grupo
const PRODUTOS_POR_GRUPO: Record<string, string[]> = {
  // Moda Infantil
  'Bebê': ['Body', 'Macacão', 'Mijão', 'Saída de maternidade', 'Kit maternidade', 'Babador'],
  'Infantil': ['Camiseta', 'Vestidinho', 'Short', 'Calça', 'Conjunto', 'Jaqueta'],
  'Juvenil': ['Camiseta juvenil', 'Calça jeans juvenil', 'Moletom', 'Short juvenil', 'Vestido juvenil'],
  'Conjuntos infantis': ['Verão', 'Inverno', 'Esportivo', 'Festa', 'Look completo'],
  'Pijamas infantis': ['Manga curta', 'Manga longa', 'Macacão pijama', 'Temático', 'Kit com 2'],
  'Calçados infantis': ['Tênis infantil', 'Sandália infantil', 'Sapatinho de bebê', 'Chinelo infantil', 'Bota infantil'],
  'Acessórios infantis': ['Laço', 'Faixa de cabelo', 'Meia', 'Boné infantil', 'Mochila infantil'],

  // Moda Íntima
  'Sutiãs': ['Com bojo', 'Sem bojo', 'Push up', 'Amamentação', 'Strapless', 'Top'],
  'Calcinhas': ['Tanga', 'Fio dental', 'Cintura alta', 'Hot pants', 'Kit com 3'],
  'Cuecas': ['Boxer', 'Slip', 'Samba-canção', 'Kit com 3'],
  'Pijamas': ['Manga curta', 'Manga longa', 'Short doll', 'Conjunto de inverno'],
  'Camisolas': ['Curta', 'Longa', 'Com robe', 'Renda', 'Noiva'],
  'Modeladores': ['Cinta modeladora', 'Body modelador', 'Shortinho modelador', 'Pós-cirúrgico'],
  'Meias': ['Soquete', 'Meia-calça', 'Meia 7/8', 'Meia esportiva', 'Kit com 3'],

  // Moda Fitness
  'Tops': ['Alta sustentação', 'Média sustentação', 'Nadador', 'Com bojo', 'Cropped'],
  'Leggings': ['Cintura alta', 'Com bolso', 'Térmica', 'Estampada', 'Poliamida'],
  'Shorts fitness': ['Ciclista', 'Saia-short', 'Corrida', 'Com bolso'],
  'Macaquinhos': ['Curto', 'Longo', 'Com bojo', 'Estampado'],
  'Conjuntos fitness': ['Top e legging', 'Top e short', 'Conjunto térmico', 'Kit treino'],
  'Regatas': ['Cavada', 'Alongada', 'Dry fit', 'Cropped'],
  'Agasalhos': ['Jaqueta corta-vento', 'Moletom', 'Calça de moletom', 'Conjunto de frio'],

  // Moda Evangélica
  'Vestidos longos': ['Liso', 'Estampado', 'Com manga', 'Social', 'Festa'],
  'Saias midi': ['Godê', 'Plissada', 'Lápis', 'Jeans', 'Com fenda forrada'],
  'Saias longas': ['Godê', 'Evasê', 'Jeans', 'Plissada', 'Com elástico'],
  'Blusas manga longa': ['Social', 'Tricô', 'Viscose', 'Com laço', 'Estampada'],
  'Conjuntos evangélicos': ['Saia e blusa', 'Twinset', 'Conjunto de festa', 'Conjunto social'],
  'Camisas': ['Social', 'Linho', 'Tricoline', 'Manga 3/4', 'Estampada'],

  // Plus Size
  'Blusas plus': ['Manga curta', 'Manga longa', 'Regata', 'Social', 'Estampada'],
  'Calças plus': ['Jeans', 'Alfaiataria', 'Legging', 'Pantalona', 'Cargo'],
  'Vestidos plus': ['Casual', 'Festa', 'Midi', 'Longo', 'Tubinho'],
  'Saias plus': ['Midi', 'Longa', 'Jeans', 'Evasê'],
  'Lingerie plus': ['Sutiã', 'Calcinha', 'Modelador', 'Conjunto'],
  'Moda praia plus': ['Biquíni', 'Maiô', 'Saída de praia', 'Short praia'],

  // Alta Costura
  'Vestidos de festa': ['Longo', 'Midi', 'Curto', 'Com fenda', 'Bordado', 'Sereia'],
  'Vestidos de noiva': ['Clássico', 'Sereia', 'Princesa', 'Civil', 'Segundo vestido'],
  'Madrinhas': ['Longo', 'Midi', 'Conjunto', 'Cores da paleta'],
  'Debutante': ['Vestido 15 anos', 'Valsa', 'Segundo vestido', 'Ensaio'],
  'Trajes masculinos': ['Smoking', 'Terno de festa', 'Gravata', 'Colete de noivo'],
  'Sob medida': ['Primeira prova', 'Ajuste final', 'Criação exclusiva', 'Consultoria'],

  // Alfaiataria
  'Ternos': ['Slim', 'Tradicional', 'Risca de giz', 'Linho', 'Casamento'],
  'Blazers': ['Feminino', 'Masculino', 'Oversized', 'Acinturado', 'Linho'],
  'Calças de alfaiataria': ['Reta', 'Pantalona', 'Slim', 'Com pregas', 'Cintura alta'],
  'Coletes': ['Social', 'Jeans', 'Xadrez', 'De terno'],
  'Camisas sociais': ['Branca', 'Slim fit', 'Tradicional', 'Com punho duplo', 'Linho'],
  'Ajustes e sob medida': ['Ajuste de barra', 'Ajuste de cintura', 'Peça sob medida', 'Prova'],

  // Loja de Roupas
  'Feminino': ['Blusa', 'Cropped', 'Vestido casual', 'Macacão', 'Body', 'Conjunto'],
  'Masculino': ['Camisa', 'Polo', 'Bermuda', 'Moletom', 'Colete'],
  'Jeans': ['Skinny', 'Mom', 'Wide leg', 'Reta', 'Flare', 'Jaqueta jeans'],
  'Camisetas': ['Básica', 'Estampada', 'Oversized', 'Gola V', 'Baby look'],
  'Vestidos': ['Casual', 'Midi', 'Longo', 'Tubinho', 'Chemise'],
  'Saias': ['Midi', 'Curta', 'Longa', 'Plissada', 'Jeans'],
  'Casacos e jaquetas': ['Moletom', 'Jaqueta jeans', 'Casaco de tricô', 'Corta-vento', 'Sobretudo'],
  'Shorts': ['Jeans', 'Alfaiataria', 'Moletom', 'Saia-short'],

  // Loja de Calçados
  'Tênis': ['Casual', 'Corrida', 'Chunky', 'Slip on', 'Infantil'],
  'Sandálias': ['Rasteira', 'Salto alto', 'Salto bloco', 'Anabela', 'Papete'],
  'Botas': ['Cano curto', 'Cano longo', 'Coturno', 'Over the knee', 'Impermeável'],
  'Sapatilhas': ['Bico fino', 'Bico redondo', 'Com laço', 'Boneca'],
  'Chinelos': ['Slide', 'Dedo', 'Anabela', 'Papete'],
  'Sapatos sociais': ['Oxford', 'Mocassim', 'Scarpin', 'Loafer'],
  'Calçados esportivos': ['Corrida', 'Treino', 'Futsal', 'Society', 'Caminhada'],

  // Loja de Bolsas
  'Bolsas femininas': ['Tote', 'Transversal', 'Ombro', 'Baguete', 'Festa', 'Shopper'],
  'Mochilas': ['Casual', 'Notebook', 'Escolar', 'Viagem', 'Antifurto'],
  'Carteiras': ['Feminina', 'Masculina', 'Porta-cartão', 'Com zíper'],
  'Necessaires': ['Maquiagem', 'Viagem', 'Kit com 3', 'Transparente'],
  'Malas de viagem': ['Bordo', 'Média', 'Grande', 'Kit com 3', 'Com rodinhas'],
  'Pochetes': ['Transversal', 'Cintura', 'Esportiva', 'Couro'],

  // Moda Praia
  'Biquínis': ['Cortininha', 'Hot pants', 'Tomara que caia', 'Asa delta', 'Com bojo', 'Estampado'],
  'Maiôs': ['Engana mamãe', 'Cavado', 'Com bojo', 'Frente única', 'Plus'],
  'Sungas': ['Tradicional', 'Boxer', 'Estampada', 'Lisa'],
  'Saídas de praia': ['Kimono', 'Vestido de praia', 'Camisão', 'Macacão de praia'],
  'Shorts de praia': ['Masculino', 'Feminino', 'Infantil', 'Estampado'],
  'Acessórios de praia': ['Canga', 'Chapéu de palha', 'Óculos de sol', 'Bolsa de praia', 'Protetor solar'],

  // Moda Country
  'Camisas country': ['Xadrez', 'Bordada', 'Manga longa', 'Feminina', 'Masculina'],
  'Botas country': ['Bico fino', 'Bico quadrado', 'Texana', 'Feminina', 'Masculina', 'Infantil'],
  'Chapéus': ['Feltro', 'Palha', 'Americano', 'Infantil'],
  'Cintos e fivelas': ['Cinto de couro', 'Fivela grande', 'Fivela personalizada', 'Cinto bordado'],
  'Jeans country': ['Bota cut', 'Flare', 'Reta masculina', 'Cintura alta'],
  'Acessórios country': ['Carteira de couro', 'Bandana', 'Luva', 'Bolsa de couro'],

  // Semijoias
  'Brincos': ['Argola', 'Ponto de luz', 'Ear cuff', 'Pendente', 'Brinco infantil'],
  'Colares': ['Choker', 'Corrente', 'Com pingente', 'Longo', 'Gargantilha'],
  'Pulseiras': ['Rígida', 'Elo', 'Com berloque', 'Fina', 'Kit'],
  'Anéis': ['Solitário', 'Aparador', 'Falange', 'Ajustável', 'Formatura'],
  'Tornozeleiras': ['Fina', 'Com pingente', 'Dupla', 'Trançada'],
  'Berloques': ['Coração', 'Letra', 'Zircônia', 'Temático'],
  'Conjuntos': ['Brinco e colar', 'Trio', 'Presente', 'Noiva'],

  // Relojoaria
  'Relógios femininos': ['Analógico', 'Digital', 'Dourado', 'Prateado', 'Com pedras'],
  'Relógios masculinos': ['Analógico', 'Cronógrafo', 'Automático', 'Social', 'Esportivo'],
  'Smartwatches': ['Fitness', 'Com GPS', 'Com chamadas', 'Infantil', 'Feminino'],
  'Pulseiras e correias': ['Couro', 'Aço', 'Silicone', 'Milanesa', 'Náilon'],
  'Assistência técnica': ['Troca de bateria', 'Ajuste de pulseira', 'Limpeza', 'Conserto', 'Troca de vidro'],

  // Perfumaria
  'Perfumes importados': ['Masculino', 'Feminino', 'Unissex', 'Árabe', 'Deo parfum', 'Miniatura'],
  'Perfumes nacionais': ['Masculino', 'Feminino', 'Infantil', 'Colônia', 'Deo colônia'],
  'Body splash': ['Frutado', 'Amadeirado', 'Doce', 'Infantil', 'Kit'],
  'Maquiagem': ['Base', 'Batom', 'Máscara de cílios', 'Pó compacto', 'Blush', 'Paleta de sombras'],
  'Cuidados com a pele': ['Protetor solar', 'Hidratante', 'Sérum', 'Sabonete facial', 'Esfoliante'],
  'Kits e presentes': ['Kit para ela', 'Kit para ele', 'Cesta', 'Kit infantil', 'Vale-presente'],

  // Joalheria
  'Alianças': ['Noivado', 'Casamento', 'Compromisso', 'Gravada', 'Com diamante'],
  'Anéis de ouro': ['Solitário', 'Formatura', 'Com pedra', 'Aparador'],
  'Colares de ouro': ['Corrente', 'Com pingente', 'Gargantilha', 'Escapulário'],
  'Brincos de ouro': ['Argola', 'Ponto de luz', 'Pendente', 'Infantil'],
  'Pulseiras de ouro': ['Elo', 'Veneziana', 'Com berloque', 'Masculina'],
  'Pedras preciosas': ['Diamante', 'Esmeralda', 'Safira', 'Rubi', 'Topázio'],

  // Ótica
  'Óculos solares': ['Aviador', 'Quadrado', 'Redondo', 'Gatinho', 'Esportivo', 'Infantil'],
  'Óculos de grau': ['Grau simples', 'Multifocal', 'Bifocal', 'Leitura', 'Infantil'],
  'Armações': ['Metal', 'Acetato', 'Balgriff', 'Titânio', 'Flexível'],
  'Lentes de grau': ['Antirreflexo', 'Transitions', 'Filtro azul', 'Polarizada', 'Multifocal'],
  'Lentes de contato': ['Diária', 'Mensal', 'Anual', 'Colorida', 'Tórica'],
  'Acessórios de ótica': ['Estojo', 'Cordinha', 'Flanela', 'Spray de limpeza', 'Correntinha']
}

// Marcas sugeridas conforme os grupos escolhidos
const MARCAS_POR_GRUPO: Record<string, string[]> = {
  // Moda Infantil
  'Bebê': ['Hering Kids', 'Milon', 'Puc', 'Alphabeto', 'Tip Top'],
  'Infantil': ['Hering Kids', 'Malwee Kids', 'Brandili', 'Milon', 'Puc'],
  'Juvenil': ['Hering Kids', 'Malwee Kids', 'Colcci Teen', 'Brandili'],
  'Calçados infantis': ['Klin', 'Bibi', 'Pampili', 'Molekinha', 'Nike Kids'],

  // Moda Íntima
  'Sutiãs': ['Hope', 'DeMillus', 'Liz', 'Loungerie', 'Duloren'],
  'Calcinhas': ['Hope', 'DeMillus', 'Liz', 'Duloren', 'Trifil'],
  'Cuecas': ['Zorba', 'Mash', 'Calvin Klein', 'Hering', 'Upman'],
  'Pijamas': ['Any Any', 'Hering', 'Lupo', 'Mixte'],
  'Camisolas': ['Any Any', 'DeMillus', 'Hope', 'Mixte'],
  'Modeladores': ['Plié', 'Esbelt', 'Yoga', 'Loba'],
  'Meias': ['Lupo', 'Trifil', 'Puket', 'Selene'],

  // Moda Fitness
  'Tops': ['Alto Giro', 'Live!', 'Vestem', 'Nike', 'Oxer'],
  'Leggings': ['Alto Giro', 'Live!', 'Vestem', 'Track&Field', 'Adidas'],
  'Shorts fitness': ['Live!', 'Oxer', 'Nike', 'Adidas'],
  'Conjuntos fitness': ['Alto Giro', 'Vestem', 'Live!', 'Track&Field'],
  'Agasalhos': ['Nike', 'Adidas', 'Puma', 'Oxer'],

  // Moda Evangélica
  'Vestidos longos': ['Joyaly', 'Bella Herança', 'Via Tolentino', 'Hapuk'],
  'Saias midi': ['Joyaly', 'Hapuk', 'Via Tolentino', 'Tata Martello'],
  'Saias longas': ['Joyaly', 'Bella Herança', 'Hapuk'],
  'Blusas manga longa': ['Joyaly', 'Via Tolentino', 'Tata Martello'],

  // Plus Size
  'Blusas plus': ['Almaria', 'Lunender', 'Pool Plus', 'Wee!'],
  'Calças plus': ['Almaria', 'Lunender', 'Pool Plus', 'Sawary'],
  'Vestidos plus': ['Almaria', 'Wee!', 'Lunender', 'Marisa Plus'],
  'Lingerie plus': ['DeMillus', 'Hope', 'Plié'],

  // Alta Costura
  'Vestidos de festa': ['Lethicia Bronstein', 'Patricia Bonaldi', 'Sandro Barros', 'Martu', 'Ateliê próprio'],
  'Vestidos de noiva': ['Wanda Borges', 'Lethicia Bronstein', 'Emannuelle Junqueira', 'Ateliê próprio'],
  'Trajes masculinos': ['Hugo Boss', 'Aramis', 'VR', 'Colombo'],

  // Alfaiataria
  'Ternos': ['Hugo Boss', 'Aramis', 'VR', 'Colombo', 'Reserva'],
  'Blazers': ['Reserva', 'Aramis', 'Colcci', 'Zinzane'],
  'Calças de alfaiataria': ['Reserva', 'Aramis', 'Colcci', 'VR'],
  'Camisas sociais': ['Dudalina', 'Aramis', 'Hugo Boss', 'VR', 'Individual'],

  // Loja de Roupas
  'Feminino': ['Hering', 'Colcci', 'Zinzane', 'Lez a Lez', 'Farm'],
  'Masculino': ['Hering', 'Colcci', 'Aramis', 'Reserva', 'Calvin Klein'],
  'Jeans': ['Levi’s', 'Sawary', 'Colcci', 'Zoomp', 'Handbook'],
  'Camisetas': ['Hering', 'Reserva', 'Colcci', 'Lacoste'],
  'Vestidos': ['Farm', 'Zinzane', 'Lez a Lez', 'Colcci'],
  'Casacos e jaquetas': ['Hering', 'Colcci', 'Nike', 'Adidas'],

  // Loja de Calçados
  'Tênis': ['Nike', 'Adidas', 'Olympikus', 'Vans', 'Puma'],
  'Sandálias': ['Vizzano', 'Beira Rio', 'Melissa', 'Dakota', 'Santa Lolla'],
  'Botas': ['Dakota', 'Bottero', 'Usaflex', 'Via Marte'],
  'Sapatilhas': ['Moleca', 'Beira Rio', 'Vizzano', 'Usaflex'],
  'Chinelos': ['Havaianas', 'Ipanema', 'Melissa', 'Rider'],
  'Sapatos sociais': ['Democrata', 'Ferracini', 'Sapatoterapia', 'Pegada'],
  'Calçados esportivos': ['Nike', 'Adidas', 'Olympikus', 'Mizuno', 'Asics'],

  // Loja de Bolsas
  'Bolsas femininas': ['Petite Jolie', 'Schutz', 'Santa Lolla', 'Colcci', 'Dumond'],
  'Mochilas': ['Kipling', 'Nike', 'Adidas', 'Sestini'],
  'Carteiras': ['Kipling', 'Petite Jolie', 'Schutz'],
  'Malas de viagem': ['Sestini', 'Samsonite', 'American Tourister'],

  // Moda Praia
  'Biquínis': ['Cia Marítima', 'Salinas', 'Rio de Sol', 'Água de Coco', 'Mar Rio'],
  'Maiôs': ['Cia Marítima', 'Lenny Niemeyer', 'Rio de Sol'],
  'Sungas': ['Mash', 'Speedo', 'Mar Rio'],
  'Saídas de praia': ['Salinas', 'Água de Coco', 'Cia Marítima'],

  // Moda Country
  'Camisas country': ['Wrangler', 'Minuty', 'Texas Farm', 'Radade'],
  'Botas country': ['Texas Boots', 'Goyazes', 'Capelli', 'Mexican Boots'],
  'Chapéus': ['Pralana', 'Eldorado', 'Marcatto'],
  'Cintos e fivelas': ['Silverado', 'Texas Farm', 'Fivelas do Brasil'],
  'Jeans country': ['Wrangler', 'Levi’s', 'Carmim', 'Minuty'],

  // Semijoias
  'Brincos': ['Rommanel', 'Prata Fina', 'Morana', 'Sabrina Joias'],
  'Colares': ['Rommanel', 'Morana', 'Prata Fina', 'Ouro Fino'],
  'Pulseiras': ['Rommanel', 'Prata Fina', 'Morana'],
  'Anéis': ['Rommanel', 'Prata Fina', 'Morana'],
  'Conjuntos': ['Rommanel', 'Morana', 'Sabrina Joias'],

  // Relojoaria
  'Relógios femininos': ['Technos', 'Mondaine', 'Michael Kors', 'Orient', 'Champion'],
  'Relógios masculinos': ['Casio', 'Orient', 'Technos', 'Seiko', 'Citizen'],
  'Smartwatches': ['Apple', 'Samsung', 'Garmin', 'Amazfit', 'Xiaomi'],
  'Pulseiras e correias': ['Technos', 'Casio', 'Orient'],

  // Perfumaria
  'Perfumes importados': ['Paco Rabanne', 'Carolina Herrera', 'Dior', 'Lattafa', 'Versace', 'Chanel'],
  'Perfumes nacionais': ['Natura', 'O Boticário', 'Eudora', 'Avon', 'Jequiti'],
  'Body splash': ['O Boticário', 'Natura', 'Eudora', 'Victoria’s Secret'],
  'Maquiagem': ['Ruby Rose', 'Vult', 'Mari Maria', 'Boca Rosa', 'Natura'],
  'Cuidados com a pele': ['La Roche-Posay', 'Vichy', 'Neutrogena', 'Cerave', 'Principia'],

  // Joalheria
  'Alianças': ['Vivara', 'Monte Carlo', 'H.Stern', 'Manoel Bernardes'],
  'Anéis de ouro': ['Vivara', 'Pandora', 'Monte Carlo', 'H.Stern'],
  'Colares de ouro': ['Vivara', 'Monte Carlo', 'Pandora'],
  'Brincos de ouro': ['Vivara', 'Pandora', 'Monte Carlo'],
  'Pedras preciosas': ['H.Stern', 'Vivara', 'Manoel Bernardes'],

  // Ótica
  'Óculos solares': ['Ray-Ban', 'Oakley', 'Chilli Beans', 'Carrera', 'Vogue', 'Prada'],
  'Óculos de grau': ['Ray-Ban', 'Vogue', 'Atitude', 'Hugo Boss', 'Tommy Hilfiger'],
  'Armações': ['Ray-Ban', 'Atitude', 'Colcci', 'Bulget', 'Lacoste'],
  'Lentes de grau': ['Zeiss', 'Essilor', 'Transitions', 'Hoya', 'Varilux'],
  'Lentes de contato': ['Acuvue', 'Bioview', 'Solotica', 'Air Optix', 'Biofinity']
}

// Marcas gerais da categoria, quando os grupos escolhidos não têm lista própria
const MARCAS_POR_SEGMENTO: Record<string, string[]> = {
  'moda-infantil': ['Hering Kids', 'Milon', 'Puc', 'Malwee Kids'],
  'moda-intima': ['Hope', 'DeMillus', 'Liz', 'Lupo'],
  'moda-fitness': ['Alto Giro', 'Live!', 'Vestem', 'Nike'],
  'moda-evangelica': ['Joyaly', 'Bella Herança', 'Hapuk'],
  'plus-size': ['Almaria', 'Lunender', 'Wee!'],
  'alta-costura': ['Ateliê próprio', 'Lethicia Bronstein', 'Martu'],
  'alfaiataria': ['Hugo Boss', 'Aramis', 'Dudalina', 'VR'],
  'loja-roupas': ['Hering', 'Colcci', 'Farm', 'Levi’s'],
  'loja-calcados': ['Nike', 'Adidas', 'Vizzano', 'Beira Rio'],
  'loja-bolsas': ['Kipling', 'Petite Jolie', 'Schutz'],
  'moda-praia': ['Cia Marítima', 'Salinas', 'Rio de Sol'],
  'moda-country': ['Wrangler', 'Minuty', 'Texas Farm'],
  'semijoias': ['Rommanel', 'Prata Fina', 'Morana'],
  'relojoaria': ['Casio', 'Technos', 'Orient', 'Mondaine'],
  'perfumaria': ['Natura', 'O Boticário', 'Eudora', 'Lattafa'],
  'joalheria': ['Vivara', 'Pandora', 'Monte Carlo'],
  'otica': ['Ray-Ban', 'Oakley', 'Chilli Beans', 'Zeiss']
}

// As sugestões vêm agrupadas, para a seleção ficar organizada na tela,
// e na ordem em que o cliente escolheu na etapa anterior. Um item que
// aparece em mais de um bloco fica só no primeiro, para não duplicar botão.
export interface BlocoSugestao {
  id: string
  titulo: string
  itens: string[]
}

export const gruposPorCategoria = (segmentoIds: string[]): BlocoSugestao[] => {
  const jaUsados = new Set<string>()
  return segmentoIds.flatMap(id => {
    const seg = SEGMENTOS.find(s => s.id === id)
    if (!seg) return []
    const itens = seg.grupos.filter(g => {
      if (jaUsados.has(g)) return false
      jaUsados.add(g)
      return true
    })
    return itens.length > 0 ? [{ id: seg.id, titulo: tituloCurto(seg.id), itens }] : []
  })
}

// produtos de cada grupo escolhido, um bloco por grupo
export const produtosPorGrupo = (grupos: string[]): BlocoSugestao[] => {
  const jaUsados = new Set<string>()
  return grupos.flatMap(grupo => {
    const itens = (PRODUTOS_POR_GRUPO[grupo] ?? []).filter(p => {
      if (jaUsados.has(p)) return false
      jaUsados.add(p)
      return true
    })
    return itens.length > 0 ? [{ id: grupo, titulo: grupo, itens }] : []
  })
}

export const marcasPorCategoria = (
  segmentoIds: string[],
  gruposSelecionados: string[]
): BlocoSugestao[] => {
  const jaUsadas = new Set<string>()
  return segmentoIds.flatMap(id => {
    const seg = SEGMENTOS.find(s => s.id === id)
    if (!seg) return []

    // marcas dos grupos desta categoria que o cliente marcou
    const gruposDaCategoria = seg.grupos.filter(g => gruposSelecionados.includes(g))
    const candidatas = gruposDaCategoria.flatMap(g => MARCAS_POR_GRUPO[g] ?? [])

    // se os grupos escolhidos não têm marcas mapeadas, usa as da categoria
    const base = candidatas.length > 0
      ? candidatas
      : gruposDaCategoria.length > 0 ? (MARCAS_POR_SEGMENTO[id] ?? []) : []

    const itens = base.filter(m => {
      if (jaUsadas.has(m)) return false
      jaUsadas.add(m)
      return true
    })
    return itens.length > 0 ? [{ id: seg.id, titulo: tituloCurto(seg.id), itens }] : []
  })
}

// listas planas, usadas para validar o que continua válido
export const gruposSugeridos = (segmentoIds: string[]): string[] =>
  gruposPorCategoria(segmentoIds).flatMap(b => b.itens)

export const produtosSugeridos = (grupos: string[]): string[] =>
  produtosPorGrupo(grupos).flatMap(b => b.itens)

export const marcasSugeridas = (segmentoIds: string[], grupos: string[]): string[] =>
  marcasPorCategoria(segmentoIds, grupos).flatMap(b => b.itens)
