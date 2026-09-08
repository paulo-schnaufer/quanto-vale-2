export function proximaDuplaDaRodada(state: any) {
  if (!state.duplas || state.duplas.length === 0) {
    return null;
  }

  const palpitesDaRodada = state.rodadaAtual?.palpites || [];
  
  const duplasQueJaJogaram = new Set(palpitesDaRodada.map((p: any) => p.duplaId));
  
  const proxima = state.duplas.find((dupla: any) => !duplasQueJaJogaram.has(dupla.id));
  
  return proxima || null;
}