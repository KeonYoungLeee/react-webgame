import React, {useReducer, createContext, useMemo, useEffect} from 'react';
import Table from './Table';
import Form from './Form';

// 지뢰 상태를 코드로 만들 것이다.
export const CODE = {
  MINE : -7, // 지뢰 칸
  NORMAL : -1,          // 정상 칸(닫혀 있는 칸)
  QUESTION : -2,        // 물음 표
  FLAG : -3,            // 깃발
  QUESTION_MINE : -4,   // 물음표 지뢰
  FLAG_MINE : -5,       // 깃발 지뢰
  CLICKED_MINE : -6,    // 클릭 지뢰
  OPENED : 0,           // 칸을 연칸 : 0 이상이면 전부 OPEND 열리도록 한다. 
}

export const TableContext = createContext({
  tableData: [],
  halted: true,
  dispatch: () => {},
});

// 지뢰를 심는 함수
const plantMine = (row, cell, mine) => {
  console.log(row, cell, mine);
  const candiate = Array(row*cell).fill().map((arr, i) => { // 0 ~ 99 칸
    return i;
  });
  const shuffle = [];
  while ( candiate.length > row * cell - mine ) { 
    const chosen = candiate.splice(Math.floor(Math.random() * candiate.length), 1)[0]; 
    shuffle.push(chosen);
  }
  const data = []; 
  for ( let i = 0; i < row; i ++ ) { // 테이블 데이터을 구현
    const rowData = [];
    data.push(rowData);
    for ( let j = 0; j < cell; j ++ ) {
      rowData.push(CODE.NORMAL);
    }
  }

  for ( let k = 0; k < shuffle.length; k++ ) { // 칸 위치 찾기
    const ver = Math.floor(shuffle[k] / cell ); 
    const hor = shuffle[k] % cell;
    data[ver][hor] = CODE.MINE;
  }

  console.log(data);
  return data; // tableData에 지뢰를 심는다
};

const initalState = {
  tableData: [],
  data : {
    row : 0,
    cell : 0,
    mine : 0,
  },
  timer: 0,
  result: '',
  halted: true, // halted가 '중단된' 의미..
  openedCount : 0, // 칸을 몇개를 열었는지 체크하는 거
};

export const START_GAME = 'START_GAME';
export const OPEN_CELL = 'OPEN_CELL';
export const CLICK_MINE = 'CLICK_MINE';
export const FLAG_CELL = 'FLAG_CELL';
export const QUESTION_CELL = 'QUESTION_CELL';
export const NORMALIZE_CELL = 'NORMALIZE_CELL';
export const INCREMENT_TIMER = 'INCREMENT_TIMER';

