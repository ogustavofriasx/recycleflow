import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DESTINOS, MATERIAIS } from '../data/game.js';
import styles from './GamePage.module.css';

export default function GamePage() {
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [pontos, setPontos] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const navigate = useNavigate();

  const materialAtual = MATERIAIS[indiceAtual];
  const jogoFinalizado = indiceAtual >= MATERIAIS.length;

  // arrasta guardando o ID do destino esperado
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', materialAtual.id);
  };

  // Permite que a lixeira receba o item
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Quando o usuário solta a imaagem
  const handleDrop = (e, destinoId) => {
    e.preventDefault();
    if (!materialAtual) return;

    const acertou = materialAtual.destinoCorreto === destinoId;

    if (acertou) {
      setPontos((prev) => prev + 10);
      setFeedback({
        tipo: 'acerto',
        texto: `Muito bem! ${materialAtual.dica}`,
        mostrarMapa: destinoId === 'ecoponto',
      });
    } else {
      setFeedback({
        tipo: 'erro',
        texto: `Ops! Esse não é o local ideal. ${materialAtual.dica}`,
        mostrarMapa: materialAtual.destinoCorreto === 'ecoponto',
      });
    }

    // Avança para o próximo material após 2.5 segundos
    setTimeout(() => {
      setFeedback(null);
      setIndiceAtual((prev) => prev + 1);
    }, 2500);
  };

  const reiniciarJogo = () => {
    setIndiceAtual(0);
    setPontos(0);
    setFeedback(null);
  };

  return (
    <section className={styles.stage}>
      <img src="/assets/fundo_jogo_pagina.png" alt="" className={styles.stageBg} />
      <div className={styles.container}>
      <div className={styles.header}>
        <h1>Desafio da Reciclagem</h1>
        <span className={styles.placar}>Pontos: {pontos}</span>
      </div>

      {!jogoFinalizado ? (
        <>
          <div className={styles.areaItem}>
            <div
              className={styles.itemArrastavel}
              draggable
              onDragStart={handleDragStart}
            >
              <img src={materialAtual.img} alt={materialAtual.nome} />
              <p className={styles.itemNome}>{materialAtual.nome}</p>
            </div>
            <span className={styles.instrucao}>
              Arraste o item acima até a lixeira correta ou ao Ecoponto
            </span>
          </div>

          <div className={styles.gridDestinos}>
            {DESTINOS.map((destino) => (
              <div
                key={destino.id}
                className={styles.destinoCard}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, destino.id)}
              >
                <img src={destino.img} alt={destino.nome} />
                <span>{destino.nome}</span>
              </div>
            ))}
          </div>

          {feedback && (
            <div
              className={`${styles.feedback} ${
                feedback.tipo === 'acerto' ? styles.acerto : styles.erro
              }`}
            >
              <p>{feedback.texto}</p>
              {feedback.mostrarMapa && (
                <div className={styles.acoesExtras}>
                  <button
                    className={`${styles.btn} ${styles.btnSecundario}`}
                    onClick={() => navigate('/mapa')} // leva pro mapa
                  >
                    Ver Ecopontos na cidade
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className={styles.areaItem}>
          <h2>Parabéns! Você concluiu o desafio.</h2>
          <p className={styles.itemNome}>Pontuação final: {pontos} pontos</p>
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