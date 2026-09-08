export function proximaDuplaDaRodada(state: any) {
  if (!state.duplas || state.duplas.length === 0) {
    return null;
  }

  const palpitesDaRodada = state.rodadaAtual?.palpites || [];
  
  const duplasQueJaJogaram = new Set(palpitesDaRodada.map((p: any) => p.duplaId));
  
  const proxima = state.duplas.find((dupla: any) => !duplasQueJaJogaram.has(dupla.id));
  
  return proxima || null;
}

export function sessaoTerminou(state: any): boolean {
  const totalRodadas = state.configuracoes?.totalRodadas || 3;
  const numeroAtual = state.rodadaAtual?.numero || 1;
  const proxima = proximaDuplaDaRodada(state);
  
  return numeroAtual >= totalRodadas && proxima === null;
}