import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DESTINOS, MATERIAIS } from '../data/game.js';
import styles from './GamePage.module.css';

// Embaralha uma copia do array sem alterar o original
function embaralharArray(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Nome acessível do botão: só a cor (ou "Ecoponto"), para não entregar a resposta
const rotuloDestino = (destino) =>
  destino.id === 'ecoponto' ? 'Ecoponto' : `Lixeira ${destino.nome.replace(/[()]/g, '').toLowerCase()}`;

// Lixeira (data-destino) que está sob o ponto (x, y). elementsFromPoint devolve todos os
// elementos empilhados ali, inclusive os que estão atrás do item sendo arrastado.
function destinoNoPonto(x, y) {
  const alvo = document.elementsFromPoint(x, y).find((el) => el.closest?.('[data-destino]'));
  return alvo?.closest('[data-destino]')?.dataset.destino ?? null;
}

// Abaixo disso (em px) o gesto é considerado toque, não arrasto
const LIMIAR_ARRASTO = 6;

export default function GamePage() {
  const [materiaisRodada, setMateriaisRodada] = useState(() =>
    embaralharArray(MATERIAIS)
  );
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [sequencia, setSequencia] = useState(0);
  const [maiorSequencia, setMaiorSequencia] = useState(0);
  const [feedback, setFeedback] = useState(null);
  // Arrasto com Pointer Events: funciona com mouse, toque e caneta
  // (o arrastar nativo do HTML, draggable/onDrop, não funciona em celular).
  const [arrasto, setArrasto] = useState(null); // { dx, dy } enquanto arrasta
  const [destinoSobItem, setDestinoSobItem] = useState(null);
  const inicioRef = useRef(null); // { x, y, pointerId }
  const feedbackRef = useRef(null);
  const navigate = useNavigate();

  const materialAtual = materiaisRodada[indiceAtual];
  const jogoFinalizado = indiceAtual >= materiaisRodada.length;
  const ehUltimoItem = indiceAtual === materiaisRodada.length - 1;

  // Confere a resposta (vinda do arrasto ou de um toque/clique na lixeira)
  const responder = (destinoId) => {
    if (!materialAtual || feedback) return;

    const acertou = materialAtual.destinoCorreto === destinoId;

    if (acertou) {
      setSequencia((prev) => {
        const novaSequencia = prev + 1;
        setMaiorSequencia((recorde) => Math.max(recorde, novaSequencia));
        return novaSequencia;
      });
      setFeedback({
        tipo: 'acerto',
        texto: `Muito bem! ${materialAtual.dica}`,
        mostrarMapa: destinoId === 'ecoponto',
      });
    } else {
      setSequencia(0);
      setFeedback({
        tipo: 'erro',
        texto: `Ops! ${materialAtual.dica}`,
        mostrarMapa: materialAtual.destinoCorreto === 'ecoponto',
      });
    }
  };

  // No celular a dica aparece abaixo das lixeiras: rola até ela para o botão "Próximo" ficar visível
  useEffect(() => {
    if (!feedback) return;
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    feedbackRef.current?.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'nearest' });
  }, [feedback]);

  const handlePointerDown = (e) => {
    if (feedback || !materialAtual) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault(); // evita seleção de texto e o "fantasma" da imagem
    e.currentTarget.setPointerCapture(e.pointerId);
    inicioRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    setArrasto({ dx: 0, dy: 0 });
  };

  const handlePointerMove = (e) => {
    const inicio = inicioRef.current;
    if (!inicio || inicio.pointerId !== e.pointerId) return;
    setArrasto({ dx: e.clientX - inicio.x, dy: e.clientY - inicio.y });
    setDestinoSobItem(destinoNoPonto(e.clientX, e.clientY));
  };

  const terminarArrasto = (e, cancelado = false) => {
    const inicio = inicioRef.current;
    if (!inicio || inicio.pointerId !== e.pointerId) return;
    const moveu = Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > LIMIAR_ARRASTO;
    const destino = !cancelado && moveu ? destinoNoPonto(e.clientX, e.clientY) : null;
    inicioRef.current = null;
    setArrasto(null);
    setDestinoSobItem(null);
    if (destino) responder(destino);
  };

  // Avança para o próximo item ao clicar no botão
  const handleProximo = () => {
    setFeedback(null);
    setIndiceAtual((prev) => prev + 1);
  };

  const reiniciarJogo = () => {
    setMateriaisRodada(embaralharArray(MATERIAIS));
    setIndiceAtual(0);
    setSequencia(0);
    setMaiorSequencia(0);
    setFeedback(null);
  };

  return (
    <section className={styles.stage}>
      <img
        src="/assets/fundo_jogo_pagina.png"
        alt=""
        className={styles.stageBg}
      />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Desafio da Reciclagem</h1>
          <span className={styles.placar}>Sequência: {sequencia}</span>
        </div>

        {!jogoFinalizado ? (
          <>
            <div className={styles.areaItem}>
              <div
                className={[
                  styles.itemArrastavel,
                  arrasto && styles.arrastando,
                  feedback && styles.itemBloqueado,
                ].filter(Boolean).join(' ')}
                style={arrasto ? { transform: `translate(${arrasto.dx}px, ${arrasto.dy}px) scale(1.08)` } : undefined}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={(e) => terminarArrasto(e)}
                onPointerCancel={(e) => terminarArrasto(e, true)}
              >
                <img src={materialAtual.img} alt={materialAtual.nome} draggable={false} />
                <p className={styles.itemNome}>{materialAtual.nome}</p>
              </div>
              <span className={styles.instrucao} aria-live="polite">
                {feedback
                  ? 'Leia a dica abaixo e toque em Próximo para continuar'
                  : 'Arraste o item até a lixeira correta ou ao Ecoponto (ou toque no destino)'}
              </span>
            </div>

            <div className={styles.gridDestinos}>
              {DESTINOS.map((destino) => (
                <button
                  type="button"
                  key={destino.id}
                  data-destino={destino.id}
                  className={destinoSobItem === destino.id ? `${styles.destinoCard} ${styles.destinoAlvo}` : styles.destinoCard}
                  onClick={() => responder(destino.id)}
                  disabled={Boolean(feedback)}
                  aria-label={rotuloDestino(destino)}
                >
                  <img src={destino.img} alt="" draggable={false} />
                  <span>{destino.nome}</span>
                </button>
              ))}
            </div>

            {feedback && (
              <div
                ref={feedbackRef}
                role="status"
                className={`${styles.feedback} ${
                  feedback.tipo === 'acerto' ? styles.acerto : styles.erro
                }`}
              >
                <p>{feedback.texto}</p>
                <div className={styles.acoesExtras}>
                  {feedback.mostrarMapa && (
                    <button
                      className={`${styles.btn} ${styles.btnSecundario}`}
                      onClick={() => navigate('/mapa')} // leva pro mapa
                    >
                      Ver Ecopontos na cidade
                    </button>
                  )}
                  <button className={styles.btn} onClick={handleProximo}>
                    {ehUltimoItem ? 'Ver resultado' : 'Próximo'}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={styles.areaItem}>
            <h2>Parabéns! Você concluiu o desafio.</h2>
            <p className={styles.itemNome}>
              Sequência final: {sequencia} | Maior sequência: {maiorSequencia}
            </p>
            <div className={styles.acoesExtras}>
              <button className={styles.btn} onClick={reiniciarJogo}>
                Jogar Novamente
              </button>
              <button
                className={`${styles.btn} ${styles.btnSecundario}`}
                onClick={() => navigate('/mapa')} // leva pro mapa
              >
                Encontrar Ecopontos
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
