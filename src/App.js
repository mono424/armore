import React, { useState } from 'react';
import MonacoEditor from "react-monaco-editor";
import Terminal from "./components/Terminal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import api from './services/api';
import './App.css';

import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { faTimes, faSave, faFolderOpen, faShare } from "@fortawesome/free-solid-svg-icons";

library.add(fab, faTimes, faSave, faFolderOpen, faShare);

const sleep = t => new Promise(r => setTimeout(r, t));

const getUrlArgs = () => {
  const args = window.location.href.split("#")[1];
  if (!args) return {};
  try {
    return JSON.parse(atob(args));
  } catch (e) {
    return {};
  }
};

const DEFAULT_CODE = `.data
msg:
.ascii "Hello Innsbruck!"
len = . - msg
.align
.global _start
_start:
MOV r0, #1
LDR r1, =msg
LDR r2, =len
MOV r7, #4
SWI #0

MOV r0, #0
MOV r7, #1
SWI #0
`;

function App() {
  let editorWrapRef = React.createRef();
  const [code, setCode] = useState(DEFAULT_CODE);
  const [terminalopen, setTerminalopen] = useState(false);
  const [terminaltext, setTerminaltext] = useState("");
  const [editorwidth, setEditorwidth] = useState("100%");

  React.useEffect(() => {
    const args = getUrlArgs();
    if (args.code) {
      setCode(args.code);
    }
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      if (editorWrapRef.current) {
        setEditorwidth(
          editorWrapRef.current.offsetWidth
          - 40 //padding
        )
      }
    }
    window.addEventListener('resize', handleResize)
  });

  const printOut = async (text, delay) => {
    await setTerminaltext(text);
    await sleep(delay);
  }

  const run = async () => {
    try {
      setTerminalopen(true);
      await printOut("Assembling...", 100);
      const assambleRes = await api.assamble(code);
      await printOut("Assembling ✔️", 200);
      await printOut("Linking ...", 100);
      const linkRes = await api.link(assambleRes.data.data.data);
      await printOut("Linking ✔️", 200);
      await printOut("Running ...", 200);
      const runRes = await api.exec(linkRes.data.data.data);
      setTerminaltext(runRes.data.data.join("\n"));
    } catch (error) {
      const respMsg = error.response && error.response.data.message;
      setTerminaltext(`**ERROR**\n\n${respMsg || error.message}`);
    }
  };

  const share = () => {
    const link = `${window.location.origin}#${btoa(JSON.stringify({ code }))}`;
    console.log(link);
  };

  return (
    <div className="App">
      <div className="background-bar"></div>
      <div className="editor" ref={editorWrapRef}>
        <header>
          <h1>
            ♥ ARM<i>ore</i>
          </h1>
          <div className="controls">
            <button onClick={run} className="icon-btn">
              <FontAwesomeIcon size="2x" icon="folder-open" />
            </button>
            <button onClick={run} className="icon-btn">
              <FontAwesomeIcon size="2x" icon="save" />
            </button>
            <button onClick={share} className="icon-btn">
              <FontAwesomeIcon size="2x" icon="share" />
            </button>
            <button onClick={run} className="main-btn">
              RUN
            </button>
          </div>
        </header>
        <MonacoEditor
          width={editorwidth}
          height={terminalopen ? "400px" : "630px"}
          language="javascript"
          theme="vs-dark"
          value={code}
          onChange={setCode}
        />
        {terminalopen && (
          <Terminal text={terminaltext} close={() => setTerminalopen(false)} />
        )}
      </div>
      <footer>
        <a target="_blank" href="https://github.com/mono424/armore">
          <FontAwesomeIcon icon={["fab", "github"]} />
        </a>
        <span>
          handcrafted by
          <a target="_blank" href="https://khadimfall.com">
            Khadim Fall
          </a>
        </span>
      </footer>
    </div>
  );
}

export default App;
