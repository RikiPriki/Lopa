import React from 'react';
import { CoreProvider } from '../../core/AppEngine';

import './SingleTesting.sass';

import { SSRWrapper, Panel, PanelHeader, Counter, Group, Cell, PanelHeaderButton, Button, Alert, Div, Progress, Text, FormLayout, FormLayoutGroup, Radio, Checkbox, FixedLayout, Input, List, Footer, ANDROID } from '@vkontakte/vkui';
import Icon28DoorArrowLeftOutline from '@vkontakte/icons/dist/28/door_arrow_left_outline';

import Icon28CancelCircleFillRed from '@vkontakte/icons/dist/28/cancel_circle_fill_red';
import Icon28CheckCircleFill from '@vkontakte/icons/dist/28/check_circle_fill';

export default function SingleTesting(props) {
  const app = React.useContext(CoreProvider);
  const [state, setState] = React.useState({
    tasks: null,
    tasksCount: 0,
    currentTask: 0,
    replied: false,
    answers: [],
    results: [],
    durations: [],
    enterTime: Date.now() 
  });

  React.useEffect(() => {
    Promise.all([
      app.File.loadFromURL(`/assets/${ props.subject }.json`, true),
      app.File.loadFromURL(`/static/tasks-state/${ UID }`, false)
    ]).then(([mat, _tState]) => {
      var tasks = mat.catalog[0].problems.map((v, i) => [v, i]).filter(v => props.types[v[0].type]);
      var tState = (_tState ?? new Array(mat.catalog[0].problems.length).fill(0));
      if (typeof tState == "string") {
        tState = tState.split(' ');
        app.File.keep(`/static/tasks-state/${ UID }`, tState);
      }
      if (props.random) {
        tasks.sort((a, b) => tState[a[1]] == tState[b[1]] ? Math.random() - 0.5 : tState[a[1]] - tState[b[1]]);
      }
      if (!props.allTasks) {
        tasks = tasks.slice(0, props.tasksCount);
      }
      setState({ ...state, tasks, tasksCount: tasks.length });
    });
  }, []);

  React.useLayoutEffect(() => {
    if (state.replied) {
      const handler = ({ key }) => {
        if (key == "Enter") {
          next();
        }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [state.replied]);

  function complete() {
    app.Event.dispatchEvent('switchpanel', ["single-result", { ...state, tasksCount: state.results.length, subject: props.subject, durations: state.durations }]);
  }

  function openExit() {
    const popout = (
      <Alert
        actions={[{
          title: '???????????????????? ????????????????????',
          autoclose: true,
          mode: 'default',
          action: () => complete(),
        }, {
          title: '?????????????????? ?? ??????????',
          autoclose: true,
          mode: 'destructive',
          action: () => app.Event.dispatchEvent("closepanel"),
        }, {
          title: '????????????',
          autoclose: true,
          mode: 'cancel'
        }]}
        actionsLayout="vertical"
        onClose={ () => app.Event.dispatchEvent("closepopout") }
      >
        <h2>???????????????????? ??????????</h2>
        <p>???? ??????????????, ?????? ???????????? ?????????????????? ?????????</p>
      </Alert>
    )

    app.Event.dispatchEvent("openpopout", [popout]);
  }

  function onReply(answer, result) {
    setState({ ...state,
      replied: true,
      answers: [...state.answers, answer],
      results: [...state.results, result],
      durations: [...state.durations, Date.now() - state.enterTime] });
  }

  function next() {
    if (state.currentTask + 1 == state.tasksCount) {
      complete();
    } else {
      setState({ ...state, currentTask: state.currentTask + 1, replied: false, enterTime: Date.now() });
    }
  }

  const tasksLeft = state.tasksCount - state.currentTask - state.replied;

  return (
    <Panel id={ props.id } className="single-testing-panel">
      <PanelHeader left={
        <PanelHeaderButton onClick={ openExit }><Icon28DoorArrowLeftOutline/></PanelHeaderButton>
      }>{ state.tasks != null ? `???????????? ${ state.currentTask + 1 }` : "????????????????????????" }</PanelHeader>

      { state.tasks != null &&
      <>
        <FixedLayout vertical="top" style={{ borderBottom: '1px solid #f2f2f3' }}>
          <Div style={{ background: 'white' }}>
            <Progress value={ (state.currentTask + state.replied) / state.tasksCount * 100 } />
          </Div>
        </FixedLayout>
        <div style={{ height: 25 }} />

        <Div>
          <div style={{
            padding: '15px 10px',
            border: '2px solid #a9d5f9',
            borderTopWidth: 0,
            borderLeftWidth: 0,
            background: '#c6e2f9'
          }}>
            <Text weight="medium">
              <span dangerouslySetInnerHTML={{ __html: `${(state.tasks[state.currentTask][1] + 1).toString()}. ` + state.tasks[state.currentTask][0].question }}></span>
            </Text>
          </div>
        </Div>

        { state.tasks[state.currentTask][0].picture &&
          <Div style={{ display: 'flex', justifyContent: 'center', width: '100%', boxSizing: 'border-box' }}>
            <T_Image src={`/static/images/${props.subject}/${state.tasks[state.currentTask][0].picture}`} />
          </Div>
        }

        { (state.tasks && state.tasks[state.currentTask][0].type == "order") &&
          <T_Order key={ state.currentTask } id={ state.tasks[state.currentTask][1] } problem={ state.tasks[state.currentTask][0] } onReply={ onReply } replied={ state.replied } />
        }
        { (state.tasks && state.tasks[state.currentTask][0].type == "input") &&
          <T_Input key={ state.currentTask } id={ state.tasks[state.currentTask][1] } problem={ state.tasks[state.currentTask][0] } onReply={ onReply } replied={ state.replied } />
        }
        { (state.tasks && state.tasks[state.currentTask][0].type == "radio") &&
          <T_Radio key={ state.currentTask } id={ state.tasks[state.currentTask][1] } problem={ state.tasks[state.currentTask][0] } onReply={ onReply } replied={ state.replied } />
        }
        { (state.tasks && state.tasks[state.currentTask][0].type == "select") &&
          <T_Select key={ state.currentTask } id={ state.tasks[state.currentTask][1] } problem={ state.tasks[state.currentTask][0] } onReply={ onReply } replied={ state.replied } />
        }
        { state.replied && 
          <FixedLayout vertical="bottom">
            <Div style={{ background: 'white' }}>
              <Button mode={ state.currentTask + 1 == state.tasksCount ? "commerce" : "primary" } stretched size="xl" onClick={ next }>
                { state.currentTask + 1 == state.tasksCount ? "???????????? ????????????????????" : "????????????" }
              </Button>
            </Div>
          </FixedLayout>
        }

        { state.tasksCount - state.currentTask - state.replied > 0 && 
          <Footer>??????????{ tasksLeft == 1 ? '????' : '??????' } { tasksLeft } ????????????{tasksLeft == 1 ? '' : (tasksLeft >= 2 && tasksLeft <= 4 ? '??' : '????')}</Footer>
        }
        { state.tasksCount - state.currentTask - state.replied == 0 && 
          <Footer>???? ???????????????? ???? ?????? ?????????????? :)</Footer>
        }
        <div style={{ display: 'block', height: 100 }}></div>
      </>
      }

    </Panel>
  );
}

function T_Image(props) {
  const [dimensions, setDimensions] = React.useState({ w: 1, h: 1 });

  React.useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const mxw = document.body.clientWidth * 0.7;
      const mxh = document.body.clientHeight * 0.35;
      var nd = { w: img.width, h: img.height };
      if (nd.w > mxw) {
        nd.h = mxw * nd.h / nd.w;
        nd.w = mxw;
      }
      if (nd.h > mxh) {
        nd.w = mxh * nd.w / nd.h;
        nd.h = mxh;
      }
      setDimensions(nd);
    };
    img.src = props.src;
  }, [props.src]);

  return (
    <img src={ props.src } width={ dimensions.w } height={ dimensions.h } />
  )
}

