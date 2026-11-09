export interface FaqItem {
  question: string;
  answer: string;
}

export const homeFaqEn: FaqItem[] = [
  {
    question: "What is TimeToLearn?",
    answer: "TimeToLearn is an educational platform focused on teaching and learning English. It brings together interactive activities, resources for teachers and tools to organize student progress.",
  },
  {
    question: "Who is the platform for?",
    answer: "The platform is designed mainly for English teachers who want to create, organize and share activities, and for students who want to practice and track their learning in an organized environment.",
  },
  {
    question: "Does a student need to be linked to a teacher to use TimeToLearn?",
    answer: "Not to try public activities. To use individual progress tracking and the shared digital notebook, students need to accept an invitation from a teacher.",
  },
  {
    question: "Can I try activities without creating an account?",
    answer: "Yes. Activities published as public can be accessed without signing up. Public sessions are anonymous and do not add results to the leaderboard.",
  },
  {
    question: "What can teachers do on the platform?",
    answer: "Teachers can create activities, track student attempts, invite students to establish learning connections and use the digital notebook to organize content and learning records.",
  },
];

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


export const subscriptionFaq: FaqItem[] = [
  {
    question: "Quais planos estão disponíveis para professores?",
    answer: "O plano Gratuito oferece até 500 MB de armazenamento, até 5 alunos ativos ou convidados e exibição de anúncios. O plano Professor custa R$ 5,90 por mês, oferece 5 GB de armazenamento, alunos ilimitados e remove os anúncios.",
  },
  {
    question: "Como faço para contratar o plano Professor?",
    answer: "Na página Plano e assinatura, selecione a opção para assinar. Quando a integração de pagamento estiver habilitada, você será direcionado ao checkout para concluir a contratação.",
  },
  {
    question: "Como acompanho minha assinatura?",
    answer: "A página Plano e assinatura exibe o plano atual, o status da assinatura, o limite de armazenamento, a quantidade de alunos e a situação dos anúncios.",
  },
  {
    question: "Como cancelar minha assinatura?",
    answer: "Quando houver uma assinatura gerenciável, a página Plano e assinatura exibirá a opção Cancelar assinatura. O sistema solicitará confirmação antes de enviar o pedido.",
  },
  {
    question: "O que acontece se meu pagamento ficar pendente ou a assinatura expirar?",
    answer: "O status será apresentado na página Plano e assinatura. A disponibilidade dos benefícios pagos depende da situação atual da assinatura confirmada pelo sistema.",
  },
  {
    question: "A assinatura é necessária para vender materiais no Marketplace?",
    answer: "Sim. Para professores, a publicação de materiais para venda exige uma assinatura Professor ativa. Materiais cadastrados pela administração seguem regras próprias.",
  },
];

export const marketplaceFaqEn: FaqItem[] = [
  { question: "What is the Marketplace?", answer: "It is a place to discover teaching materials created by teachers, review previews and purchase files or resources delivered as Google Slides copies." },
  { question: "How do I purchase a resource?", answer: "Open the resource page, review its description, price and preview pages. Enter a valid email address and select Buy resource to start the payment." },
  { question: "Do I need an account to make a purchase?", answer: "You can start a purchase by entering an email address. To view My purchases on the platform, sign in or create an account with the same email address used for the purchase and verify it." },
  { question: "How do I receive a purchased resource?", answer: "For file-based resources, My purchases provides the original file download after payment confirmation. For Google Slides resources, it provides a link to create your own copy." },
  { question: "How do resource previews work?", answer: "You can review the pages made available by the seller before purchasing. Previews displayed by the platform include a TimeToLearn watermark." },
  { question: "How can I sell resources on the Marketplace?", answer: "Teachers must connect their own Mercado Pago account and have an active Teacher subscription. They can then submit a PDF, PPT or PPTX file, or provide a Google Slides link with a PDF preview." },
  { question: "Are resources submitted by teachers published immediately?", answer: "No. Resources submitted by teachers are reviewed by an administrator and become public only after approval. Resources added by administrators are published immediately." },
  { question: "What is the sales commission?", answer: "TimeToLearn retains a 20% commission on each sale made by teachers. Mercado Pago processing fees are charged separately." },
  { question: "How is a Google Slides resource delivered?", answer: "The buyer receives a link to create a copy in their own Google Drive. They must be signed in to a Google account, and the seller must configure sharing to allow copying." },
  { question: "Where can I find my purchases?", answer: "Open My purchases in the Marketplace. You must be signed in to the account associated with the email address used for the purchase." },
];