const reducer = (state, action) => {
  switch (action.type) {
    case START_GAME: 
    return { 
      ...state,
      data : {
        row : action.row,
        cell : action.cell,
        mine : action.mine,
      }, 
      tableData : plantMine(action.row, action.cell, action.mine),
      halted: false, 
      openedCount : 0,
      timer : 0, 
    };
    case OPEN_CELL: {
      const tableData = [...state.tableData];
      tableData.forEach((row, i) => {
        tableData[i] = [...row];
      });
      const checked = [];
      let openedCount = 0;
      const checkAround = (row, cell) => {
        if (row < 0 || row > tableData.length || cell < 0 || cell > tableData[0].length) {
          return;
        }
        if ([CODE.OPENED, CODE.FLAG, CODE.FLAG_MINE, CODE.QUESTION_MINE, CODE.QUESTION].includes(tableData[row][cell])) {
          return;
        }
        if (checked.includes(row + '/' + cell)) {
          return;
        } else {
          checked.push(row + '/' + cell);
        }
        
        let around = [
          tableData[row][cell - 1], tableData[row][cell + 1],
        ];
        if (tableData[row - 1]) {
          around = around.concat([tableData[row - 1][cell - 1], tableData[row - 1][cell], tableData[row - 1][cell + 1]]);
        }
        if (tableData[row + 1]) {
          around = around.concat([tableData[row + 1][cell - 1], tableData[row + 1][cell], tableData[row + 1][cell + 1]]);
        }
        const count = around.filter(function (v) {
          return [CODE.MINE, CODE.FLAG_MINE, CODE.QUESTION_MINE].includes(v);
        }).length;
        if (count === 0) { // 주변칸 오픈
          if (row > -1) {
            const near = [];
            if (row - 1 > -1) {
              near.push([row -1, cell - 1]);
              near.push([row -1, cell]);
              near.push([row -1, cell + 1]);
            }
            near.push([row, cell - 1]);
            near.push([row, cell + 1]);
            if (row + 1 < tableData.length) {
              near.push([row + 1, cell - 1]);
              near.push([row + 1, cell]);
              near.push([row + 1, cell + 1]);
            }
            near.filter(v => !!v).forEach((n) => {
              if (tableData[n[0]][n[1]] !== CODE.OPENED) {
                checkAround(n[0], n[1]);
              }
            })
          }
        }
        if ( tableData[row][cell] === CODE.NORMAL) { 
          openedCount += 1;
        }
        tableData[row][cell] = count;
      };
      checkAround(action.row, action.cell);
      let halted = false;
      let result = '';
      console.log(state.data.row * state.data.cell - state.data.mine, state.openedCount + openedCount)
      if ( state.data.row * state.data.cell - state.data.mine === state.openedCount + openedCount) {
        halted = true;
        result = `${state.timer} 승리하셨습니다`;
      }
      return {
        ...state,
        tableData,
        openedCount : state.openedCount + openedCount, 
        halted,
        result,
      };
    }

    case CLICK_MINE: { 
      const tableData = [...state.tableData];
      tableData[action.row] = [...state.tableData[action.row]];
      tableData[action.row][action.cell] = CODE.CLICKED_MINE; 
      return {
        ...state,
        tableData,
        halted: true, // 게임을 멈추기 위해서 추가하였다. 
      }
    }
    case FLAG_CELL: {
      const tableData = [...state.tableData];
      tableData[action.row] = [...state.tableData[action.row]];
      if (tableData[action.row][action.cell] === CODE.MINE) { 
        tableData[action.row][action.cell] = CODE.FLAG_MINE; 
      } else {
        tableData[action.row][action.cell] = CODE.FLAG; 
      }
      return {
        ...state,
        tableData,
      }
    }
    case QUESTION_CELL: {
      const tableData = [...state.tableData];
      tableData[action.row] = [...state.tableData[action.row]];
      if (tableData[action.row][action.cell] === CODE.FLAG_MINE) {
        tableData[action.row][action.cell] = CODE.QUESTION_MINE;
      } else {
        tableData[action.row][action.cell] = CODE.QUESTION;
      }
      return {
        ...state,
        tableData,
      };
    }
    case NORMALIZE_CELL: {
      const tableData = [...state.tableData];
      tableData[action.row] = [...state.tableData[action.row]];
      if (tableData[action.row][action.cell] === CODE.QUESTION_MINE) { 
        tableData[action.row][action.cell] = CODE.MINE; 
      } else {
        tableData[action.row][action.cell] = CODE.NORMAL; 
      }
      return {
        ...state,
        tableData,
      }
    }

    case INCREMENT_TIMER : {
      return {
        ...state,
        timer : state.timer + 1,
      }
    }

    default:
      return state;
  }
};

const MineSearch = () => {

  const [state, dispatch] = useReducer(reducer, initalState);
  const { tableData, halted, timer, result } = state;

  const value = useMemo(() => (
    { tableData, halted, dispatch }
  ), [tableData, halted]);

  useEffect(() => {
    let timer;
    if ( halted === false ) { // 중단이 풀렸을 때 게임이 시작한다.
      timer = setInterval(() => {
        dispatch( { type : INCREMENT_TIMER })
      }, 1000)
    }
    return () => {
      clearInterval(timer);
    }
  }, [halted]);


  return (
    <>
      <TableContext.Provider value={value}>
        <Form /> 
        <div>{timer}</div>
        <Table />
        <div>{result}</div>
      </TableContext.Provider>
    </>
    
  );
};

export default MineSearch;