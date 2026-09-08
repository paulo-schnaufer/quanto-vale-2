// features/calculo-pontuacao/logic.test.ts
//
// Cobre diretamente os critérios de aceite da spec. Escrito para vitest
// (padrão em projetos Vite); ajuste o import se o projeto usar outro
// test runner.

import { describe, it, expect } from 'vitest';
import { calcularResultado, calcularErroPercentualAbsoluto, faixaPorErro } from './logic';
import type { RodadaAtual } from '../../core/game-state.types';

function rodadaBase(overrides: Partial<RodadaAtual> = {}): RodadaAtual {
  return {
    numero: 1,
    duplaId: 'dupla-1',
    objeto: {
      id: 'obj-1',
      nome: 'Objeto de teste',
      imagemUrl: '',
      precoReaisCentavos: 10000, // R$ 100,00
    },
    palpiteReaisCentavos: 10000,
    tempoRespostaMs: 5000,
    esgotouTempo: false,
    resultado: null,
    ...overrides,
  };
}

describe('faixaPorErro — limites inclusivos', () => {
  it('erro de exatamente 5% cai em "maxima"', () => {
    expect(faixaPorErro(0.05)).toBe('maxima');
  });

  it('erro de exatamente 15% cai em "media"', () => {
    expect(faixaPorErro(0.15)).toBe('media');
  });

  it('erro de exatamente 30% cai em "baixa"', () => {
    expect(faixaPorErro(0.3)).toBe('baixa');
  });

  it('erro acima de 30% cai em "zero"', () => {
    expect(faixaPorErro(0.30001)).toBe('zero');
  });
});

describe('calcularErroPercentualAbsoluto — guarda defensiva preco === 0', () => {
  it('preco 0 e palpite 0 => erro 0', () => {
    expect(calcularErroPercentualAbsoluto(0, 0)).toBe(0);
  });

  it('preco 0 e palpite != 0 => erro 1', () => {
    expect(calcularErroPercentualAbsoluto(0, 500)).toBe(1);
  });
});

describe('calcularResultado — esgotouTempo sempre força pontosGanhos: 0', () => {
  it('esgotouTempo true, mesmo com palpite "perfeito" registrado => 0 pontos, faixa zero', () => {
    const rodada = rodadaBase({ esgotouTempo: true, palpiteReaisCentavos: 10000 });
    const resultado = calcularResultado(rodada);
    expect(resultado.pontosGanhos).toBe(0);
    expect(resultado.faixa).toBe('zero');
  });

  it('esgotouTempo true com palpite null (caso real de timeout)', () => {
    const rodada = rodadaBase({ esgotouTempo: true, palpiteReaisCentavos: null });
    const resultado = calcularResultado(rodada);
    expect(resultado.pontosGanhos).toBe(0);
    expect(resultado.faixa).toBe('zero');
  });
});

describe('calcularResultado — pontuação por faixa', () => {
  it('palpite exato => 1000 pontos, faixa maxima', () => {
    const rodada = rodadaBase({ palpiteReaisCentavos: 10000 });
    const resultado = calcularResultado(rodada);
    expect(resultado.faixa).toBe('maxima');
    expect(resultado.pontosGanhos).toBe(1000);
  });

  it('erro de 10% => 600 pontos, faixa media', () => {
    const rodada = rodadaBase({ palpiteReaisCentavos: 11000 });
    const resultado = calcularResultado(rodada);
    expect(resultado.faixa).toBe('media');
    expect(resultado.pontosGanhos).toBe(600);
  });

  it('erro de 25% => 250 pontos, faixa baixa', () => {
    const rodada = rodadaBase({ palpiteReaisCentavos: 12500 });
    const resultado = calcularResultado(rodada);
    expect(resultado.faixa).toBe('baixa');
    expect(resultado.pontosGanhos).toBe(250);
  });

  it('erro de 50% => 0 pontos, faixa zero', () => {
    const rodada = rodadaBase({ palpiteReaisCentavos: 15000 });
    const resultado = calcularResultado(rodada);
    expect(resultado.faixa).toBe('zero');
    expect(resultado.pontosGanhos).toBe(0);
  });
});