export const marketplaceFaq: FaqItem[] = [
  {
    question: "O que é o Marketplace?",
    answer: "É um espaço para encontrar materiais didáticos preparados por professores, consultar suas prévias e adquirir arquivos ou materiais disponibilizados como cópia no Google Slides.",
  },
  {
    question: "Como faço para comprar um material?",
    answer: "Abra a página do material, confira a descrição, o preço e as páginas de prévia. Informe um e-mail válido e selecione Comprar material para iniciar o pagamento.",
  },
  {
    question: "Preciso ter uma conta para comprar?",
    answer: "A compra pode ser iniciada informando um e-mail. Para consultar Minhas compras dentro da plataforma, entre ou crie uma conta usando o mesmo endereço informado na compra e confirme esse e-mail.",
  },
  {
    question: "Como recebo um material comprado?",
    answer: "Para materiais em arquivo, a área Minhas compras disponibiliza o download do original após a confirmação do pagamento. Para materiais Google Slides, ela apresenta o link para criar sua própria cópia.",
  },
  {
    question: "Como funciona a prévia dos materiais?",
    answer: "As páginas disponibilizadas pelo vendedor podem ser consultadas antes da compra. As prévias exibidas pela plataforma recebem marca d'água do TimeToLearn.",
  },
  {
    question: "Como vender materiais no Marketplace?",
    answer: "O professor precisa conectar sua própria conta do Mercado Pago e ter uma assinatura Professor ativa. Depois, pode cadastrar um arquivo PDF, PPT ou PPTX, ou disponibilizar um link do Google Slides acompanhado de um PDF para prévia.",
  },
  {
    question: "Os materiais enviados pelos professores são publicados imediatamente?",
    answer: "Não. Os materiais enviados por professores passam por análise administrativa e só aparecem publicamente depois da aprovação. Materiais cadastrados pela administração são publicados imediatamente.",
  },
  {
    question: "Qual é a comissão sobre as vendas?",
    answer: "O TimeToLearn retém uma comissão de 20% sobre cada venda realizada por professores. As tarifas de processamento do Mercado Pago são cobradas separadamente.",
  },
  {
    question: "Como funciona a entrega de um material do Google Slides?",
    answer: "O comprador recebe acesso ao link para criar uma cópia no próprio Google Drive. É necessário estar conectado a uma conta Google e o compartilhamento do material precisa estar configurado pelo vendedor para permitir a cópia.",
  },
  {
    question: "Onde encontro minhas compras?",
    answer: "Acesse Minhas compras no Marketplace. Essa área exige que você esteja conectado à conta associada ao e-mail utilizado na compra.",
  },
];

export const adminFaq: FaqItem[] = [
  {
    question: "Como funciona a aprovação de atividades?",
    answer: "As atividades enviadas pelos professores ficam disponíveis na área administrativa para revisão. A administração pode aprovar, solicitar alterações ou rejeitar uma atividade.",
  },
  {
    question: "Como disponibilizar uma atividade na página inicial?",
    answer: "Na administração de atividades, atividades publicadas podem ter sua visibilidade pública ativada ou desativada pela ação correspondente.",
  },
  {
    question: "Como funciona a moderação do Marketplace?",
    answer: "Os materiais enviados por professores ficam na fila de moderação. A administração pode revisar a descrição e o material e então aprovar para publicar ou rejeitar.",
  },
  {
    question: "Materiais cadastrados pela administração também precisam de aprovação?",
    answer: "Não. Materiais cadastrados pela administração são publicados imediatamente e não exigem assinatura de professor.",
  },
  {
    question: "O que acontece quando um material é rejeitado?",
    answer: "Ele não é publicado no Marketplace. O professor poderá consultar o status do material na área Marketplace do professor.",
  },
];
