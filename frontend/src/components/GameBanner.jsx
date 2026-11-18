import Button from './Button.jsx';
import styles from './GameBanner.module.css';

// Itens "soltos" no banner, iguais aos que aparecem no jogo (public/assets/game)
const ITENS = [
  { src: '/assets/game/materiais/garrafa_plastica.png', className: 'itemA' },
  { src: '/assets/game/materiais/latinha.png', className: 'itemB' },
  { src: '/assets/game/materiais/jornal.png', className: 'itemC' },
];
const LIXEIRAS = ['azul', 'vermelha', 'verde', 'amarela'];

/**
 * Chamada para o jogo de separação (/jogo).
 * `variant="hero"`: card grande da Home. `variant="compact"`: faixa para Materiais/Conteúdos.
 */
export default function GameBanner({
  variant = 'compact',
  background = '/assets/fundo_jogo.png',
  eyebrow = 'APRENDA BRINCANDO',
  title = 'Você sabe separar o lixo?',
  text = 'Arraste cada material para a lixeira certa e descubra dicas de descarte no caminho.',
  cta = 'Jogar agora',
  className = '',
}) {
  return (
    <section className={`${styles.banner} ${styles[variant]} ${className}`} aria-label="Jogo de separação de materiais">
      <img src={background} alt="" className={styles.bg} />
      <div className={styles.content}>
        <span className={styles.eyebrow}>
          <img src="/assets/leaf.svg" alt="" />
          {eyebrow}
        </span>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.text}>{text}</p>
        <Button to="/jogo" className={styles.cta}>
          {cta} <span aria-hidden="true">›</span>
        </Button>
      </div>
      <div className={styles.visual} aria-hidden="true">
        {ITENS.map((item) => (
          <img key={item.src} src={item.src} alt="" className={`${styles.item} ${styles[item.className]}`} />
        ))}
        <div className={styles.bins}>
          {LIXEIRAS.map((cor) => (
            <img key={cor} src={`/assets/game/descarte/lixeira_${cor}.png`} alt="" className={styles.bin} />
          ))}
        </div>
      </div>
    </section>
  );
}
