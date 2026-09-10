// features/selecao-objeto/catalogo.ts
//
// Catálogo de objetos é local a esta feature (fora de GameState), pois
// nenhuma outra feature precisa da lista completa — apenas do objeto já
// sorteado, disponível via RodadaAtual.objeto.
//
// TODO de asset: as imagens reais ainda não existem. `imagemUrl` aponta
// para um caminho convencionado em `public/assets/objetos/`; enquanto o
// arquivo não existir, a UI cai automaticamente no placeholder colorido
// com o nome do objeto (ver index.ts / evento `error` da <img>).

import type { ObjetoJogo } from '../../core/game-state.types';

/**
 * Catálogo mínimo recomendado pela spec: 15 objetos (cobre 3 duplas × 5
 * rodadas sem repetição). Mantido em 16 para uma pequena folga.
 */
export const CATALOGO_OBJETOS: ObjetoJogo[] = [
  {
    id: 'tenis-esportivo',
    nome: 'Tênis esportivo',
    imagemUrl: '/assets/objetos/tenis-esportivo.jpg',
    precoReaisCentavos: 29990,
    categoria: 'vestuário',
  },
  {
    id: 'smartphone-intermediario',
    nome: 'Smartphone',
    imagemUrl: '/assets/objetos/smartphone-intermediario.jpg',
    precoReaisCentavos: 189900,
    categoria: 'eletrônicos',
  },
  {
    id: 'fone-bluetooth',
    nome: 'Fone de ouvido bluetooth',
    imagemUrl: '/assets/objetos/fone-bluetooth.jpg',
    precoReaisCentavos: 14990,
    categoria: 'eletrônicos',
  },
  {
    id: 'mochila-escolar',
    nome: 'Mochila escolar',
    imagemUrl: '/assets/objetos/mochila-escolar.jpg',
    precoReaisCentavos: 12990,
    categoria: 'acessórios',
  },
  {
    id: 'relogio-digital',
    nome: 'Relógio digital',
    imagemUrl: '/assets/objetos/relogio-digital.jpg',
    precoReaisCentavos: 8990,
    categoria: 'acessórios',
  },
  {
    id: 'bicicleta-aro-29',
    nome: 'Bicicleta aro 29',
    imagemUrl: '/assets/objetos/bicicleta-aro-29.jpg',
    precoReaisCentavos: 89900,
    categoria: 'esporte',
  },
  {
    id: 'console-videogame',
    nome: 'Console de videogame',
    imagemUrl: '/assets/objetos/console-videogame.jpg',
    precoReaisCentavos: 249900,
    categoria: 'eletrônicos',
  },
  {
    id: 'camera-digital',
    nome: 'Câmera digital compacta',
    imagemUrl: '/assets/objetos/camera-digital.jpg',
    precoReaisCentavos: 79900,
    categoria: 'eletrônicos',
  },
  {
    id: 'skate-completo',
    nome: 'Skate completo',
    imagemUrl: '/assets/objetos/skate-completo.jpg',
    precoReaisCentavos: 24990,
    categoria: 'esporte',
  },
  {
    id: 'patins-inline',
    nome: 'Patins in-line',
    imagemUrl: '/assets/objetos/patins-inline.jpg',
    precoReaisCentavos: 19990,
    categoria: 'esporte',
  },
  {
    id: 'violao-acustico',
    nome: 'Violão acústico',
    imagemUrl: '/assets/objetos/violao-acustico.jpg',
    precoReaisCentavos: 45900,
    categoria: 'música',
  },
  {
    id: 'guarda-chuva-grande',
    nome: 'Guarda-chuva grande',
    imagemUrl: '/assets/objetos/guarda-chuva-grande.jpg',
    precoReaisCentavos: 3990,
    categoria: 'utilidades',
  },
  {
    id: 'caderno-universitario',
    nome: 'Caderno universitário',
    imagemUrl: '/assets/objetos/caderno-universitario.jpg',
    precoReaisCentavos: 2490,
    categoria: 'papelaria',
  },
  {
    id: 'estojo-escolar',
    nome: 'Estojo escolar',
    imagemUrl: '/assets/objetos/estojo-escolar.jpg',
    precoReaisCentavos: 3490,
    categoria: 'papelaria',
  },
  {
    id: 'bone-esportivo',
    nome: 'Boné esportivo',
    imagemUrl: '/assets/objetos/bone-esportivo.jpg',
    precoReaisCentavos: 5990,
    categoria: 'vestuário',
  },
  {
    id: 'oculos-de-sol',
    nome: 'Óculos de sol',
    imagemUrl: '/assets/objetos/oculos-de-sol.jpg',
    precoReaisCentavos: 14900,
    categoria: 'acessórios',
  },
];
