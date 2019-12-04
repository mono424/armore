import React, { useState } from 'react';
import MonacoEditor from "react-monaco-editor";
import Terminal from "./components/Terminal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import api from './services/api';
import './App.css';

import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

library.add(fab, faTimes);

const sleep = t => new Promise(r => setTimeout(r, t));

const DEFAULT_CODE = `.data
msg:
.ascii "Hello Innsbruck!\n"
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

  const [code, setCode] = useState(DEFAULT_CODE);
  const [terminalopen, setTerminalopen] = useState(false);
  const [terminaltext, setTerminaltext] = useState("");

  const printOut = async (text, delay) => {
    await setTerminaltext(text);
    await sleep(delay);
  }

  const run = async () => {
    setTerminalopen(true);
    await printOut("Assambling...", 400)
    const assambleRes = await api.assamble(code);
    await printOut("Assambling ✔️", 400);
    await printOut("Linking ...", 400);
    const linkRes = await api.link(assambleRes.data.data.data);
    await printOut("Linking ✔️", 400);
    await printOut("Running ...", 600);
    const runRes = await api.exec(linkRes.data.data.data);
    setTerminaltext(runRes.data.data.join("\n"));
  };

  return (
    <div className="App">
      <div className="editor">
        <header>
          <h1>
            ♥ ARM<i>ore</i>
          </h1>
          <button onClick={run} className="main-btn">
            RUN
          </button>
        </header>
        <MonacoEditor
          width="100%"
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
        <a href="https://khadimfall.com">
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
