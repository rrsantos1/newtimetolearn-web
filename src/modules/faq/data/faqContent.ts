export interface FaqItem {
  question: string;
  answer: string;
}

export const homeFaq: FaqItem[] = [
  {
    question: "O que é o TimeToLearn?",
    answer: "O TimeToLearn é uma plataforma educacional voltada ao ensino e à aprendizagem de inglês. Ela reúne atividades interativas, recursos para professores e ferramentas para organizar o acompanhamento dos alunos.",
  },
  {
    question: "Para quem a plataforma foi criada?",
    answer: "A plataforma atende principalmente professores de inglês que desejam criar, organizar e compartilhar atividades, e alunos que querem praticar e acompanhar seus estudos em um ambiente organizado.",
  },
  {
    question: "O aluno precisa ter um professor vinculado para usar o TimeToLearn?",
    answer: "Não para experimentar atividades públicas. Para utilizar o acompanhamento individual e o caderno virtual compartilhado, o aluno precisa aceitar um convite enviado por um professor.",
  },
  {
    question: "É possível experimentar atividades sem criar uma conta?",
    answer: "Sim. As atividades disponibilizadas como públicas podem ser acessadas sem cadastro. A execução pública é anônima e não registra resultados no ranking.",
  },
  {
    question: "O que os professores podem fazer na plataforma?",
    answer: "Professores podem criar atividades, acompanhar tentativas dos alunos, convidar alunos para estabelecer vínculos e utilizar o caderno virtual para organizar conteúdos e registros de aprendizagem.",
  },
];

export const activitiesFaq: FaqItem[] = [
  {
    question: "Quais tipos de atividades estão disponíveis?",
    answer: "O catálogo atual inclui Caça-palavras, Palavras cruzadas, Quiz, Jogo da memória, Listening, Associação de palavras, Complete as frases, Múltipla escolha, Roleta, Forca e Acertar a toupeira. A disponibilidade pode variar conforme a área e as permissões da conta.",
  },
  {
    question: "Como funciona o Caça-palavras?",
    answer: "O aluno procura e seleciona, em uma grade de letras, as palavras cadastradas pelo professor. A atividade pode ser usada para praticar vocabulário e reconhecimento de palavras.",
  },
  {
    question: "Como funcionam as Palavras cruzadas?",
    answer: "O aluno preenche a grade com palavras a partir de pistas horizontais e verticais preparadas pelo professor.",
  },
  {
    question: "Como funciona o Quiz?",
    answer: "O aluno responde a questões de múltipla escolha, com alternativas e correção automática. A atividade permite revisar as respostas ao terminar.",
  },
  {
    question: "Como funciona o Jogo da memória?",
    answer: "O aluno procura pares correspondentes. Os pares podem combinar textos e imagens, de acordo com a configuração criada pelo professor.",
  },
  {
    question: "O que é uma atividade Listening?",
    answer: "É uma atividade de compreensão auditiva. O aluno acompanha a narração de um ou mais textos e completa os espaços em branco correspondentes.",
  },
  {
    question: "Como funcionam Associação de palavras e Múltipla escolha?",
    answer: "Em Associação de palavras, o aluno relaciona elementos correspondentes. Em Múltipla escolha, analisa cada item e seleciona a opção correta entre as alternativas apresentadas.",
  },
  {
    question: "Como funciona Complete as frases?",
    answer: "O aluno completa frases preenchendo os espaços com palavras disponíveis em um banco de opções.",
  },
  {
    question: "Como funcionam a Roleta, a Forca e Acertar a toupeira?",
    answer: "A Roleta sorteia temas ou desafios; na Forca, o aluno descobre uma palavra a partir de pistas; e em Acertar a toupeira, identifica as respostas corretas entre os elementos apresentados durante o jogo.",
  },
  {
    question: "Quem pode criar e publicar atividades?",
    answer: "Professores podem criar atividades e enviá-las para avaliação. A publicação como atividade pública depende da aprovação administrativa.",
  },
  {
    question: "Atividades públicas registram resultados no ranking?",
    answer: "Não quando são executadas anonimamente, sem login. Essas execuções não participam do ranking.",
  },
];

export const teacherStudentsFaq: FaqItem[] = [
  {
    question: "Como convidar um aluno?",
    answer: "Na área Meus alunos, o professor informa o e-mail utilizado pelo aluno no cadastro e envia o convite. O aluno precisa acessar sua conta e aceitar o convite para ativar o vínculo.",
  },
  {
    question: "O que acontece depois que o convite é enviado?",
    answer: "O convite aparece como pendente para o professor e fica disponível para o aluno na área Meus professores. Até que o aluno aceite, o vínculo não está ativo.",
  },
  {
    question: "O aluno pode recusar ou cancelar um convite?",
    answer: "Sim. O aluno pode aceitar ou recusar o convite recebido. Também pode cancelar um convite pendente, assim como o professor pode cancelar um convite que enviou.",
  },
  {
    question: "Como acessar o caderno virtual de um aluno?",
    answer: "Na lista de alunos com vínculo ativo, o professor utiliza a opção Abrir caderno para acessar o caderno compartilhado daquele aluno.",
  },
  {
    question: "O que pode ser organizado no caderno virtual?",
    answer: "O caderno permite organizar registros por dia, incluir conteúdos e anexos e trocar mensagens relacionadas aos registros. Ele funciona como um espaço compartilhado entre professor e aluno.",
  },
  {
    question: "O professor pode encerrar um vínculo?",
    answer: "Sim. Na área Meus alunos, o professor pode encerrar um vínculo ativo. Essa ação deve ser utilizada quando o acompanhamento entre professor e aluno não for mais necessário.",
  },
];

export const studentFaq: FaqItem[] = [
  {
    question: "Como recebo um convite de um professor?",
    answer: "O professor envia o convite para o e-mail associado à sua conta. Depois, acesse a área Meus professores para consultar os convites recebidos.",
  },
  {
    question: "Como aceitar um convite?",
    answer: "Na área Meus professores, localize o convite pendente e selecione Aceitar. Depois da confirmação, o vínculo passa a aparecer como ativo.",
  },
  {
    question: "Posso recusar um convite?",
    answer: "Sim. Na mesma área em que os convites são exibidos, você pode selecionar Recusar. O convite também pode ser cancelado enquanto estiver pendente.",
  },
  {
    question: "Como acesso meu caderno virtual?",
    answer: "Depois que o vínculo com o professor estiver ativo, utilize a opção Abrir meu caderno na área Meus professores.",
  },
  {
    question: "Como funciona o caderno virtual?",
    answer: "O caderno é um espaço compartilhado com o professor vinculado. Nele ficam organizados registros por data, conteúdos e anexos, além de recursos para comunicação sobre os registros.",
  },
  {
    question: "Quem pode adicionar ou organizar conteúdos no caderno?",
    answer: "O caderno é compartilhado entre professor e aluno. As opções disponíveis na tela podem variar conforme o tipo de registro e a permissão de cada participante.",
  },
  {
    question: "O que acontece se eu encerrar o vínculo com um professor?",
    answer: "O vínculo deixa de ficar ativo. Se precisar de acompanhamento novamente, será necessário estabelecer um novo vínculo por convite.",
  },
];
