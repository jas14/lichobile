import router from '../../../router';
import * as helper from '../../helper';
import { AnalyseCtrlInterface, ExplorerData, ExplorerGame, ExplorerMove, ExplorerPlayer } from '../interfaces';
import settings from '../../../settings';

let pieceNotation: boolean;

export interface Attrs {
  ctrl: AnalyseCtrlInterface
  data: ExplorerData
}

const OpeningTable: Mithril.Component<Attrs, {}> = {
  onbeforeupdate({ attrs }, { attrs: oldattrs }) {
    return attrs.data !== oldattrs.data;
  },

  view({ attrs }) {
    const { ctrl, data } = attrs;

    const moveTable = showMoveTable(ctrl, data.moves);
    const recentTable = showGameTable(ctrl, 'recent', data.recentGames || []);
    const topTable = showGameTable(ctrl, 'top', data.topGames || []);

    if (moveTable || recentTable || topTable) {
      return (
        <div key="explorer-opening" className="data scrollerWrapper">
          {moveTable}
          {topTable}
          {recentTable}
        </div>
      );
    } else {
      return showEmpty(ctrl);
    }
  }
}

export default OpeningTable

export function showTitle(ctrl: AnalyseCtrlInterface) {
  if (ctrl.data.game.variant.key === 'standard' || ctrl.data.game.variant.key === 'fromPosition') {
    return 'Opening explorer';
  } else {
    return ctrl.data.game.variant.name + ' opening explorer';
  }
}

export function showEmpty(ctrl: AnalyseCtrlInterface) {
  return (
    <div key="explorer-empty" className="data empty scrollerWrapper">
      <div className="title">{showTitle(ctrl)}</div>
      <div className="message">
        <i data-icon="" />
        <h3>No game found</h3>
        <p>{
          ctrl.explorer.config.fullHouse() ?
          'Already searching through all available games.' :
          'Maybe include more games from the preferences menu?'
        }</p>
      </div>
    </div>
  );
}

export function getTR(e: Event): HTMLElement {
  const target = (e.target as HTMLElement);
  return target.tagName === 'TR' ? target :
    helper.findParentBySelector(target, 'tr');
}

function resultBar(move: ExplorerMove) {
  const sum = move.white + move.draws + move.black;
  function section(key: string) {
    const num: number = move[key];
    const percent = num * 100 / sum;
    const width = (Math.round(num * 1000 / sum) / 10) + '%';
    return percent === 0 ? null : (
      <span className={'explorerBar ' + key} style={{width}}>
        {percent > 12 ? Math.round(percent) + (percent > 20 ? '%' : '') : null}
      </span>
    );
  }
  return ['white', 'draws', 'black'].map(section);
}

function onTableTap(ctrl: AnalyseCtrlInterface, e: Event) {
  const el = getTR(e);
  if ((el.dataset as any).uci) ctrl.explorerMove((el.dataset as any).uci);
}

function showResult(w: Color) {
  if (w === 'white') return <result className="white">1-0</result>;
  if (w === 'black') return <result className="black">0-1</result>;
  return <result className="draws">½-½</result>;
}

function link(ctrl: AnalyseCtrlInterface, e: Event) {
  const orientation = ctrl.chessground.data.orientation;
  const gameId = (getTR(e).dataset as any).id;
  if (gameId && ctrl.explorer.config.data.db.selected() === 'lichess') {
    router.set(`/analyse/online/${gameId}/${orientation}`);
  }
}

function showGameTable(ctrl: AnalyseCtrlInterface, type: string, games: Array<ExplorerGame>) {
  if (!ctrl.explorer.withGames || !games.length) return null;
  return (
    <table className="games"
      oncreate={helper.ontap(e => link(ctrl, e), null, null, false, getTR)}
    >
      <thead>
        <tr className="explorerTableHeader">
          <th colspan="4">{type + ' games'}</th>
        </tr>
      </thead>
      <tbody>
      { games.map((game: ExplorerGame) => {
        return (
          <tr key={game.id} data-id={game.id}>
            <td>
              {[game.white, game.black].map((p: ExplorerPlayer) =>
                <span>{p.rating}</span>
              )}
            </td>
            <td>
              {[game.white, game.black].map((p: ExplorerPlayer) =>
                <span>{p.name}</span>
              )}
            </td>
            <td>
              {showResult(game.winner)}
            </td>
            <td>
              {game.year}
            </td>
          </tr>
        );
      })}
      </tbody>
    </table>
  );
}

function showMoveTable(ctrl: AnalyseCtrlInterface, moves: Array<ExplorerMove>) {
  if (!moves.length) return null;
  pieceNotation = pieceNotation === undefined ? settings.game.pieceNotation() : pieceNotation;
  return (
    <table className={'moves' + (pieceNotation ? ' displayPieces' : '')}
      oncreate={helper.ontap(e => onTableTap(ctrl, e), null, null, false, getTR)}
    >
      <thead>
        <tr className="explorerTableHeader">
          <th>Move</th>
          <th>Games</th>
          <th>Rating</th>
          <th>White / Draw / Black</th>
        </tr>
      </thead>
      <tbody>
        { moves.map(move => {
          return (
            <tr key={move.uci} data-uci={move.uci}>
              <td className="explorerMove">
                {move.san[0] === 'P' ? move.san.slice(1) : move.san}
              </td>
              <td className="explorerMove">
                {move.white + move.draws + move.black}
              </td>
              <td className="explorerMove">
                {move.averageRating}
              </td>
              <td className="explorerMove">
                {resultBar(move)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}