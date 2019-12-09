import React, { useState } from 'react';
import MonacoEditor from "react-monaco-editor";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import hotkeys from "hotkeys-js";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { faTimes, faSave, faFolderOpen, faLink, faFile, faTrash, faFileUpload } from "@fortawesome/free-solid-svg-icons";

import api from './services/api';
import storage from './services/storage';
import Terminal from "./components/Terminal";
import './App.css';
import FuzzyOpen from './components/FuzzyOpen';
import DropZone from './components/DropZone';

hotkeys.filter = () => {
  return true;
};

library.add(
  fab,
  faTimes,
  faSave,
  faFolderOpen,
  faLink,
  faFile,
  faTrash,
  faFileUpload
);

const sleep = t => new Promise(r => setTimeout(r, t));

const copyToClipboard = text => {
  if (window.clipboardData && window.clipboardData.setData) {
    // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
    return window.clipboardData.setData("Text", text);
  } else if (
    document.queryCommandSupported &&
    document.queryCommandSupported("copy")
  ) {
    var textarea = document.createElement("textarea");
    textarea.textContent = text;
    textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in Microsoft Edge.
    document.body.appendChild(textarea);
    textarea.select();
    try {
      return document.execCommand("copy"); // Security exception may be thrown by some browsers.
    } catch (ex) {
      console.warn("Copy to clipboard failed.", ex);
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
};

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
  const [filename, setFilename] = useState("unknown.asm");
  const [filenameOpened, setFilenameOpened] = useState(null); // Last opened file; relevant for save lock; Ensures that existing files are not overwritten by mistake.
  const [editorwidth, setEditorwidth] = useState("100%");
  const [openfileDialogOpen, setOpenfileDialogOpen] = useState(false);
  const filenameIsOpenedOne = filenameOpened === filename;

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

  const copyLink = () => {
    const link = `${window.location.origin}#${btoa(JSON.stringify({ code, filename }))}`;
    copyToClipboard(link);
    toast("URL copied to clipboard", { autoClose: 2500, className: 'toasty' });
  };

  const deleteFile = (fileName) => {
    storage.deleteFile(fileName);
    toast("File removed", { autoClose: 2500, className: "toasty" });
  };

  const saveFile = () => {
    if (!filenameIsOpenedOne && storage.files()[filename]) {
      return toast("File already exists!", { autoClose: 2500, className: "toasty" });
    }
    storage.saveFile(filename, code);
    toast("File saved", { autoClose: 2500, className: 'toasty' });
    setFilenameOpened(filename);
  };

  const openFile = fileName => {
    const file = storage.files()[fileName];
    setOpenfileDialogOpen(false);
    setFilename(fileName);
    setCode(file.code);
    setFilenameOpened(fileName);
  };

  const onFileDrop = file => {
    if (!/.asm$/i.test(file.name)) {
      return toast("Please only upload .asm-Files", {
        autoClose: 2500,
        className: "toasty"
      });
    }
    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = function(evt) {
      setFilename(file.name);
      setCode(evt.target.result);
      toast("File loaded!", {
        autoClose: 2500,
        className: "toasty"
      });
    };
  };

    React.useEffect(() => {
      // URL ARGUMENTS
      const args = getUrlArgs();
      if (args.code) {
        setCode(args.code);
        setFilename(args.filename);
      }

      // HOTKEYS
      hotkeys("f5", (e) => { e.preventDefault(); run(); });
      hotkeys("ctrl+s", (e) => { e.preventDefault(); saveFile(); });
      hotkeys("ctrl+o", (e) => { e.preventDefault(); setOpenfileDialogOpen(true); });
    }, []);

  return (
    <div className="App">
      <ToastContainer />
      {openfileDialogOpen && (
        <FuzzyOpen
          onSelect={openFile}
          onDelete={deleteFile}
          onClose={() => setOpenfileDialogOpen(false)}
        />
      )}
      <div className="background-bar"></div>
      <DropZone onDrop={onFileDrop}>
        <div className="editor" ref={editorWrapRef}>
          <header>
            <div className="main-head">
              <h1>
                ♥ ARM<i>ore</i>
              </h1>
              <input
                class="filename"
                value={filename}
                onChange={e => setFilename(e.target.value)}
              />
            </div>
            <div className="controls">
              <button
                onClick={() => setOpenfileDialogOpen(true)}
                className="icon-btn"
              >
                <FontAwesomeIcon size="2x" icon="folder-open" />
              </button>
              <button onClick={saveFile} className="icon-btn">
                <FontAwesomeIcon size="2x" icon="save" />
              </button>
              <button onClick={copyLink} className="icon-btn">
                <FontAwesomeIcon size="2x" icon="link" />
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
            <Terminal
              text={terminaltext}
              close={() => setTerminalopen(false)}
            />
          )}
        </div>
      </DropZone>
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
