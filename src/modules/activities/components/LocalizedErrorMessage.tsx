import { ErrorMessage } from "formik";
import { useTranslation } from "@/hooks/useTranslation";

const validationMessages: Record<string, string> = {
  "Informe o nome da atividade.": "Enter an activity name.",
  "Informe o nome do Quiz.": "Enter a quiz name.",
  "O nome deve ter pelo menos 3 caracteres.": "The name must contain at least 3 characters.",
  "O nome deve ter no máximo 120 caracteres.": "The name must contain no more than 120 characters.",
  "A descrição deve ter no máximo 2.000 caracteres.": "The description must contain no more than 2,000 characters.",
  "Selecione uma dificuldade válida.": "Select a valid difficulty.",
  "Selecione a dificuldade.": "Select a difficulty.",
  "Informe uma palavra.": "Enter a word.",
  "Cada palavra deve ter no máximo 50 caracteres.": "Each word must contain no more than 50 characters.",
  "Use apenas letras, espaços e hífens.": "Use letters, spaces, and hyphens only.",
  "Cada palavra deve ter entre 2 e 20 letras, desconsiderando espaços e hífens.": "Each word must contain between 2 and 20 letters, excluding spaces and hyphens.",
  "Informe as palavras da atividade.": "Enter the activity words.",
  "Informe pelo menos 3 palavras.": "Enter at least 3 words.",
  "Informe no máximo 30 palavras.": "Enter no more than 30 words.",
  "Existem palavras duplicadas na atividade.": "The activity contains duplicate words.",
  "Informe a resposta.": "Enter an answer.",
  "A resposta deve ter no máximo 100 caracteres.": "The answer must contain no more than 100 characters.",
  "A resposta deve ter entre 2 e 25 letras, desconsiderando espaços e hífens.": "The answer must contain between 2 and 25 letters, excluding spaces and hyphens.",
  "Informe a pista.": "Enter a clue.",
  "A pista deve ter no máximo 500 caracteres.": "The clue must contain no more than 500 characters.",
  "Informe as respostas e pistas.": "Enter the answers and clues.",
  "Informe pelo menos 3 respostas.": "Enter at least 3 answers.",
  "Informe no máximo 20 respostas.": "Enter no more than 20 answers.",
  "Existem respostas duplicadas na atividade.": "The activity contains duplicate answers.",
  "A imagem precisa ter uma referência válida.": "The image must have a valid reference.",
  "Identificador da alternativa obrigatório.": "The option ID is required.",
  "O texto deve ter no máximo 1000 caracteres.": "The text must contain no more than 1,000 characters.",
  "Use no máximo 5 imagens por alternativa.": "Use no more than 5 images per option.",
  "Preencha o texto da alternativa ou adicione uma imagem.": "Enter the option text or add an image.",
  "Informe o enunciado da questão.": "Enter the question prompt.",
  "O enunciado deve ter no máximo 2000 caracteres.": "The question prompt must contain no more than 2,000 characters.",
  "Use no máximo 5 imagens por enunciado.": "Use no more than 5 images per question prompt.",
  "A questão precisa ter pelo menos 3 alternativas.": "The question must have at least 3 options.",
  "Use no máximo 6 alternativas.": "Use no more than 6 options.",
  "Marque uma alternativa correta.": "Mark one correct option.",
  "A resposta correta deve corresponder a uma alternativa.": "The correct answer must match one of the options.",
  "Marque uma alternativa correta válida.": "Mark a valid correct option.",
  "Preencha o texto ou selecione uma imagem aprovada.": "Enter text or select an approved image.",
  "Identificador do par obrigatório.": "The pair ID is required.",
  "Adicione pelo menos 3 pares.": "Add at least 3 pairs.",
  "O limite é de 50 pares.": "The limit is 50 pairs.",
  "Cada par precisa ter um identificador único.": "Each pair must have a unique ID.",
  "Informe a palavra.": "Enter a word.",
  "A palavra deve ter até 20 letras.": "The word must contain up to 20 letters.",
  "Informe uma dica.": "Enter a hint.",
  "Informe uma URL válida.": "Enter a valid URL.",
  "Cadastre pelo menos 1 palavra.": "Add at least 1 word.",
  "Cadastre pelo menos 2 opções corretas.": "Add at least 2 correct options.",
  "Cadastre pelo menos 2 opções incorretas.": "Add at least 2 incorrect options.",
  "Informe um assunto com pelo menos 2 caracteres.": "Enter a topic with at least 2 characters.",
  "Cadastre pelo menos 2 assuntos.": "Add at least 2 topics.",
  "Adicione pelo menos 3 associações.": "Add at least 3 matches.",
  "O limite é de 50 associações.": "The limit is 50 matches.",
  "Cada associação precisa ter um identificador único.": "Each match must have a unique ID.",
  "Os itens de origem e as correspondências precisam ser únicos.": "Source items and matching items must be unique.",
  "Adicione pelo menos uma palavra.": "Add at least one word.",
  "O limite é de 200 palavras.": "The limit is 200 words.",
  "Inclua texto e pelo menos uma lacuna.": "Include text and at least one blank.",
  "Cada frase precisa ter pelo menos uma lacuna.": "Each sentence must contain at least one blank.",
  "Selecione uma palavra para cada lacuna.": "Select a word for each blank.",
  "Adicione pelo menos uma frase.": "Add at least one sentence.",
  "O limite é de 100 frases.": "The limit is 100 sentences.",
  "Cada palavra correta deve existir no banco e só pode ser usada uma vez.": "Each correct word must exist in the word bank and can only be used once.",
};

export function translateValidationMessage(message: string, locale: string): string {
  if (locale !== "en") return message;
  return validationMessages[message] ?? message;
}

interface LocalizedErrorMessageProps {
  name: string;
  className?: string;
}

export function LocalizedErrorMessage({ name, className }: LocalizedErrorMessageProps) {
  const { locale } = useTranslation();

  return (
    <ErrorMessage name={name}>
      {(message: string) => (
        <p className={className} role="alert">
          {translateValidationMessage(message, locale)}
        </p>
      )}
    </ErrorMessage>
  );
}
