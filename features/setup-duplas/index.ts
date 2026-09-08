// features/setup-duplas/index.ts
//
// Superfície pública desta feature. O núcleo do app (main.ts /
// screen-router) importa apenas daqui — nunca dos arquivos internos
// *.screen.ts diretamente. Isso mantém a regra de acoplamento: outras
// features também nunca devem importar nada desta pasta além do que é
// exportado aqui (idealmente, nem isso — comunicação é só via bus).

import './setup-duplas.css';

export { boasVindasScreen } from './boas-vindas.screen';
export { setupDuplasScreen } from './setup-duplas.screen';
