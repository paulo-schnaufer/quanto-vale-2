// features/configuracoes/index.ts
//
// Ponto único de importação da feature para o núcleo (registro de telas
// em main.ts). Importa o CSS junto ao módulo para que o Vite o inclua no
// bundle sempre que a tela for referenciada.
import './configuracoes.css';

export { configuracoesScreen } from './configuracoes.screen';