function T_Order({ problem, id, onReply, replied }) {
  const [answer, setAnswer] = React.useState(new Array(problem.options.length).fill(0).map((v, i) => i).sort(() => Math.random() - 0.5));
  function reply() {
    onReply(answer.join(''), answer.join('') == problem.answer);
  }

  React.useLayoutEffect(() => {
    const handler = ({ key }) => {
      if (key == "Enter" && answer != "") {
        reply();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [answer]);

  return (
  <>
    <FormLayout>
      <FormLayoutGroup top="?????????????? ???????????? ??????????????">
        <List>
          <SSRWrapper userAgent="android">
            { answer.map((v, i) => (
              <Cell platform={ ANDROID } key={v} draggable={ !replied }
              className={["order-cell", replied ? "order-status" : ""].join(' ')}
              onDragFinish={({ from, to }) => {
                const draggingList = answer.slice();
                draggingList.splice(from, 1);
                draggingList.splice(to, 0, answer[from]);
                setAnswer(draggingList);
              }}
              before={ replied ?
                <Counter mode={ problem.answer.indexOf(v.toString()) == i ? "primary" : "prominent" } style={{ marginRight: 10 }}>{ problem.answer.indexOf(v.toString()) + 1 }</Counter>
                : null
              }
              >
                <span dangerouslySetInnerHTML={{ __html: problem.options[v] }}></span>
              </Cell>
            ))}
          </SSRWrapper >
        </List>
      </FormLayoutGroup>
    </FormLayout>

    {!replied && 
      <FixedLayout vertical="bottom">
        <Div style={{ background: 'white' }}>
            <Button mode="primary" stretched size="xl" onClick={ reply }>????????????????</Button>
        </Div>
      </FixedLayout>
    }
  </>
  );
}

function T_Input({ problem, id, onReply, replied }) {
  const [answer, setAnswer] = React.useState(null);

  function reply() {
    onReply(answer, problem.answer.indexOf(answer) != -1);
  }

  React.useLayoutEffect(() => {
    const handler = ({ key }) => {
      if (key == "Enter" && answer != "") {
        reply();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [answer]);

  return (
  <>
    <FormLayout>
      <FormLayoutGroup top="?????????????? ???????????????????? ??????????">
        <Input onChange={ (ev) => !replied && setAnswer(ev.target.value) }
          style={{ background: replied ? (problem.answer.indexOf(answer) != -1 ? "#a5d6a7" : "#ef9a9a") : "transparent", border: `${ replied ? 1 : 0 }px solid #e3e4e6`, borderRadius: 9 }}
        />
      </FormLayoutGroup>
    </FormLayout>

    {replied &&
      <Div>
        <Text weight="medium">???????????????????? ??????????: ({ problem.answer.join('|') })</Text>
      </Div>
    }

    {!replied && 
      <FixedLayout vertical="bottom">
        <Div style={{ background: 'white' }}>
            <Button mode="primary" stretched size="xl" onClick={ reply }>????????????????</Button>
        </Div>
      </FixedLayout>
    }
  </>
  );
}

function T_Radio({ problem, id, onReply, replied }) {
  const [conv] = React.useState(new Array(problem.options.length).fill(0).map((v, i) => i).sort(() => Math.random() - 0.5));
  const [answer, setAnswer] = React.useState(null);
  console.log(conv);

  function reply() {
    if (answer == null) return;
    onReply(answer.toString(), answer.toString() == problem.answer);
  }

  React.useLayoutEffect(() => {
    const handler = ({ key }) => {
      if (key == "Enter" && answer != null) {
        reply();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [answer]);

  return (
  <>
    <FormLayout>
      <FormLayoutGroup top="???????????????? ???????? ???????????????????? ??????????">
        { problem.options.map((v, _i) => {
          const i = conv[_i];
          return (
            <Radio name="test" key={ i } checked={ answer == i }
              onChange={ (ev) => ev.target.checked && setAnswer(replied ? answer : i) }
              style={{ background: replied && problem.answer.indexOf(i.toString()) != -1 ? "#c8e6c9" : "transparent" }}
            ><span dangerouslySetInnerHTML={{ __html: problem.options[i] }}></span></Radio>
          );
        })
        }
      </FormLayoutGroup>
    </FormLayout>

    {!replied && 
      <FixedLayout vertical="bottom">
        <Div style={{ background: 'white' }}>
          <Button disabled={ answer == null } mode="primary" stretched size="xl" onClick={ reply }>????????????????</Button>
        </Div>
      </FixedLayout>
    }
  </>
  );
}

function T_Select({ problem, id, onReply, replied }) {
  const [conv] = React.useState(new Array(problem.options.length).fill(0).map((v, i) => i).sort(() => Math.random() - 0.5));
  const [answer, setAnswer] = React.useState(new Array(problem.options.length).fill(false));

  function reply() {
    var res = answer.map((v, i) => i).filter((v, i) => answer[i]).join('');
    onReply(res, res == problem.answer);
  }

  React.useLayoutEffect(() => {
    const handler = ({ key }) => {
      if (key == "Enter" && answer.some(v => v)) {
        reply();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [answer]);

  return (
  <>
    <FormLayout>
      <FormLayoutGroup top="???????????????? ?????????????????? ???????????????????? ??????????????">
      { problem.options.map((v, _i) => {
          const i = conv[_i];
          return (
            <Checkbox key={ i } checked={ answer[i] }
              onChange={ (ev) => setAnswer([...answer.slice(0, i), replied ? answer[i] : ev.target.checked, ...answer.slice(i + 1)]) }
              style={{ background: replied && problem.answer.indexOf(i.toString()) != -1 ? "#c8e6c9" : "transparent" }}>
                <span dangerouslySetInnerHTML={{ __html: problem.options[i] }}></span>
            </Checkbox>
          )
        })
        }
      </FormLayoutGroup>
    </FormLayout>
    {!replied && 
      <FixedLayout vertical="bottom">
        <Div style={{ background: 'white' }}>
          <Button disabled={ answer.every(v => !v) } mode="primary" stretched size="xl" onClick={ reply }>????????????????</Button>
        </Div>
      </FixedLayout>
    }
  </>
  );
}